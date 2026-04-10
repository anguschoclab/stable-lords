import React, { useMemo } from "react";
import { useGameStore, useWorldState } from "@/state/useGameStore";
import { cn } from "@/lib/utils";
import { getRecentFightsForWarrior } from "@/engine/core/historyUtils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FormSparklineProps {
  warriorId: string;
  limit?: number;
}

export const FormSparkline = React.memo(function FormSparkline({ warriorId, limit = 5 }: FormSparklineProps) {
  // Only select what we need: the history array
  const state = useWorldState();
  const arenaHistory = state.arenaHistory;

  const history = useMemo(() => {
    return getRecentFightsForWarrior(arenaHistory, warriorId, limit);
  }, [arenaHistory, warriorId, limit]);

  return (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        {history.length === 0 ? (
          <span className="text-[10px] text-muted-foreground font-mono">NEW</span>
        ) : (
          history.map((fight) => {
            const isA = fight.a === warriorId;
            const won = (isA && fight.winner === "A") || (!isA && fight.winner === "D");
            const byKill = fight.by === "Kill";
            const isDraw = fight.winner === null;

            let colorClass = "bg-muted";
            let label = "Draw";
            
            if (isDraw) {
              colorClass = "bg-amber-500/50";
              label = "Draw";
            } else if (won) {
              colorClass = byKill ? "bg-arena-blood shadow-[0_0_8px_rgba(153,27,27,0.5)]" : "bg-arena-fame";
              label = byKill ? "Win (Kill)" : "Win";
            } else {
              colorClass = "bg-destructive/60";
              label = "Loss";
            }

            return (
              <Tooltip key={fight.id}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "w-3 h-3 rounded-sm transition-transform hover:scale-125",
                      colorClass
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <div className="text-[11px]">
                    <p className="font-bold">Week {fight.week}: {label}</p>
                    <p className="text-muted-foreground">vs {isA ? fight.d : fight.a}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })
        )}
      </TooltipProvider>
    </div>
  );
});
