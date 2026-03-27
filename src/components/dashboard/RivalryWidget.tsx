import React, { useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { GameState } from "@/types/game";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StableLink, WarriorLink } from "@/components/EntityLink";
import { Flame, Skull } from "lucide-react";

export interface DerivedRivalry {
  stableName: string;
  ownerId: string;
  intensity: number;
  kills: { killer: string; victim: string; week: number }[];
  bouts: number;
  playerWins: number;
  playerLosses: number;
}

// Custom Hook to gather player roster names
function usePlayerRosterNames(state: GameState): Set<string> {
  return useMemo(() =>
    new Set(state.roster.map(w => w.name).concat(state.graveyard?.map(w => w.name) ?? [])),
  [state.roster, state.graveyard]);
}

// Custom Hook to map rival warrior names to their stable
function useRivalWarriorStable(state: GameState): Map<string, string> {
  return useMemo(() => {
    const m = new Map<string, string>();
    for (const r of (state.rivals ?? [])) {
      for (const w of r.roster) m.set(w.name, r.owner.stableName);
    }
    return m;
  }, [state.rivals]);
}

// Custom Hook to compute ongoing rivalries
function useRivalriesList(state: GameState, rosterNames: Set<string>, rivalWarriorStable: Map<string, string>): DerivedRivalry[] {
  return useMemo(() => {
    const map = new Map<string, DerivedRivalry>();

    for (const bout of state.arenaHistory) {
      const aIsPlayer = rosterNames.has(bout.a);
      const dIsPlayer = rosterNames.has(bout.d);
      if (!aIsPlayer && !dIsPlayer) continue;

      const rivalName = aIsPlayer ? bout.d : bout.a;
      const stable = rivalWarriorStable.get(rivalName);
      if (!stable) continue;

      if (!map.has(stable)) {
        const owner = (state.rivals ?? []).find(r => r.owner.stableName === stable);
        map.set(stable, {
          stableName: stable,
          ownerId: owner?.owner.id ?? stable,
          intensity: 0,
          kills: [],
          bouts: 0,
          playerWins: 0,
          playerLosses: 0,
        });
      }

      const r = map.get(stable)!;
      r.bouts++;

      const playerIsA = aIsPlayer;
      const playerWon = (playerIsA && bout.winner === "A") || (!playerIsA && bout.winner === "D");
      if (playerWon) r.playerWins++;
      else if (bout.winner) r.playerLosses++;

      if (bout.by === "Kill" && bout.winner) {
        const killerIsPlayer = playerWon;
        r.kills.push({
          killer: killerIsPlayer ? (playerIsA ? bout.a : bout.d) : rivalName,
          victim: killerIsPlayer ? rivalName : (playerIsA ? bout.a : bout.d),
          week: bout.week,
        });
      }
    }

    for (const r of map.values()) {
      let intensity = 0;
      intensity += Math.min(r.kills.length * 2, 4);
      intensity += r.bouts >= 5 ? 1 : 0;
      r.intensity = Math.max(1, Math.min(5, intensity));
    }

    return [...map.values()].filter(r => r.bouts > 0).sort((a, b) => b.intensity - a.intensity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.arenaHistory, rosterNames, rivalWarriorStable]);
}

// Custom Hook to calculate the most wanted rival
function useMostWantedRival(state: GameState, rosterNames: Set<string>, rivalWarriorStable: Map<string, string>) {
  return useMemo(() => {
    const winCounts = new Map<string, { name: string; stable: string; wins: number; kills: number }>();
    for (const bout of state.arenaHistory) {
      const aIsPlayer = rosterNames.has(bout.a);
      const dIsPlayer = rosterNames.has(bout.d);
      if (!aIsPlayer && !dIsPlayer) continue;

      const playerWon = (aIsPlayer && bout.winner === "A") || (dIsPlayer && bout.winner === "D");
      if (playerWon || !bout.winner) continue;

      const rivalName = aIsPlayer ? bout.d : bout.a;
      const stable = rivalWarriorStable.get(rivalName) ?? "Unknown";
      const entry = winCounts.get(rivalName) ?? { name: rivalName, stable, wins: 0, kills: 0 };
      entry.wins++;
      if (bout.by === "Kill") entry.kills++;
      winCounts.set(rivalName, entry);
    }
    return [...winCounts.values()].sort((a, b) => b.wins - a.wins || b.kills - a.kills)[0] ?? null;

  }, [state.arenaHistory, rosterNames, rivalWarriorStable]);
}

const intensityColor = (n: number) =>
  n >= 4 ? "text-destructive" : n >= 2 ? "text-arena-gold" : "text-muted-foreground";

const intensityLabel = (n: number) =>
  n >= 5 ? "Blood Feud" : n >= 4 ? "Bitter" : n >= 3 ? "Heated" : n >= 2 ? "Tense" : "Simmering";

// Extracted Sub-component for individual rivalries
function RivalryItem({ r, rosterNames }: { r: DerivedRivalry; rosterNames: Set<string> }) {
  return (
    <div key={r.ownerId} className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StableLink name={r.stableName} className="font-display font-semibold text-sm">
            {r.stableName}
          </StableLink>
          <Badge variant="outline" className={`text-[9px] ${intensityColor(r.intensity)}`}>
            🔥 {intensityLabel(r.intensity)}
          </Badge>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">
          {r.playerWins}W-{r.playerLosses}L
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className={`h-2 w-5 rounded-sm transition-colors ${
                i <= r.intensity
                  ? i >= 4 ? "bg-destructive" : i >= 2 ? "bg-arena-gold" : "bg-primary"
                  : "bg-secondary"
              }`}
            />
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground">{r.bouts} bouts</span>
      </div>

      {r.kills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {r.kills.slice(-3).map((k, i) => {
            const playerKilled = rosterNames.has(k.killer);
            return (
              <Badge
                key={i}
                variant={playerKilled ? "default" : "destructive"}
                className="text-[9px] gap-1 h-5"
              >
                <Skull className="h-2.5 w-2.5" />
                {k.killer} → {k.victim} (Wk {k.week})
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Main Widget Component
export function RivalryWidget() {
  const { state } = useGameStore();
  const rosterNames = usePlayerRosterNames(state as GameState);
  const rivalWarriorStable = useRivalWarriorStable(state as GameState);
  const rivalries = useRivalriesList(state as GameState, rosterNames, rivalWarriorStable);
  const mostWanted = useMostWantedRival(state as GameState, rosterNames, rivalWarriorStable);

  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <Flame className="h-4 w-4 text-destructive" /> Rivalries
        </CardTitle>
        {rivalries.length > 0 && (
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            {rivalries.length} active
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {rivalries.length === 0 ? (
          <div className="text-center py-4 space-y-1">
            <p className="text-xs text-muted-foreground italic">No rivalries yet.</p>
            <p className="text-[10px] text-muted-foreground">Fight rival stables to forge vendettas and blood feuds.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              {rivalries.slice(0, 4).map(r => (
                <RivalryItem key={r.ownerId} r={r} rosterNames={rosterNames} />
              ))}
            </div>

            {mostWanted && (
              <div className="border-t border-border/50 pt-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">
                  ⚔ Most Wanted
                </div>
                <div className="flex items-center gap-3 rounded-md bg-destructive/5 border border-destructive/20 p-2.5">
                  <Skull className="h-5 w-5 text-destructive shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <WarriorLink name={mostWanted.name} className="font-display font-bold text-sm" />
                      <span className="text-[10px] text-muted-foreground">({mostWanted.stable})</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {mostWanted.wins} win{mostWanted.wins !== 1 ? "s" : ""} vs your warriors
                      {mostWanted.kills > 0 && <span className="text-destructive"> · {mostWanted.kills} kill{mostWanted.kills !== 1 ? "s" : ""}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
