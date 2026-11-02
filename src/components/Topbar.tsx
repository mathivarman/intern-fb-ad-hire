"use client";

import { usePathname } from "next/navigation";
import { ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";

const pageTitles: Record<string, string> = {
  "/dashboard": "AD Contacts",
  "/applicants": "Applicants",
  "/positions": "Positions",
  "/batches": "Batches",
  "/reports": "Reports",
};

interface TopbarProps {
  onMenuClick?: () => void;
}

export default function Topbar({ onMenuClick = () => {} }: TopbarProps) {
  const pathname = usePathname();

  const title =
    Object.entries(pageTitles).find(([key]) => pathname.startsWith(key))?.[1] ?? "AD Contacts";

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors md:hidden"
          aria-label="Toggle Menu"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="15" x2="16" y2="15" />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-semibold text-foreground leading-none">{title}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Facebook Ad Leads &amp; Student Contacts</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/enroll"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
        >
          <span>View Public FB Ad Form</span>
          <ExternalLink size={13} />
        </Link>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-xs text-foreground font-medium border border-border">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="hidden sm:inline">Admin Access</span>
        </div>
      </div>
    </header>
  );
}
