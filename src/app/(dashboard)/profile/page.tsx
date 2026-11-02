"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { User, Lock, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [password, setPassword] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  const changePassword = async () => {
    if (!password.current || !password.next) { toast.error("Fill in all fields"); return; }
    if (password.next !== password.confirm) { toast.error("Passwords do not match"); return; }
    if (password.next.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setSaving(true);
    // In a real app, call PUT /api/profile/password
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setPassword({ current: "", next: "", confirm: "" });
    toast.success("Password changed successfully");
  };

  const initials = session?.user?.name
    ?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "AD";

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <User size={14} /> Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">{session?.user?.name}</p>
              <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
              <span className="inline-block mt-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Administrator</span>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={session?.user?.name ?? ""} readOnly className="bg-muted/30" />
            </div>
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <Input value={session?.user?.email ?? ""} readOnly className="bg-muted/30" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <Lock size={14} /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Current Password</Label>
            <Input type="password" placeholder="••••••••" value={password.current} onChange={(e) => setPassword({ ...password, current: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>New Password</Label>
            <Input type="password" placeholder="••••••••" value={password.next} onChange={(e) => setPassword({ ...password, next: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Confirm New Password</Label>
            <Input type="password" placeholder="••••••••" value={password.confirm} onChange={(e) => setPassword({ ...password, confirm: e.target.value })} />
          </div>
          <Button onClick={changePassword} disabled={saving}>
            <Save size={16} className="mr-2" />
            {saving ? "Saving..." : "Update Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
