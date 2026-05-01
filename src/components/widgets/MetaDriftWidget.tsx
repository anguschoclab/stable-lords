import { useMemo } from 'react';
import { useWorldState } from '@/state/useGameStore';
import { FightingStyle, STYLE_DISPLAY_NAMES } from '@/types/game';
import { computeMetaDrift, getMetaLabel, getMetaColor } from '@/engine/metaDrift';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { Activity, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function MetaDriftWidget() {
  const state = useWorldState();

  const meta = useMemo(() => computeMetaDrift(state.arenaHistory || []), [state.arenaHistory]);

  const sortedStyles = useMemo(() => {
    return Object.entries(meta)
      .map(([style, drift]) => ({
        style: style as FightingStyle,
        drift,
        label: getMetaLabel(drift),
        color: getMetaColor(drift),
      }))
      .sort((a, b) => b.drift - a.drift);
  }, [meta]);

  return (
    <Surface variant="glass" className="h-full border-white/5 bg-white/[0.01]">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ImperialRing size="xs" variant="bronze">
            <Activity className="h-3 w-3 text-primary" />
          </ImperialRing>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">
            Style Meta Drift
          </span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground/40 cursor-help hover:text-foreground transition-colors" />
            </TooltipTrigger>
            <TooltipContent className="bg-black border-white/10 text-[9px] uppercase font-black tracking-widest p-3 rounded-none">
              Tracks winning trends over the last 20 bouts.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-4">
          {sortedStyles.map((item) => {
            const absDrift = Math.abs(item.drift);
            const percentage = (absDrift / 10) * 100;
            const isPositive = item.drift > 0;
            const isNeutral = item.drift === 0;

            return (
              <div key={item.style} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3 text-primary" />
                    ) : isNeutral ? (
                      <Minus className="h-3 w-3 text-muted-foreground/40" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-destructive" />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 group-hover:text-foreground transition-colors">
                      {STYLE_DISPLAY_NAMES[item.style]}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[8px] font-black uppercase py-0 px-2 h-4 rounded-none border-white/5',
                      isPositive ? 'text-primary' : 'text-muted-foreground/40'
                    )}
                  >
                    {item.label}
                  </Badge>
                </div>
                <div className="relative h-1 w-full bg-white/5 overflow-hidden">
                  <div
                    className={cn(
                      'absolute h-full transition-all duration-1000',
                      isPositive
                        ? 'bg-primary right-1/2'
                        : isNeutral
                          ? 'bg-muted-foreground/20 left-1/2 w-0'
                          : 'bg-destructive left-1/2'
                    )}
                    style={{ width: `${percentage / 2}%` }}
                  />
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10 z-10" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-6 border-t border-white/5">
          <p className="text-[9px] text-muted-foreground/40 leading-relaxed italic uppercase font-black tracking-tight">
            Institutional meta-cycles occur every 20 engagements. Adaptive stables pivot training to
            exploit declining tactical archetypes.
          </p>
        </div>
      </div>
    </Surface>
  );
}
