import React, { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Dumbbell, ChevronRight, Activity, Zap, Target, TrendingUp, AlertCircle, Sparkles } from "lucide-react";
import { useGameStore, useWorldState } from "@/state/useGameStore";
import { Surface } from "@/components/ui/Surface";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ATTRIBUTE_LABELS } from "@/types/game";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function TrainingWidget() {
  const state = useWorldState();
  
  // Map warrior IDs to warriors for display
  const trainingWarriors = useMemo(() => {
    const assignments = state.trainingAssignments ?? [];
    const roster = state.roster ?? [];
    return assignments.map(a => ({
      ...a,
      warrior: roster.find(w => w.id === a.warriorId),
    })).filter(a => a.warrior);
  }, [state.trainingAssignments, state.roster]);

  return (
    <Surface variant="glass" padding="none" className="h-full border-border/10 group overflow-hidden relative flex flex-col">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
         <Dumbbell className="h-12 w-12" />
      </div>

      <div className="p-6 border-b border-white/5 bg-neutral-900/40 relative z-10 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
               <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
               <h3 className="font-display text-sm font-black uppercase tracking-tight">Neuro_Conditioning</h3>
               <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">Attribute_Optimization_Feed</p>
            </div>
         </div>
         <Badge variant="outline" className="text-[9px] font-mono font-black border-white/10 bg-white/5 text-muted-foreground/60 h-7 px-3 tracking-widest">
            {trainingWarriors.length} ACTIVE_TRAINEES
         </Badge>
      </div>

      <div className="flex-1 overflow-y-auto relative z-10 space-y-4 p-6 custom-scrollbar">
        {trainingWarriors.length === 0 ? (
          <div className="py-8 text-center opacity-20 italic">
            <p className="text-[10px] uppercase tracking-[0.2em]">Training_Grounds_Idle</p>
            <Link to="/command/training">
               <Button variant="ghost" size="sm" className="mt-4 text-[9px] uppercase tracking-widest font-black border border-white/5 hover:bg-primary/10 hover:text-primary transition-all">
                  Assign_Modules
               </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {trainingWarriors.map(({ warriorId, attribute, warrior }) => {
              const w = warrior!;
              const current = w.attributes[attribute as keyof typeof w.attributes] || 0;
              const potential = w.potential?.[attribute as keyof typeof w.attributes];
              const atCeiling = potential !== undefined && current >= potential;
              const nearCeiling = potential !== undefined && (potential - current) <= 2;

              return (
                <div key={warriorId} className="flex items-center justify-between group/item p-3 bg-white/2 rounded-xl border border-white/5 hover:border-primary/20 transition-all">
                   <div className="flex items-center gap-4">
                      <div className="relative">
                         <div className="h-8 w-8 rounded-lg bg-secondary/20 flex items-center justify-center border border-white/5">
                            <span className="text-[10px] font-black text-white/40">{w.name.charAt(0)}</span>
                         </div>
                         <div className={cn(
                            "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#050506]",
                            atCeiling ? "bg-muted-foreground" : "bg-primary animate-pulse"
                         )} />
                      </div>
                      
                      <div className="flex flex-col">
                         <span className="text-[11px] font-black uppercase tracking-tight text-foreground/80 group-hover/item:text-primary transition-colors">
                            {w.name}
                         </span>
                         <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">Training:</span>
                            <span className={cn(
                               "text-[9px] font-black uppercase tracking-widest transition-colors",
                               atCeiling ? "text-muted-foreground" : "text-primary"
                            )}>
                               {attribute ? (ATTRIBUTE_LABELS[attribute as keyof typeof ATTRIBUTE_LABELS] || attribute) : "Recovery"}
                            </span>
                         </div>
                      </div>
                   </div>

                   <div className="flex items-center gap-4">
                      <div className="text-right">
                         <div className="text-xs font-mono font-black text-foreground drop-shadow-sm">
                            {current}<span className="text-[9px] text-white/10 ml-0.5">/</span>{potential || "???"}
                         </div>
                         {atCeiling && (
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 block leading-none mt-0.5">At_Cap</span>
                         )}
                         {!atCeiling && nearCeiling && (
                            <span className="text-[8px] font-black uppercase tracking-widest text-arena-gold block leading-none mt-0.5 animate-pulse">Near_Cap</span>
                         )}
                      </div>
                   </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5 bg-black/40 flex justify-center relative z-10 mt-auto">
         <Link 
            to="/command/training"
            className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground hover:text-primary transition-colors opacity-40 hover:opacity-100 flex items-center gap-2 group"
         >
            Sync_Training_Hub <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
         </Link>
      </div>
    </Surface>
  );
}
