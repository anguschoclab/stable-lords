import React from "react";
import { cn } from "@/lib/utils";

interface ConditionBatteryProps {
  value: number; // 0-100
  className?: string;
  showText?: boolean;
}

export function ConditionBattery({ value, className, showText = false }: ConditionBatteryProps) {
  // Determine color segment
  const color = value > 70 ? "bg-primary" : value > 30 ? "bg-amber-500" : "bg-destructive";
  const opacity = value > 70 ? "opacity-100" : value > 30 ? "opacity-80" : "opacity-90";

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="relative w-8 h-4 border border-muted-foreground/30 rounded-[2px] p-[1px] bg-background/50 overflow-hidden">
        {/* Battery Top Notch */}
        <div className="absolute right-[-2px] top-1/2 -translate-y-1/2 w-0.5 h-2 bg-muted-foreground/30 rounded-r-[1px]" />
        
        {/* Fill */}
        <div 
          className={cn("h-full rounded-[1px] transition-all duration-500", color, opacity)}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
      {showText && (
        <span className={cn("text-[10px] font-mono font-bold", value < 30 ? "text-destructive" : "text-muted-foreground")}>
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
}
