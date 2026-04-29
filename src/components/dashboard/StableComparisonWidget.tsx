import { useMemo } from 'react';
import { Shield, Swords, Activity, TrendingUp, BarChart3 } from 'lucide-react';
import { useGameStore } from '@/state/useGameStore';
import { resolveStableName } from '@/utils/historyResolver';
import { type Warrior } from '@/types/game';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StableComparisonStats = {
  id: string;
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

import { calculateStableStats } from '@/engine/stats/stableStats';

// Helper: Extracts key stats for a single stable in O(n) using the centralized engine
function getWidgetStats(
  roster: readonly Warrior[],
  stableId: string,
  stableName: string,
  isPlayer: boolean
): StableComparisonStats {
  const stats = calculateStableStats(roster as Warrior[]);
  return {
    id: stableId,
    name: stableName,
    warriors: stats.activeCount,
    wins: stats.totalWins,
    kills: stats.totalKills,
    avgFame: stats.avgFame,
    isPlayer,
  };
}

export function StableComparisonWidget() {
  const state = useGameStore();

  const playerWarriorIds = useMemo(
    () => new Set((state.roster || []).map((w) => w.id)),
    [state.roster]
  );

  const playerStats = useMemo(() => {
    return getWidgetStats(state.roster || [], state.player.id, state.player.stableName, true);
  }, [state.roster, state.player.id, state.player.stableName]);

  const { rivalStats, h2hRecords } = useMemo(() => {
    const rivals = (state.rivals ?? []).slice(0, 3);
    const h2h: Record<string, HeadToHeadRecord> = {};

    const stats = rivals.map((r) => {
      const rivalWarriorIds = new Set((r.roster || []).map((w) => w.id));
      const rStats = getWidgetStats(r.roster || [], r.id, r.owner.stableName, false);

      const record: HeadToHeadRecord = { wins: 0, losses: 0, kills: 0, deaths: 0 };
      for (const f of state.arenaHistory || []) {
        const aIsPlayer = playerWarriorIds.has(f.warriorIdA);
        const dIsPlayer = playerWarriorIds.has(f.warriorIdD);
        const aIsRival = rivalWarriorIds.has(f.warriorIdA);
        const dIsRival = rivalWarriorIds.has(f.warriorIdD);

        if ((aIsPlayer && dIsRival) || (dIsPlayer && aIsRival)) {
          const playerIsA = aIsPlayer;
          const playerWon = (playerIsA && f.winner === 'A') || (!playerIsA && f.winner === 'D');
          const playerLost = (playerIsA && f.winner === 'D') || (!playerIsA && f.winner === 'A');
          if (playerWon) {
            record.wins++;
            if (f.by === 'Kill') record.kills++;
          } else if (playerLost) {
            record.losses++;
            if (f.by === 'Kill') record.deaths++;
          }
        }
      }
      h2h[r.id] = record;
      return rStats;
    });

    return { rivalStats: stats, h2hRecords: h2h };
  }, [state.rivals, state.arenaHistory, playerWarriorIds]);

  const allStables = [playerStats, ...rivalStats];
  const maxWins = Math.max(...allStables.map((s) => s.wins), 1);
  const maxFame = Math.max(...allStables.map((s) => s.avgFame), 1);

  return (
    <Surface
      variant="glass"
      padding="none"
      className="md:col-span-2 border-border/10 group overflow-hidden relative flex flex-col"
    >
      <div className="p-6 border-b border-white/5 bg-neutral-900/40 relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-none bg-primary/10 border border-primary/20">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-base font-black uppercase tracking-tight">
              Competitive Matrix
            </h3>
            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
              Cross-Stable Resource Audit
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="text-[9px] font-mono font-black border-white/10 bg-white/5 text-muted-foreground/60 h-7 px-3 tracking-widest"
        >
          {allStables.length} STABLES
        </Badge>
      </div>

      <div className="p-6 flex-1 relative z-10 space-y-8">
        <div className="space-y-4">
          <div className="grid grid-cols-[1fr_80px_120px_80px_120px] gap-4 px-4 pb-2 border-b border-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
            <span>Entity</span>
            <span className="text-center">Assets</span>
            <span>Wins</span>
            <span className="text-center">Kills</span>
            <span>Avg Fame</span>
          </div>

          <div className="space-y-2">
            {allStables.map((s, i) => (
              <div
                key={i}
                className={cn(
                  'grid grid-cols-[1fr_80px_120px_80px_120px] gap-4 p-4 rounded-none border transition-all duration-300 group/row items-center',
                  s.isPlayer
                    ? 'bg-primary/5 border-primary/20 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]'
                    : 'bg-white/2 border-white/5 hover:bg-white/5'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {s.isPlayer ? (
                    <div className="p-1.5 rounded-none bg-primary/20 border border-primary/30">
                      <Shield className="h-3 w-3 text-primary" />
                    </div>
                  ) : (
                    <div className="p-1.5 rounded-none bg-white/5 border border-white/10 opacity-40">
                      <Activity className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                  <span
                    className={cn(
                      'text-xs font-black uppercase tracking-tight truncate',
                      s.isPlayer ? 'text-primary' : 'text-foreground/80'
                    )}
                  >
                    {resolveStableName(state, s.id, s.name)}
                  </span>
                </div>

                <div className="text-center font-mono text-sm font-black text-muted-foreground/60 group-hover/row:text-foreground transition-colors">
                  {s.warriors.toString().padStart(2, '0')}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-black/40 rounded-none overflow-hidden border border-white/5">
                    <div
                      className={cn(
                        'h-full rounded-none transition-all duration-1000',
                        s.isPlayer
                          ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.4)]'
                          : 'bg-arena-pop'
                      )}
                      style={{ width: `${(s.wins / maxWins) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-black w-6 text-right">{s.wins}</span>
                </div>

                <div className="text-center font-mono text-sm font-black text-destructive/60 group-hover/row:text-destructive transition-colors">
                  {s.kills.toString().padStart(2, '0')}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-black/40 rounded-none overflow-hidden border border-white/5">
                    <div
                      className={cn(
                        'h-full rounded-none transition-all duration-1000',
                        s.isPlayer
                          ? 'bg-arena-gold shadow-[0_0_10px_rgba(255,215,0,0.4)]'
                          : 'bg-arena-fame'
                      )}
                      style={{ width: `${(s.avgFame / maxFame) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-black w-8 text-right">
                    {s.avgFame}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {rivalStats.some((r) => {
          const rec = h2hRecords[r.id];
          return rec && rec.wins + rec.losses > 0;
        }) && (
          <div className="border-t border-white/5 pt-8 space-y-6">
            <div className="flex items-center gap-3 px-2">
              <Swords className="h-4 w-4 text-primary opacity-60" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                HEAD TO HEAD
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rivalStats.map((r) => {
                const rec = h2hRecords[r.id];
                if (!rec || rec.wins + rec.losses === 0) return null;
                const total = rec.wins + rec.losses;
                const winPct = Math.round((rec.wins / total) * 100);

                return (
                  <div
                    key={r.id}
                    className="p-4 bg-black/20 rounded-none border border-white/5 group/h2h hover:border-primary/20 transition-all"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                        {resolveStableName(state, r.id, r.name)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'text-xs font-mono font-black',
                            winPct >= 50 ? 'text-arena-pop' : 'text-destructive'
                          )}
                        >
                          {winPct}% EFFICIENCY
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1 h-2 rounded-none overflow-hidden mb-3 border border-white/5">
                      <div
                        className="h-full bg-arena-pop shadow-[inset_0_0_5px_rgba(0,0,0,0.2)]"
                        style={{ width: `${winPct}%` }}
                      />
                      <div
                        className="h-full bg-destructive/40"
                        style={{ width: `${100 - winPct}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex gap-4">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">
                            WINS
                          </span>
                          <span className="text-xs font-mono font-black text-arena-pop">
                            {rec.wins}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">
                            LOSSES
                          </span>
                          <span className="text-xs font-mono font-black text-destructive">
                            {rec.losses}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-4 text-right">
                        {rec.kills > 0 && (
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest text-right">
                              TERMINATED
                            </span>
                            <span className="text-xs font-mono font-black text-arena-gold">
                              ☠ {rec.kills}
                            </span>
                          </div>
                        )}
                        {rec.deaths > 0 && (
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest text-right">
                              FATALITIES
                            </span>
                            <span className="text-xs font-mono font-black text-destructive">
                              {rec.deaths}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5 bg-black/40 flex justify-center relative z-10 mt-auto">
        <button
          aria-label="Global Registry Analysis"
          className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground hover:text-primary transition-colors opacity-40 hover:opacity-100 flex items-center gap-2 group"
        >
          GLOBAL REGISTRY ANALYSIS{' '}
          <BarChart3 className="h-3 w-3 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </Surface>
  );
}
