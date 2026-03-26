import React, { useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, TrendingDown, TrendingUp, Wallet, ArrowRightLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function TreasuryWidget() {
  const { state } = useGameStore();

  const finance = useMemo(() => {
    const upkeep = state.roster.length * 5 + state.trainers.length * 15;
    const surplus = state.player.funds - upkeep;
    
    // Last week's profit? (Search ledger)
    const lastWeek = state.week - 1;
    let weekDelta = 0;
    if (state.ledger) {
      const weekEntries = state.ledger.filter(e => e.week === lastWeek);
      weekDelta = weekEntries.reduce((sum, e) => sum + e.amount, 0);
    }
    
    return {
      upkeep,
      surplus,
      weekDelta
    };
  }, [state.player.funds, state.roster, state.trainers, state.ledger, state.week]);

  return (
    <Card className="h-full border-l-4 border-l-arena-gold/50 shadow-md">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-display font-black flex items-center gap-2 uppercase tracking-tighter">
          <Wallet className="h-4 w-4 text-arena-gold" /> Treasury Ops
        </CardTitle>
        <Link to="/stable/finance">
          <Badge variant="outline" className="text-[10px] font-mono border-arena-gold/20 text-arena-gold hover:bg-arena-gold/10">
            Ledger
          </Badge>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                Total Balance
              </span>
              <span className="text-2xl font-display font-black text-arena-gold drop-shadow-sm">
                ${state.player.funds.toLocaleString()}
              </span>
            </div>
            <div className={cn(
              "flex items-center gap-1 text-[11px] font-mono font-bold mb-1 px-1.5 py-0.5 rounded",
              finance.weekDelta >= 0 ? "text-primary bg-primary/10" : "text-destructive bg-destructive/10"
            )}>
              {finance.weekDelta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {finance.weekDelta >= 0 ? "+" : ""}{finance.weekDelta}
            </div>
          </div>

          <div className="grid gap-2 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between">
               <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                 <ArrowRightLeft className="h-2.5 w-2.5" /> Est. Upkeep
               </span>
               <span className="text-xs font-mono text-destructive">-${finance.upkeep}</span>
            </div>
            <div className="flex items-center justify-between">
               <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                 <Wallet className="h-2.5 w-2.5" /> Net Project
               </span>
               <span className={cn(
                 "text-xs font-mono font-bold underline decoration-2 underline-offset-4",
                 finance.surplus >= 0 ? "decoration-primary text-primary" : "decoration-destructive text-destructive"
               )}>
                 ${finance.surplus}
               </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
