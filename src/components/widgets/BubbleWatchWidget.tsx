import React from "react";
import { useGameStore, useWorldState } from "@/state/useGameStore";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, HelpCircle, AlertCircle, TrendingUp } from "lucide-react";
import { Surface } from "@/components/ui/Surface";
import { TOURNAMENT_TIERS } from "@/engine/matchmaking/tournamentSelection";

export default function BubbleWatchWidget() {
  const state = useWorldState();
  const { realmRankings, roster } = state;

  if (!realmRankings || Object.keys(realmRankings).length === 0) {
    return null;
  }

  return (
    <Surface variant="glass" padding="none" className="overflow-hidden border-border/10">
      <div className="p-4 bg-secondary/10 border-b border-white/5 flex items-center justify-between">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-muted-foreground/60">
          <Trophy className="h-3.5 w-3.5 text-arena-gold" />
          <span>Tournament Bubble Watch</span>
        </div>
      </div>
      <div className="p-5 space-y-6">
        {TOURNAMENT_TIERS.map((tier) => {
          const cutOff = tier.maxRank;
          const playerWarriorsInZone = roster.map(w => ({
            w,
            rank: realmRankings[w.id]?.overallRank || 999
          })).filter(entry => entry.rank > 0 && entry.rank <= cutOff + 20) // Show those close to cut-off
             .sort((a, b) => a.rank - b.rank);

          return (
            <div key={tier.id} className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80">{tier.name}</span>
                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 border-white/5 bg-white/[0.02]">Cut-off: #{cutOff}</Badge>
              </div>
              
              <div className="space-y-3">
                {playerWarriorsInZone.length === 0 ? (
                  <p className="px-1 text-[9px] uppercase font-black tracking-widest text-muted-foreground/20 italic">NO CONTENDERS IN ZONE</p>
                ) : (
                  playerWarriorsInZone.map(({ w, rank }) => {
                    const isSafe = rank <= cutOff;
                    const distToCutoff = rank - cutOff;
                    const intensity = isSafe ? Math.max(0, 100 - (rank / cutOff) * 100) : Math.max(0, 100 - (distToCutoff / 20) * 100);

                    return (
                      <div key={w.id} className={cn("p-2 border border-white/5 bg-black/20 flex items-center gap-3 transition-colors hover:bg-black/30", isSafe ? "border-l-2 border-l-arena-gold" : "border-l-2 border-l-destructive/40")}>
                         <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                               <span className={isSafe ? "text-arena-gold" : "text-destructive/80"}>{w.name}</span>
                               <span className="font-mono text-muted-foreground/40">RANK #{rank}</span>
                            </div>
                            <Progress 
                              value={intensity} 
                              className={`h-1 !bg-white/5 rounded-none ${isSafe ? "[&>div]:bg-arena-gold" : "[&>div]:bg-destructive"}`}
                            />
                         </div>
                         <div className="shrink-0">
                           {isSafe ? (
                             <TrendingUp className="h-3 w-3 text-arena-gold opacity-50" />
                           ) : (
                             <AlertCircle className="h-3 w-3 text-destructive opacity-50 animate-pulse" />
                           )}
                         </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="p-3 bg-secondary/5 border-t border-white/5 text-[9px] uppercase font-black tracking-widest text-muted-foreground/30 text-center">
        Selection Committee decisions finalized every 13 weeks.
      </div>
    </Surface>
  );
}
