"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Position {
  _id: string;
  name: string;
  department: string;
  description?: string;
  status: "active" | "inactive";
  createdAt: string;
}

const emptyForm = { name: "", department: "", description: "", status: "active" };

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchPositions = async () => {
    const res = await fetch("/api/positions");
    const data = await res.json();
    setPositions(data.positions || []);
    setLoading(false);
  };

  useEffect(() => { fetchPositions(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (p: Position) => {
    setEditing(p);
    setForm({ name: p.name, department: p.department, description: p.description || "", status: p.status });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name || !form.department) { toast.error("Name and department are required"); return; }
    setSaving(true);
    if (editing) {
      await fetch(`/api/positions/${editing._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      toast.success("Position updated");
    } else {
      await fetch("/api/positions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      toast.success("Position created");
    }
    setSaving(false);
    setOpen(false);
    fetchPositions();
  };

  const toggleStatus = async (p: Position) => {
    await fetch(`/api/positions/${p._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: p.status === "active" ? "inactive" : "active" }),
    });
    toast.success("Status updated");
    fetchPositions();
  };

  const deletePosition = async (id: string) => {
    if (!confirm("Delete this position?")) return;
    await fetch(`/api/positions/${id}`, { method: "DELETE" });
    toast.success("Position deleted");
    fetchPositions();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{positions.length} positions total</p>
        <Button size="sm" onClick={openCreate}>
          <Plus size={16} className="mr-2" /> Add Position
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : positions.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No positions yet. Click "Add Position" to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {positions.map((p) => (
            <Card key={p._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.department}</p>
                  </div>
                  <Badge variant={p.status === "active" ? "default" : "secondary"} className="ml-2 flex-shrink-0">
                    {p.status}
                  </Badge>
                </div>
                {p.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-3">
                  Created {new Date(p.createdAt).toLocaleDateString()}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                    <Pencil size={14} className="mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleStatus(p)}>
                    {p.status === "active" ? <ToggleLeft size={14} className="mr-1" /> : <ToggleRight size={14} className="mr-1" />}
                    {p.status === "active" ? "Deactivate" : "Activate"}
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => deletePosition(p._id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Position" : "Create Position"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Position Name *</Label>
              <Input placeholder="e.g. Frontend Intern" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Department *</Label>
              <Input placeholder="e.g. Engineering" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Optional description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={save} disabled={saving} className="w-full">
              {saving ? "Saving..." : editing ? "Update Position" : "Create Position"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
