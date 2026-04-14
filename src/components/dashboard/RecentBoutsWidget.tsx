import React, { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ScrollText, ChevronRight, Swords, Trophy, Activity, Target, Zap, Shield } from "lucide-react";
import { useGameStore } from "@/state/useGameStore";
import { resolveStableName } from "@/utils/historyResolver";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function RecentBoutsWidget() {
  const state = useGameStore();

  // Get the last 5 bouts involving the player's stable
  const recentBouts = useMemo(() => {
    const playerStableId = state.player.id;
    return (state.arenaHistory || [])
      .filter(bout => bout.stableIdA === playerStableId || bout.stableIdD === playerStableId)
      .slice(0, 5);
  }, [state.arenaHistory, state.player.id]);

  return (
    <Surface variant="glass" padding="none" className="flex flex-col h-full border-border/10 group overflow-hidden relative md:col-span-2 shadow-2xl">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
         <Swords className="h-48 w-48 text-primary" />
      </div>

      <div className="p-6 border-b border-white/5 bg-neutral-900/40 relative z-10 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
               <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
               <h3 className="font-display text-base font-black uppercase tracking-tight">Deployment_History</h3>
               <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">Recent_Arena_Engagements</p>
            </div>
         </div>
         <Badge variant="outline" className="text-[9px] font-mono font-black border-white/10 bg-white/5 text-muted-foreground/60 h-7 px-3 tracking-widest">
            RECENT_05_OPS
         </Badge>
      </div>

      <div className="flex-1 overflow-x-auto relative z-10 custom-scrollbar">
        <Table>
          <TableHeader className="bg-black/20">
            <TableRow className="hover:bg-transparent border-white/5">
              <TableHead className="w-24 font-black uppercase text-[10px] tracking-widest pl-6 py-4">Temporal_ID</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground/60 py-4">Operative_Sync</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-center text-muted-foreground/60 py-4">Engagement_Outcome</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-right pr-6 py-4">Termination_Method</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentBouts.length === 0 ? (
              <TableRow className="hover:bg-transparent border-none">
                 <TableCell colSpan={4} className="py-12 text-center opacity-20 italic">
                    <p className="text-[10px] uppercase tracking-[0.3em]">No_Engagement_Data_Synchronized</p>
                 </TableCell>
              </TableRow>
            ) : (
              recentBouts.map((bout, i) => {
              const isPlayerA = bout.stableIdA === state.player.id;
              const playerWon = (isPlayerA && bout.winner === "A") || (!isPlayerA && bout.winner === "D");
                const resultColor = playerWon ? "text-arena-pop" : "text-destructive";

                return (
                  <TableRow key={bout.id} className="border-white/5 group/row hover:bg-white/2 transition-colors">
                    <TableCell className="pl-6 py-4">
                       <span className="text-[10px] font-mono font-black text-white/20 group-hover/row:text-primary transition-colors">
                          WK_{bout.week.toString().padStart(2, '0')}
                       </span>
                    </TableCell>
                    <TableCell className="py-4">
                       <div className="flex flex-col">
                          <span className="text-xs font-black uppercase tracking-tight text-foreground/80 group-hover/row:text-foreground">
                             {resolveStableName(state, isPlayerA ? bout.stableIdA : bout.stableIdD, isPlayerA ? bout.a : bout.d)}
                          </span>
                          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mt-0.5">
                             VS // {resolveStableName(state, isPlayerA ? bout.stableIdD : bout.stableIdA, isPlayerA ? bout.d : bout.a)}
                          </span>
                       </div>
                    </TableCell>
                    <TableCell className="text-center py-4">
                       <Tooltip>
                          <TooltipTrigger asChild>
                             <div className={cn(
                                "inline-flex items-center gap-2 px-3 py-1 rounded-lg border font-black text-[9px] tracking-[0.2em] uppercase transition-all",
                                playerWon ? "bg-arena-pop/10 border-arena-pop/20 text-arena-pop" : "bg-destructive/10 border-destructive/20 text-destructive"
                             )}>
                                {playerWon ? <Trophy className="h-2.5 w-2.5" /> : <Shield className="h-2.5 w-2.5" />}
                                {playerWon ? "VICTORY" : "DEFEAT"}
                             </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-neutral-950 border-white/10 text-[9px] font-black tracking-widest">
                             {playerWon ? "Combat objectives achieved." : "Strategic failure detected."}
                          </TooltipContent>
                       </Tooltip>
                    </TableCell>
                    <TableCell className="text-right pr-6 py-4">
                       <div className="flex flex-col items-end">
                          <span className="text-[10px] font-mono font-black text-muted-foreground/60 uppercase">
                             {bout.by || "JUDICIAL_DECREE"}
                          </span>
                          <div className="h-0.5 w-8 bg-white/5 rounded-full mt-1 group-hover/row:bg-primary/40 transition-colors" />
                       </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="p-4 border-t border-white/5 bg-black/40 flex justify-center relative z-10 mt-auto">
         <Link 
            to="/world/chronicle"
            className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground hover:text-primary transition-colors opacity-40 hover:opacity-100 flex items-center gap-2 group"
         >
            Sync_Engagement_Chronicle <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
         </Link>
      </div>
    </Surface>
  );
}
