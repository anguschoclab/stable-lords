import React, { useMemo } from "react";
import { Shield, Swords, Users } from "lucide-react";
import { useGameStore } from "@/state/useGameStore";
import { type Warrior } from "@/types/game";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type StableComparisonStats = {
  name: string;
  warriors: number;
  wins: number;
  kills: number;
  avgFame: number;
  isPlayer: boolean;
};

type HeadToHeadRecord = {
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
};

// Helper: Extracts key stats for a single stable in O(n)
function calculateStableStats(roster: readonly Warrior[], stableName: string, isPlayer: boolean): StableComparisonStats {
  let activeCount = 0;
  let totalFame = 0;
  let wins = 0;
  let kills = 0;
  for (const w of roster) {
    wins += w.career.wins;
    kills += w.career.kills;
    if (w.status === "Active") {
      activeCount++;
      totalFame += w.fame ?? 0;
    }
  }
  const avgFame = activeCount > 0 ? Math.round(totalFame / activeCount) : 0;
  return { name: stableName, warriors: activeCount, wins, kills, avgFame, isPlayer };
}

// Subcomponent: List of all stables (player + rivals)
function StableComparisonList({ allStables }: { allStables: StableComparisonStats[] }) {
  const maxWins = Math.max(...allStables.map(s => s.wins), 1);
  const maxFame = Math.max(...allStables.map(s => s.avgFame), 1);

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="grid grid-cols-[1fr_60px_80px_50px_70px] gap-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium border-b border-border pb-1.5">
        <span>Stable</span>
        <span className="text-center">Size</span>
        <span className="text-center">Victories</span>
        <span className="text-center">Kills</span>
        <span className="text-center">Avg Fame</span>
      </div>
      {allStables.map((s, i) => (
        <div
          key={i}
          className={`grid grid-cols-[1fr_60px_80px_50px_70px] gap-2 items-center py-1.5 rounded-md px-1.5 ${
            s.isPlayer ? "bg-primary/5 border border-primary/20" : "hover:bg-secondary/40"
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {s.isPlayer && <Shield className="h-3 w-3 text-primary shrink-0" />}
            <span className={`text-sm truncate ${s.isPlayer ? "font-semibold" : ""}`}>{s.name}</span>
          </div>
          <div className="text-center text-sm font-mono">{s.warriors}</div>
          <div className="flex items-center gap-1.5">
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-arena-pop rounded-full transition-all" style={{ width: `${(s.wins / maxWins) * 100}%` }} />
            </div>
            <span className="text-xs font-mono w-6 text-right">{s.wins}</span>
          </div>
          <div className="text-center text-sm font-mono text-destructive">{s.kills}</div>
          <div className="flex items-center gap-1.5">
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-arena-fame rounded-full transition-all" style={{ width: `${(s.avgFame / maxFame) * 100}%` }} />
            </div>
            <span className="text-xs font-mono w-6 text-right">{s.avgFame}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Subcomponent: Head-to-Head breakdown
function HeadToHeadBreakdown({ rivalStats, h2hRecords }: { rivalStats: StableComparisonStats[], h2hRecords: Record<string, HeadToHeadRecord> }) {
  if (!rivalStats.some(r => {
    const rec = h2hRecords[r.name];
    return rec && (rec.wins + rec.losses) > 0;
  })) return null;

  return (
    <div className="space-y-2 pt-2 border-t border-border">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
        <Swords className="h-3 w-3" /> Head-to-Head
      </div>
      {rivalStats.map(r => {
        const rec = h2hRecords[r.name];
        if (!rec || (rec.wins + rec.losses) === 0) return null;
        const total = rec.wins + rec.losses;
        const winPct = Math.round((rec.wins / total) * 100);

        return (
          <div key={r.name} className="flex items-center gap-3">
            <span className="text-xs text-foreground/80 w-28 truncate" title={r.name}>vs {r.name}</span>
            <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden flex">
              <div
                className="h-full bg-arena-pop transition-all"
                style={{ width: `${winPct}%` }}
                title={`${rec.wins} wins`}
              />
              <div
                className="h-full bg-destructive/70 transition-all"
                style={{ width: `${100 - winPct}%` }}
                title={`${rec.losses} losses`}
              />
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-mono font-semibold text-arena-pop">{rec.wins}W</span>
              <span className="text-[10px] text-muted-foreground">-</span>
              <span className="text-xs font-mono font-semibold text-destructive">{rec.losses}L</span>
              {(rec.kills > 0 || rec.deaths > 0) && (
                <span className="text-[10px] font-mono text-muted-foreground ml-1">
                  {rec.kills > 0 && <span className="text-arena-gold">☠{rec.kills}</span>}
                  {rec.deaths > 0 && <span className="text-destructive ml-0.5">💀{rec.deaths}</span>}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function StableComparisonWidget() {
  const { state } = useGameStore();

  const playerNames = useMemo(() => new Set(state.roster.map(w => w.name)), [state.roster]);

  const playerStats = useMemo(() => {
    return calculateStableStats(state.roster, state.player.stableName, true);
  }, [state.roster, state.player.stableName]);

  const { rivalStats, h2hRecords } = useMemo(() => {
    const rivals = (state.rivals ?? []).slice(0, 3);
    const h2h: Record<string, HeadToHeadRecord> = {};

    const stats = rivals.map(r => {
      const rivalNameSet = new Set(r.roster.map(w => w.name));
      const rStats = calculateStableStats(r.roster, r.owner.stableName, false);

      const record: HeadToHeadRecord = { wins: 0, losses: 0, kills: 0, deaths: 0 };
      for (const f of state.arenaHistory) {
        const aIsPlayer = playerNames.has(f.a);
        const dIsPlayer = playerNames.has(f.d);
        const aIsRival = rivalNameSet.has(f.a);
        const dIsRival = rivalNameSet.has(f.d);

        if ((aIsPlayer && dIsRival) || (dIsPlayer && aIsRival)) {
          const playerIsA = aIsPlayer;
          const playerWon = (playerIsA && f.winner === "A") || (!playerIsA && f.winner === "D");
          const playerLost = (playerIsA && f.winner === "D") || (!playerIsA && f.winner === "A");
          if (playerWon) {
            record.wins++;
            if (f.by === "Kill") record.kills++;
          } else if (playerLost) {
            record.losses++;
            if (f.by === "Kill") record.deaths++;
          }
        }
      }
      h2h[r.owner.stableName] = record;
      return rStats;
    });

    return { rivalStats: stats, h2hRecords: h2h };
  }, [state.rivals, state.arenaHistory, playerNames]);

  const allStables = [playerStats, ...rivalStats];

  if (rivalStats.length === 0) {
    return (
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Stable Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground italic">No rival stables to compare yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" /> Stable Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <StableComparisonList allStables={allStables} />
        <HeadToHeadBreakdown rivalStats={rivalStats} h2hRecords={h2hRecords} />
      </CardContent>
    </Card>
  );
}
