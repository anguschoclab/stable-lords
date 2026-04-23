import { useMemo } from 'react';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Activity, Binary, Search, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface MetaAnalyticsProps {
  allFights: import('@/types/game').FightSummary[];
}

const TACTICAL_STYLES = ['Brawler', 'Technician', 'High-Flyer', 'Powerhouse', 'Grappler'];

export function TacticalStyleAnalysis({ allFights }: MetaAnalyticsProps) {
  // ⚡ Bolt: Reduced O(S * N) repeated filter calls to O(N) single-pass aggregation and memoized result
  const stats = useMemo(() => {
    const agg: Record<string, { wins: number; total: number }> = {};
    for (const s of TACTICAL_STYLES) agg[s] = { wins: 0, total: 0 };

    for (let i = 0; i < allFights.length; i++) {
      const f = allFights[i];
      if (!f) continue;
      const wStyle = f.winner === 'A' ? f.styleA : f.winner === 'D' ? f.styleD : null;
      const lStyle = f.winner === 'A' ? f.styleD : f.winner === 'D' ? f.styleA : null;

      if (wStyle && agg[wStyle]) {
        agg[wStyle].wins++;
        agg[wStyle].total++;
      }
      if (lStyle && agg[lStyle]) {
        agg[lStyle].total++;
      }
    }

    return TACTICAL_STYLES.map((style) => {
      const { wins, total } = agg[style] || { wins: 0, total: 0 };
      const rate = total > 0 ? (wins / total) * 100 : 0;
      return { style, wins, total, rate };
    }).sort((a, b) => b.rate - a.rate);
  }, [allFights]);

  return (
    <Surface
      variant="glass"
      className="border-border/10 bg-neutral-900/40 relative overflow-hidden h-full"
    >
      <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
        <Activity className="h-24 w-24 text-primary" />
      </div>

      <div className="flex items-center gap-4 mb-8 relative z-10">
        <div className="p-2.5 rounded-none bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display text-base font-black uppercase tracking-tight">
            Combat_Flow_Analysis
          </h3>
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
            Style_Efficiency // Meta_Pulse
          </p>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        {stats.map((s, idx) => (
          <div key={s.style} className="space-y-2.5 group">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono font-black text-white/20">0{idx + 1}</span>
                <span className="text-xs font-black uppercase tracking-widest text-foreground/80 group-hover:text-primary transition-colors">
                  {s.style}
                </span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono font-black text-primary/60 group-hover:text-primary transition-colors">
                      {s.rate.toFixed(1)}%
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[8px] font-mono font-black border-white/5 bg-white/5 text-muted-foreground/60 h-5 px-2"
                    >
                      {s.wins} / {s.total}
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-neutral-950 border-white/10 text-[9px] font-black tracking-widest">
                  Win Density: {s.wins} Wins in {s.total} Registered Bouts
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.rate}%` }}
                transition={{ duration: 1, delay: idx * 0.1 }}
                className={cn(
                  'h-full transition-all duration-1000',
                  s.rate > 55
                    ? 'bg-arena-pop shadow-[0_0_10px_rgba(var(--arena-pop-rgb),0.4)]'
                    : s.rate > 45
                      ? 'bg-primary'
                      : 'bg-muted-foreground/40'
                )}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between opacity-40 hover:opacity-80 transition-opacity">
        <div className="flex items-center gap-2">
          <Search className="h-3 w-3" />
          <span className="text-[8px] font-black uppercase tracking-widest">
            Global_Sample: {allFights.length} Bouts
          </span>
        </div>
        <span className="text-[8px] font-black uppercase tracking-[0.3em]">SYNCHRONIZED_META</span>
      </div>
    </Surface>
  );
}

export function StyleMatchupHeatmap({ allFights }: MetaAnalyticsProps) {
  // ⚡ Bolt: Reduced O(S^2 * N) nested filtering to O(N) single-pass aggregation and memoized result
  const matchupStats = useMemo(() => {
    const agg: Record<string, Record<string, { wins: number; total: number }>> = {};
    for (const f of allFights || []) {
      const wStyle = f.winner === 'A' ? f.styleA : f.winner === 'D' ? f.styleD : null;
      const lStyle = f.winner === 'A' ? f.styleD : f.winner === 'D' ? f.styleA : null;
      if (!wStyle || !lStyle) continue;

      if (!agg[wStyle]) agg[wStyle] = {};
      if (!agg[wStyle][lStyle]) agg[wStyle][lStyle] = { wins: 0, total: 0 };
      agg[wStyle][lStyle].wins++;
      agg[wStyle][lStyle].total++;

      if (!agg[lStyle]) agg[lStyle] = {};
      if (!agg[lStyle][wStyle]) agg[lStyle][wStyle] = { wins: 0, total: 0 };
      agg[lStyle][wStyle].total++;
    }
    return agg;
  }, [allFights]);

  return (
    <Surface
      variant="glass"
      className="border-border/10 bg-neutral-900/40 relative overflow-hidden h-full"
    >
      <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
        <LayoutGrid className="h-24 w-24 text-arena-gold" />
      </div>

      <div className="flex items-center gap-4 mb-8 relative z-10">
        <div className="p-2.5 rounded-none bg-arena-gold/10 border border-arena-gold/20 shadow-[0_0_15px_rgba(255,215,0,0.1)]">
          <Binary className="h-5 w-5 text-arena-gold" />
        </div>
        <div>
          <h3 className="font-display text-base font-black uppercase tracking-tight">
            Matchup_Dynamic_Registry
          </h3>
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
            Style_Interactions // Kinetic_Heatmap
          </p>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar relative z-10">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2"></th>
              {TACTICAL_STYLES.map((s) => (
                <th
                  key={s}
                  className="p-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 text-center w-16 group/header"
                >
                  <div className="rotate-45 mb-4 group-hover/header:text-primary transition-colors">
                    {s}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TACTICAL_STYLES.map((rowStyle) => (
              <tr key={rowStyle} className="group/row">
                <td className="p-2 text-[10px] font-black uppercase tracking-widest text-foreground/60 text-right pr-4 group-hover/row:text-arena-gold transition-colors">
                  {rowStyle}
                </td>
                {TACTICAL_STYLES.map((colStyle) => {
                  const data = matchupStats[rowStyle]?.[colStyle] || { wins: 0, total: 0 };
                  const rate = data.total > 0 ? (data.wins / data.total) * 100 : 50;
                  const isNeutral = data.total === 0;
                  const wins = data.wins;
                  const matchesLength = data.total;

                  return (
                    <td key={colStyle} className="p-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'h-10 w-full rounded-none border border-white/5 transition-all duration-500 cursor-help',
                              isNeutral
                                ? 'bg-white/[0.02] opacity-20'
                                : rate > 65
                                  ? 'bg-arena-pop/40 border-arena-pop/40 shadow-[inset_0_0_10px_rgba(var(--arena-pop-rgb),0.2)]'
                                  : rate > 55
                                    ? 'bg-arena-pop/20 border-arena-pop/20'
                                    : rate > 45
                                      ? 'bg-primary/20 border-primary/20'
                                      : rate > 35
                                        ? 'bg-destructive/20 border-destructive/20'
                                        : 'bg-destructive/40 border-destructive/40 shadow-[inset_0_0_10px_rgba(255,0,0,0.2)]'
                            )}
                          >
                            {!isNeutral && (
                              <div className="h-full w-full flex items-center justify-center">
                                <span className="text-[10px] font-mono font-black text-white/60">
                                  {rate.toFixed(0)}
                                </span>
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-neutral-950 border-white/10 text-[9px] font-black tracking-widest">
                          {rowStyle} vs {colStyle}: {rate.toFixed(1)}% Win Rate ({wins}/
                          {matchesLength})
                        </TooltipContent>
                      </Tooltip>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex items-center justify-center gap-6 opacity-40 text-[8px] font-black uppercase tracking-widest relative z-10">
        <div className="flex items-center gap-1.5 text-arena-pop">
          <div className="h-2 w-2 rounded-none bg-arena-pop/40" /> Superior
        </div>
        <div className="flex items-center gap-1.5 text-primary">
          <div className="h-2 w-2 rounded-none bg-primary/40" /> Neutral
        </div>
        <div className="flex items-center gap-1.5 text-destructive">
          <div className="h-2 w-2 rounded-none bg-destructive/40" /> Vulnerable
        </div>
      </div>
    </Surface>
  );
}
