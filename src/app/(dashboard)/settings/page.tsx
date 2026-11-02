"use client";

import { Settings, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <Settings size={14} /> System Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Application Name</Label>
              <Input value="IHMS" readOnly className="bg-muted/30" />
            </div>
            <div className="space-y-1.5">
              <Label>Short Name</Label>
              <Input value="IHMS" readOnly className="bg-muted/30" />
            </div>
            <div className="space-y-1.5">
              <Label>Organization</Label>
              <Input value="Apptron Solutions" readOnly className="bg-muted/30" />
            </div>
            <div className="space-y-1.5">
              <Label>Version</Label>
              <Input value="1.0.0" readOnly className="bg-muted/30" />
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            <p className="text-sm font-medium">Tech Stack</p>
            <div className="flex flex-wrap gap-2">
              {["Next.js 15","TypeScript","Tailwind CSS","Shadcn UI","MongoDB Atlas","NextAuth.js","Recharts","PapaParse","XLSX"].map((t) => (
                <Badge key={t} variant="secondary">{t}</Badge>
              ))}
            </div>
          </div>
          <Separator />
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Info size={14} className="mt-0.5 flex-shrink-0" />
            <p>To update system settings such as SMTP email, Cloudinary keys, or MongoDB URI, edit the <code className="bg-muted px-1 rounded text-xs">.env.local</code> file and restart the server.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
