"use client";

import { useEffect, useState, useCallback } from "react";
import { Phone, Clock, RefreshCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface CallLog {
  _id: string;
  calledBy: string;
  outcome: string;
  notes?: string;
  calledDate: string;
  followUpDate?: string;
  applicationId: string;
}

const outcomeColors: Record<string, string> = {
  "New": "bg-blue-100 text-blue-700 border-blue-200",
  "Messaged": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Called": "bg-purple-100 text-purple-700 border-purple-200",
  "No Response": "bg-gray-100 text-gray-600 border-gray-200",
  "Follow Up": "bg-amber-100 text-amber-700 border-amber-200",
  "Interview": "bg-teal-100 text-teal-700 border-teal-200",
  "Rejected": "bg-red-100 text-red-700 border-red-200",
};

export default function CallingPage() {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/call-logs");
    const data = await res.json();
    setLogs(data.logs || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = logs.filter((l) =>
    l.calledBy.toLowerCase().includes(search.toLowerCase()) ||
    l.outcome.toLowerCase().includes(search.toLowerCase()) ||
    (l.notes || "").toLowerCase().includes(search.toLowerCase())
  );

  // Follow-ups due today or past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const followUps = logs.filter((l) => l.followUpDate && new Date(l.followUpDate) <= new Date());

  return (
    <div className="space-y-6">
      {/* Follow-up alerts */}
      {followUps.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10">
          <CardContent className="p-4">
            <p className="font-semibold text-amber-700 flex items-center gap-2 mb-2">
              <Clock size={16} /> {followUps.length} Follow-up{followUps.length > 1 ? "s" : ""} Due
            </p>
            <div className="space-y-1">
              {followUps.slice(0, 3).map((l) => (
                <p key={l._id} className="text-sm text-amber-600">
                  Follow-up with {l.calledBy} — {new Date(l.followUpDate!).toLocaleDateString()}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-3">
        <Input placeholder="Search by caller, outcome, notes..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <Button variant="outline" size="sm" onClick={fetchLogs}>
          <RefreshCcw size={14} className="mr-2" /> Refresh
        </Button>
        <p className="text-sm text-muted-foreground ml-auto">{filtered.length} call logs</p>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Phone size={40} className="mx-auto mb-3 opacity-30" />
          <p>No call logs yet. Go to an applicant profile to log a call.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((log) => (
            <Card key={log._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Phone size={15} className="text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-xs ${outcomeColors[log.outcome] || ""}`}>{log.outcome}</Badge>
                        <span className="text-sm text-muted-foreground">by <span className="font-medium text-foreground">{log.calledBy}</span></span>
                      </div>
                      {log.notes && <p className="text-sm mt-1 text-foreground/80">{log.notes}</p>}
                      {log.followUpDate && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock size={11} /> Follow-up: {new Date(log.followUpDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground flex-shrink-0">{new Date(log.calledDate).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
