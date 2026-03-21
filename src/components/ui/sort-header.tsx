import React from "react";
import { ArrowUpDown } from "lucide-react";

export type SortDir = "asc" | "desc";

export interface SortHeaderProps {
  label: string;
  active: boolean;
  dir?: SortDir;
  onClick: () => void;
}

export function SortHeader({ label, active, onClick }: SortHeaderProps) {
  return (
    <button onClick={onClick} aria-label={`Sort by ${label}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
      {label}
      <ArrowUpDown className={`h-3 w-3 ${active ? "text-primary" : "text-muted-foreground/40"}`} />
    </button>
  );
}
