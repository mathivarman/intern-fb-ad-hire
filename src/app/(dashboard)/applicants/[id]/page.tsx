"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Phone, Mail, ExternalLink, Globe, BookOpen, User, Clock, FileText, Plus, MapPin } from "lucide-react";
import { classifyCountry } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import StatusBadge from "@/components/StatusBadge";
import type { ApplicationStatus } from "@/models/Application";
import { useSession } from "next-auth/react";

const STATUSES: ApplicationStatus[] = ["New", "Messaged", "No Response", "Follow Up", "Interview", "Confirmed", "Rejected"];
const CALL_OUTCOMES = ["Messaged", "Called", "No Response", "Follow Up"];

interface ApplicantData {
  applicant: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
    group?: string;
    linkedin?: string;
    portfolio?: string;
    educationLevel?: string;
    preferredLanguage?: string;
    follower?: string;
    cvUrl?: string;
    country?: string;
    internId?: string;
    createdAt: string;
  };
  applications: {
    _id: string;
    status: ApplicationStatus;
    appliedDate: string;
    interviewDate?: string;
    notes?: string;
    positionId: { name: string; department: string };
    batchId: { title: string; startDate: string; endDate: string };
  }[];
  callLogs: {
    _id: string;
    applicationId: string;
    calledBy: string;
    outcome: string;
    notes?: string;
    calledDate: string;
    followUpDate?: string;
  }[];
}

function ApplicantDetailContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [data, setData] = useState<ApplicantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState("");
  const [callOutcome, setCallOutcome] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [interviewAppId, setInterviewAppId] = useState<string | null>(null);
  const [interviewDateTime, setInterviewDateTime] = useState("");
  const [isSubmittingInterview, setIsSubmittingInterview] = useState(false);
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);

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

  const fetchData = async () => {
    const res = await fetch(`/api/applicants/${id}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const updateStatus = async (appId: string, status: string) => {
    if (status === "Interview") {
      setInterviewAppId(appId);
      const app = data?.applications?.find((a) => a._id === appId);
      if (app?.interviewDate) {
        try {
          const d = new Date(app.interviewDate);
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
    if (status === "Follow Up") {
      setFollowUpAppId(appId);
      const app = data?.applications?.find((a) => a._id === appId);
      setFollowUpNotes(app?.notes || "");
      setFollowUpDialogOpen(true);
      return;
    }
    if (status === "Rejected") {
      setRejectedAppId(appId);
      const app = data?.applications?.find((a) => a._id === appId);
      setRejectedNotes(app?.notes || "");
      setRejectedDialogOpen(true);
      return;
    }
    await fetch(`/api/applications/${appId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast.success("Status updated");
    fetchData();
  };

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
      toast.success("Interview scheduled");
      setInterviewDialogOpen(false);
      fetchData();
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
      toast.success("Status updated to Follow Up");
      setFollowUpDialogOpen(false);
      fetchData();
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
      toast.success("Status updated to Rejected");
      setRejectedDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setIsSubmittingRejected(false);
    }
  };

  const logCall = async () => {
    if (!selectedAppId || !callOutcome) { toast.error("Please select an application and outcome"); return; }
    setSubmitting(true);
    await fetch("/api/call-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicationId: selectedAppId,
        calledBy: session?.user?.name || "Admin",
        outcome: callOutcome,
        notes: callNotes,
        calledDate: new Date().toISOString(),
        followUpDate: followUp || undefined,
      }),
    });
    setSubmitting(false);
    setCallDialogOpen(false);
    setCallOutcome(""); setCallNotes(""); setFollowUp("");
    toast.success("Call logged successfully");
    fetchData();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 col-span-1" />
          <Skeleton className="h-80 col-span-2" />
        </div>
      </div>
    );
  }

  if (!data?.applicant) return <p className="text-muted-foreground">Applicant not found.</p>;

  const { applicant, applications, callLogs } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const qs = searchParams.toString();
            router.push(`/applicants${qs ? `?${qs}` : ""}`);
          }}
        >
          <ArrowLeft size={16} className="mr-1" /> Back
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{applicant.fullName}</h2>
            {applicant.internId && (
              <Badge variant="outline" className="font-mono text-xs text-primary border-primary bg-primary/5">
                {applicant.internId}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Added {new Date(applicant.createdAt).toLocaleDateString()} · {applications.length} application{applications.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="ml-auto">
          <Dialog open={callDialogOpen} onOpenChange={setCallDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Phone size={16} className="mr-2" /> Log Call
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log a Call — {applicant.fullName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Application</Label>
                  <Select value={selectedAppId} onValueChange={setSelectedAppId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select application" />
                    </SelectTrigger>
                    <SelectContent>
                      {applications.map((app) => (
                        <SelectItem key={app._id} value={app._id}>
                          {app.positionId?.name} — {app.batchId?.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Outcome</Label>
                  <Select value={callOutcome} onValueChange={setCallOutcome}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select outcome" />
                    </SelectTrigger>
                    <SelectContent>
                      {CALL_OUTCOMES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Textarea placeholder="Add notes..." value={callNotes} onChange={(e) => setCallNotes(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Follow-up Date</Label>
                  <Input type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
                </div>
                <Button onClick={logCall} className="w-full" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Call Log"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">Profile</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail size={14} className="text-muted-foreground flex-shrink-0" />
              <span className="truncate">{applicant.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone size={14} className="text-muted-foreground flex-shrink-0" />
              <span>{applicant.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={14} className="text-muted-foreground flex-shrink-0" />
              {applicant.country ? (
                <span>
                  {applicant.country}
                  {classifyCountry(applicant.country, applicant.phone) !== applicant.country && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({classifyCountry(applicant.country, applicant.phone)})
                    </span>
                  )}
                </span>
              ) : (
                <span>
                  <span className="text-muted-foreground/50">—</span>
                  <span className="text-xs text-muted-foreground ml-1">
                    ({classifyCountry("", applicant.phone)})
                  </span>
                </span>
              )}
            </div>
            {applicant.group && (
              <div className="flex items-center gap-2 text-sm">
                <User size={14} className="text-muted-foreground flex-shrink-0" />
                <span>{applicant.group}</span>
              </div>
            )}
            {applicant.preferredLanguage && (
              <div className="flex items-center gap-2 text-sm">
                <Globe size={14} className="text-muted-foreground flex-shrink-0" />
                <Badge variant="outline">{applicant.preferredLanguage}</Badge>
              </div>
            )}
            {applicant.follower && (
              <div className="flex items-center gap-2 text-sm">
                <User size={14} className="text-muted-foreground flex-shrink-0" />
                <span className="font-medium">Follower:</span>
                <Badge variant="outline">{applicant.follower}</Badge>
              </div>
            )}
            {applicant.educationLevel && (
              <div className="flex items-center gap-2 text-sm">
                <BookOpen size={14} className="text-muted-foreground flex-shrink-0" />
                <span>{applicant.educationLevel}</span>
              </div>
            )}
            {applicant.linkedin && (
              <a href={applicant.linkedin} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline">
                <ExternalLink size={14} /> LinkedIn Profile
              </a>
            )}
            {applicant.portfolio && (
              <a href={applicant.portfolio} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Globe size={14} /> Portfolio
              </a>
            )}
            {applicant.cvUrl && (
              <div className="pt-2">
                <a href={applicant.cvUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="w-full">
                    <FileText size={14} className="mr-2" /> View CV
                  </Button>
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Applications + Call Logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Application History */}
          <Card>
            <CardHeader><CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">Application History</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {applications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No applications yet.</p>
              ) : applications.map((app) => (
                <div key={app._id} className="flex items-start justify-between p-3 rounded-lg border bg-muted/20">
                  <div>
                    <p className="font-medium text-sm">{app.positionId?.name}</p>
                    <p className="text-xs text-muted-foreground">{app.batchId?.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Applied {new Date(app.appliedDate).toLocaleDateString()}
                    </p>
                    {app.status === "Interview" && (
                      <div className="text-xs text-teal-600 font-medium mt-1 flex items-center gap-2 flex-wrap">
                        <span>
                          📅 {app.interviewDate 
                            ? `Scheduled: ${new Date(app.interviewDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}`
                            : "Interview not scheduled"}
                        </span>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-5 px-1.5 text-teal-600 hover:text-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950/30 text-xs flex items-center gap-0.5"
                          onClick={() => {
                            setInterviewAppId(app._id);
                            if (app.interviewDate) {
                              try {
                                const d = new Date(app.interviewDate);
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
                          {app.interviewDate ? "Change" : "Schedule"}
                        </Button>
                      </div>
                    )}
                    {app.notes && <p className="text-xs mt-1 text-foreground/70 italic">{app.notes}</p>}
                    {app.status === "Follow Up" && (
                      <div className="mt-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-5 px-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-xs flex items-center gap-0.5"
                          onClick={() => {
                            setFollowUpAppId(app._id);
                            setFollowUpNotes(app.notes || "");
                            setFollowUpDialogOpen(true);
                          }}
                        >
                          Edit Comment
                        </Button>
                      </div>
                    )}
                    {app.status === "Rejected" && (
                      <div className="mt-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-5 px-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs flex items-center gap-0.5"
                          onClick={() => {
                            setRejectedAppId(app._id);
                            setRejectedNotes(app.notes || "");
                            setRejectedDialogOpen(true);
                          }}
                        >
                          Edit Reason
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={app.status} />
                    <Select value={app.status} onValueChange={(v) => updateStatus(app._id, v)}>
                      <SelectTrigger className="h-7 text-xs w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem 
                            key={s} 
                            value={s}
                            onClick={() => {
                              if (s === "Interview" && app.status === "Interview") {
                                setInterviewAppId(app._id);
                                if (app.interviewDate) {
                                  try {
                                    const d = new Date(app.interviewDate);
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
                              if (s === "Follow Up" && app.status === "Follow Up") {
                                setFollowUpAppId(app._id);
                                setFollowUpNotes(app.notes || "");
                                setFollowUpDialogOpen(true);
                              }
                              if (s === "Rejected" && app.status === "Rejected") {
                                setRejectedAppId(app._id);
                                setRejectedNotes(app.notes || "");
                                setRejectedDialogOpen(true);
                              }
                            }}
                          >
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Call Log Timeline */}
          <Card>
            <CardHeader><CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">Call History</CardTitle></CardHeader>
            <CardContent>
              {callLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No calls logged yet.</p>
              ) : (
                <div className="space-y-3">
                  {callLogs.map((log) => (
                    <div key={log._id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Phone size={14} className="text-primary" />
                        </div>
                        <div className="w-px flex-1 bg-border mt-1" />
                      </div>
                      <div className="pb-4 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">{log.outcome}</Badge>
                          <span className="text-xs text-muted-foreground">by {log.calledBy}</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(log.calledDate).toLocaleDateString()}
                          </span>
                        </div>
                        {log.notes && <p className="text-sm mt-1 text-foreground/80">{log.notes}</p>}
                        {log.followUpDate && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock size={11} /> Follow-up: {new Date(log.followUpDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
        </div>
      </div>
    </div>
  );
}

export default function ApplicantDetailPage() {
  return (
    <Suspense fallback={<div className="space-y-4"><div className="h-10 w-full animate-pulse rounded bg-muted" /><div className="h-64 w-full animate-pulse rounded bg-muted" /></div>}>
      <ApplicantDetailContent />
    </Suspense>
  );
}
