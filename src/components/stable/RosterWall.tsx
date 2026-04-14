import React, { useMemo } from "react";
import { useGameStore, useWorldState } from "@/state/useGameStore";
import { useNavigate, Link } from "@tanstack/react-router";
import { ATTRIBUTE_KEYS, ATTRIBUTE_LABELS } from "@/types/game";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatBadge, WarriorNameTag } from "@/components/ui/WarriorBadges";
import { Users, ChevronRight, Trophy, Star, Swords, Target, Crown, Activity, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger 
} from "@/components/ui/tooltip";

export function RosterWall() {
  const state = useWorldState();
  const navigate = useNavigate();

  const sortedRoster = useMemo(
    () => [...state.roster]
      .filter(w => w.status === "Active")
      .sort((a, b) => b.fame - a.fame),
    [state.roster]
  );

  return (
    <Surface variant="glass" padding="none" className="border-border/10 overflow-hidden relative shadow-2xl">
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary/40 via-arena-gold/40 to-primary/40 opacity-30" />
      
      <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-neutral-900/40 backdrop-blur-md">
        <div className="flex items-center gap-4">
           <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]">
             <Users className="h-6 w-6 text-primary" />
           </div>
           <div>
             <h3 className="font-display text-base font-black uppercase tracking-tight">Active_Personnel_Matrix</h3>
             <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-60">Deployable_Assets // Total_Synced: {sortedRoster.length}</span>
                <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
             </div>
           </div>
        </div>
        
        <Link to="/ops/personnel">
          <Button variant="outline" size="sm" className="bg-neutral-900 border-white/10 text-[10px] font-black uppercase tracking-[0.2em] gap-2 h-10 px-6 hover:bg-primary hover:text-white hover:border-primary transition-all">
             Initialize_Recruitment <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="p-8">
        {sortedRoster.length === 0 ? (
          <Surface variant="glass" className="py-24 text-center border-dashed border-border/40 flex flex-col items-center gap-6">
            <div className="relative">
               <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
               <Swords className="h-16 w-16 text-muted-foreground opacity-20 relative z-10" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-display font-black uppercase tracking-[0.2em] text-muted-foreground">Roster_Data_Empty</p>
              <p className="text-xs text-muted-foreground/60 italic max-w-sm mx-auto leading-relaxed">
                Synchronization failed. All personnel berths are currently vacant. Proceed to the recruitment terminal to enlist your first combatant asset.
              </p>
            </div>
            <Link to="/ops/personnel" className="mt-4">
               <Button className="bg-primary text-white font-black uppercase tracking-[0.2em] text-[10px] px-10 h-12 shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)] hover:scale-105 active:scale-95 transition-all">
                  Initialize_SYNC
               </Button>
            </Link>
          </Surface>
        ) : (
          <div className="grid gap-6">
            <AnimatePresence mode="popLayout">
              {sortedRoster.map((w, i) => {
                const fights = w.career.wins + w.career.losses;
                const winRate = fights > 0 ? Math.round((w.career.wins / fights) * 100) : 0;
                const injuryCount = (w.injuries ?? []).length;

                return (
                  <motion.div
                    key={w.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.5 }}
                  >
                    <button
                      onClick={() => navigate({ to: "/warrior/$id", params: { id: w.id } })}
                      className="w-full relative group"
                      aria-label={`View profile for ${w.name}`}
                    >
                      <Surface 
                        variant="paper" 
                        padding="none" 
                        className="flex flex-col md:flex-row items-stretch border border-white/5 bg-neutral-900/60 transition-all duration-500 overflow-hidden group-hover:border-primary/40 group-hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)]"
                      >
                         {/* Ranking Vertical Strip */}
                        <div className={cn(
                          "w-full md:w-20 shrink-0 flex flex-row md:flex-col items-center justify-center p-4 md:p-0 gap-4 border-b md:border-b-0 md:border-r border-white/5 relative",
                          i === 0 ? "bg-arena-gold/5" : i === 1 ? "bg-primary/5" : "bg-white/2"
                        )}>
                           <div className="absolute top-0 left-0 w-full md:w-1 h-1 md:h-full bg-primary opacity-40 group-hover:opacity-100 transition-all duration-500" />
                           <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 md:mb-1">RANK</span>
                           <span className={cn(
                             "text-4xl font-display font-black tracking-tighter leading-none",
                             i === 0 ? "text-arena-gold drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]" : i === 1 ? "text-primary" : "text-muted-foreground/40"
                           )}>
                             {i + 1}
                           </span>
                           {i === 0 && <Crown className="h-4 w-4 mt-1 text-arena-gold animate-bounce" />}
                        </div>

                        {/* Main Body */}
                        <div className="flex-1 p-6 flex flex-col md:flex-row gap-8">
                           {/* Personnel Info */}
                           <div className="flex-1 min-w-0 space-y-4">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                 <div className="space-y-1.5">
                                    <WarriorNameTag
                                       id={w.id}
                                       name={w.name}
                                       isChampion={w.champion}
                                       injuryCount={injuryCount}
                                       useCrown
                                    />
                                    <div className="flex items-center gap-3">
                                       <StatBadge styleName={w.style as import("@/types/game").FightingStyle} career={w.career} />
                                       <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-black border border-white/5 opacity-80 group-hover:border-primary/30 group-hover:opacity-100 transition-all">
                                          <Star className={cn("h-3 w-3", w.fame > 1000 ? "text-arena-gold" : "text-muted-foreground/60")} />
                                          <span className={cn("text-[10px] font-mono font-black", w.fame > 1000 ? "text-arena-gold" : "text-muted-foreground")}>{w.fame}G</span>
                                       </div>
                                    </div>
                                 </div>

                                 <div className="flex items-center gap-6 px-6 py-3 rounded-2xl bg-black/40 border border-white/5 group-hover:border-primary/10 transition-all">
                                    <div className="text-center">
                                       <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-40 block mb-0.5">Victory</span>
                                       <span className="font-mono font-black text-primary text-sm">{winRate}%</span>
                                    </div>
                                    <div className="h-8 w-px bg-white/5" />
                                    <div className="text-center">
                                       <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-40 block mb-0.5">Kills</span>
                                       <span className={cn(
                                          "font-mono font-black text-sm",
                                          w.career.kills > 0 ? "text-destructive" : "text-muted-foreground/40"
                                       )}>{w.career.kills}</span>
                                    </div>
                                 </div>
                              </div>

                              {/* Attribute Matrix Overlay */}
                              <div className="grid grid-cols-7 gap-2 pt-2">
                                 {ATTRIBUTE_KEYS.map(k => {
                                    const val = w.attributes?.[k as keyof typeof w.attributes] ?? 0;
                                    return (
                                       <Tooltip key={k}>
                                          <TooltipTrigger asChild>
                                             <div className="space-y-1.5">
                                                <div className="flex items-center justify-between px-0.5">
                                                   <span className="text-[8px] font-black tracking-widest text-muted-foreground opacity-40">{k}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-black rounded-full overflow-hidden border border-white/5 shadow-inner relative">
                                                   <div 
                                                      className={cn(
                                                         "absolute inset-y-0 left-0 transition-all duration-1000 group-hover:animate-pulse",
                                                         val >= 20 ? "bg-arena-gold shadow-[0_0_10px_rgba(255,215,0,0.5)]" : val >= 15 ? "bg-primary" : "bg-neutral-800"
                                                      )} 
                                                      style={{ width: `${(val / 25) * 100}%` }}
                                                   />
                                                </div>
                                             </div>
                                          </TooltipTrigger>
                                          <TooltipContent className="bg-neutral-950 border-white/10 text-[9px] font-black tracking-widest">
                                             {ATTRIBUTE_LABELS[k]}: {val} / 25
                                          </TooltipContent>
                                       </Tooltip>
                                    );
                                 })}
                              </div>
                           </div>

                           {/* Tactical Summary Vertical */}
                           <div className="w-full md:w-32 shrink-0 flex flex-col justify-center gap-1 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-8">
                              <div className="flex items-center justify-between md:flex-col md:items-start md:gap-4">
                                 <div>
                                    <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40 block">Condition</span>
                                    <div className="flex items-center gap-1.5 mt-1">
                                       <Activity className={cn("h-3 w-3", injuryCount > 0 ? "text-destructive" : "text-primary")} />
                                       <span className={cn("text-[9px] font-black uppercase tracking-widest", injuryCount > 0 ? "text-destructive" : "text-primary")}>
                                          {injuryCount > 0 ? "Compromised" : "Nominal"}
                                       </span>
                                    </div>
                                 </div>
                                 <button
                                    className="flex items-center gap-2 group/btn px-4 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:border-primary/50 transition-all"
                                    aria-label={`View tactical report for ${w.name}`}
                                 >
                                    <span className="text-[9px] font-black uppercase tracking-widest group-hover/btn:text-primary transition-colors">Tactical_Report</span>
                                    <ChevronRight className="h-3 w-3 opacity-20 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
                                 </button>
                              </div>
                           </div>
                        </div>
                      </Surface>
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Surface>
  );
}
