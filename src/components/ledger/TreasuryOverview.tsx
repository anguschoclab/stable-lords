import React, { useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { computeWeeklyBreakdown } from "@/engine/economy";
import { Surface } from "@/components/ui/Surface";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Coins, FileText, TrendingUp, Skull, Swords, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function TreasuryOverview() {
  const { state } = useGameStore();
  const breakdown = useMemo(() => computeWeeklyBreakdown(state), [state]);
  const gold = state.gold ?? 0;
  
  const activeWarriors = state.roster.filter(w => w.status === "Active");
  const { wins: totalWins, kills: totalKills } = state.roster.reduce(
    (acc, w) => ({
      wins: acc.wins + w.career.wins,
      kills: acc.kills + w.career.kills,
    }),
    { wins: 0, kills: 0 }
  );

  const recentLedger = (state.ledger ?? []).slice(-10).reverse();

  return (
    <div className="space-y-6">
      {/* ─── High-Level Metrics ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Treasury", value: `${gold.toLocaleString()}G`, icon: Coins, color: "text-arena-gold", variant: "gold" as const },
          { label: "Active Roster", value: activeWarriors.length, icon: Swords, color: "text-primary", variant: "glass" as const },
          { label: "Total Victories", value: totalWins, icon: TrendingUp, color: "text-arena-pop", variant: "glass" as const },
          { label: "Fatalities", value: totalKills, icon: Skull, color: "text-destructive", variant: "blood" as const },
        ].map((stat, i) => (
          <Surface key={i} variant={stat.variant} padding="sm" className="flex flex-col items-center justify-center text-center group">
            <stat.icon className={cn("h-4 w-4 mb-2 opacity-50 group-hover:opacity-100 transition-opacity", stat.color)} />
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black mb-1">{stat.label}</span>
            <span className={cn("text-2xl font-mono font-black leading-none", stat.color === "text-foreground" ? "" : stat.color)}>
              {stat.value}
            </span>
          </Surface>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Weekly Projection ─── */}
        <Surface variant="glass" className="lg:col-span-1 border-primary/10">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="font-display text-sm font-black uppercase tracking-tight">Weekly Projection</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center justify-between">
                <span>Current Income</span>
                <span className="h-px flex-1 bg-border/30 mx-2" />
              </h4>
              {breakdown.income.map((item, i) => (
                <div key={i} className="flex justify-between text-xs py-1">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="text-arena-pop font-mono font-bold">+{item.amount}g</span>
                </div>
              ))}
              {breakdown.income.length === 0 && <p className="text-[10px] text-muted-foreground italic">No active revenue streams</p>}
            </div>

            <div>
              <h4 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center justify-between">
                <span>Current Expenses</span>
                <span className="h-px flex-1 bg-border/30 mx-2" />
              </h4>
              {breakdown.expenses.map((item, i) => (
                <div key={i} className="flex justify-between text-xs py-1">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="text-destructive font-mono font-bold">-{item.amount}g</span>
                </div>
              ))}
              {breakdown.expenses.length === 0 && <p className="text-[10px] text-muted-foreground italic">No fixed costs</p>}
            </div>

            <div className="pt-2 border-t border-border/40">
              <div className="flex justify-between items-center text-sm font-black uppercase tracking-tight">
                <span>Net Flux</span>
                <span className={cn("font-mono text-lg", breakdown.net >= 0 ? "text-arena-pop" : "text-destructive")}>
                  {breakdown.net >= 0 ? "+" : ""}{breakdown.net}g
                </span>
              </div>
            </div>
          </div>
        </Surface>

        {/* ─── Transaction History ─── */}
        <Surface variant="glass" padding="none" className="lg:col-span-2 border-border/20">
          <div className="p-6 pb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-display text-sm font-black uppercase tracking-tight whitespace-nowrap">Ledger Chronicle</h3>
            <div className="h-px w-full bg-border/20" />
          </div>
          
          <div className="overflow-x-auto">
            {recentLedger.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-[10px] uppercase tracking-widest opacity-40">
                The pages are empty. Run bouts to generate records.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/20">
                    <TableHead className="w-16 font-black uppercase text-[10px] tracking-widest">Week</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Registry Entry</TableHead>
                    <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Disbursement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLedger.map((entry, i) => (
                    <TableRow key={i} className="border-border/10">
                      <TableCell className="font-mono text-[10px] font-black text-muted-foreground">WK_{entry.week.toString().padStart(2, '0')}</TableCell>
                      <TableCell className="text-xs font-medium text-foreground/80">{entry.label}</TableCell>
                      <TableCell className={cn("text-right font-mono text-xs font-black", entry.amount >= 0 ? "text-arena-pop" : "text-destructive")}>
                        {entry.amount >= 0 ? "+" : ""}{entry.amount}g
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Surface>
      </div>
    </div>
  );
}
