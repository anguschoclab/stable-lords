import React, { useMemo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Trophy, ChevronRight } from "lucide-react";
import { useGameStore } from "@/state/useGameStore";
import { selectActiveWarriors } from "@/state/selectors";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WarriorNameTag, StatBadge } from "@/components/ui/WarriorBadges";

export function RankingsWidget() {
  const { state } = useGameStore();
  const navigate = useNavigate();

  const ranked = useMemo(
    () => [...selectActiveWarriors(state)]
      .sort((a, b) => b.fame - a.fame)
      .slice(0, 5),
    [state]
  );

  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-arena-gold" /> Warrior Rankings
        </CardTitle>
        <Badge variant="outline" className="text-[10px] text-muted-foreground">
          {selectActiveWarriors(state).length} active
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        {ranked.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            No warriors yet. <Link to="/recruit" className="text-primary hover:underline">Recruit your first.</Link>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {ranked.map((w, i) => (
              <button
                key={w.id}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/40 transition-colors text-left"
                onClick={() => navigate({ to: `/warrior/${w.id}` as any })}
              >
                {/* Rank */}
                <span className={`text-sm font-mono font-bold w-5 text-center ${
                  i === 0 ? "text-arena-gold" : i === 1 ? "text-arena-steel" : "text-muted-foreground"
                }`}>
                  {i + 1}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <WarriorNameTag id={w.id} name={w.name} isChampion={w.champion} />
                  <StatBadge styleName={w.style} career={w.career} />
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-center">
                    <div className="text-xs font-bold text-arena-fame">{w.fame}</div>
                    <div className="text-[9px] text-muted-foreground">Fame</div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
