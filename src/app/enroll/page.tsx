"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Phone,
  User,
  GraduationCap,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  Award,
  Users,
  Send,
  Loader2,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { POPULAR_COURSES } from "@/types/student";

export default function StudentEnrollmentPage() {
  const [formData, setFormData] = useState({
    name: "",
    tpNumber: "",
    courseName: POPULAR_COURSES[0],
    email: "",
    notes: "",
  });

  const [customCourse, setCustomCourse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedStudent, setSubmittedStudent] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!formData.tpNumber.trim()) {
      toast.error("Please enter your contact / TP number");
      return;
    }

    const finalCourse =
      formData.courseName === "Other"
        ? customCourse.trim() || "General Inquiry"
        : formData.courseName;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          tpNumber: formData.tpNumber.trim(),
          courseName: finalCourse,
          email: formData.email.trim(),
          notes: formData.notes.trim(),
          source: "Facebook Ad",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit enrollment");
      }

      setSubmittedStudent(data.student);
      toast.success("Registration submitted successfully!");
      setFormData({
        name: "",
        tpNumber: "",
        courseName: POPULAR_COURSES[0],
        email: "",
        notes: "",
      });
      setCustomCourse("");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                AD <span className="text-indigo-400">Contacts</span>
              </span>
              <p className="text-[11px] text-slate-400 -mt-0.5">E-Learning Admissions &amp; Training</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-slate-900 border border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white transition-all shadow-xs"
            >
              <span>Admin Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Course pitch & info */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Facebook Special Offer &bull; Limited Seats Available</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
              Master In-Demand Skills with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
                Industry Experts
              </span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl">
              Register now to get full syllabus, batch timings, and early-bird scholarship details for our practical online courses.
            </p>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">100% Practical & Projects</h4>
                  <p className="text-xs text-slate-400">Build real portfolio applications</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <Clock className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Flexible Online Batches</h4>
                  <p className="text-xs text-slate-400">Weekend & weekday evening slots</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <Award className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Verified Certificate</h4>
                  <p className="text-xs text-slate-400">Boost your LinkedIn & CV</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <Users className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Mentorship & Support</h4>
                  <p className="text-xs text-slate-400">1-on-1 code reviews & guidance</p>
                </div>
              </div>
            </div>

            {/* Courses tags */}
            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Featured Programs:
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_COURSES.map((course) => (
                  <span
                    key={course}
                    className="text-xs px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/80 text-slate-300 font-medium"
                  >
                    {course}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Lead Form */}
          <div className="lg:col-span-5">
            <Card className="bg-slate-900 border-slate-800 shadow-2xl shadow-indigo-950/30 overflow-hidden relative">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              
              <CardHeader className="pb-4 pt-6">
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  Student Registration
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Fill in your details to receive course fees, curriculum, and WhatsApp counseling.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {submittedStudent ? (
                  <div className="py-6 text-center space-y-4 animate-in fade-in duration-300">
                    <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Registration Received!</h3>
                      <p className="text-sm text-slate-300 mt-1">
                        Thank you, <span className="font-semibold text-white">{submittedStudent.name}</span>.
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        We have recorded your interest in{" "}
                        <span className="text-indigo-400 font-medium">{submittedStudent.courseName}</span>.
                        Our counselor will reach you at{" "}
                        <span className="text-white font-medium">{submittedStudent.tpNumber}</span> shortly.
                      </p>
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setSubmittedStudent(null)}
                        className="w-full border-slate-700 hover:bg-slate-800 text-slate-300"
                      >
                        Submit Another Inquiry
                      </Button>

                      <Link href="/dashboard" className="w-full">
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                          <span>View in Staff Dashboard</span>
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Student Name */}
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        Student Full Name <span className="text-rose-400">*</span>
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="e.g. Rahul Sharma / Kasun Perera"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>

                    {/* TP Number (Contact Number) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="tpNumber" className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-indigo-400" />
                        Contact / TP Number (WhatsApp) <span className="text-rose-400">*</span>
                      </Label>
                      <Input
                        id="tpNumber"
                        type="tel"
                        placeholder="e.g. 077 123 4567 or +94 77 123 4567"
                        value={formData.tpNumber}
                        onChange={(e) => setFormData({ ...formData, tpNumber: e.target.value })}
                        required
                        className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <p className="text-[11px] text-slate-400">
                        We will send the course details to this number on WhatsApp.
                      </p>
                    </div>

                    {/* Course Selection */}
                    <div className="space-y-1.5">
                      <Label htmlFor="courseName" className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                        Interested Course <span className="text-rose-400">*</span>
                      </Label>
                      <Select
                        value={formData.courseName}
                        onValueChange={(val) => setFormData({ ...formData, courseName: val })}
                      >
                        <SelectTrigger className="w-full bg-slate-950 border-slate-800 text-white">
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-white">
                          {POPULAR_COURSES.map((course) => (
                            <SelectItem key={course} value={course} className="focus:bg-slate-800 focus:text-white">
                              {course}
                            </SelectItem>
                          ))}
                          <SelectItem value="Other" className="focus:bg-slate-800 focus:text-white">
                            Other Course...
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      {formData.courseName === "Other" && (
                        <Input
                          type="text"
                          placeholder="Type your course of interest..."
                          value={customCourse}
                          onChange={(e) => setCustomCourse(e.target.value)}
                          className="mt-2 bg-slate-950 border-slate-800 text-white placeholder:text-slate-500"
                        />
                      )}
                    </div>

                    {/* Optional Email */}
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-medium text-slate-300">
                        Email Address <span className="text-slate-500 font-normal">(Optional)</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="yourname@gmail.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus:border-indigo-500"
                      />
                    </div>

                    {/* Optional Note / Questions */}
                    <div className="space-y-1.5">
                      <Label htmlFor="notes" className="text-xs font-medium text-slate-300">
                        Questions or Preferred Time <span className="text-slate-500 font-normal">(Optional)</span>
                      </Label>
                      <Input
                        id="notes"
                        type="text"
                        placeholder="e.g. Weekend batch preferred / call after 5 PM"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus:border-indigo-500"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-5 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit &amp; Get Course Details</span>
                          <Send className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>

                    <p className="text-[11px] text-center text-slate-500 flex items-center justify-center gap-1 pt-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                      Your information is secure. No spam, only direct course updates.
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-400">
        <p>&copy; {new Date().getFullYear()} AD Contacts &bull; E-Learning Academy. All rights reserved.</p>
      </footer>
    </div>
  );
}
