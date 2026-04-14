import React from "react";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/badge";
import { Brain, Quote, Target, Zap, Activity, Coins, TrendingUp } from "lucide-react";
import { MetaDriftWidget } from "@/components/widgets/MetaDriftWidget";
import { STYLE_DISPLAY_NAMES, type FightingStyle, type RivalStableData } from "@/types/game";
import { cn } from "@/lib/utils";

interface RivalIntelligenceProps {
  rivals: RivalStableData[];
}

export function RivalIntelligence({ rivals }: RivalIntelligenceProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <MetaDriftWidget />
      </div>
      <div className="lg:col-span-2 space-y-6">
        <Surface variant="glass" padding="none" className="border-border/40 overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-primary/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-sm font-black uppercase tracking-tight">Rival Network</h3>
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Neural Simulation Engine // Strategic Intel Registry</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-primary/20 bg-primary/5 text-primary">SCANNED_UNITS: {rivals.length}</Badge>
          </div>

          <div className="divide-y divide-white/5">
            {rivals.map((rival) => (
              <div key={rival.owner.id} className="p-6 hover:bg-primary/5 transition-all group relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-4 text-left">
                     <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-white/5 flex items-center justify-center font-display font-black text-xs text-muted-foreground group-hover:text-primary group-hover:border-primary/40 transition-all">
                        {rival.owner.stableName.slice(0, 2).toUpperCase()}
                     </div>
                     <div>
                        <h4 className="font-display font-black uppercase text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">{rival.owner.stableName}</h4>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest">COMMANDER: {rival.owner.name}</span>
                           <span className="h-1 w-1 rounded-full bg-border" />
                           <span className="text-[10px] text-primary/60 font-bold uppercase tracking-widest">{rival.owner.personality || "Calculated"}</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex-1 max-w-md">
                     <div className="relative mb-6">
                        <Quote className="h-4 w-4 text-primary/20 absolute -top-3 -left-4" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1.5 block">Doctrine Philosophy</span>
                        <p className="text-[11px] leading-relaxed italic border-l-2 border-primary/20 pl-4 py-1 text-foreground/80">
                           "{rival.philosophy || "Prioritizing martial purity and the preservation of ancient gladiatorial traditions."}"
                        </p>
                     </div>

                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                           <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 block">Strategic Current</span>
                           <div className="flex items-center gap-2">
                              <Badge className={cn(
                                "text-[9px] font-black border-none uppercase tracking-widest px-2 py-0.5",
                                rival.strategy?.intent === "VENDETTA" ? "bg-red-500/20 text-red-400" :
                                rival.strategy?.intent === "EXPANSION" ? "bg-stone-500/20 text-stone-400" :
                                rival.strategy?.intent === "RECOVERY" ? "bg-orange-500/20 text-orange-400" :
                                "bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                              )}>
                                 {rival.strategy?.intent || "STABLE"}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground font-mono font-bold opacity-40">Wk {5 - (rival.strategy?.planWeeksRemaining || 0)}/4</span>
                           </div>
                        </div>

                        <div className="space-y-3">
                           <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 block">Capital Reservoir</span>
                           <div className="flex items-center gap-2">
                              <div className={cn(
                                "h-1.5 w-1.5 rounded-full animate-pulse",
                                rival.treasury < 150 ? "bg-destructive shadow-[0_0_8px_red]" : 
                                rival.treasury < 500 ? "bg-orange-500 shadow-[0_0_8px_orange]" : 
                                "bg-emerald-500 shadow-[0_0_8px_green]"
                              )} />
                              <span className="text-[10px] font-black uppercase tracking-tight text-foreground/90">
                                {rival.treasury < 150 ? "DEBT_THRESHOLD" : rival.treasury < 500 ? "DEPLETED" : rival.treasury < 1200 ? "OPERATIONAL" : "SURPLUS_RESERVE"}
                              </span>
                              <div className="ml-auto text-[9px] font-bold text-muted-foreground flex items-center gap-1">
                                 <Activity className="h-2.5 w-2.5" /> {rival.trainers?.length || 0} STAFF
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="w-full md:w-32 flex flex-col gap-3">
                     <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Favored Doctrines</span>
                     <div className="flex flex-wrap md:flex-col gap-1.5">
                        {rival.owner.favoredStyles && (rival.owner.favoredStyles as FightingStyle[]).length > 0 ? (
                           (rival.owner.favoredStyles as FightingStyle[]).map((s) => (
                              <Badge key={s} variant="outline" className="text-[9px] font-black uppercase tracking-widest py-1 px-2 bg-neutral-900 border-white/5 hover:border-primary/40 transition-colors">
                                 {STYLE_DISPLAY_NAMES[s]}
                              </Badge>
                           ))
                        ) : (
                           <span className="text-[10px] text-muted-foreground/40 italic font-medium">No specialized bias</span>
                        )}
                     </div>
                  </div>
                </div>

                <div className="absolute right-0 top-0 h-full w-1 bg-primary/20 transform translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              </div>
            ))}
          </div>
        </Surface>

        <Surface variant="glass" className="bg-primary/5 border-primary/20 border-dashed">
          <div className="flex items-start gap-4">
             <div className="p-2 rounded-lg bg-primary/10">
                <Zap className="h-4 w-4 text-primary" />
             </div>
             <div className="space-y-1">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-primary">Scouting Protocol Summary</h5>
                <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                  Rival owners react to meta shifts with varying latency. <span className="text-foreground font-black">Innovators</span> anticipate trends, while <span className="text-foreground font-black">Traditionalists</span> provide predictable matchups. Leverage neural intelligence to exploit doctrinal gaps in future brackets.
                </p>
             </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}
