import React, { useMemo } from "react";
import { Coins, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useGameStore } from "@/state/useGameStore";
import { computeWeeklyBreakdown } from "@/engine/economy";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function FinancesWidget() {
  const { state } = useGameStore();
  const breakdown = useMemo(() => computeWeeklyBreakdown(state), [state]);
  const gold = state.gold ?? 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <Coins className="h-4 w-4 text-arena-gold" /> Finances
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center">
          <div className="text-3xl font-bold text-arena-gold">{gold}g</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Treasury</div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-md bg-secondary/60 p-2 border border-border/50">
            <div className="text-sm font-semibold text-arena-pop flex items-center justify-center gap-0.5">
              <ArrowUpRight className="h-3 w-3" /> {breakdown.totalIncome}g
            </div>
            <div className="text-[10px] text-muted-foreground">Income</div>
          </div>
          <div className="rounded-md bg-secondary/60 p-2 border border-border/50">
            <div className="text-sm font-semibold text-destructive flex items-center justify-center gap-0.5">
              <ArrowDownRight className="h-3 w-3" /> {breakdown.totalExpenses}g
            </div>
            <div className="text-[10px] text-muted-foreground">Expenses</div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-1 border-t border-border/50">
          <span className="text-xs text-muted-foreground">Net / week</span>
          <span className={`text-sm font-mono font-bold ${breakdown.net >= 0 ? "text-arena-pop" : "text-destructive"}`}>
            {breakdown.net >= 0 ? "+" : ""}{breakdown.net}g
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
