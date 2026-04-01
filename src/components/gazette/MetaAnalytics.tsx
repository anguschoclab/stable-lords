import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, Grid3X3, Zap, Shield, Swords, Info } from "lucide-react";
import { Surface } from "@/components/ui/Surface";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { FightSummary } from "@/types/game";
import { cn } from "@/lib/utils";

interface MetaAnalyticsProps {
  allFights: FightSummary[];
}

export function TacticalStyleAnalysis({ allFights }: MetaAnalyticsProps) {
  const meta = useMemo(() => {
    const m: Record<string, { w: number; l: number; k: number; fights: number }> = {};
    const ensure = (s: string) => {
      if (!m[s]) m[s] = { w: 0, l: 0, k: 0, fights: 0 };
    };
    for (const f of allFights) {
      ensure(f.styleA);
      ensure(f.styleD);
      m[f.styleA].fights++;
      m[f.styleD].fights++;
      if (f.winner === "A") { m[f.styleA].w++; m[f.styleD].l++; }
      else if (f.winner === "D") { m[f.styleD].w++; m[f.styleA].l++; }
      if (f.by === "Kill") {
        if (f.winner === "A") m[f.styleA].k++;
        else if (f.winner === "D") m[f.styleD].k++;
      }
    }
    return Object.entries(m)
      .map(([style, d]) => ({ style, ...d, pct: d.fights > 0 ? d.w / d.fights : 0 }))
      .sort((a, b) => b.fights - a.fights);
  }, [allFights]);

  if (meta.length === 0) return null;

  const maxFights = Math.max(...meta.map((m) => m.fights), 1);

  return (
    <Surface variant="glass" padding="none" className="border-border/40 overflow-hidden">
      <div className="p-6 border-b border-white/5 bg-primary/5 flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-base font-display font-black uppercase tracking-tight flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Tactical Style Analysis
          </h3>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-60">
            DATASET: {allFights.length} REGISTERED BOUTS // GLOBAL AGGREGATE
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-[10px] p-3 leading-relaxed font-medium">
            Style Analysis tracks the win-loss percentage and lethality of every fighting style across the entire history of the arena.
          </TooltipContent>
        </Tooltip>
      </div>
      
      <div className="p-6 space-y-6">
        {meta.map((s) => {
          const winPct = (s.pct * 100).toFixed(0);
          const usageWidth = (s.fights / maxFights) * 100;
          return (
            <div key={s.style} className="space-y-3 group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-display font-black uppercase text-foreground group-hover:text-primary transition-colors tracking-tight">{s.style}</span>
                <div className="flex items-center gap-4 text-[9px] font-mono font-black text-muted-foreground/60">
                  <span className="bg-secondary/40 px-2 py-0.5 rounded border border-border/20">{s.fights} BOUTS</span>
                  <span className="text-primary font-black uppercase tracking-widest">{winPct}% WIN_RATE</span>
                  {s.k > 0 && <span className="text-destructive font-black uppercase tracking-widest">{s.k} FATALITIES</span>}
                </div>
              </div>
              <div className="h-2.5 bg-secondary/10 rounded-full overflow-hidden flex shadow-inner relative border border-white/5" style={{ width: `${usageWidth}%`, minWidth: "6rem" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${s.pct * 100}%` }}
                  className="h-full bg-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.5)] relative z-10"
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(1 - s.pct) * 100}%` }}
                  className="h-full bg-secondary/80"
                />
              </div>
            </div>
          );
        })}
      </div>
    </Surface>
  );
}

export function StyleMatchupHeatmap({ allFights }: MetaAnalyticsProps) {
  const { styles, matrix } = useMemo(() => {
    const m = new Map<string, Map<string, { wins: number; total: number }>>();
    const styleSet = new Set<string>();

    for (const f of allFights) {
      styleSet.add(f.styleA);
      styleSet.add(f.styleD);

      if (!m.has(f.styleA)) m.set(f.styleA, new Map());
      if (!m.has(f.styleD)) m.set(f.styleD, new Map());

      const adEntry = m.get(f.styleA)!.get(f.styleD) ?? { wins: 0, total: 0 };
      const daEntry = m.get(f.styleD)!.get(f.styleA) ?? { wins: 0, total: 0 };
      adEntry.total++;
      daEntry.total++;
      if (f.winner === "A") adEntry.wins++;
      else if (f.winner === "D") daEntry.wins++;
      m.get(f.styleA)!.set(f.styleD, adEntry);
      m.get(f.styleD)!.set(f.styleA, daEntry);
    }

    const styles = [...styleSet].sort();
    return { styles, matrix: m };
  }, [allFights]);

  if (styles.length < 2) return null;

  function cellColor(pct: number): string {
    if (pct >= 0.7) return "bg-primary text-primary-foreground";
    if (pct >= 0.55) return "bg-primary/40 text-foreground";
    if (pct >= 0.45) return "bg-muted text-muted-foreground";
    if (pct >= 0.3) return "bg-destructive/30 text-foreground";
    return "bg-destructive text-destructive-foreground";
  }

  return (
    <Surface variant="glass" padding="none" className="border-border/40 overflow-hidden">
      <div className="p-6 border-b border-white/5 bg-primary/5">
        <h3 className="text-base font-display font-black uppercase tracking-tight flex items-center gap-2">
          <Grid3X3 className="h-4 w-4 text-primary" /> 
          Dominance Coefficient Matrix
        </h3>
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-60">
          ROW_STYLE WIN% VS COLUMN_STYLE // RELATIVE BIAS
        </p>
      </div>
      
      <div className="p-6 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/20 sticky left-0 bg-neutral-900 z-10">VS ↓</th>
              {styles.map((s) => (
                <th key={s} className="p-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center border-b border-border/20 min-w-[2.5rem] whitespace-nowrap">
                  <div className="vertical-text py-2">{s}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {styles.map((rowStyle) => (
              <tr key={rowStyle} className="group">
                <td className="p-2 text-[10px] font-black uppercase tracking-widest text-foreground group-hover:text-primary transition-colors border-r border-border/20 sticky left-0 bg-neutral-900 z-10 whitespace-nowrap">
                  {rowStyle}
                </td>
                {styles.map((colStyle) => {
                  if (rowStyle === colStyle) {
                    return <td key={colStyle} className="p-1"><div className="w-full h-8 rounded-sm bg-border/20 border border-white/5" /></td>;
                  }
                  const entry = matrix.get(rowStyle)?.get(colStyle);
                  if (!entry || entry.total === 0) {
                    return <td key={colStyle} className="p-1"><div className="w-full h-8 rounded-sm text-muted-foreground/20 italic flex items-center justify-center text-[8px]">n/a</div></td>;
                  }
                  const pct = entry.wins / entry.total;
                  return (
                    <td key={colStyle} className="p-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={cn(
                            "w-full h-8 rounded-sm flex items-center justify-center font-mono text-[10px] font-black border border-white/10 cursor-default hover:scale-110 transition-transform",
                            cellColor(pct)
                          )}>
                            {Math.round(pct * 100)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[10px] p-2 bg-neutral-950 border-primary/20">
                          <span className="font-black text-primary uppercase">{rowStyle}</span> VS <span className="font-black text-foreground uppercase">{colStyle}</span>
                          <div className="mt-1 font-mono font-bold">{entry.wins}W / {entry.total} TOTAL ({Math.round(pct * 100)}%)</div>
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
    </Surface>
  );
}
