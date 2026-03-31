import React, { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { useGameStore } from "@/state/useGameStore";
import { computeMetaDrift, getMetaLabel, getMetaColor } from "@/engine/metaDrift";
import { STYLE_DISPLAY_NAMES } from "@/types/game";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function MetaPulseWidget() {
  const { state } = useGameStore();
  const metaDrift = useMemo(
    () => computeMetaDrift(state.arenaHistory),
    [state.arenaHistory]
  );
  const activeStyles = useMemo(
    () => Object.entries(metaDrift)
      .filter(([, drift]) => drift !== 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4),
    [metaDrift]
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" /> Meta Pulse
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeStyles.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No meta shift detected yet.</p>
        ) : (
          <div className="space-y-2">
            {activeStyles.map(([style, drift]) => (
              <div key={style} className="flex items-center justify-between">
                <span className="text-xs text-foreground/80">
                  {STYLE_DISPLAY_NAMES[style as keyof typeof STYLE_DISPLAY_NAMES] ?? style}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${getMetaColor(drift)}`}
                >
                  {getMetaLabel(drift)} {drift > 0 ? "↑" : "↓"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
