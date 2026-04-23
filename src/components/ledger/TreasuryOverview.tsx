import { useMemo } from 'react';
import { useWorldState } from '@/state/useGameStore';
import { computeWeeklyBreakdown } from '@/engine/economy';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TrendingUp,
  Skull,
  Swords,
  Wallet,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { type Warrior } from '@/types/game';
import { TreasurySparkline } from '@/components/charts/TreasurySparkline';

export function TreasuryOverview() {
  const state = useWorldState();
  const breakdown = useMemo(() => computeWeeklyBreakdown(state), [state]);
  const gold = state.treasury ?? 0;

  const activeWarriors = (state.roster ?? []).filter((w: Warrior) => w.status === 'Active');

  // ⚡ Bolt: Fast accumulation without allocating objects per iteration
  let totalWins = 0;
  let totalKills = 0;
  const roster = state.roster ?? [];
  for (let i = 0; i < roster.length; i++) {
    const w = roster[i];
    if (w) {
      totalWins += w.career.wins ?? 0;
      totalKills += w.career.kills ?? 0;
    }
  }

  const recentLedger = (state.ledger ?? []).slice(-15).reverse();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ─── Treasury Trend Sparkline ─── */}
      <TreasurySparkline height={52} />

      {/* ─── Global Treasury Matrix ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Treasury Reserve',
            value: `${gold.toLocaleString()}G`,
            icon: Wallet,
            color: 'text-arena-gold',
            variant: 'gold' as const,
            desc: 'Liquid capital available for operations and recruitment.',
          },
          {
            label: 'Active Personnel',
            value: activeWarriors.length,
            icon: Swords,
            color: 'text-primary',
            variant: 'glass' as const,
            desc: 'Total combatant assets currently on active deployment.',
          },
          {
            label: 'Total Wins',
            value: totalWins,
            icon: TrendingUp,
            color: 'text-arena-pop',
            variant: 'glass' as const,
            desc: 'Cumulative competitive victories across all career rosters.',
          },
          {
            label: 'Arena Kills',
            value: totalKills,
            icon: Skull,
            color: 'text-destructive',
            variant: 'blood' as const,
            desc: 'Final cessation incidents recorded during arena engagements.',
          },
        ].map((stat, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <Surface
                variant={stat.variant}
                padding="md"
                className="flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-all relative overflow-hidden h-32"
              >
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <stat.icon className="h-10 w-10" />
                </div>
                <stat.icon
                  className={cn(
                    'h-5 w-5 mb-3 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300',
                    stat.color
                  )}
                />
                <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground font-black mb-1 opacity-60">
                  {stat.label}
                </span>
                <span
                  className={cn(
                    'text-3xl font-display font-black leading-none drop-shadow-sm',
                    stat.color
                  )}
                >
                  {stat.value}
                </span>
              </Surface>
            </TooltipTrigger>
            <TooltipContent className="bg-neutral-950 border-white/10 text-[10px] uppercase font-black tracking-widest px-4 py-2">
              {stat.desc}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* ─── Fiscal Trajectory Monitor ─── */}
        <Surface
          variant="glass"
          className="lg:col-span-4 border-primary/10 relative overflow-hidden flex flex-col"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 via-primary/10 to-transparent" />

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-none bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-sm font-black uppercase tracking-tight">
                  Fiscal Trajectory
                </h3>
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
                  Operating Liquidity · WK {state.week.toString().padStart(2, '0')}
                </p>
              </div>
            </div>
            {breakdown.net >= 0 ? (
              <Badge className="bg-arena-pop/20 text-arena-pop border-arena-pop/30 font-black text-[9px] tracking-widest uppercase">
                Solvent
              </Badge>
            ) : (
              <Badge className="bg-destructive/20 text-destructive border-destructive/30 font-black text-[9px] tracking-widest uppercase">
                Impaired
              </Badge>
            )}
          </div>

          <div className="space-y-8 flex-1">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-3 w-3 text-arena-pop" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  Revenue Streams
                </span>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              <div className="space-y-2">
                {breakdown.income.map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center group/item hover:bg-white/2 p-1.5 rounded transition-colors"
                  >
                    <span className="text-[11px] font-medium text-foreground/70 group-hover/item:text-foreground">
                      {item.label}
                    </span>
                    <span className="text-arena-pop font-mono font-black text-xs">
                      +{item.amount}G
                    </span>
                  </div>
                ))}
                {breakdown.income.length === 0 && (
                  <p className="text-[10px] text-muted-foreground/30 italic uppercase tracking-widest py-2 text-center">
                    No active revenue
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ArrowDownRight className="h-3 w-3 text-destructive" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  Operational Costs
                </span>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              <div className="space-y-2">
                {breakdown.expenses.map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center group/item hover:bg-white/2 p-1.5 rounded transition-colors"
                  >
                    <span className="text-[11px] font-medium text-foreground/70 group-hover/item:text-foreground">
                      {item.label}
                    </span>
                    <span className="text-destructive font-mono font-black text-xs">
                      -{item.amount}G
                    </span>
                  </div>
                ))}
                {breakdown.expenses.length === 0 && (
                  <p className="text-[10px] text-muted-foreground/30 italic uppercase tracking-widest py-2 text-center">
                    No active debits
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5">
            <Surface
              variant="paper"
              padding="sm"
              className="bg-black/40 border border-white/5 flex justify-between items-center group hover:border-primary/30 transition-all"
            >
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.3em] opacity-40">
                  Weekly Net Flux
                </span>
                <span className="text-xs font-black uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">
                  Projected Net
                </span>
              </div>
              <div
                className={cn(
                  'text-2xl font-mono font-black drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]',
                  breakdown.net >= 0 ? 'text-arena-pop' : 'text-destructive'
                )}
              >
                {breakdown.net >= 0 ? '+' : ''}
                {breakdown.net}G
              </div>
            </Surface>
          </div>
        </Surface>

        {/* ─── High-Fidelity Ledger Chronicle ─── */}
        <Surface
          variant="glass"
          padding="none"
          className="lg:col-span-8 border-border/10 flex flex-col relative overflow-hidden h-[500px]"
        >
          <div className="p-8 border-b border-white/5 bg-neutral-900/40 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-none bg-secondary/20 border border-white/5">
                <History className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-display text-base font-black uppercase tracking-tight">
                  Ledger Registry
                </h3>
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
                  Audited Transaction History · {state.ledger?.length ?? 0} entries
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-arena-gold animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-widest text-arena-gold opacity-60">
                Verified by Scribes
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
            {recentLedger.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-20 group">
                <Wallet className="h-16 w-16 mb-4 group-hover:scale-110 transition-transform duration-500" />
                <p className="text-sm font-display font-black uppercase tracking-[0.3em]">
                  Registry Empty
                </p>
                <p className="text-[10px] lowercase italic opacity-80 mt-2 font-medium">
                  Bout engagement required for transaction logging...
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-black/20 sticky top-0 z-10 backdrop-blur-md border-b border-white/5">
                  <TableRow className="hover:bg-transparent border-white/5">
                    <TableHead className="w-24 font-black uppercase text-[10px] tracking-widest pl-8">
                      INDEX
                    </TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground/60">
                      DESCRIPTION
                    </TableHead>
                    <TableHead className="text-right font-black uppercase text-[10px] tracking-widest pr-8">
                      DISBURSEMENT
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLedger.map((entry, i) => (
                    <TableRow
                      key={i}
                      className="border-white/5 group hover:bg-white/2 transition-colors"
                    >
                      <TableCell className="pl-8 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-mono font-black text-muted-foreground opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all">
                            WK {entry.week.toString().padStart(2, '0')}
                          </span>
                          <div className="h-1 w-1 rounded-full bg-white/5 group-hover:bg-primary transition-colors" />
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-xs font-black uppercase tracking-widest text-foreground/80 group-hover:text-foreground transition-all">
                          {entry.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-8 py-4">
                        <div
                          className={cn(
                            'font-mono text-sm font-black tracking-tighter drop-shadow-[0_0_5px_rgba(0,0,0,0.5)]',
                            entry.amount >= 0 ? 'text-arena-pop' : 'text-destructive'
                          )}
                        >
                          {entry.amount >= 0 ? '+' : ''}
                          {entry.amount.toLocaleString()}G
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="p-4 border-t border-white/5 bg-black/40 flex justify-center">
            <button
              aria-label="Access Full Archive"
              className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground hover:text-primary transition-colors opacity-40 hover:opacity-100 flex items-center gap-2 group"
            >
              Access Full Archive{' '}
              <ArrowDownRight className="h-3 w-3 group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
        </Surface>
      </div>
    </div>
  );
}
