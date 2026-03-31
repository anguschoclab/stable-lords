import React, { useMemo } from "react";
import { Skull } from "lucide-react";
import { useGameStore } from "@/state/useGameStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StableLink } from "@/components/EntityLink";
import { WarriorNameTag } from "@/components/ui/WarriorBadges";

export function RivalsListWidget() {
  const { state } = useGameStore();
  const rivals = state.rivals ?? [];

  // Find recent bouts involving rival warriors
  const recentRivalBouts = useMemo(() => {
    const rosterNames = new Set(state.roster.map(w => w.name));
    return (state.arenaHistory || [])
      .filter(f => {
        const aIsPlayer = rosterNames.has(f.a);
        const dIsPlayer = rosterNames.has(f.d);
        return (aIsPlayer && !dIsPlayer) || (!aIsPlayer && dIsPlayer);
      })
      .slice(-3)
      .reverse();
  }, [state.arenaHistory, state.roster]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <Skull className="h-4 w-4 text-destructive" /> Rival Stables
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rivals.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No rival stables yet.</p>
        ) : (
          <div className="space-y-2">
            {rivals.slice(0, 6).map(r => {
              const active = r.roster.filter(w => w.status === "Active").length;
              const topWarrior = [...r.roster].sort((a, b) => (b.fame || 0) - (a.fame || 0))[0];
              const tierColors: Record<string, string> = {
                Major: "text-arena-gold border-arena-gold/40",
                Established: "text-primary border-primary/40",
                Minor: "text-muted-foreground border-border",
                Legendary: "text-destructive border-destructive/40",
              };
              const tierClass = tierColors[r.tier ?? "Minor"] ?? tierColors.Minor;
              return (
                <div key={r.owner.id} className="flex items-center gap-3 py-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <StableLink name={r.owner.stableName} className="text-sm font-display font-semibold truncate">
                        {r.owner.stableName}
                      </StableLink>
                      {r.tier && (
                        <Badge variant="outline" className={`text-[9px] h-4 px-1 shrink-0 ${tierClass}`}>
                          {r.tier}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[9px] h-4 px-1 shrink-0">
                        {r.owner.personality ?? "Unknown"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                      <span>{active} warriors</span>
                      <span>·</span>
                      <span className="text-arena-fame">{r.owner.fame} fame</span>
                      {r.philosophy && (
                        <>
                          <span>·</span>
                          <span className="italic">{r.philosophy}</span>
                        </>
                      )}
                      {topWarrior && (
                        <>
                          <span>·</span>
                          <span className="truncate flex items-center gap-1">★ <WarriorNameTag name={topWarrior.name} id={topWarrior.id} /></span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Recent rival bouts */}
            {recentRivalBouts.length > 0 && (
              <div className="pt-2 mt-1 border-t border-border/50">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                  Recent vs Rivals
                </div>
                {recentRivalBouts.map(f => {
                  const rosterNames = new Set(state.roster.map(w => w.name));
                  const playerIsA = rosterNames.has(f.a);
                  const won = (playerIsA && f.winner === "A") || (!playerIsA && f.winner === "D");
                  return (
                    <div key={f.id} className="flex items-center gap-2 py-0.5">
                      <Badge
                        variant={won ? "default" : f.winner ? "destructive" : "secondary"}
                        className="text-[9px] w-5 h-4 justify-center p-0"
                      >
                        {won ? "W" : f.winner ? "L" : "D"}
                      </Badge>
                      <span className="text-[11px] truncate flex items-center gap-1">
                        <WarriorNameTag name={playerIsA ? f.a : f.d} /> vs <WarriorNameTag name={playerIsA ? f.d : f.a} />
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
