import React from "react";
import { Badge } from "@/components/ui/badge";
import { STYLE_ABBREV, STYLE_DISPLAY_NAMES, type FightingStyle, type CareerRecord } from "@/types/game";

interface StatBadgeProps {
  styleName: FightingStyle;
  career?: CareerRecord;
  variant?: "default" | "secondary" | "destructive" | "outline";
  showFullName?: boolean;
}

export function StatBadge({ styleName, career, variant = "outline", showFullName = false }: StatBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant={variant} className="text-[10px] font-mono h-4 px-1 shrink-0">
        {showFullName ? (STYLE_DISPLAY_NAMES[styleName] || styleName) : (STYLE_ABBREV[styleName] || styleName)}
      </Badge>
      {career && (
        <span className="text-[10px] text-muted-foreground">
          {career.wins}W-{career.losses}L
          {career.kills > 0 && <span className="text-arena-blood ml-0.5">{career.kills}K</span>}
        </span>
      )}
    </div>
  );
}
