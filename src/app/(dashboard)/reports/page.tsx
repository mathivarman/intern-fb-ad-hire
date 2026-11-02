"use client";

import { useState, useEffect } from "react";
import { Download, FileText, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/StatusBadge";
import type { ApplicationStatus } from "@/models/Application";
import * as XLSX from "xlsx";
import Papa from "papaparse";

interface Position { _id: string; name: string; }
interface ReportRow {
  _id: string;
  status: ApplicationStatus;
  appliedDate: string;
  applicantId: { fullName: string; email: string; phone: string; preferredLanguage?: string; educationLevel?: string; };
  positionId: { name: string; };
  batchId: { title: string; };
}

const STATUSES = ["New", "Messaged", "No Response", "Follow Up", "Interview", "Confirmed", "Rejected"];
const LANGUAGES = ["Tamil", "Sinhala", "English"];

export default function ReportsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [positionId, setPositionId] = useState("all");
  const [status, setStatus] = useState("all");
  const [language, setLanguage] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/positions").then(r => r.json()).then(d => setPositions(d.positions || []));
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (positionId && positionId !== "all") params.set("positionId", positionId);
    if (status && status !== "all") params.set("status", status);
    if (language && language !== "all") params.set("language", language);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    const res = await fetch(`/api/reports/export?${params}`);
    const data = await res.json();
    setRows(data.applications || []);
    setLoading(false);
  };

  const toFlat = () => rows.map((r) => ({
    "Full Name": r.applicantId?.fullName,
    "Email": r.applicantId?.email,
    "Phone": r.applicantId?.phone,
    "Language": r.applicantId?.preferredLanguage,
    "Education": r.applicantId?.educationLevel,
    "Position": r.positionId?.name,
    "Batch": r.batchId?.title,
    "Status": r.status,
    "Applied Date": new Date(r.appliedDate).toLocaleDateString(),
  }));

  const exportCSV = () => {
    const csv = Papa.unparse(toFlat());
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "iams-report.csv"; a.click();
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(toFlat());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Applicants");
    XLSX.writeFile(wb, "iams-report.xlsx");
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader><CardTitle className="text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2"><Filter size={14} /> Report Filters</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Position</Label>
              <Select value={positionId} onValueChange={setPositionId}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  {positions.map((p) => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">From Date</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">To Date</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
          <Button onClick={fetchReport} className="mt-4" disabled={loading}>
            {loading ? "Loading..." : "Generate Report"}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {rows.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{rows.length} records found</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download size={14} className="mr-2" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportExcel}>
                <Download size={14} className="mr-2" /> Excel
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      {["Name","Email","Phone","Language","Education","Position","Batch","Status","Applied"].map((h) => (
                        <th key={h} className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r._id} className="border-b hover:bg-muted/20">
                        <td className="py-2.5 px-4 font-medium">{r.applicantId?.fullName}</td>
                        <td className="py-2.5 px-4 text-muted-foreground text-xs">{r.applicantId?.email}</td>
                        <td className="py-2.5 px-4 text-xs">{r.applicantId?.phone}</td>
                        <td className="py-2.5 px-4 text-xs">{r.applicantId?.preferredLanguage || "—"}</td>
                        <td className="py-2.5 px-4 text-xs">{r.applicantId?.educationLevel || "—"}</td>
                        <td className="py-2.5 px-4 text-xs">{r.positionId?.name}</td>
                        <td className="py-2.5 px-4 text-xs text-muted-foreground">{r.batchId?.title}</td>
                        <td className="py-2.5 px-4"><StatusBadge status={r.status} /></td>
                        <td className="py-2.5 px-4 text-xs text-muted-foreground">{new Date(r.appliedDate).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!loading && rows.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p>Set filters and click "Generate Report" to view data.</p>
        </div>
      )}
    </div>
  );
}
