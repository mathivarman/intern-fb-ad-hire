"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import {
  Users,
  UserPlus,
  Phone,
  Search,
  RefreshCw,
  Download,
  Trash2,
  Edit,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  GraduationCap,
  ExternalLink,
  ChevronDown,
  Loader2,
  Calendar,
  AlertCircle,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  STUDENT_STATUSES,
  DEFAULT_FOLLOWERS,
  POPULAR_COURSES,
  StudentStatus,
  StudentRecord as StudentItem,
} from "@/types/student";
import Link from "next/link";

interface ApiResponse {
  success: boolean;
  students: StudentItem[];
  stats: Record<string, number>;
  courses: string[];
  followers: string[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const STATUS_CONFIG: Record<
  StudentStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  New: {
    label: "New",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
  },
  Contacted: {
    label: "Contacted",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  "No Answer": {
    label: "No Answer",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
  },
  "Follow Up": {
    label: "Follow Up",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
  },
  Confirmed: {
    label: "Confirmed",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
};

export default function DashboardPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [followerFilter, setFollowerFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");

  // Add Student Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    tpNumber: "",
    courseName: POPULAR_COURSES[0],
    customCourse: "",
    status: "New" as StudentStatus,
    follower: "None",
    email: "",
    notes: "",
  });

  // Edit Student Modal State
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Modal State
  const [deletingStudent, setDeletingStudent] = useState<StudentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // SWR Data Fetching
  const queryParams = new URLSearchParams();
  if (search) queryParams.set("search", search);
  if (statusFilter !== "all") queryParams.set("status", statusFilter);
  if (followerFilter !== "all") queryParams.set("follower", followerFilter);
  if (courseFilter !== "all") queryParams.set("course", courseFilter);

  const apiUrl = `/api/students?${queryParams.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<ApiResponse>(apiUrl, fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 15000, // Poll every 15s to automatically catch new Facebook Ad submissions
  });

  const students = data?.students || [];
  const stats = data?.stats || {
    all: 0,
    New: 0,
    Contacted: 0,
    "No Answer": 0,
    "Follow Up": 0,
    Confirmed: 0,
  };

  // Followers are strictly Mathi and Sinthu (plus None for unassigned)
  const allFollowers = DEFAULT_FOLLOWERS;

  // Handle Quick Status Change
  const handleQuickStatusChange = async (studentId: string, newStatus: StudentStatus) => {
    try {
      // Optimistic update
      mutate(
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            students: prev.students.map((s) =>
              s._id === studentId ? { ...s, status: newStatus } : s
            ),
          };
        },
        false
      );

      const res = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      toast.success(`Status updated to "${newStatus}"`);
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
      mutate();
    }
  };

  // Handle Quick Follower Change
  const handleQuickFollowerChange = async (studentId: string, newFollower: string) => {
    try {
      mutate(
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            students: prev.students.map((s) =>
              s._id === studentId ? { ...s, follower: newFollower } : s
            ),
          };
        },
        false
      );

      const res = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ follower: newFollower }),
      });

      if (!res.ok) throw new Error("Failed to assign follower");
      toast.success(`Assigned to ${newFollower}`);
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to assign follower");
      mutate();
    }
  };

  // Handle Add Student Manually
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      toast.error("Please enter student name");
      return;
    }
    if (!addForm.tpNumber.trim()) {
      toast.error("Please enter contact / TP number");
      return;
    }

    const courseToSubmit =
      addForm.courseName === "Other"
        ? addForm.customCourse.trim() || "General Inquiry"
        : addForm.courseName;

    setIsAdding(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name.trim(),
          tpNumber: addForm.tpNumber.trim(),
          courseName: courseToSubmit,
          status: addForm.status,
          follower: addForm.follower,
          email: addForm.email.trim(),
          notes: addForm.notes.trim(),
          source: "Manual Entry",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to add student");
      }

      toast.success("Student added successfully!");
      setIsAddModalOpen(false);
      setAddForm({
        name: "",
        tpNumber: "",
        courseName: POPULAR_COURSES[0],
        customCourse: "",
        status: "New",
        follower: "None",
        email: "",
        notes: "",
      });
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Error adding student");
    } finally {
      setIsAdding(false);
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/students/${editingStudent._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingStudent.name.trim(),
          tpNumber: editingStudent.tpNumber.trim(),
          courseName: editingStudent.courseName.trim(),
          status: editingStudent.status,
          follower: editingStudent.follower,
          email: editingStudent.email?.trim() || "",
          notes: editingStudent.notes?.trim() || "",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update student");
      }

      toast.success("Student updated successfully!");
      setEditingStudent(null);
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Error updating student");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!deletingStudent) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/students/${deletingStudent._id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete student");
      }

      toast.success("Student deleted");
      setDeletingStudent(null);
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Error deleting student");
    } finally {
      setIsDeleting(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!students || students.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Student Name",
      "TP Number",
      "Status",
      "Follower",
      "Course Name",
      "Email",
      "Notes",
      "Source",
      "Registered Date",
    ];

    const rows = students.map((s) => [
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.tpNumber.replace(/"/g, '""')}"`,
      `"${s.status}"`,
      `"${s.follower}"`,
      `"${s.courseName.replace(/"/g, '""')}"`,
      `"${(s.email || "").replace(/"/g, '""')}"`,
      `"${(s.notes || "").replace(/"/g, '""')}"`,
      `"${s.source || "Facebook Ad"}"`,
      `"${new Date(s.createdAt).toLocaleString()}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `elearning_students_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV file downloaded");
  };

  // Format clean WhatsApp number link
  const getWhatsAppUrl = (tp: string) => {
    const cleaned = tp.replace(/\D/g, "");
    // If starts with 0 (e.g. Sri Lanka 077...), replace leading 0 with 94
    let formatted = cleaned;
    if (formatted.startsWith("0")) {
      formatted = "94" + formatted.slice(1);
    }
    return `https://wa.me/${formatted}?text=${encodeURIComponent(
      "Hello! Thank you for registering for Apptron E-Learning courses. How can we help you?"
    )}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              AD Contacts
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live DB
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Student Admissions &amp; Facebook Ad Leads &bull; Single-Page Tracker
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => mutate()}
            className="gap-1.5 text-xs h-9 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="gap-1.5 text-xs h-9 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-1.5 text-xs h-9 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Student Manually</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <Card className="bg-card border-border shadow-xs hover:border-border/80 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Leads
              </p>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-bold text-foreground mt-2">{stats.all ?? 0}</p>
            <p className="text-[11px] text-muted-foreground mt-1">All registrations</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-xs hover:border-blue-500/30 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-blue-400 uppercase tracking-wider">
                New Leads
              </p>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            </div>
            <p className="text-2xl font-bold text-blue-400 mt-2">{stats.New ?? 0}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Awaiting contact</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-xs hover:border-amber-500/30 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-amber-400 uppercase tracking-wider">
                Contacted
              </p>
              <Phone className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-400 mt-2">{stats.Contacted ?? 0}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Messaged / Called</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-xs hover:border-rose-500/30 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-rose-400 uppercase tracking-wider">
                No Answer
              </p>
              <AlertCircle className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl font-bold text-rose-400 mt-2">{stats["No Answer"] ?? 0}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Unreachable</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-xs hover:border-purple-500/30 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-purple-400 uppercase tracking-wider">
                Follow Up
              </p>
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-400 mt-2">{stats["Follow Up"] ?? 0}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Scheduled call</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-xs hover:border-emerald-500/30 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                Confirmed
              </p>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400 mt-2">{stats.Confirmed ?? 0}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Enrolled & confirmed</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters Bar */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search Name, TP, Course..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STUDENT_STATUSES.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st} ({stats[st] || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Follower Filter */}
            <div>
              <Select value={followerFilter} onValueChange={setFollowerFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All Followers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Followers</SelectItem>
                  {allFollowers.map((fol) => (
                    <SelectItem key={fol} value={fol}>
                      Follower: {fol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Course Filter */}
            <div>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {(data?.courses || POPULAR_COURSES).map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Students Data Table */}
      <Card className="border-border shadow-xs">
        {/* Mobile Swipe Hint */}
        <div className="md:hidden px-3.5 py-2 bg-indigo-500/10 border-b border-border flex items-center justify-between text-xs text-indigo-400 font-medium">
          <span className="flex items-center gap-1.5">
            <span>&larr; Swipe left to view Status, Follower &amp; Actions &rarr;</span>
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold uppercase">
            Scrollable
          </span>
        </div>

        <div className="overflow-x-auto overflow-y-auto touch-pan-x w-full custom-scrollbar scrollbar-left max-h-[calc(100vh-280px)]">
          <table className="w-full min-w-[880px] text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 z-10">
                <th className="py-3 px-4 min-w-[200px] bg-muted/90 backdrop-blur-sm">Student Name</th>
                <th className="py-3 px-4 min-w-[150px] bg-muted/90 backdrop-blur-sm">TP Number (Contact)</th>
                <th className="py-3 px-4 min-w-[140px] bg-muted/90 backdrop-blur-sm">Status</th>
                <th className="py-3 px-4 min-w-[130px] bg-muted/90 backdrop-blur-sm">Follower</th>
                <th className="py-3 px-4 min-w-[200px] bg-muted/90 backdrop-blur-sm">Course Name</th>
                <th className="py-3 px-4 min-w-[150px] bg-muted/90 backdrop-blur-sm">Submitted Date</th>
                <th className="py-3 px-4 min-w-[90px] text-right bg-muted/90 backdrop-blur-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {isLoading && students.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-3.5 px-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-5 w-40" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="py-3.5 px-4 text-right"><Skeleton className="h-7 w-14 ml-auto" /></td>
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <GraduationCap className="w-10 h-10 text-muted-foreground/40" />
                      <p className="text-base font-medium text-foreground">No student leads found</p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {search || statusFilter !== "all" || followerFilter !== "all" || courseFilter !== "all"
                          ? "Try clearing your search or filter options"
                          : "Students will appear here as soon as they submit details on the Facebook Ad website or you add them manually."}
                      </p>
                      <div className="pt-2 flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSearch("");
                            setStatusFilter("all");
                            setFollowerFilter("all");
                            setCourseFilter("all");
                          }}
                          className="text-xs"
                        >
                          Clear Filters
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setIsAddModalOpen(true)}
                          className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          + Add First Student
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const statusConf = STATUS_CONFIG[student.status] || STATUS_CONFIG.New;
                  return (
                    <tr
                      key={student._id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Name Column */}
                      <td className="py-3 px-4 font-medium text-foreground">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground flex items-center gap-1.5">
                            {student.name}
                            {student.source === "Manual Entry" ? (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-slate-500/10 text-slate-400 border border-slate-500/20 font-normal">
                                Manual
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-blue-500/10 text-blue-400 border border-blue-500/20 font-normal flex items-center gap-1">
                                FB Ad
                              </span>
                            )}
                          </span>
                          {student.email ? (
                            <span className="text-xs text-muted-foreground">{student.email}</span>
                          ) : null}
                          {student.notes ? (
                            <span className="text-[11px] text-muted-foreground/80 italic line-clamp-1 mt-0.5">
                              &ldquo;{student.notes}&rdquo;
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* TP Number (Contact Number) with WhatsApp & Call */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${student.tpNumber}`}
                            className="font-mono text-xs text-foreground font-semibold hover:text-indigo-400 transition-colors"
                            title="Click to call"
                          >
                            {student.tpNumber}
                          </a>
                          <a
                            href={getWhatsAppUrl(student.tpNumber)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* Status Dropdown (1-Click Change) */}
                      <td className="py-3 px-4">
                        <Select
                          value={student.status}
                          onValueChange={(val) =>
                            handleQuickStatusChange(student._id, val as StudentStatus)
                          }
                        >
                          <SelectTrigger
                            className={`h-7 text-xs font-semibold rounded-full border px-2.5 w-[130px] ${statusConf.bg} ${statusConf.color} ${statusConf.border}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STUDENT_STATUSES.map((st) => {
                              const conf = STATUS_CONFIG[st];
                              return (
                                <SelectItem key={st} value={st} className="text-xs font-medium">
                                  <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${conf.color} bg-current`} />
                                  {st}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Follower Dropdown (1-Click Assign) */}
                      <td className="py-3 px-4">
                        <Select
                          value={student.follower || "None"}
                          onValueChange={(val) => handleQuickFollowerChange(student._id, val)}
                        >
                          <SelectTrigger className="h-7 text-xs rounded-md border border-border px-2 w-[110px] bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {allFollowers.map((fol) => (
                              <SelectItem key={fol} value={fol} className="text-xs">
                                {fol === "None" ? "— Unassigned —" : fol}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Course Name */}
                      <td className="py-3 px-4">
                        <Badge
                          variant="secondary"
                          className="font-normal text-xs bg-muted text-foreground border-border truncate max-w-[220px]"
                        >
                          {student.courseName}
                        </Badge>
                      </td>

                      {/* Submitted Date */}
                      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground/60" />
                          <span>
                            {new Date(student.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-[11px] text-muted-foreground/60">
                            {new Date(student.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => setEditingStudent(student)}
                            title="Edit Student"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-rose-400"
                            onClick={() => setDeletingStudent(student)}
                            title="Delete Student"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="px-4 py-3 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>
            Showing <span className="font-semibold text-foreground">{students.length}</span>{" "}
            {students.length === 1 ? "student" : "students"}
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              <span>Test Public Facebook Ad Form</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </Card>

      {/* MODAL: ADD STUDENT MANUALLY */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="w-5 h-5 text-indigo-500" />
              Add Student Manually
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Manually record a new student enrollment inquiry or walk-in lead.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-3.5 pt-2">
            {/* Student Name */}
            <div className="space-y-1">
              <Label htmlFor="m-name" className="text-xs font-semibold">
                Student Full Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="m-name"
                placeholder="e.g. Kasun Perera"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                required
                className="h-9 text-xs"
              />
            </div>

            {/* TP Number */}
            <div className="space-y-1">
              <Label htmlFor="m-tp" className="text-xs font-semibold">
                Contact / TP Number <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="m-tp"
                placeholder="e.g. 077 123 4567 or +94 77 123 4567"
                value={addForm.tpNumber}
                onChange={(e) => setAddForm({ ...addForm, tpNumber: e.target.value })}
                required
                className="h-9 text-xs"
              />
            </div>

            {/* Course Name */}
            <div className="space-y-1">
              <Label htmlFor="m-course" className="text-xs font-semibold">
                Course Name <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={addForm.courseName}
                onValueChange={(val) => setAddForm({ ...addForm, courseName: val })}
              >
                <SelectTrigger id="m-course" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POPULAR_COURSES.map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">
                      {c}
                    </SelectItem>
                  ))}
                  <SelectItem value="Other" className="text-xs">
                    Other / Custom Course...
                  </SelectItem>
                </SelectContent>
              </Select>
              {addForm.courseName === "Other" && (
                <Input
                  placeholder="Type course name..."
                  value={addForm.customCourse}
                  onChange={(e) => setAddForm({ ...addForm, customCourse: e.target.value })}
                  className="h-9 text-xs mt-1.5"
                />
              )}
            </div>

            {/* Status & Follower in 2 columns */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Status</Label>
                <Select
                  value={addForm.status}
                  onValueChange={(val) => setAddForm({ ...addForm, status: val as StudentStatus })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STUDENT_STATUSES.map((st) => (
                      <SelectItem key={st} value={st} className="text-xs">
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Follower</Label>
                <Select
                  value={addForm.follower}
                  onValueChange={(val) => setAddForm({ ...addForm, follower: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allFollowers.map((fol) => (
                      <SelectItem key={fol} value={fol} className="text-xs">
                        {fol === "None" ? "— Unassigned —" : fol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Optional Email */}
            <div className="space-y-1">
              <Label htmlFor="m-email" className="text-xs">
                Email Address <span className="text-muted-foreground text-[10px]">(Optional)</span>
              </Label>
              <Input
                id="m-email"
                type="email"
                placeholder="student@example.com"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            {/* Optional Notes */}
            <div className="space-y-1">
              <Label htmlFor="m-notes" className="text-xs">
                Follow-up Notes / Remarks
              </Label>
              <Textarea
                id="m-notes"
                placeholder="e.g. Inquired about weekend batch fees, will confirm on Friday"
                value={addForm.notes}
                onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                rows={2}
                className="text-xs resize-none"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isAdding}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Student</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDIT STUDENT */}
      <Dialog
        open={!!editingStudent}
        onOpenChange={(open) => {
          if (!open) setEditingStudent(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Edit className="w-5 h-5 text-indigo-500" />
              Edit Student Details
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update contact info, course, follow-up status, or notes.
            </DialogDescription>
          </DialogHeader>

          {editingStudent && (
            <form onSubmit={handleEditSubmit} className="space-y-3.5 pt-2">
              <div className="space-y-1">
                <Label htmlFor="e-name" className="text-xs font-semibold">
                  Student Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="e-name"
                  value={editingStudent.name}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, name: e.target.value })
                  }
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="e-tp" className="text-xs font-semibold">
                  TP Number <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="e-tp"
                  value={editingStudent.tpNumber}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, tpNumber: e.target.value })
                  }
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="e-course" className="text-xs font-semibold">
                  Course Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="e-course"
                  value={editingStudent.courseName}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, courseName: e.target.value })
                  }
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Status</Label>
                  <Select
                    value={editingStudent.status}
                    onValueChange={(val) =>
                      setEditingStudent({
                        ...editingStudent,
                        status: val as StudentStatus,
                      })
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STUDENT_STATUSES.map((st) => (
                        <SelectItem key={st} value={st} className="text-xs">
                          {st}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Follower</Label>
                  <Select
                    value={editingStudent.follower || "None"}
                    onValueChange={(val) =>
                      setEditingStudent({ ...editingStudent, follower: val })
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allFollowers.map((fol) => (
                        <SelectItem key={fol} value={fol} className="text-xs">
                          {fol === "None" ? "— Unassigned —" : fol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="e-email" className="text-xs">
                  Email Address
                </Label>
                <Input
                  id="e-email"
                  type="email"
                  value={editingStudent.email || ""}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, email: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="e-notes" className="text-xs">
                  Notes / Follow-up Details
                </Label>
                <Textarea
                  id="e-notes"
                  value={editingStudent.notes || ""}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, notes: e.target.value })
                  }
                  rows={3}
                  className="text-xs resize-none"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingStudent(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSavingEdit}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Update Student</span>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: DELETE CONFIRMATION */}
      <Dialog
        open={!!deletingStudent}
        onOpenChange={(open) => {
          if (!open) setDeletingStudent(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-500 text-base">
              <AlertCircle className="w-5 h-5" />
              Delete Student Lead
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {deletingStudent?.name}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingStudent(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={handleDeleteConfirm}
              className="text-xs cursor-pointer"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
