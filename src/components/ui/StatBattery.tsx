import React from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface StatBatteryProps {
  label: string;
  value: number;
  max?: number;
  labelValue?: string | number; // Optional explicit display string for the value
  colorClass?: string;          // Tailwind class for the progress bar color
  className?: string;           // Optional wrapper class
}

export function StatBattery({
  label,
  value,
  max = 100,
  labelValue,
  colorClass,
  className,
}: StatBatteryProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const displayValue = labelValue !== undefined ? labelValue : value;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="text-xs text-muted-foreground w-8 font-mono">{label}</span>
      <div className="flex-1 relative">
        <Progress
          value={pct}
          className={cn("h-2 overflow-hidden shadow-[0_0_5px_currentColor]", colorClass)}
        />
      </div>
      <span className="text-sm font-mono font-semibold w-6 text-right">{displayValue}</span>
    </div>
  );
}