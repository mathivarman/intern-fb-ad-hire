"use client";

import { useEffect, useState } from "react";
import { History, CheckCircle2, AlertCircle, XCircle, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface ImportLog {
  _id: string;
  fileName: string;
  importedCount: number;
  duplicateCount: number;
  errorCount: number;
  positionId: { name: string; department: string };
  batchId: { title: string };
  createdAt: string;
}

export default function ImportHistoryPage() {
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/import-history");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch {
      toast.error("Failed to load import history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const deleteImport = async (id: string, fileName: string) => {
    const confirmDelete = confirm(
      `Are you sure you want to delete the import of "${fileName}"?\n\nThis will permanently delete all new applicants and applications created from this upload session.`
    );
    if (!confirmDelete) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/import-history/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          `Rollback successful! Deleted ${data.deletedApplications} applications and ${data.deletedApplicants} applicants.`
        );
        fetchHistory();
      } else {
        toast.error(data.error || "Failed to rollback import");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          View all CSV/Excel upload sessions. You can delete/rollback an entire import session to clean up the database.
        </p>
        <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full">
          {logs.length} imports logged
        </span>
      </div>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <History size={40} className="mx-auto mb-3 opacity-30" />
            <p>No upload history recorded yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const total = log.importedCount + log.duplicateCount + log.errorCount;
            return (
              <Card key={log._id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-sm break-all">{log.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.positionId?.name || "Unknown Position"} — {log.batchId?.title || "Unknown Batch"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded on {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 ml-auto sm:ml-0">
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-bold text-foreground">{total}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-green-600 flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          {log.importedCount}
                        </p>
                        <p className="text-xs text-muted-foreground">New</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-amber-600 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {log.duplicateCount}
                        </p>
                        <p className="text-xs text-muted-foreground">Dupe</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-red-600 flex items-center gap-1">
                          <XCircle size={12} />
                          {log.errorCount}
                        </p>
                        <p className="text-xs text-muted-foreground">Errors</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8"
                      disabled={deletingId === log._id}
                      onClick={() => deleteImport(log._id, log.fileName)}
                    >
                      {deletingId === log._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
