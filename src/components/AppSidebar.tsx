"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ExternalLink,
  Users,
  Briefcase,
  Layers,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  GraduationCap,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface AppSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AppSidebar({ isOpen = false, onClose = () => {} }: AppSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300",
        "md:relative md:translate-x-0 md:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full",
        collapsed ? "md:w-16" : "md:w-56",
        "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-sidebar-border overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg overflow-hidden relative border border-border bg-indigo-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {(!collapsed || isOpen) && (
            <div className={cn("overflow-hidden", collapsed ? "md:hidden" : "block")}>
              <p className="font-bold text-sm text-foreground truncate">AD Contacts</p>
              <p className="text-xs text-muted-foreground truncate">E-Learning Leads</p>
            </div>
          )}
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                    active
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  <span className={cn("truncate flex-1", collapsed ? "md:hidden" : "block")}>
                    {item.label}
                  </span>
                  {item.badge && (!collapsed || isOpen) && (
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-sidebar-border space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
        >
          <ExternalLink size={18} className="flex-shrink-0" />
          <span className={cn(collapsed ? "md:hidden" : "block")}>View FB Ad Page</span>
        </Link>
      </div>

      {/* Collapse Toggle */}
      <Button
        variant="outline"
        size="icon"
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border shadow-md bg-background z-10 hidden md:flex"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </Button>
    </aside>
  );
}

const navItems = [
  { href: "/dashboard", label: "Student Leads", icon: LayoutDashboard, badge: "Main" },
  { href: "/", label: "Student Ad Form", icon: GraduationCap, external: false },
  { href: "/applicants", label: "Intern Hiring (Archive)", icon: Users },
];
