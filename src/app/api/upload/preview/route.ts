import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Applicant from "@/models/Applicant";
import Application from "@/models/Application";
import { normalizePhone } from "@/lib/normalizePhone";
import { findValue } from "@/lib/findValue";
import { normalizeLanguage } from "@/lib/normalizeEnum";
import { guessCountryFromPhone } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { records, positionId, batchId } = await req.json();

    // Track the original row index before sorting
    records.forEach((record: any, idx: number) => {
      record.originalRowIndex = idx + 1;
    });

    // Sort records by applied date ascending
    const getAppliedDate = (r: any) => {
      const dateVal = findValue(r, ["applieddate", "applied date", "date"]);
      if (!dateVal) return new Date();
      const parsed = new Date(dateVal);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    };
    records.sort((a: any, b: any) => getAppliedDate(a).getTime() - getAppliedDate(b).getTime());

    const results = {
      total: records.length,
      new: 0,
      duplicates: 0,
      errors: 0,
      rows: [] as Array<{
        row: number;
        status: "new" | "duplicate" | "error";
        reason?: string;
        applicant?: object;
      }>,
    };

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

    // 3. Process each record using in-memory maps
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      try {
        const phoneRaw = findValue(record, ["phone", "phonenumber", "contact", "contactnumber", "mobile", "whatsapp", "tele", "tel"]);
        const phone = normalizePhone(phoneRaw);
        const email = findValue(record, ["email", "emailaddress"])?.toLowerCase();
        const fullName = findValue(record, ["fullname", "name", "nameinfull", "namewithinitials", "applicantname", "candidate", "initials"]);
        const language = normalizeLanguage(findValue(record, ["preferredlanguage", "language", "languages"]));

        // If both name and phone are empty, it's a blank/metadata row. Ignore it.
        if (!fullName && !phoneRaw) {
          results.total--;
          continue;
        }

        if (!fullName || !phone) {
          results.errors++;
          results.rows.push({ 
            row: record.originalRowIndex, 
            status: "error", 
            reason: `Missing name or phone (Name: ${fullName || "Empty"}, Phone: ${phoneRaw || "Empty"})` 
          });
          continue;
        }

        if (language !== "Tamil") {
          results.errors++;
          results.rows.push({
            row: record.originalRowIndex,
            status: "error",
            reason: `Language: ${language || "Unknown"} (Only Tamil students are imported)`
          });
          continue;
        }

        // Check for duplicate in memory
        let existingApplicant = phoneMap.get(phone);
        if (!existingApplicant && email) {
          existingApplicant = emailMap.get(email);
        }

        const country = findValue(record, ["country", "county", "nation", "nationality", "location"]) || "";

        if (existingApplicant) {
          results.duplicates++;
          results.rows.push({
            row: record.originalRowIndex,
            status: "duplicate",
            reason: `Duplicate: existing applicant ${existingApplicant.fullName}`,
            applicant: { 
              _id: existingApplicant._id, 
              fullName: existingApplicant.fullName,
              phone: existingApplicant.phone,
              email: existingApplicant.email,
              country: existingApplicant.country || country
            },
          });
        } else {
          results.new++;
          results.rows.push({
            row: record.originalRowIndex,
            status: "new",
            applicant: { fullName, phone, email, country },
          });
        }
      } catch (err) {
        console.error("Error previewing record:", err);
        results.errors++;
        results.rows.push({ row: record.originalRowIndex, status: "error", reason: "Processing error" });
      }
    }

    return NextResponse.json({ results, positionId, batchId });
  } catch (err) {
    console.error("Preview request failed:", err);
    return NextResponse.json({ error: "Preview failed" }, { status: 500 });
  }
}

