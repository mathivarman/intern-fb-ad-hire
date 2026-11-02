"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Upload, FileText, CheckCircle2, AlertCircle, XCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Position { _id: string; name: string; }
interface Batch { _id: string; title: string; positionId: string | { _id: string; name: string }; }

const STEPS = ["Position", "Batch", "Upload File", "Preview Data", "Validate", "Import"];

export default function UploadPage() {
  const [step, setStep] = useState(0);
  const [positions, setPositions] = useState<Position[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [positionId, setPositionId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [fileName, setFileName] = useState("");
  const [records, setRecords] = useState<Record<string, string>[]>([]);
  const [preview, setPreview] = useState<{ results: { total: number; new: number; duplicates: number; errors: number; rows: {row: number; status: string; reason?: string; applicant?: Record<string,string>}[] } } | null>(null);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; duplicates: number; errors: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([fetch("/api/positions"), fetch("/api/batches")])
      .then(([p, b]) => Promise.all([p.json(), b.json()]))
      .then(([pd, bd]) => {
        setPositions(pd.positions?.filter((p: Position & { status: string }) => p.status === "active") || []);
        setBatches(bd.batches || []);
      });
  }, []);

  const filteredBatches = batches.filter((b) => {
    const bPosId = typeof b.positionId === "object" ? b.positionId._id : b.positionId;
    return bPosId === positionId;
  });

  const handleFile = (file: File) => {
    setFileName(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "csv") {
      Papa.parse<Record<string, string>>(file, {
        header: true, skipEmptyLines: true,
        complete: (res) => { setRecords(res.data); setStep(3); },
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const wb = XLSX.read(e.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        setRecords(XLSX.utils.sheet_to_json<Record<string, string>>(ws));
        setStep(3);
      };
      reader.readAsBinaryString(file);
    } else {
      toast.error("Only CSV, XLS, and XLSX files are supported");
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [positionId, batchId]);

  const validate = async () => {
    setLoading(true);
    const res = await fetch("/api/upload/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records, positionId, batchId }),
    });
    const data = await res.json();
    setPreview(data);
    setLoading(false);
    setStep(5);
  };

  const doImport = async () => {
    setLoading(true);
    const res = await fetch("/api/upload/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records, positionId, batchId, fileName }),
    });
    const data = await res.json();
    setImportResult(data);
    setLoading(false);
    setStep(6);
    toast.success(`Import complete! ${data.created} new applicants created.`);
  };

  const reset = () => {
    setStep(0); setPositionId(""); setBatchId(""); setFileName(""); setRecords([]); setPreview(null); setImportResult(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Stepper */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold flex-shrink-0 transition-colors ${
              i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-primary/20 text-primary border-2 border-primary" : "bg-muted text-muted-foreground"
            }`}>
              {i < step ? <CheckCircle2 size={16} /> : i + 1}
            </div>
            <div className="flex-1 h-px bg-border mx-1 last:hidden" />
          </div>
        ))}
      </div>
      <div className="flex">
        {STEPS.map((s, i) => (
          <div key={s} className={`flex-1 text-center text-xs ${i === step ? "text-primary font-semibold" : "text-muted-foreground"}`}>
            {s}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Step 0: Select Position */}
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Step 1: Select Position</h3>
              <div className="space-y-1.5">
                <Label>Internship Position</Label>
                <Select value={positionId} onValueChange={setPositionId}>
                  <SelectTrigger><SelectValue placeholder="Select a position" /></SelectTrigger>
                  <SelectContent>
                    {positions.map((p) => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setStep(1)} disabled={!positionId} className="w-full">
                Next <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          )}

          {/* Step 1: Select Batch */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Step 2: Select Batch</h3>
              <div className="space-y-1.5">
                <Label>Recruitment Batch</Label>
                <Select value={batchId} onValueChange={setBatchId}>
                  <SelectTrigger><SelectValue placeholder="Select a batch" /></SelectTrigger>
                  <SelectContent>
                    {filteredBatches.length === 0
                      ? <SelectItem value="none" disabled>No batches for this position</SelectItem>
                      : filteredBatches.map((b) => <SelectItem key={b._id} value={b._id}>{b.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(0)} className="flex-1"><ChevronLeft size={16} className="mr-1" /> Back</Button>
                <Button onClick={() => setStep(2)} disabled={!batchId} className="flex-1">Next <ChevronRight size={16} className="ml-1" /></Button>
              </div>
            </div>
          )}

          {/* Step 2: Upload File */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Step 3: Upload File</h3>
              <div
                className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onDrop={onDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={40} className="mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">Drop your file here or click to browse</p>
                <p className="text-sm text-muted-foreground mt-1">Supports CSV, XLS, XLSX</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xls,.xlsx"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              <Button variant="outline" onClick={() => setStep(1)} className="w-full"><ChevronLeft size={16} className="mr-1" /> Back</Button>
            </div>
          )}

          {/* Step 3: Preview Data */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Step 4: Preview Data</h3>
                <Badge variant="outline">{records.length} records</Badge>
              </div>
              <div className="border rounded-lg overflow-auto max-h-72">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>{Object.keys(records[0] || {}).slice(0, 6).map((k) => (
                      <th key={k} className="px-3 py-2 text-left font-medium text-muted-foreground">{k}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {records.slice(0, 20).map((r, i) => (
                      <tr key={i} className="border-t hover:bg-muted/20">
                        {Object.values(r).slice(0, 6).map((v, j) => (
                          <td key={j} className="px-3 py-2 truncate max-w-[120px]">{v as string}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {records.length > 20 && <p className="text-xs text-muted-foreground">... and {records.length - 20} more rows</p>}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1"><ChevronLeft size={16} className="mr-1" /> Back</Button>
                <Button onClick={() => { setStep(4); validate(); }} className="flex-1">Validate Records <ChevronRight size={16} className="ml-1" /></Button>
              </div>
            </div>
          )}

          {/* Step 4: Validating */}
          {step === 4 && (
            <div className="text-center py-12 space-y-4">
              <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="font-medium">Validating {records.length} records...</p>
              <p className="text-sm text-muted-foreground">Checking for duplicates by phone and email</p>
            </div>
          )}

          {/* Step 5: Validation Results */}
          {step === 5 && preview && (
            <div className="space-y-4">
              <h3 className="font-semibold">Step 5: Validation Results</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total", value: preview.results.total, color: "text-foreground", icon: FileText },
                  { label: "New", value: preview.results.new, color: "text-green-600", icon: CheckCircle2 },
                  { label: "Duplicates", value: preview.results.duplicates, color: "text-amber-600", icon: AlertCircle },
                  { label: "Errors", value: preview.results.errors, color: "text-red-600", icon: XCircle },
                ].map((s) => (
                  <div key={s.label} className="text-center p-3 rounded-lg border">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="border rounded-lg overflow-auto max-h-60">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50"><tr>
                    <th className="px-3 py-2 text-left">Row</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Info</th>
                  </tr></thead>
                  <tbody>
                    {preview.results.rows.slice(0, 50).map((r) => (
                      <tr key={r.row} className="border-t">
                        <td className="px-3 py-1.5">{r.row}</td>
                        <td className="px-3 py-1.5">
                          <Badge variant="outline" className={
                            r.status === "new" ? "text-green-600 border-green-200" :
                            r.status === "duplicate" ? "text-amber-600 border-amber-200" :
                            "text-red-600 border-red-200"
                          }>{r.status}</Badge>
                        </td>
                        <td className="px-3 py-1.5 text-muted-foreground">
                          {r.reason ? (
                            <div>
                              <p className="text-amber-600 font-medium">{r.reason}</p>
                              {(r.applicant as Record<string, string>)?.country && (
                                <p className="text-[10px] text-primary/80 font-medium mt-0.5">
                                  🌐 {(r.applicant as Record<string, string>)?.country}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium text-foreground">{(r.applicant as Record<string, string>)?.fullName}</p>
                              {(r.applicant as Record<string, string>)?.country && (
                                <p className="text-[10px] text-primary/80 font-medium mt-0.5">
                                  🌐 {(r.applicant as Record<string, string>)?.country}
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1"><ChevronLeft size={16} className="mr-1" /> Back</Button>
                <Button 
                  onClick={doImport} 
                  disabled={loading || (preview.results.new === 0 && preview.results.duplicates === 0)} 
                  className="flex-1"
                >
                  {loading ? "Importing..." : `Import ${preview.results.new + preview.results.duplicates} Valid Records`}
                </Button>
              </div>
            </div>
          )}

          {/* Step 6: Import Complete */}
          {step === 6 && importResult && (
            <div className="text-center space-y-6 py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Import Complete!</h3>
                <p className="text-muted-foreground mt-1">
                  Successfully processed {importResult.created + importResult.duplicates + importResult.errors} records.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{importResult.created}</p>
                  <p className="text-xs text-muted-foreground">New</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">{importResult.duplicates}</p>
                  <p className="text-xs text-muted-foreground">Duplicates</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{importResult.errors}</p>
                  <p className="text-xs text-muted-foreground">Errors</p>
                </div>
              </div>
              <Button onClick={reset} className="w-full max-w-xs">Upload Another File</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
