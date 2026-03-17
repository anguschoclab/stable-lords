import React from "react";
import { Badge } from "@/components/ui/badge";
import { STYLE_ABBREV, type FightingStyle, type CareerRecord } from "@/types/game";

interface StatBadgeProps {
  styleName: FightingStyle;
  career?: CareerRecord;
}

export function StatBadge({ styleName, career }: StatBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-[10px] font-mono h-4 px-1">
        {STYLE_ABBREV[styleName]}
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
