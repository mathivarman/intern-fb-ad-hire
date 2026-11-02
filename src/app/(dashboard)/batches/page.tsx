"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Position { _id: string; name: string; }
interface Batch {
  _id: string; title: string; description?: string;
  startDate: string; endDate: string;
  positionId: { _id: string; name: string; department: string };
  createdAt: string;
}

const emptyForm = { title: "", positionId: "", startDate: "", endDate: "", description: "" };

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Batch | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    const [bRes, pRes] = await Promise.all([fetch("/api/batches"), fetch("/api/positions")]);
    const [bData, pData] = await Promise.all([bRes.json(), pRes.json()]);
    setBatches(bData.batches || []);
    setPositions(pData.positions?.filter((p: Position & { status: string }) => p.status === "active") || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (b: Batch) => {
    setEditing(b);
    setForm({ title: b.title, positionId: b.positionId?._id, startDate: b.startDate.slice(0, 10), endDate: b.endDate.slice(0, 10), description: b.description || "" });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title || !form.positionId || !form.startDate || !form.endDate) {
      toast.error("Title, position, start and end date are required"); return;
    }
    setSaving(true);
    if (editing) {
      await fetch(`/api/batches/${editing._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      toast.success("Batch updated");
    } else {
      await fetch("/api/batches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      toast.success("Batch created");
    }
    setSaving(false); setOpen(false); fetchAll();
  };

  const deleteBatch = async (id: string) => {
    if (!confirm("Delete this batch?")) return;
    await fetch(`/api/batches/${id}`, { method: "DELETE" });
    toast.success("Batch deleted"); fetchAll();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{batches.length} batches total</p>
        <Button size="sm" onClick={openCreate}><Plus size={16} className="mr-2" /> Add Batch</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : batches.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">No batches yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map((b) => (
            <Card key={b._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <p className="font-semibold text-sm">{b.title}</p>
                <Badge variant="outline" className="mt-2 text-xs">{b.positionId?.name}</Badge>
                <p className="text-xs text-muted-foreground mt-1">{b.positionId?.department}</p>
                <div className="mt-3 text-xs text-muted-foreground">
                  <p>Start: {new Date(b.startDate).toLocaleDateString()}</p>
                  <p>End: {new Date(b.endDate).toLocaleDateString()}</p>
                </div>
                {b.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{b.description}</p>}
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={() => openEdit(b)}><Pencil size={14} className="mr-1" /> Edit</Button>
                  <Button variant="outline" size="sm" className="text-destructive" onClick={() => deleteBatch(b._id)}><Trash2 size={14} /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Batch" : "Create Batch"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Batch Title *</Label>
              <Input placeholder="e.g. Frontend Internship June 2026" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Position *</Label>
              <Select value={form.positionId} onValueChange={(v) => setForm({ ...form, positionId: v })}>
                <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                <SelectContent>
                  {positions.map((p) => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date *</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date *</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Optional..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <Button onClick={save} disabled={saving} className="w-full">
              {saving ? "Saving..." : editing ? "Update Batch" : "Create Batch"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
