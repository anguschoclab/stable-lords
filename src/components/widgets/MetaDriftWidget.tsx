import { useMemo } from 'react';
import { useGameStore, useWorldState } from '@/state/useGameStore';
import { FightingStyle, STYLE_DISPLAY_NAMES } from '@/types/game';
import { computeMetaDrift, getMetaLabel, getMetaColor } from '@/engine/metaDrift';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
    <Card className="h-full border-t-2 border-t-accent/30 shadow-lg bg-gradient-to-b from-card to-secondary/10">
      <CardHeader className="pb-2 border-b border-border/40">
        <CardTitle className="text-sm font-display font-black flex items-center justify-between uppercase tracking-tighter">
          <span className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-accent" /> Style Meta Drift
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="w-full max-w-xs text-[10px] leading-relaxed">
                Tracks winning/losing trends over the last 20 bouts. Dominant styles gain subtle
                momentum bonuses.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="space-y-3">
          {sortedStyles.map((item) => {
            const absDrift = Math.abs(item.drift);
            const percentage = (absDrift / 10) * 100;
            const isPositive = item.drift > 0;
            const isNeutral = item.drift === 0;

            return (
              <div key={item.style} className="group">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3 text-arena-gold" />
                    ) : isNeutral ? (
                      <Minus className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-destructive" />
                    )}
                    <span className="text-[11px] font-bold uppercase tracking-tight group-hover:text-primary transition-colors">
                      {STYLE_DISPLAY_NAMES[item.style]}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn('text-[8px] font-black uppercase py-0 px-1.5 h-4', item.color)}
                  >
                    {item.label}
                  </Badge>
                </div>
                <div className="relative h-1 w-full bg-secondary/50 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'absolute h-full transition-all duration-1000',
                      isPositive
                        ? 'bg-arena-gold right-1/2 mr-0'
                        : isNeutral
                          ? 'bg-muted-foreground left-1/2 ml-0 w-0'
                          : 'bg-destructive left-1/2 ml-0'
                    )}
                    style={{ width: `${percentage / 2}%` }}
                  />
                  {/* Center line */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border/60 z-10" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-border/30">
          <p className="text-[9px] text-muted-foreground leading-tight italic">
            Meta shifts every 20 bouts. Adapt your stable's training to exploit declining styles.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
