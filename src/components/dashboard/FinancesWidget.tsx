import { useMemo } from 'react';
import { Coins, ArrowUpRight, ArrowDownRight, Wallet, TrendingUp } from 'lucide-react';
import { useWorldState } from '@/state/useGameStore';
import { computeWeeklyBreakdown } from '@/engine/economy';
import { Surface } from '@/components/ui/Surface';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function FinancesWidget() {
  const state = useWorldState();
  const breakdown = useMemo(() => computeWeeklyBreakdown(state), [state]);
  const treasury = state.treasury ?? 0;

  return (
    <Surface variant="glass" className="h-full border-border/10 group overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Wallet className="h-12 w-12" />
      </div>

      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-2 rounded-none bg-arena-gold/10 border border-arena-gold/20">
          <Coins className="h-4 w-4 text-arena-gold" />
        </div>
        <div>
          <h3 className="font-display text-sm font-black uppercase tracking-tight">FISCAL CORE</h3>
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
            OPERATING LIQUIDITY MONITOR
          </p>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        <div className="flex flex-col items-center justify-center py-4 bg-black/20 rounded-none border border-white/5 shadow-inner">
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground opacity-40 mb-1">
            TOTAL RESERVE
          </span>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-display font-black text-white selection:bg-arena-gold/30 drop-shadow-[0_0_15px_rgba(255,215,0,0.1)]">
              {Math.round(treasury).toLocaleString()}
            </span>
            <span className="text-xs font-black text-arena-gold opacity-60">G</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-arena-pop/5 border border-arena-pop/10 rounded-none p-3 group/stat hover:bg-arena-pop/10 transition-colors cursor-help">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowUpRight className="h-3 w-3 text-arena-pop opacity-60 group-hover/stat:opacity-100 transition-opacity" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                    INFLOW
                  </span>
                </div>
                <div className="text-base font-mono font-black text-arena-pop">
                  +{breakdown.totalIncome}G
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-neutral-950 border-white/10 text-[9px] font-black tracking-widest">
              Arena Payouts & Marketplace Revenue
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-destructive/5 border border-destructive/10 rounded-none p-3 group/stat hover:bg-destructive/10 transition-colors cursor-help">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowDownRight className="h-3 w-3 text-destructive opacity-60 group-hover/stat:opacity-100 transition-opacity" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                    OUTFLOW
                  </span>
                </div>
                <div className="text-base font-mono font-black text-destructive">
                  -{breakdown.totalExpenses}G
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-neutral-950 border-white/10 text-[9px] font-black tracking-widest">
              Personnel Salaries & Upkeep
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3 w-3 text-muted-foreground opacity-40" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              WEEKLY FLUX
            </span>
          </div>
          <div
            className={cn(
              'text-xs font-mono font-black drop-shadow-sm',
              breakdown.net >= 0 ? 'text-arena-pop' : 'text-destructive'
            )}
          >
            {breakdown.net >= 0 ? '+' : ''}
            {breakdown.net}G
          </div>
        </div>
      </div>
    </Surface>
  );
}
