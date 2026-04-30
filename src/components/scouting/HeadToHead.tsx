import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Swords, History, Zap, Target } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import { ArenaHistory } from '@/engine/history/arenaHistory';
import type { Warrior } from '@/types/game';
import { resolveWarriorName } from '@/utils/historyResolver';
import { useGameStore } from '@/state/useGameStore';
import { cn } from '@/lib/utils';

interface HeadToHeadProps {
  nameA: string;
  nameB: string;
  rosterA: Warrior[];
  rosterB: Warrior[];
}

export function HeadToHead({ rosterA, rosterB }: Omit<HeadToHeadProps, 'nameA' | 'nameB'>) {
  const state = useGameStore();
  const allFights = useMemo(() => ArenaHistory.all() || [], []);
  const idsA = useMemo(() => new Set(rosterA.map((w) => w.id)), [rosterA]);
  const idsB = useMemo(() => new Set(rosterB.map((w) => w.id)), [rosterB]);

  // ⚡ Bolt: Reduced multiple O(N) array filter/slice/reverse operations into a single O(N) pass
  // with a pre-reversed list to prevent blocking the render loop.
  const { h2hReversed, winsA, winsB, draws } = useMemo(() => {
    const reversed = [];
    let wA = 0;
    let wB = 0;
    let d = 0;

    for (let i = allFights.length - 1; i >= 0; i--) {
      const f = allFights[i];
      if (!f) continue;
      const idA = f.warriorIdA;
      const idD = f.warriorIdD;
      const aIsA = idsA.has(idA);

      if (aIsA && idsB.has(idD)) {
        reversed.push(f);
        if (f.winner === 'A') wA++;
        else if (f.winner === 'D') wB++;
        else d++;
      } else if (idsA.has(idD) && idsB.has(idA)) {
        reversed.push(f);
        if (f.winner === 'D') wA++;
        else if (f.winner === 'A') wB++;
        else d++;
      }
    }

    return { h2hReversed: reversed, winsA: wA, winsB: wB, draws: d };
  }, [allFights, idsA, idsB]);

  const h2hLength = h2hReversed.length;

  return (
    <Surface variant="glass" padding="none" className="border-border/40 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary via-border/20 to-accent" />

      <div className="p-4 border-b border-white/5 bg-neutral-900/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1 px-2 rounded-none bg-arena-gold/10 border border-arena-gold/20">
            <History className="h-3.5 w-3.5 text-arena-gold" />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">
            Head-to-Head History
          </h3>
        </div>
        {h2hLength > 0 && (
          <Badge
            variant="outline"
            className="text-[9px] font-black tracking-widest uppercase border-white/10 bg-white/5 text-muted-foreground"
          >
            {h2hLength} ENGAGEMENTS
          </Badge>
        )}
      </div>

      <div className="p-6 space-y-6">
        {h2hLength === 0 ? (
          <div className="py-12 text-center flex flex-col items-center gap-4 opacity-20">
            <Swords className="h-10 w-10 text-muted-foreground" />
            <p className="text-[10px] font-black uppercase tracking-widest">
              No Historical Matchups Detected
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between font-display">
                <div className="text-left">
                  <div className="text-[8px] font-black uppercase tracking-[0.3em] text-primary mb-1">
                    Asset Alpha
                  </div>
                  <div className="text-lg font-black text-foreground leading-none">{winsA}W</div>
                </div>
                <div className="text-center opacity-20">
                  <Zap className="h-4 w-4 text-arena-gold" />
                </div>
                <div className="text-right">
                  <div className="text-[8px] font-black uppercase tracking-[0.3em] text-accent mb-1">
                    Asset Beta
                  </div>
                  <div className="text-lg font-black text-foreground leading-none">{winsB}W</div>
                </div>
              </div>

              <div className="h-2 rounded-full overflow-hidden flex bg-neutral-900 border border-white/5 shadow-inner">
                {winsA > 0 && (
                  <div
                    className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)] transition-all"
                    style={{ width: `${(winsA / h2hLength) * 100}%` }}
                  />
                )}
                {draws > 0 && (
                  <div
                    className="h-full bg-muted-foreground/20 transition-all"
                    style={{ width: `${(draws / h2hLength) * 100}%` }}
                  />
                )}
                {winsB > 0 && (
                  <div
                    className="h-full bg-accent shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)] transition-all"
                    style={{ width: `${(winsB / h2hLength) * 100}%` }}
                  />
                )}
              </div>
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {h2hReversed.map((f) => {
                const aIsStableA = idsA.has(f.warriorIdA);
                const winnerIsA =
                  (idsA.has(f.warriorIdA) && f.winner === 'A') ||
                  (idsA.has(f.warriorIdD) && f.winner === 'D');
                const winnerIsB =
                  (idsB.has(f.warriorIdA) && f.winner === 'A') ||
                  (idsB.has(f.warriorIdD) && f.winner === 'D');

                const warriorIdLeft = aIsStableA ? f.warriorIdA : f.warriorIdD;
                const warriorNameLeft = aIsStableA ? f.a : f.d;
                const warriorIdRight = aIsStableA ? f.warriorIdD : f.warriorIdA;
                const warriorNameRight = aIsStableA ? f.d : f.a;

                return (
                  <div
                    key={f.id}
                    className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 group/row hover:bg-white/5 transition-colors px-2 rounded-none"
                  >
                    <div className="text-[8px] font-mono font-black text-muted-foreground/30 w-8">
                      W{f.week}
                    </div>
                    <div
                      className={cn(
                        'flex-1 truncate text-[11px] font-black transition-colors uppercase tracking-tight',
                        winnerIsA ? 'text-primary' : 'text-muted-foreground/40'
                      )}
                    >
                      {resolveWarriorName(state, warriorIdLeft, warriorNameLeft)}
                    </div>
                    <div className="flex items-center gap-1 mx-4">
                      <Target className="h-3 w-3 text-arena-gold/40" />
                      <Badge
                        variant="outline"
                        className="text-[8px] h-4 py-0 uppercase tracking-widest border-white/10 text-muted-foreground/40 font-mono italic"
                      >
                        {f.by || 'D'}
                      </Badge>
                    </div>
                    <div
                      className={cn(
                        'flex-1 truncate text-right text-[11px] font-black transition-colors uppercase tracking-tight',
                        winnerIsB ? 'text-accent' : 'text-muted-foreground/40'
                      )}
                    >
                      {resolveWarriorName(state, warriorIdRight, warriorNameRight)}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Surface>
  );
}
