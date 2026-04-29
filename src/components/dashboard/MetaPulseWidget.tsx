import { useMemo } from 'react';
import {
  TrendingUp,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownLeft,
  Target,
  Globe,
  ChevronRight,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useGameStore, useWorldState } from '@/state/useGameStore';
import { computeMetaDrift, getMetaLabel, getMetaColor } from '@/engine/metaDrift';
import { STYLE_DISPLAY_NAMES } from '@/types/game';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function MetaPulseWidget() {
  const state = useWorldState();
  const metaDrift = useMemo(() => computeMetaDrift(state.arenaHistory), [state.arenaHistory]);

  const activeStyles = useMemo(
    () =>
      Object.entries(metaDrift)
        .filter(([, drift]) => drift !== 0)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 4),
    [metaDrift]
  );

  return (
    <Surface
      variant="glass"
      className="h-full border-border/10 group overflow-hidden relative flex flex-col"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Globe className="h-12 w-12" />
      </div>

      <div className="p-6 border-b border-white/5 bg-neutral-900/40 relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-none bg-primary/10 border border-primary/20">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-sm font-black uppercase tracking-tight">
              Divisional Pulse
            </h3>
            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
              Meta Drift Analysis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[8px] font-black uppercase tracking-widest text-primary opacity-60">
            LIVE SCAN
          </span>
        </div>
      </div>

      <div className="p-6 flex-1 relative z-10">
        {activeStyles.length === 0 ? (
          <div className="py-8 text-center opacity-20 italic">
            <p className="text-[10px] uppercase tracking-[0.2em]">Stagnant Meta Signal</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeStyles.map(([style, drift]) => (
              <div key={style} className="flex items-center justify-between group/item">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80 group-hover/item:text-primary transition-colors">
                    {STYLE_DISPLAY_NAMES[style as keyof typeof STYLE_DISPLAY_NAMES] ?? style}
                  </span>
                  <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">
                    Martial Discipline
                  </span>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[9px] font-black uppercase tracking-widest h-6 px-3 bg-white/2 cursor-help',
                        getMetaColor(drift)
                      )}
                    >
                      {drift > 0 ? (
                        <ArrowUpRight className="h-2.5 w-2.5 mr-1" />
                      ) : (
                        <ArrowDownLeft className="h-2.5 w-2.5 mr-1" />
                      )}
                      {getMetaLabel(drift)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="bg-neutral-950 border-white/10 text-[9px] font-black tracking-widest">
                    Drift Coefficient: {drift.toFixed(2)}
                  </TooltipContent>
                </Tooltip>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-white/5 bg-black/40 flex justify-center mt-auto">
        <Link
          to="/world/chronicle"
          className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground hover:text-primary transition-colors opacity-40 hover:opacity-100 flex items-center gap-2 group"
        >
          View Full Meta Report
          <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </Surface>
  );
}
