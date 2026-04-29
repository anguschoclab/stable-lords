import React from 'react';
import { ArrowUpDown } from 'lucide-react';

export type SortDir = 'asc' | 'desc';

export interface SortHeaderProps {
  label: React.ReactNode;
  active: boolean;
  dir?: SortDir;
  onClick: () => void;
}

export function SortHeader({ label, active, dir, onClick }: SortHeaderProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      <span>{label}</span>
      <span className="sr-only">
        {active
          ? dir
            ? dir === 'desc'
              ? ' (sorted descending)'
              : ' (sorted ascending)'
            : ' (sorted)'
          : ' (click to sort)'}
      </span>
      <ArrowUpDown
        className={`h-3 w-3 ${active ? 'text-primary' : 'text-muted-foreground/40'}`}
        aria-hidden="true"
      />
    </button>
  );
}
