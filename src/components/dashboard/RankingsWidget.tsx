import React, { useMemo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Trophy, ChevronRight, Star, Award, Target, TrendingUp, Zap } from "lucide-react";
import { useGameStore, useWorldState } from "@/state/useGameStore";
import { selectActiveWarriors } from "@/state/selectors";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function RankingsWidget() {
  const state = useWorldState();
  const navigate = useNavigate();

  const ranked = useMemo(
    () => [...selectActiveWarriors(state)]
      .sort((a, b) => b.fame - a.fame)
      .slice(0, 5),
    [state]
  );

  return (
    <Surface variant="glass" padding="none" className="md:col-span-2 border-border/10 group overflow-hidden relative flex flex-col">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
         <Trophy className="h-48 w-48 text-primary" />
      </div>

      <div className="p-6 border-b border-white/5 bg-neutral-900/40 relative z-10 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-none bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
               <Award className="h-5 w-5 text-primary" />
            </div>
            <div>
               <h3 className="font-display text-base font-black uppercase tracking-tight">Elite_Ranking_Registry</h3>
               <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">Internal_Performance_Index</p>
            </div>
         </div>
         <Badge variant="outline" className="text-[9px] font-mono font-black border-white/10 bg-white/5 text-muted-foreground/60 h-7 px-3 tracking-widest">
            {selectActiveWarriors(state).length} ACTIVE_ASSETS
         </Badge>
      </div>

      <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
        {ranked.length === 0 ? (
          <div className="px-8 py-12 text-center opacity-20 italic">
            <p className="text-[10px] uppercase tracking-[0.3em]">No_Combat_Data_Recorded</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {ranked.map((w, i) => (
              <button
                key={w.id}
                className="w-full flex items-center gap-6 px-6 py-4 hover:bg-white/2 transition-all group/row text-left relative overflow-hidden"
                onClick={() => navigate({ to: "/warrior/$id", params: { id: w.id } })}
                aria-label={`View profile for ${w.name}`}
              >
                {/* Visual Rank Indicator */}
                <div className="flex items-center gap-4 shrink-0">
                   <span className={cn(
                      "text-sm font-mono font-black w-6 text-center select-none",
                      i === 0 ? "text-arena-gold drop-shadow-[0_0_8px_rgba(255,215,0,0.4)]" : 
                      i === 1 ? "text-primary/60" : 
                      "text-muted-foreground/20"
                   )}>
                      {(i + 1).toString().padStart(2, '0')}
                   </span>
                   <div className={cn(
                      "w-1.5 h-10 rounded-full transition-all duration-500",
                      i === 0 ? "bg-arena-gold shadow-[0_0_15px_rgba(255,215,0,0.5)] scale-y-110" : 
                      i === 1 ? "bg-primary/40" : 
                      "bg-white/5 group-hover/row:bg-white/10"
                   )} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                     <span className="font-display font-black text-sm uppercase tracking-tight text-foreground transition-colors group-hover/row:text-primary">
                        {w.name}
                     </span>
                     {w.champion && (
                        <Star className="h-3 w-3 text-arena-gold animate-pulse shadow-[0_0_8px_rgba(255,215,0,0.4)]" />
                     )}
                     <Badge variant="outline" className="text-[8px] font-black border-white/5 bg-secondary/20 text-muted-foreground/80 uppercase tracking-widest px-2">
                        {w.style}
                     </Badge>
                  </div>
                  
                  <div className="mt-1.5 flex items-center gap-4">
                     <div className="flex items-center gap-1.5">
                        <Target className="h-2.5 w-2.5 text-arena-pop opacity-40 group-hover/row:opacity-100 transition-opacity" />
                        <span className="text-[10px] font-mono font-black text-arena-pop/80">
                           {w.career.wins}W <span className="text-white/10 font-normal">/</span> {w.career.kills}K
                        </span>
                     </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0 pr-2">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5 text-arena-fame">
                       <span className="text-lg font-mono font-black tracking-tighter">{w.fame}</span>
                       <Star className="h-3.5 w-3.5 opacity-60 group-hover/row:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Fame_Score</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-white/5 group-hover/row:text-primary transition-all group-hover/row:translate-x-1" />
                </div>

                {/* Progress Sparkline Mask */}
                {i === 0 && (
                   <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-arena-gold/30 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer / CTA */}
      <div className="p-4 border-t border-white/5 bg-black/40 flex justify-center relative z-10">
         <button aria-label="button"
            onClick={() => navigate({ to: "/world" })}
            className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground hover:text-primary transition-colors opacity-40 hover:opacity-100 flex items-center gap-2 group"
         >
            Sync_Global_Rankings <TrendingUp className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
         </button>
      </div>
    </Surface>
  );
}
