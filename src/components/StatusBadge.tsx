import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus } from "@/models/Application";

const statusConfig: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  New: { label: "New", className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400" },
  Messaged: { label: "Messaged", className: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400" },
  "No Response": { label: "No Response", className: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400" },
  "Follow Up": { label: "Follow Up", className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400" },
  Interview: { label: "Interview", className: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400" },
  Confirmed: { label: "Confirmed", className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400" },
  Rejected: { label: "Rejected", className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400" },
};

export default function StatusBadge({ status }: { status: ApplicationStatus }) {
  const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-600" };
  return (
    <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
      {config.label}
    </Badge>
  );
}
