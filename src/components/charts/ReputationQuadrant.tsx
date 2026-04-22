/**
 * ReputationQuadrant — 2D scatter: Fame (X) vs Notoriety (Y)
 * Shows player stable vs rival stables in reputation space.
 */
import { useMemo } from 'react';
import { useGameStore, useWorldState } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '@/lib/utils';
import { computeStableReputation, computeRivalReputation } from '@/engine/stableReputation';
import { Surface } from '@/components/ui/Surface';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface QuadrantDot {
  label: string;
  fame: number;
  notoriety: number;
  isPlayer: boolean;
}

export function ReputationQuadrant({ className }: { className?: string }) {
  const worldState = useWorldState();
  const { rivals } = useGameStore(useShallow((s) => ({ rivals: s.rivals })));

  const dots = useMemo<QuadrantDot[]>(() => {
    const playerRep = computeStableReputation(worldState);
    const result: QuadrantDot[] = [
      {
        label: worldState.player?.stableName ?? 'Your Stable',
        fame: playerRep.fame,
        notoriety: playerRep.notoriety,
        isPlayer: true,
      },
    ];
    for (const rival of rivals ?? []) {
      const rep = computeRivalReputation(
        rival.roster,
        worldState.arenaHistory,
        rival.owner.stableName
      );
      result.push({
        label: rival.owner.stableName,
        fame: rep.fame,
        notoriety: rep.notoriety,
        isPlayer: false,
      });
    }
    return result;
  }, [worldState, rivals]);

  return (
    <Surface variant="glass" className={cn('p-4 flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
          Reputation Quadrant
        </span>
        <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-none bg-primary inline-block" /> You
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-none bg-white/20 inline-block" /> Rivals
          </span>
        </div>
      </div>

      {/* Plot area */}
      <div className="relative w-full aspect-square bg-white/[0.02] border border-white/5 rounded-none overflow-hidden">
        {/* Quadrant lines */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/5" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5" />
        </div>

        {/* Axis labels */}
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-widest text-muted-foreground/30">
          Fame →
        </span>
        <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 [writing-mode:vertical-rl] rotate-180">
          Notoriety →
        </span>

        {/* Quadrant labels */}
        <span className="absolute top-2 left-2 text-[7px] font-black uppercase tracking-widest text-destructive/30">
          Feared
        </span>
        <span className="absolute top-2 right-2 text-[7px] font-black uppercase tracking-widest text-arena-gold/30">
          Legendary
        </span>
        <span className="absolute bottom-2 left-2 text-[7px] font-black uppercase tracking-widest text-muted-foreground/20">
          Unknown
        </span>
        <span className="absolute bottom-2 right-2 text-[7px] font-black uppercase tracking-widest text-primary/30">
          Celebrated
        </span>

        {/* Dots */}
        <TooltipProvider>
          {dots.map((dot, i) => {
            const x = dot.fame; // 0-100 → 0-100%
            const y = 100 - dot.notoriety; // flip Y so high notoriety = top

            return (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'absolute w-3 h-3 rounded-none -translate-x-1/2 -translate-y-1/2 cursor-default transition-transform hover:scale-150',
                      dot.isPlayer
                        ? 'bg-primary shadow-[0_0_8px_rgba(255,0,0,0.6)] z-10'
                        : 'bg-white/30 hover:bg-white/50'
                    )}
                    style={{ left: `${x}%`, top: `${y}%` }}
                  />
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="text-[9px] font-black uppercase tracking-widest bg-neutral-950 border-white/10 rounded-none"
                >
                  <div className="font-black text-foreground">{dot.label}</div>
                  <div className="text-muted-foreground/60 mt-0.5">
                    Fame {dot.fame} · Notoriety {dot.notoriety}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
    </Surface>
  );
}
