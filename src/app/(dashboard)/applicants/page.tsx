"use client";

import { useState, useMemo, useCallback, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR, { mutate } from "swr";
import { Search, ChevronLeft, ChevronRight, Plus, Edit2, Loader2, Eye, Calendar, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/StatusBadge";
import type { ApplicationStatus } from "@/models/Application";
import { toast } from "sonner";
import { cn, guessCountryFromPhone, classifyCountry } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface ApplicationRow {
  _id: string;
  status: ApplicationStatus;
  appliedDate: string;
  interviewDate?: string;
  notes?: string;
  applicantId: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
    preferredLanguage?: string;
    follower?: string;
    educationLevel?: string;
    group?: string;
    linkedin?: string;
    portfolio?: string;
    cvUrl?: string;
    country?: string;
    internId?: string;
  };
  positionId: { _id: string; name: string; department: string };
  batchId: { _id: string; title: string };
}

interface ApplicantsResponse {
  applications: ApplicationRow[];
  total: number;
  page: number;
  limit: number;
  counts?: {
    all: number;
    new: number;
    messaged: number;
    noresponse: number;
    interview: number;
    confirmed: number;
    followup: number;
    rejected: number;
  };
}

interface PositionOption {
  _id: string;
  name: string;
  department: string;
  status: string;
}

interface BatchOption {
  _id: string;
  title: string;
  positionId: { _id: string; name: string };
}

const STATUSES = ["New", "Messaged", "No Response", "Follow Up", "Interview", "Confirmed", "Rejected"];
const LANGUAGES = ["Tamil", "Sinhala", "English"];
const FOLLOWERS = ["None", "Mathi", "Sinthu"];
const EDUCATIONS = ["Diploma", "HND", "Undergraduate", "Graduate"];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Debounce hook
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useMemo(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const INITIAL_FORM = {
  fullName: "",
  email: "",
  phone: "",
  group: "",
  linkedin: "",
  portfolio: "",
  educationLevel: "",
  preferredLanguage: "",
  follower: "None",
  cvUrl: "",
  positionId: "",
  batchId: "",
  country: "Sri Lanka",
};

function ApplicantsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial values from URL search params so back-navigation restores filters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(() => {
    const urlStatus = searchParams.get("status");
    return urlStatus || "all";
  });
  const [follower, setFollower] = useState(searchParams.get("follower") || "all");
  const [education, setEducation] = useState(searchParams.get("education") || "all");
  const [positionId, setPositionId] = useState(searchParams.get("positionId") || "all");
  const [date, setDate] = useState(searchParams.get("date") || "");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  // Sync state with URL search params (e.g. when navigating back/forward or on mount after hydration)
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    const urlStatus = searchParams.get("status") || "all";
    const urlFollower = searchParams.get("follower") || "all";
    const urlEducation = searchParams.get("education") || "all";
    const urlPositionId = searchParams.get("positionId") || "all";
    const urlDate = searchParams.get("date") || "";
    const urlPage = Number(searchParams.get("page")) || 1;

    setSearch((prev) => (prev !== urlSearch ? urlSearch : prev));
    setStatus((prev) => (prev !== urlStatus ? urlStatus : prev));
    setFollower((prev) => (prev !== urlFollower ? urlFollower : prev));
    setEducation((prev) => (prev !== urlEducation ? urlEducation : prev));
    setPositionId((prev) => (prev !== urlPositionId ? urlPositionId : prev));
    setDate((prev) => (prev !== urlDate ? urlDate : prev));
    setPage((prev) => (prev !== urlPage ? urlPage : prev));
  }, [searchParams]);

  // Sync filters to URL (replace, not push, to avoid polluting history)
  const syncUrl = useCallback((overrides: Record<string, string | number>) => {
    const params = new URLSearchParams();
    const merged = { search, status, follower, education, positionId, date, page, ...overrides };
    if (merged.search) params.set("search", String(merged.search));
    if (merged.status && merged.status !== "all") params.set("status", String(merged.status));
    if (merged.follower && merged.follower !== "all") params.set("follower", String(merged.follower));
    if (merged.education && merged.education !== "all") params.set("education", String(merged.education));
    if (merged.positionId && merged.positionId !== "all") params.set("positionId", String(merged.positionId));
    if (merged.status === "Interview") {
      if (merged.date) params.set("date", String(merged.date));
    }
    if (Number(merged.page) > 1) params.set("page", String(merged.page));
    const qs = params.toString();
    router.replace(`/applicants${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [search, status, follower, education, positionId, date, page, router]);

  const [interviewAppId, setInterviewAppId] = useState<string | null>(null);
  const [interviewDateTime, setInterviewDateTime] = useState("");
  const [isSubmittingInterview, setIsSubmittingInterview] = useState(false);
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);

  // Edit state
  const [editTarget, setEditTarget] = useState<ApplicationRow | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState(INITIAL_FORM);
  const [isEditing, setIsEditing] = useState(false);

  // Follow up state
  const [followUpAppId, setFollowUpAppId] = useState<string | null>(null);
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);

  // Rejected state
  const [rejectedAppId, setRejectedAppId] = useState<string | null>(null);
  const [rejectedNotes, setRejectedNotes] = useState("");
  const [isSubmittingRejected, setIsSubmittingRejected] = useState(false);
  const [rejectedDialogOpen, setRejectedDialogOpen] = useState(false);

  // Bulk selection and status update state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAllMatching, setSelectAllMatching] = useState(false);
  const [bulkStatusValue, setBulkStatusValue] = useState("");
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [pendingBulkStatus, setPendingBulkStatus] = useState<ApplicationStatus | "">("");
  const [bulkInterviewDateTime, setBulkInterviewDateTime] = useState("");
  const [bulkNotes, setBulkNotes] = useState("");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Add candidate state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState(INITIAL_FORM);
  const [isAdding, setIsAdding] = useState(false);
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);

  const limit = 20;
  const debouncedSearch = useDebounce(search, 300);

  // Build the SWR key from filters
  const swrKey = useMemo(() => {
    const params = new URLSearchParams({
      search: debouncedSearch,
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status && status !== "all") params.set("status", status);
    if (follower && follower !== "all") params.set("follower", follower);
    if (education && education !== "all") params.set("education", education);
    if (positionId && positionId !== "all") params.set("positionId", positionId);
    if (status === "Interview") {
      if (date) params.set("date", date);
    }
    return `/api/applicants?${params}`;
  }, [debouncedSearch, status, follower, education, positionId, date, page]);

  const { data, isLoading } = useSWR<ApplicantsResponse>(swrKey, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
    dedupingInterval: 10000,
  });

  const rows = data?.applications || [];
  const total = data?.total || 0;

  const counts = data?.counts || {
    all: 0,
    new: 0,
    messaged: 0,
    noresponse: 0,
    interview: 0,
    confirmed: 0,
    followup: 0,
    rejected: 0,
  };

  const getTabCount = (tabId: string) => {
    if (tabId === "all") return counts.all;
    if (tabId === "New") return counts.new;
    if (tabId === "Messaged") return counts.messaged;
    if (tabId === "Interview") return counts.interview;
    if (tabId === "Confirmed") return counts.confirmed;
    if (tabId === "Follow Up") return counts.followup;
    if (tabId === "No Response") return counts.noresponse;
    if (tabId === "Rejected") return counts.rejected;
    return 0;
  };

  // Fetch positions initially for filters, and batches when add or edit dialog opens
  useEffect(() => {
    fetch("/api/positions").then(r => r.json()).then(d => setPositions(d.positions || []));
  }, []);

  useEffect(() => {
    if (addDialogOpen || editDialogOpen) {
      fetch("/api/batches").then(r => r.json()).then(d => setBatches(d.batches || []));
    }
  }, [addDialogOpen, editDialogOpen]);

  // Filter batches by selected position in edit form
  const editFilteredBatches = editForm.positionId
    ? batches.filter(b => b.positionId?._id === editForm.positionId)
    : batches;

  // Filter batches by selected position
  const filteredBatches = addForm.positionId
    ? batches.filter(b => b.positionId?._id === addForm.positionId)
    : batches;

  const handleScheduleInterview = async () => {
    if (!interviewAppId || !interviewDateTime) {
      toast.error("Please enter a date and time");
      return;
    }
    setIsSubmittingInterview(true);
    try {
      const isoString = new Date(interviewDateTime).toISOString();
      const res = await fetch(`/api/applications/${interviewAppId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Interview", interviewDate: isoString }),
      });
      if (!res.ok) throw new Error("Failed to schedule interview");
      
      mutate(swrKey);
      toast.success("Interview scheduled");
      setInterviewDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to schedule interview");
    } finally {
      setIsSubmittingInterview(false);
    }
  };

  const handleSaveFollowUp = async () => {
    if (!followUpAppId) return;
    setIsSubmittingFollowUp(true);
    try {
      const res = await fetch(`/api/applications/${followUpAppId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Follow Up", notes: followUpNotes }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      
      mutate(swrKey);
      toast.success("Status updated to Follow Up");
      setFollowUpDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setIsSubmittingFollowUp(false);
    }
  };

  const handleSaveRejected = async () => {
    if (!rejectedAppId) return;
    setIsSubmittingRejected(true);
    try {
      const res = await fetch(`/api/applications/${rejectedAppId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Rejected", notes: rejectedNotes }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      
      mutate(swrKey);
      toast.success("Status updated to Rejected");
      setRejectedDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setIsSubmittingRejected(false);
    }
  };

  const handleEditCandidate = async () => {
    if (!editTarget) return;
    if (!editForm.fullName || !editForm.email || !editForm.phone || !editForm.positionId || !editForm.batchId) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsEditing(true);
    try {
      const res = await fetch(`/api/applicants/${editTarget.applicantId._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          applicationId: editTarget._id,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update candidate");
      mutate(swrKey);
      toast.success("Candidate updated successfully");
      setEditDialogOpen(false);
      setEditTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update candidate");
    } finally {
      setIsEditing(false);
    }
  };

  const handleAddCandidate = async () => {
    if (!addForm.fullName || !addForm.email || !addForm.phone || !addForm.positionId || !addForm.batchId) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsAdding(true);
    try {
      const res = await fetch("/api/applicants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to add candidate");
      mutate(swrKey);
      toast.success("Candidate added successfully");
      setAddDialogOpen(false);
      setAddForm(INITIAL_FORM);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add candidate");
    } finally {
      setIsAdding(false);
    }
  };

  // Clear selection when filters or page changes
  useEffect(() => {
    setSelectedIds([]);
    setSelectAllMatching(false);
    setBulkStatusValue("");
  }, [search, status, follower, education, positionId, date, page]);

  const isAllOnPageSelected = rows.length > 0 && rows.every((r) => selectedIds.includes(r._id));

  const handleToggleSelectAll = () => {
    if (isAllOnPageSelected || selectAllMatching) {
      setSelectedIds([]);
      setSelectAllMatching(false);
    } else {
      setSelectedIds(rows.map((r) => r._id));
      setSelectAllMatching(false);
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectAllMatching(false);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOpenBulkStatusModal = (newStatus: string) => {
    setPendingBulkStatus(newStatus as ApplicationStatus);
    setBulkStatusValue(newStatus);
    setBulkInterviewDateTime("");
    setBulkNotes("");
    setBulkModalOpen(true);
  };

  const handleCloseBulkStatusModal = () => {
    setBulkModalOpen(false);
    setPendingBulkStatus("");
    setBulkStatusValue("");
  };

  const handleConfirmBulkStatus = async () => {
    if (!pendingBulkStatus) return;
    if (pendingBulkStatus === "Interview" && !bulkInterviewDateTime) {
      toast.error("Please enter a date and time for the interview");
      return;
    }

    setIsBulkUpdating(true);
    try {
      const payload: any = {
        status: pendingBulkStatus,
        selectAllMatching,
        applicationIds: selectAllMatching ? [] : selectedIds,
        filters: {
          search: debouncedSearch,
          status: status !== "all" ? status : undefined,
          follower: follower !== "all" ? follower : undefined,
          education: education !== "all" ? education : undefined,
          positionId: positionId !== "all" ? positionId : undefined,
          date: date || undefined,
        },
      };

      if (pendingBulkStatus === "Interview") {
        payload.interviewDate = new Date(bulkInterviewDateTime).toISOString();
      }
      if (bulkNotes.trim()) {
        payload.notes = bulkNotes.trim();
      }

      const res = await fetch("/api/applications/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update applications");

      const count = json.modifiedCount ?? (selectAllMatching ? total : selectedIds.length);
      toast.success(`Updated ${count} candidate${count === 1 ? "" : "s"} to ${pendingBulkStatus}`);
      setSelectedIds([]);
      setSelectAllMatching(false);
      handleCloseBulkStatusModal();
      mutate(swrKey);
    } catch (err: any) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to bulk update status");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const tabs = [
    { id: "all", label: "Sri Lanka" },
    { id: "New", label: "New" },
    { id: "Messaged", label: "Messaged" },
    { id: "Interview", label: "Interview" },
    { id: "Confirmed", label: "Confirmed" },
    { id: "Follow Up", label: "Follow Up" },
    { id: "No Response", label: "No Response" },
    { id: "Rejected", label: "Rejected" },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Applicants</h1>
        <Button onClick={() => setAddDialogOpen(true)} size="sm">
          <Plus size={16} className="mr-2" /> Add Candidate
        </Button>
      </div>

      {/* Status Tabs Navigation */}
      <div className="flex flex-wrap border-b border-border gap-6 pb-px">
        {tabs.map((tab) => {
          const active = status === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setStatus(tab.id);
                setPage(1);
                syncUrl({ status: tab.id, page: 1 });
              }}
              className={cn(
                "pb-3 text-sm font-medium transition-all relative cursor-pointer whitespace-nowrap pr-4",
                active
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>{tab.label}</span>
              <span className={cn(
                "absolute top-0 -right-2 text-[9px] min-w-4 h-4 flex items-center justify-center px-1 rounded-full font-bold transition-all",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted-foreground/20 text-muted-foreground"
              )}>
                {getTabCount(tab.id)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by name, phone, email..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); syncUrl({ search: e.target.value, page: 1 }); }}
          />
        </div>

        <Select value={positionId} onValueChange={(v) => { setPositionId(v); setPage(1); syncUrl({ positionId: v, page: 1 }); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Courses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {positions.map((p) => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); syncUrl({ status: v, page: 1 }); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={follower} onValueChange={(v) => { setFollower(v); setPage(1); syncUrl({ follower: v, page: 1 }); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Follower" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Followers</SelectItem>
            {FOLLOWERS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={education} onValueChange={(v) => { setEducation(v); setPage(1); syncUrl({ education: v, page: 1 }); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Education" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Education</SelectItem>
            {EDUCATIONS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Date Filter Row for Interview Page */}
      {status === "Interview" && (
        <div className="flex items-center gap-3 bg-muted/20 p-3 rounded-lg border border-border/60 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mr-2">
            <Calendar size={14} className="text-primary" />
            <span>Interview Date:</span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              className="h-8 text-xs w-36 bg-background"
              value={date}
              onChange={(e) => {
                const val = e.target.value;
                setDate(val);
                setPage(1);
                syncUrl({ date: val, page: 1 });
              }}
            />
          </div>
          {date && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
              onClick={() => {
                setDate("");
                setPage(1);
                syncUrl({ date: "", page: 1 });
              }}
            >
              <X size={14} className="mr-1" /> Clear
            </Button>
          )}
        </div>
      )}

      {/* Count & Bulk Actions */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Showing {rows.length} of <span className="font-semibold text-foreground">{total}</span> applications
            </p>
            {(selectedIds.length > 0 || selectAllMatching) && (
              <Badge variant="secondary" className="text-xs font-normal">
                {selectAllMatching ? `All ${total} selected` : `${selectedIds.length} selected`}
              </Badge>
            )}
          </div>

          {/* Right side - below All Education */}
          <div className="flex items-center gap-2">
            {/* Tick box to select all students */}
            <div
              onClick={handleToggleSelectAll}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium cursor-pointer transition-all select-none",
                isAllOnPageSelected
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "bg-background border-input text-foreground hover:bg-muted/50"
              )}
            >
              <Checkbox
                id="select-all-header-btn"
                checked={isAllOnPageSelected}
                onCheckedChange={handleToggleSelectAll}
                aria-label="Select all students"
              />
              <label htmlFor="select-all-header-btn" className="cursor-pointer">
                Select All
              </label>
            </div>

            {/* Change bulk status */}
            <Select
              value={bulkStatusValue}
              onValueChange={handleOpenBulkStatusModal}
              disabled={selectedIds.length === 0 && !selectAllMatching}
            >
              <SelectTrigger
                className={cn(
                  "h-8 text-xs w-40 transition-all",
                  (selectedIds.length > 0 || selectAllMatching)
                    ? "border-primary/50 bg-background font-medium shadow-xs"
                    : "opacity-60 cursor-not-allowed bg-muted/20"
                )}
              >
                <SelectValue placeholder="Change Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    <StatusBadge status={s as ApplicationStatus} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Option to select all total matching applications if total > rows.length */}
        {isAllOnPageSelected && total > rows.length && (
          <div className="bg-primary/5 border border-primary/20 rounded-md py-1.5 px-3 text-xs flex items-center justify-between text-muted-foreground animate-in fade-in">
            <span>
              {selectAllMatching
                ? `All ${total} applications matching your filters are selected.`
                : `All ${rows.length} applications on this page are selected.`}
            </span>
            {selectAllMatching ? (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs text-primary font-semibold underline cursor-pointer"
                onClick={() => setSelectAllMatching(false)}
              >
                Clear all-pages selection
              </Button>
            ) : (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs text-primary font-semibold underline cursor-pointer"
                onClick={() => setSelectAllMatching(true)}
              >
                Select all {total} applications
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="w-10 py-3 px-3 text-center">
                    <Checkbox
                      checked={isAllOnPageSelected}
                      onCheckedChange={handleToggleSelectAll}
                      aria-label="Select all students on this page"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Applicant</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Contact</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Follower</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Education</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Position</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Batch</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Applied</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground w-16">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && !data
                  ? Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i} className="border-b">
                        {Array.from({ length: 10 }).map((_, j) => (
                          <td key={j} className="py-3 px-4">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : rows.length === 0
                  ? (
                    <tr>
                      <td colSpan={10} className="py-16 text-center text-muted-foreground">
                        No applicants found. Try adjusting your filters.
                      </td>
                    </tr>
                  )
                  : rows.map((row) => {
                    const isSelected = selectedIds.includes(row._id) || selectAllMatching;
                    return (
                    <tr
                      key={row._id}
                      className={cn(
                        "border-b transition-colors",
                        isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/10"
                      )}
                    >
                      <td className="w-10 py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleRow(row._id)}
                          aria-label={`Select ${row.applicantId?.fullName || "student"}`}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                            onClick={() => {
                              const params = new URLSearchParams();
                              if (search) params.set("search", search);
                              if (status && status !== "all") params.set("status", status);
                              if (follower && follower !== "all") params.set("follower", follower);
                              if (education && education !== "all") params.set("education", education);
                              if (page > 1) params.set("page", String(page));
                              const qs = params.toString();
                              router.push(`/applicants/${row.applicantId?._id}${qs ? `?${qs}` : ""}`);
                            }}
                            title="View Applicant Profile"
                          >
                            <Eye size={16} className="transition-transform duration-200 hover:scale-115" />
                          </Button>
                          <div>
                            <p className="font-medium text-foreground">{row.applicantId?.fullName}</p>
                            {row.applicantId?.internId && (
                              <span className="inline-block text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded mt-0.5">
                                {row.applicantId.internId}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <p>{row.applicantId?.phone}</p>
                        <p className="text-xs">{row.applicantId?.email}</p>
                        {row.applicantId?.country ? (
                          <div className="mt-0.5">
                            <span className="text-[10px] text-destructive font-medium">{row.applicantId.country}</span>
                            {classifyCountry(row.applicantId.country, row.applicantId.phone) !== row.applicantId.country && (
                              <span className="text-[9px] text-muted-foreground ml-1">
                                ({classifyCountry(row.applicantId.country, row.applicantId.phone)})
                              </span>
                            )}
                          </div>
                        ) : (
                          row.applicantId?.phone && (
                            <div className="mt-0.5">
                              <span className="text-[10px] text-muted-foreground/50">—</span>
                              <span className="text-[9px] text-muted-foreground ml-1">
                                ({classifyCountry("", row.applicantId.phone)})
                              </span>
                            </div>
                          )
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={row.status}
                            onValueChange={async (newStatus) => {
                              if (newStatus === "Interview") {
                                setInterviewAppId(row._id);
                                if (row.interviewDate) {
                                  try {
                                    const d = new Date(row.interviewDate);
                                    if (!isNaN(d.getTime())) {
                                      const localISO = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                                      setInterviewDateTime(localISO);
                                    } else {
                                      setInterviewDateTime("");
                                    }
                                  } catch {
                                    setInterviewDateTime("");
                                  }
                                } else {
                                  setInterviewDateTime("");
                                }
                                setInterviewDialogOpen(true);
                                return;
                              }
                              if (newStatus === "Follow Up") {
                                setFollowUpAppId(row._id);
                                setFollowUpNotes(row.notes || "");
                                setFollowUpDialogOpen(true);
                                return;
                              }
                              if (newStatus === "Rejected") {
                                setRejectedAppId(row._id);
                                setRejectedNotes(row.notes || "");
                                setRejectedDialogOpen(true);
                                return;
                              }
                              try {
                                const res = await fetch(`/api/applications/${row._id}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ status: newStatus }),
                                });
                                if (!res.ok) throw new Error("Failed to update status");
                                
                                mutate(swrKey);
                                toast.success("Status updated");
                              } catch (err) {
                                console.error(err);
                                toast.error("Failed to update status");
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs w-36 bg-transparent border-0 hover:bg-muted/50 p-1 flex justify-start gap-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((s) => (
                                <SelectItem 
                                  key={s} 
                                  value={s}
                                  onClick={() => {
                                    if (s === "Interview" && row.status === "Interview") {
                                      setInterviewAppId(row._id);
                                      if (row.interviewDate) {
                                        try {
                                          const d = new Date(row.interviewDate);
                                          if (!isNaN(d.getTime())) {
                                            const localISO = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                                            setInterviewDateTime(localISO);
                                          } else {
                                            setInterviewDateTime("");
                                          }
                                        } catch {
                                          setInterviewDateTime("");
                                        }
                                      } else {
                                        setInterviewDateTime("");
                                      }
                                      setInterviewDialogOpen(true);
                                    }
                                    if (s === "Follow Up" && row.status === "Follow Up") {
                                      setFollowUpAppId(row._id);
                                      setFollowUpNotes(row.notes || "");
                                      setFollowUpDialogOpen(true);
                                    }
                                    if (s === "Rejected" && row.status === "Rejected") {
                                      setRejectedAppId(row._id);
                                      setRejectedNotes(row.notes || "");
                                      setRejectedDialogOpen(true);
                                    }
                                  }}
                                >
                                  <StatusBadge status={s as ApplicationStatus} />
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {row.status === "Interview" && (
                            <div className="text-[10px] text-muted-foreground mt-1 whitespace-nowrap flex items-center gap-1.5 flex-wrap">
                              <span>
                                📅 {row.interviewDate 
                                  ? new Date(row.interviewDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                                  : "Not scheduled"}
                              </span>
                              <Button
                                variant="ghost"
                                size="xs"
                                className="h-4 px-1 text-primary hover:bg-muted text-[9px] flex items-center"
                                onClick={() => {
                                  setInterviewAppId(row._id);
                                  if (row.interviewDate) {
                                    try {
                                      const d = new Date(row.interviewDate);
                                      if (!isNaN(d.getTime())) {
                                        const localISO = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                                        setInterviewDateTime(localISO);
                                      } else {
                                        setInterviewDateTime("");
                                      }
                                    } catch {
                                      setInterviewDateTime("");
                                    }
                                  } else {
                                    setInterviewDateTime("");
                                  }
                                  setInterviewDialogOpen(true);
                                }}
                              >
                                {row.interviewDate ? "Change" : "Schedule"}
                              </Button>
                            </div>
                          )}
                          {row.status === "Follow Up" && (
                            <div className="text-[10px] text-muted-foreground mt-1 whitespace-nowrap flex items-center gap-1.5 flex-wrap">
                              <span className="truncate max-w-[110px]" title={row.notes || "No comments yet"}>
                                📝 {row.notes || "No comments yet"}
                              </span>
                              <Button
                                variant="ghost"
                                size="xs"
                                className="h-4 px-1 text-primary hover:bg-muted text-[9px] flex items-center"
                                onClick={() => {
                                  setFollowUpAppId(row._id);
                                  setFollowUpNotes(row.notes || "");
                                  setFollowUpDialogOpen(true);
                                }}
                              >
                                Edit
                              </Button>
                            </div>
                          )}
                          {row.status === "Rejected" && (
                            <div className="text-[10px] text-muted-foreground mt-1 whitespace-nowrap flex items-center gap-1.5 flex-wrap">
                              <span className="truncate max-w-[110px]" title={row.notes || "No comments yet"}>
                                🚫 {row.notes || "No comments yet"}
                              </span>
                              <Button
                                variant="ghost"
                                size="xs"
                                className="h-4 px-1 text-primary hover:bg-muted text-[9px] flex items-center"
                                onClick={() => {
                                  setRejectedAppId(row._id);
                                  setRejectedNotes(row.notes || "");
                                  setRejectedDialogOpen(true);
                                }}
                              >
                                Edit
                              </Button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={row.applicantId?.follower || "None"}
                            onValueChange={async (newFollower) => {
                              try {
                                const res = await fetch(`/api/applicants/${row.applicantId?._id}`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ follower: newFollower }),
                                });
                                if (!res.ok) throw new Error("Failed to update follower");
                                mutate(swrKey);
                                toast.success(`Follower updated to ${newFollower}`);
                              } catch (err) {
                                console.error(err);
                                toast.error("Failed to update follower");
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs w-28 bg-transparent border-0 hover:bg-muted/50 p-1 flex justify-start gap-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FOLLOWERS.map((f) => (
                                <SelectItem key={f} value={f}>
                                  {f}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {row.applicantId?.educationLevel || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-xs">{row.positionId?.name}</p>
                        <p className="text-xs text-muted-foreground">{row.positionId?.department}</p>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{row.batchId?.title}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {new Date(row.appliedDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => {
                              setEditTarget(row);
                              setEditForm({
                                fullName: row.applicantId?.fullName || "",
                                email: row.applicantId?.email || "",
                                phone: row.applicantId?.phone || "",
                                group: row.applicantId?.group || "",
                                linkedin: row.applicantId?.linkedin || "",
                                portfolio: row.applicantId?.portfolio || "",
                                educationLevel: row.applicantId?.educationLevel || "",
                                preferredLanguage: row.applicantId?.preferredLanguage || "",
                                follower: row.applicantId?.follower || "None",
                                cvUrl: row.applicantId?.cvUrl || "",
                                positionId: row.positionId?._id || "",
                                batchId: row.batchId?._id || "",
                                country: row.applicantId?.country || "Sri Lanka",
                              });
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit2 size={15} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => { const np = page - 1; setPage(np); syncUrl({ page: np }); }}>
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => { const np = page + 1; setPage(np); syncUrl({ page: np }); }}>
            <ChevronRight size={16} />
          </Button>
        </div>
      )}

      {/* Schedule Interview Dialog */}
      <Dialog open={interviewDialogOpen} onOpenChange={setInterviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Date & Time</Label>
              <Input
                type="datetime-local"
                value={interviewDateTime}
                onChange={(e) => setInterviewDateTime(e.target.value)}
              />
            </div>
            <Button onClick={handleScheduleInterview} className="w-full" disabled={isSubmittingInterview}>
              {isSubmittingInterview ? "Scheduling..." : "Schedule Interview"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Follow Up Dialog */}
      <Dialog open={followUpDialogOpen} onOpenChange={setFollowUpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Follow Up Comment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Comment / Notes</Label>
              <Textarea
                placeholder="Write any follow up comment..."
                value={followUpNotes}
                onChange={(e) => setFollowUpNotes(e.target.value)}
                rows={4}
              />
            </div>
            <Button onClick={handleSaveFollowUp} className="w-full" disabled={isSubmittingFollowUp}>
              {isSubmittingFollowUp ? "Saving..." : "Save & Set to Follow Up"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejected Dialog */}
      <Dialog open={rejectedDialogOpen} onOpenChange={setRejectedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Rejection Reason</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Reason / Notes</Label>
              <Textarea
                placeholder="Write any rejection reason..."
                value={rejectedNotes}
                onChange={(e) => setRejectedNotes(e.target.value)}
                rows={4}
              />
            </div>
            <Button onClick={handleSaveRejected} className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isSubmittingRejected}>
              {isSubmittingRejected ? "Saving..." : "Save & Set to Rejected"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Status Update Dialog */}
      <Dialog open={bulkModalOpen} onOpenChange={(open) => { if (!open) handleCloseBulkStatusModal(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>Change Status to</span>
              {pendingBulkStatus && <StatusBadge status={pendingBulkStatus as ApplicationStatus} />}
            </DialogTitle>
            <DialogDescription>
              {selectAllMatching
                ? `Update status for all ${total} applications matching current filters.`
                : `Update status for ${selectedIds.length} selected candidate${selectedIds.length === 1 ? "" : "s"}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {pendingBulkStatus === "Interview" && (
              <div className="space-y-1.5">
                <Label>Interview Date & Time <span className="text-destructive">*</span></Label>
                <Input
                  type="datetime-local"
                  value={bulkInterviewDateTime}
                  onChange={(e) => setBulkInterviewDateTime(e.target.value)}
                />
              </div>
            )}

            {(pendingBulkStatus === "Follow Up" || pendingBulkStatus === "Rejected") && (
              <div className="space-y-1.5">
                <Label>
                  {pendingBulkStatus === "Rejected" ? "Rejection Reason / Notes" : "Follow Up Notes"}
                  <span className="text-muted-foreground text-xs font-normal ml-1">(Optional)</span>
                </Label>
                <Textarea
                  placeholder={
                    pendingBulkStatus === "Rejected"
                      ? "Enter rejection reason or notes..."
                      : "Enter follow up comment or next action..."
                  }
                  value={bulkNotes}
                  onChange={(e) => setBulkNotes(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {pendingBulkStatus !== "Interview" && pendingBulkStatus !== "Follow Up" && pendingBulkStatus !== "Rejected" && (
              <p className="text-sm text-muted-foreground">
                Are you sure you want to change the status of{" "}
                <strong className="text-foreground">{selectAllMatching ? `all ${total}` : selectedIds.length}</strong>{" "}
                candidate(s) to <strong className="text-foreground">{pendingBulkStatus}</strong>?
              </p>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleCloseBulkStatusModal} disabled={isBulkUpdating}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmBulkStatus}
                disabled={isBulkUpdating}
                className={cn(pendingBulkStatus === "Rejected" && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
              >
                {isBulkUpdating ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" /> Updating...
                  </>
                ) : (
                  `Update ${selectAllMatching ? total : selectedIds.length} Candidate${(selectAllMatching ? total : selectedIds.length) === 1 ? "" : "s"}`
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Candidate Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditTarget(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Candidate Details</DialogTitle>
            <DialogDescription>Update the candidate details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Required fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Full Name <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="John Doe"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm(f => ({ ...f, fullName: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email <span className="text-destructive">*</span></Label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={editForm.email}
                  onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="94XXXXXXXXX"
                  value={editForm.phone}
                  onChange={(e) => {
                    const val = e.target.value;
                    const guessed = guessCountryFromPhone(val);
                    setEditForm(f => ({ ...f, phone: val, country: guessed }));
                  }}
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Country <span className="text-destructive">*</span></Label>
                <Select value={editForm.country} onValueChange={(v) => setEditForm(f => ({ ...f, country: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sri Lanka">Sri Lanka</SelectItem>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Position & Batch */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Position <span className="text-destructive">*</span></Label>
                <Select value={editForm.positionId} onValueChange={(v) => setEditForm(f => ({ ...f, positionId: v, batchId: "" }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.filter(p => p.status === "active").map((p) => (
                      <SelectItem key={p._id} value={p._id}>{p.name} — {p.department}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Batch <span className="text-destructive">*</span></Label>
                <Select value={editForm.batchId} onValueChange={(v) => setEditForm(f => ({ ...f, batchId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {editFilteredBatches.map((b) => (
                      <SelectItem key={b._id} value={b._id}>{b.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Optional fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Preferred Language</Label>
                <Select value={editForm.preferredLanguage} onValueChange={(v) => setEditForm(f => ({ ...f, preferredLanguage: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Follower</Label>
                <Select value={editForm.follower} onValueChange={(v) => setEditForm(f => ({ ...f, follower: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select follower" />
                  </SelectTrigger>
                  <SelectContent>
                    {FOLLOWERS.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Education Level</Label>
                <Select value={editForm.educationLevel} onValueChange={(v) => setEditForm(f => ({ ...f, educationLevel: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select education" />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATIONS.map((e) => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Group</Label>
              <Input
                placeholder="e.g. Batch A, Team 1"
                value={editForm.group}
                onChange={(e) => setEditForm(f => ({ ...f, group: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>LinkedIn URL</Label>
                <Input
                  placeholder="https://linkedin.com/in/..."
                  value={editForm.linkedin}
                  onChange={(e) => setEditForm(f => ({ ...f, linkedin: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Portfolio URL</Label>
                <Input
                  placeholder="https://portfolio.com"
                  value={editForm.portfolio}
                  onChange={(e) => setEditForm(f => ({ ...f, portfolio: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>CV URL</Label>
              <Input
                placeholder="https://drive.google.com/..."
                value={editForm.cvUrl}
                onChange={(e) => setEditForm(f => ({ ...f, cvUrl: e.target.value }))}
              />
            </div>

            <Button onClick={handleEditCandidate} className="w-full" disabled={isEditing}>
              {isEditing ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Candidate Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) setAddForm(INITIAL_FORM); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Candidate</DialogTitle>
            <DialogDescription>Fill in the details to manually add a candidate.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Required fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Full Name <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="John Doe"
                  value={addForm.fullName}
                  onChange={(e) => setAddForm(f => ({ ...f, fullName: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email <span className="text-destructive">*</span></Label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="94XXXXXXXXX"
                  value={addForm.phone}
                  onChange={(e) => {
                    const val = e.target.value;
                    const guessed = guessCountryFromPhone(val);
                    setAddForm(f => ({ ...f, phone: val, country: guessed }));
                  }}
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Country <span className="text-destructive">*</span></Label>
                <Select value={addForm.country} onValueChange={(v) => setAddForm(f => ({ ...f, country: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sri Lanka">Sri Lanka</SelectItem>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Position & Batch */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Position <span className="text-destructive">*</span></Label>
                <Select value={addForm.positionId} onValueChange={(v) => setAddForm(f => ({ ...f, positionId: v, batchId: "" }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.filter(p => p.status === "active").map((p) => (
                      <SelectItem key={p._id} value={p._id}>{p.name} — {p.department}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Batch <span className="text-destructive">*</span></Label>
                <Select value={addForm.batchId} onValueChange={(v) => setAddForm(f => ({ ...f, batchId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredBatches.map((b) => (
                      <SelectItem key={b._id} value={b._id}>{b.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Optional fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Preferred Language</Label>
                <Select value={addForm.preferredLanguage} onValueChange={(v) => setAddForm(f => ({ ...f, preferredLanguage: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Follower</Label>
                <Select value={addForm.follower} onValueChange={(v) => setAddForm(f => ({ ...f, follower: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select follower" />
                  </SelectTrigger>
                  <SelectContent>
                    {FOLLOWERS.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Education Level</Label>
                <Select value={addForm.educationLevel} onValueChange={(v) => setAddForm(f => ({ ...f, educationLevel: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select education" />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATIONS.map((e) => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Group</Label>
              <Input
                placeholder="e.g. Batch A, Team 1"
                value={addForm.group}
                onChange={(e) => setAddForm(f => ({ ...f, group: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>LinkedIn URL</Label>
                <Input
                  placeholder="https://linkedin.com/in/..."
                  value={addForm.linkedin}
                  onChange={(e) => setAddForm(f => ({ ...f, linkedin: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Portfolio URL</Label>
                <Input
                  placeholder="https://portfolio.com"
                  value={addForm.portfolio}
                  onChange={(e) => setAddForm(f => ({ ...f, portfolio: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>CV URL</Label>
              <Input
                placeholder="https://drive.google.com/..."
                value={addForm.cvUrl}
                onChange={(e) => setAddForm(f => ({ ...f, cvUrl: e.target.value }))}
              />
            </div>

            <Button onClick={handleAddCandidate} className="w-full" disabled={isAdding}>
              {isAdding ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <Plus size={14} className="mr-2" /> Add Candidate
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ApplicantsPage() {
  return (
    <Suspense fallback={<div className="space-y-4"><div className="h-10 w-full animate-pulse rounded bg-muted" /><div className="h-64 w-full animate-pulse rounded bg-muted" /></div>}>
      <ApplicantsContent />
    </Suspense>
  );
}
