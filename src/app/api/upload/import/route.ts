import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Applicant from "@/models/Applicant";
import { guessCountryFromPhone } from "@/lib/utils";
import Application from "@/models/Application";
import ImportLog from "@/models/ImportLog";
import { normalizePhone } from "@/lib/normalizePhone";
import { findValue } from "@/lib/findValue";
import { normalizeEducationLevel, normalizeLanguage } from "@/lib/normalizeEnum";
import Position from "@/models/Position";
import Counter from "@/models/Counter";
import { getPrefix } from "@/lib/internId";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { records, positionId, batchId, fileName } = await req.json();

    // Sort records by applied date ascending so internIds are assigned in chronological order
    const getAppliedDate = (r: any) => {
      const dateVal = findValue(r, ["applieddate", "applied date", "date"]);
      if (!dateVal) return new Date();
      const parsed = new Date(dateVal);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    };
    records.sort((a: any, b: any) => getAppliedDate(a).getTime() - getAppliedDate(b).getTime());

    const positionObj = await Position.findById(positionId);
    const positionName = positionObj ? positionObj.name : "Software Engineer Intern";
    const prefix = getPrefix(positionName);

    let created = 0;
    let duplicates = 0;
    let errors = 0;
    let totalValid = 0;

    const applicantIds: any[] = [];
    const applicationIds: any[] = [];

    // 1. Collect all phones and emails from records to run a bulk query
    const phones: string[] = [];
    const emails: string[] = [];

    for (const record of records) {
      const phoneRaw = findValue(record, ["phone", "phonenumber", "contact", "contactnumber", "mobile", "whatsapp", "tele", "tel"]);
      const phone = normalizePhone(phoneRaw);
      const email = findValue(record, ["email", "emailaddress"])?.toLowerCase();

      if (phone) phones.push(phone);
      if (email) emails.push(email);
    }

    // 2. Fetch existing applicants in bulk
    const existingApplicants = await Applicant.find({
      $or: [
        { phone: { $in: phones } },
        { email: { $in: emails } }
      ]
    });

    const phoneMap = new Map(existingApplicants.map((a) => [a.phone, a]));
    const emailMap = new Map(
      existingApplicants.filter((a) => a.email).map((a) => [a.email, a])
    );

    // 3. Build array of new applicants to insert (tracking in-csv duplicates too)
    const newApplicantsToInsert: any[] = [];
    const newApplicantsMap = new Map<string, any>(); // phone/email -> temp applicant object

    interface RowInfo {
      record: any;
      phone: string;
      email: string;
      fullName: string;
      isDuplicate: boolean;
    }
    const rowsInfo: RowInfo[] = [];

    for (const record of records) {
      try {
        const phoneRaw = findValue(record, ["phone", "phonenumber", "contact", "contactnumber", "mobile", "whatsapp", "tele", "tel"]);
        const phone = normalizePhone(phoneRaw);
        const email = findValue(record, ["email", "emailaddress"])?.toLowerCase() || "";
        const fullName = findValue(record, ["fullname", "name", "nameinfull", "namewithinitials", "applicantname", "candidate", "initials"]);
        const language = normalizeLanguage(findValue(record, ["preferredlanguage", "language", "languages"]));

        // If both name and phone are empty, it's a blank/metadata row. Ignore it.
        if (!fullName && !phoneRaw) {
          continue;
        }

        totalValid++;

        if (!fullName || !phone) {
          errors++;
          continue;
        }

        if (language !== "Tamil") {
          errors++;
          continue;
        }

        // Find if they exist in DB already
        let dbApplicant = phoneMap.get(phone) || (email ? emailMap.get(email) : null);
        let isDuplicate = !!dbApplicant;

        // If not in DB, check if we already planned to insert them in this batch (CSV internal duplicate)
        let applicant = dbApplicant || newApplicantsMap.get(phone) || (email ? newApplicantsMap.get(email) : null);

        if (!applicant) {
          const newAppObj = {
            _id: new mongoose.Types.ObjectId(),
            fullName,
            email,
            phone,
            group: findValue(record, ["group", "batch", "class", "section"]),
            linkedin: findValue(record, ["linkedin", "linkedinprofile", "linkedinurl"]),
            portfolio: findValue(record, ["portfolio", "portfoliourl", "website"]),
            educationLevel: normalizeEducationLevel(findValue(record, ["educationlevel", "education", "qualification", "degree"])),
            preferredLanguage: normalizeLanguage(findValue(record, ["preferredlanguage", "language", "languages"])),
            cvUrl: findValue(record, ["cvurl", "cv", "resume", "resumeurl", "uploadcv"]),
            country: findValue(record, ["country", "county", "nation", "nationality", "location"]) || "",
          };
          newApplicantsToInsert.push(newAppObj);
          newApplicantsMap.set(phone, newAppObj);
          if (email) newApplicantsMap.set(email, newAppObj);
        }

        rowsInfo.push({
          record,
          phone,
          email,
          fullName,
          isDuplicate,
        });
      } catch (err) {
        console.error("Error processing record for import:", err);
        errors++;
      }
    }

    // Generate internId for new applicants
    if (newApplicantsToInsert.length > 0) {
      const counterKey = `intern_id_${prefix}`;
      const counter = await Counter.findOneAndUpdate(
        { _id: counterKey },
        { $inc: { seq: newApplicantsToInsert.length } },
        { returnDocument: "after", upsert: true }
      );
      const lastSeq = counter.seq;
      const startSeq = lastSeq - newApplicantsToInsert.length + 1;

      newApplicantsToInsert.forEach((app, index) => {
        const seqNum = startSeq + index;
        app.internId = `${prefix}${String(seqNum).padStart(3, '0')}`;
      });
    }

    // 4. Construct list of applications to insert
    const applicationsToInsert: any[] = [];
    for (const row of rowsInfo) {
      try {
        const { record, phone, email, isDuplicate } = row;
        
        let applicant = phoneMap.get(phone) || (email ? emailMap.get(email) : null) || 
                        newApplicantsMap.get(phone) || (email ? newApplicantsMap.get(email) : null);

        if (!applicant) {
          errors++;
          continue;
        }

        if (isDuplicate) {
          duplicates++;
        } else {
          created++;
          applicantIds.push(applicant._id);
          applicationsToInsert.push({
            _id: new mongoose.Types.ObjectId(),
            applicantId: applicant._id,
            positionId,
            batchId,
            status: "New",
            appliedDate: record.appliedDate || record["Applied Date"] || new Date(),
            internId: applicant.internId,
          });
        }
      } catch (err) {
        console.error("Error building application:", err);
        errors++;
      }
    }

    // 5. Perform bulk database inserts
    if (newApplicantsToInsert.length > 0) {
      await Applicant.insertMany(newApplicantsToInsert);
    }
    if (applicationsToInsert.length > 0) {
      await Application.insertMany(applicationsToInsert);
      applicationIds.push(...applicationsToInsert.map((a) => a._id));
    }

    // Save the Import Log for rollup rollback capability
    if (totalValid > 0) {
      await ImportLog.create({
        fileName: fileName || "imported_file.csv",
        positionId,
        batchId,
        importedCount: created,
        duplicateCount: duplicates,
        errorCount: errors,
        applicantIds,
        applicationIds,
      });
    }

    return NextResponse.json({ created, duplicates, errors, total: totalValid });
  } catch (err) {
    console.error("Import request failed:", err);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}

