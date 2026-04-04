import React from "react";
import { useGameStore } from "@/state/useGameStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, HelpCircle, AlertCircle, TrendingUp } from "lucide-react";
import { TOURNAMENT_TIERS } from "@/engine/matchmaking/tournamentSelection";

export default function BubbleWatchWidget() {
  const { state } = useGameStore();
  const { realmRankings, roster } = state;

  if (!realmRankings || Object.keys(realmRankings).length === 0) {
    return null;
  }

  return (
    <Card className="bg-glass-card border-border/10 overflow-hidden">
      <CardHeader className="p-4 bg-secondary/10 border-b border-border/5">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-muted-foreground">
          <Trophy className="h-3 w-3 text-arena-gold" />
          Tournament Bubble Watch
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        {TOURNAMENT_TIERS.map((tier) => {
          const cutOff = tier.maxRank;
          const playerWarriorsInZone = roster.map(w => ({
            w,
            rank: realmRankings[w.id]?.overallRank || 999
          })).filter(entry => entry.rank > 0 && entry.rank <= cutOff + 20) // Show those close to cut-off
             .sort((a, b) => a.rank - b.rank);

          return (
            <div key={tier.id} className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-black uppercase tracking-tight text-foreground/80">{tier.name}</span>
                <Badge variant="outline" className="text-[9px] uppercase font-mono opacity-60">Cut-off: #{cutOff}</Badge>
              </div>
              
              <div className="space-y-2">
                {playerWarriorsInZone.length === 0 ? (
                  <p className="text-[9px] uppercase font-bold text-muted-foreground/30 italic">No_Contenders_In_Zone</p>
                ) : (
                  playerWarriorsInZone.map(({ w, rank }) => {
                    const isSafe = rank <= cutOff;
                    const distToCutoff = rank - cutOff;
                    const intensity = isSafe ? Math.max(0, 100 - (rank / cutOff) * 100) : Math.max(0, 100 - (distToCutoff / 20) * 100);

                    return (
                      <div key={w.id} className="flex items-center gap-3">
                         <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                               <span className={isSafe ? "text-arena-gold" : "text-destructive"}>{w.name}</span>
                               <span className="font-mono text-[9px]">RANK #{rank}</span>
                            </div>
                            <Progress 
                              value={intensity} 
                              className={`h-1 !bg-secondary/20 ${isSafe ? "[&>div]:bg-arena-gold" : "[&>div]:bg-destructive"}`}
                            />
                         </div>
                         {isSafe ? (
                           <TrendingUp className="h-3 w-3 text-arena-gold opacity-50" />
                         ) : (
                           <AlertCircle className="h-3 w-3 text-destructive opacity-50 animate-pulse" />
                         )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
      <div className="p-3 bg-secondary/5 border-t border-border/5 text-[8px] uppercase font-black tracking-widest text-muted-foreground/40 text-center">
        Selection Committee decisions finalized every 13 weeks.
      </div>
    </Card>
  );
}
