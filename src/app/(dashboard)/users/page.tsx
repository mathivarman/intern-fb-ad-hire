"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface User { _id: string; name: string; email: string; role: string; createdAt: string; }

const emptyForm = { name: "", email: "", password: "" };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data.users || []); setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (u: User) => { setEditing(u); setForm({ name: u.name, email: u.email, password: "" }); setOpen(true); };

  const save = async () => {
    if (!form.name || !form.email) { toast.error("Name and email required"); return; }
    if (!editing && !form.password) { toast.error("Password required for new users"); return; }
    setSaving(true);
    if (editing) {
      await fetch(`/api/users/${editing._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      toast.success("User updated");
    } else {
      const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed"); setSaving(false); return; }
      toast.success("User created");
    }
    setSaving(false); setOpen(false); fetchUsers();
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    toast.success("User deleted"); fetchUsers();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{users.length} admin users</p>
        <Button size="sm" onClick={openCreate}><Plus size={16} className="mr-2" /> Add User</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <Card key={u._id}>
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                    {u.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{u.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">{u.role}</span>
                  <Button variant="outline" size="sm" onClick={() => openEdit(u)}><Pencil size={14} /></Button>
                  <Button variant="outline" size="sm" className="text-destructive" onClick={() => deleteUser(u._id)}><Trash2 size={14} /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit User" : "Create Admin User"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5"><Label>Full Name *</Label><Input placeholder="John Silva" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Email *</Label><Input type="email" placeholder="admin@apptron.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{editing ? "New Password (leave blank to keep)" : "Password *"}</Label><Input type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <Button onClick={save} disabled={saving} className="w-full">{saving ? "Saving..." : editing ? "Update User" : "Create User"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
