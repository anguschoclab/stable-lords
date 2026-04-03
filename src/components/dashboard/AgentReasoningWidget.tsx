import React from "react";
import { useGameStore } from "@/state/useGameStore";
import { Brain, Cpu, ShieldAlert, Zap, TrendingUp, Target, User } from "lucide-react";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AgentReasoningWidget() {
  const { state } = useGameStore();

  const allRivalEvents = React.useMemo(() => {
    return (state.rivals || []).flatMap(rival => 
      (rival.actionHistory || []).map(event => ({
        ...event,
        rivalName: rival.owner.stableName,
        personality: rival.owner.personality,
        intent: rival.strategy?.intent || "CONSOLIDATION"
      }))
    ).sort((a, b) => b.week - a.week);
  }, [state.rivals]);

  return (
    <div className="space-y-4">
      {allRivalEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 opacity-30 shadow-inner rounded-2xl bg-black/20 border border-white/5">
          <Brain className="h-10 w-10 mb-4 text-primary/40 animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">Awaiting_Cognitive_Sync</p>
          <p className="text-[9px] text-muted-foreground mt-2 italic whitespace-pre-wrap">No rival activity logged this week.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allRivalEvents.slice(0, 15).map((event, i) => (
             <div 
               key={i} 
               className={cn(
                 "group relative p-4 rounded-xl border border-white/5 transition-all hover:bg-white/[0.03]",
                 event.riskTier === "High" ? "bg-red-500/5 hover:border-red-500/20" : 
                 event.riskTier === "Medium" ? "bg-orange-500/5 hover:border-orange-500/20" : 
                 "bg-blue-500/5 hover:border-blue-500/20"
               )}
             >
               <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                   <div className={cn(
                     "p-1.5 rounded-lg border",
                     event.riskTier === "High" ? "bg-red-500/10 border-red-500/20 text-red-400" :
                     event.riskTier === "Medium" ? "bg-orange-500/10 border-orange-500/20 text-orange-400" :
                     "bg-blue-500/10 border-blue-500/20 text-blue-400"
                   )}>
                     {event.type === "STRATEGY" && <Target className="h-3 w-3" />}
                     {event.type === "FINANCE" && <TrendingUp className="h-3 w-3" />}
                     {event.type === "ROSTER" && <User className="h-3 w-3" />}
                     {event.type === "STAFF" && <ShieldAlert className="h-3 w-3" />}
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80">
                     {event.rivalName}
                   </span>
                 </div>
                 <Badge variant="outline" className="text-[8px] font-mono border-white/10 opacity-60">
                   WK_{event.week}
                 </Badge>
               </div>

               <p className="text-[11px] leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors italic pl-7 border-l border-white/5 ml-2">
                 {event.description}
               </p>

               <div className="mt-2 flex items-center gap-2 pl-9">
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-30">Intent:</span>
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-widest",
                    event.intent === "VENDETTA" ? "text-red-400" :
                    event.intent === "EXPANSION" ? "text-primary" :
                    event.intent === "RECOVERY" ? "text-arena-gold" :
                    "text-muted-foreground"
                  )}>
                    {event.intent}
                  </span>
               </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}
