import { useMemo } from 'react';
import { useWorldState } from '@/state/useGameStore';
import { GameState } from '@/types/game';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { Flame, Skull, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRecentFights } from '@/engine/core/historyUtils';

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
  return useMemo(
    () =>
      new Set(
        (state.roster || []).map((w) => w.name).concat(state.graveyard?.map((w) => w.name) ?? [])
      ),
    [state.roster, state.graveyard]
  );
}

// Custom Hook to map rival warrior names to their stable
function useRivalWarriorStable(state: GameState): Map<string, string> {
  return useMemo(() => {
    const m = new Map<string, string>();
    for (const r of state.rivals ?? []) {
      if (r.roster) {
        for (const w of r.roster) m.set(w.name, r.owner.stableName);
      }
    }
    return m;
  }, [state.rivals]);
}

// Custom Hook to compute ongoing rivalries
function useRivalriesList(
  state: GameState,
  rosterNames: Set<string>,
  rivalWarriorStable: Map<string, string>
): DerivedRivalry[] {
  return useMemo(() => {
    const map = new Map<string, DerivedRivalry>();
    const recentHistory = getRecentFights(state.arenaHistory || [], Math.max(1, state.week - 13));

    for (const bout of recentHistory) {
      const aIsPlayer = rosterNames.has(bout.a);
      const dIsPlayer = rosterNames.has(bout.d);
      if (!aIsPlayer && !dIsPlayer) continue;

      const rivalName = aIsPlayer ? bout.d : bout.a;
      const stable = rivalWarriorStable.get(rivalName);
      if (!stable) continue;

      if (!map.has(stable)) {
        const owner = (state.rivals ?? []).find((r) => r.owner.stableName === stable);
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

      const r = map.get(stable);
      if (!r) continue;
      r.bouts++;

      const playerIsA = aIsPlayer;
      const playerWon = (playerIsA && bout.winner === 'A') || (!playerIsA && bout.winner === 'D');
      if (playerWon) r.playerWins++;
      else if (bout.winner) r.playerLosses++;

      if (bout.by === 'Kill' && bout.winner) {
        const killerIsPlayer = playerWon;
        r.kills.push({
          killer: killerIsPlayer ? (playerIsA ? bout.a : bout.d) : rivalName,
          victim: killerIsPlayer ? rivalName : playerIsA ? bout.a : bout.d,
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

    return [...map.values()].filter((r) => r.bouts > 0).sort((a, b) => b.intensity - a.intensity);
  }, [state.arenaHistory, state.week, rosterNames, rivalWarriorStable, state.rivals]);
}

// Custom Hook to calculate the most wanted rival
function useMostWantedRival(
  state: GameState,
  rosterNames: Set<string>,
  rivalWarriorStable: Map<string, string>
) {
  return useMemo(() => {
    const winCounts = new Map<
      string,
      { name: string; stable: string; wins: number; kills: number }
    >();
    const recentHistory = getRecentFights(state.arenaHistory || [], Math.max(1, state.week - 13));
    for (const bout of recentHistory) {
      const aIsPlayer = rosterNames.has(bout.a);
      const dIsPlayer = rosterNames.has(bout.d);
      if (!aIsPlayer && !dIsPlayer) continue;

      const playerWon = (aIsPlayer && bout.winner === 'A') || (dIsPlayer && bout.winner === 'D');
      if (playerWon || !bout.winner) continue;

      const rivalName = aIsPlayer ? bout.d : bout.a;
      const stable = rivalWarriorStable.get(rivalName) ?? 'Unknown';
      const entry = winCounts.get(rivalName) ?? { name: rivalName, stable, wins: 0, kills: 0 };
      entry.wins++;
      if (bout.by === 'Kill') entry.kills++;
      winCounts.set(rivalName, entry);
    }

    // ⚡ Bolt Optimization: Use a single O(N) scan to find the max entry instead of converting to array and sorting.
    // Reduces array allocations and O(N log N) GC pressure inside this useMemo hook.
    let maxEntry: { name: string; stable: string; wins: number; kills: number } | null = null;
    for (const entry of winCounts.values()) {
      if (
        !maxEntry ||
        entry.wins > maxEntry.wins ||
        (entry.wins === maxEntry.wins && entry.kills > maxEntry.kills)
      ) {
        maxEntry = entry;
      }
    }
    return maxEntry;
  }, [state.arenaHistory, state.week, rosterNames, rivalWarriorStable]);
}

const intensityLabel = (n: number) =>
  n >= 5 ? 'Blood Feud' : n >= 4 ? 'Bitter' : n >= 3 ? 'Heated' : n >= 2 ? 'Tense' : 'Simmering';

const intensityColor = (n: number) =>
  n >= 4 ? 'text-destructive' : n >= 2 ? 'text-arena-gold' : 'text-primary';

// Main Widget Component
export function RivalryWidget() {
  const state = useWorldState();
  const rosterNames = usePlayerRosterNames(state as GameState);
  const rivalWarriorStable = useRivalWarriorStable(state as GameState);
  const rivalries = useRivalriesList(state as GameState, rosterNames, rivalWarriorStable);
  const mostWanted = useMostWantedRival(state as GameState, rosterNames, rivalWarriorStable);

  return (
    <Surface
      variant="glass"
      padding="none"
      className="md:col-span-2 border-border/10 group overflow-hidden relative flex flex-col min-h-96"
    >
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
        <Flame className="h-48 w-48 text-destructive" />
      </div>

      <div className="p-6 border-b border-white/5 bg-neutral-900/40 relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-none bg-destructive/10 border border-destructive/20 shadow-[0_0_15px_rgba(var(--destructive-rgb),0.1)]">
            <Flame className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-display text-base font-black uppercase tracking-tight">
              Vendetta Registry
            </h3>
            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
              Inter-Stable Conflict Monitor
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="text-[9px] font-mono font-black border-white/10 bg-white/5 text-muted-foreground/60 h-7 px-3 tracking-widest"
        >
          {rivalries.length} ACTIVE FEUDS
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar p-6">
        {rivalries.length === 0 ? (
          <div className="py-12 text-center opacity-20 italic">
            <p className="text-[10px] uppercase tracking-[0.3em]">
              No significant vendettas detected
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rivalries.slice(0, 4).map((r) => (
                <div
                  key={r.ownerId}
                  className="space-y-4 p-4 bg-white/2 rounded-none border border-white/5 hover:border-destructive/20 transition-all group/item"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase tracking-tight text-foreground/80 group-hover/item:text-destructive transition-colors">
                        {r.stableName}
                      </span>
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'h-1 w-1 rounded-none',
                            r.intensity >= 4 ? 'bg-destructive animate-pulse' : 'bg-arena-gold'
                          )}
                        />
                        <span
                          className={cn(
                            'text-[8px] font-black uppercase tracking-widest',
                            intensityColor(r.intensity)
                          )}
                        >
                          {intensityLabel(r.intensity)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-mono font-black text-foreground opacity-60">
                        {r.playerWins}W <span className="text-foreground/10 mx-0.5">/</span>{' '}
                        {r.playerLosses}L
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30">
                        Engagement Ratio
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex gap-1 h-1.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={cn(
                            'flex-1 rounded-none transition-all duration-500',
                            i <= r.intensity
                              ? i >= 4
                                ? 'bg-destructive shadow-[0_0_8px_rgba(var(--destructive-rgb),0.5)]'
                                : 'bg-arena-gold'
                              : 'bg-white/5'
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {r.kills.length > 0 && (
                    <div className="space-y-1.5">
                      {r.kills.slice(-2).map((k, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest"
                        >
                          <Skull
                            className={cn(
                              'h-3 w-3',
                              rosterNames.has(k.killer) ? 'text-primary' : 'text-destructive'
                            )}
                          />
                          <span className="text-muted-foreground/60">{k.killer}</span>
                          <span className="text-foreground/10">→</span>
                          <span className="text-foreground/80">{k.victim}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {mostWanted && (
              <div className="border-t border-white/5 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-3.5 w-3.5 text-destructive opacity-60" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                    High Priority Target
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-destructive/5 border border-destructive/10 rounded-none group/wanted hover:bg-destructive/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-none bg-destructive/20 flex items-center justify-center border border-destructive/30">
                      <Skull className="h-5 w-5 text-destructive animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black uppercase tracking-tight text-foreground transition-colors group-wanted:text-destructive">
                        {mostWanted.name}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                        Stable: {mostWanted.stable}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-black text-destructive">
                      {mostWanted.wins} VICTORIES <span className="text-foreground/10 mx-1">|</span>{' '}
                      {mostWanted.kills} TERMINATIONS
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-destructive/40">
                      AGGRESSION RATING: EXTREME
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5 bg-black/40 flex justify-center relative z-10 mt-auto">
        <button
          aria-label="Access Conflict Archives"
          className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground hover:text-destructive transition-colors opacity-40 hover:opacity-100 flex items-center gap-2 group"
        >
          Access Conflict Archives{' '}
          <TrendingUp className="h-3 w-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </button>
      </div>
    </Surface>
  );
}
