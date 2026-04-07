import React, { useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { computeStableReputation } from "@/engine/stableReputation";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, Skull, Sparkles, Star, Eye, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const REP_LABELS: { key: keyof ReturnType<typeof computeStableReputation>; label: string; icon: React.ElementType; color: string; glow: string; desc: string }[] = [
  { key: "fame", label: "Fame", icon: Star, color: "text-arena-gold", glow: "bg-arena-gold", desc: "Public acclaim derived from victories and showmanship. Higher fame attracts wealthier patrons and more talented recruits." },
  { key: "notoriety", label: "Notoriety", icon: Skull, color: "text-destructive", glow: "bg-destructive", desc: "A feared reputation built on fatalities and ruthless rivalries. High notoriety intimidates opponents but may unsettle certain sponsors." },
  { key: "honor", label: "Honor", icon: Shield, color: "text-primary", glow: "bg-primary", desc: "Moral standing and respect from the arena elite. Honorable stables are often favored in governance decisions." },
  { key: "adaptability", label: "Adaptability", icon: Sparkles, color: "text-arena-pop", glow: "bg-arena-pop", desc: "Strategic responsiveness to the shifting combat meta. High adaptability allows your warriors to better capitalize on tactical openings." },
];

export function ReputationSliders() {
  const { state } = useGameStore();
  const rep = useMemo(() => computeStableReputation(state), [state]);

  return (
    <Surface variant="glass" className="border-border/40">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Eye className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-sm font-black uppercase tracking-tight">Stable Presence</h3>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Reputation Matrix // External Influence</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8">
        {REP_LABELS.map(({ key, label, icon: Icon, color, glow, desc }) => (
          <div key={key} className="space-y-3 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon className={cn("h-4 w-4 opacity-40 group-hover:opacity-100 transition-opacity", color)} />
                <span className="text-xs font-display font-black uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">{label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("font-mono font-black text-sm", color)}>{rep[key]}%</span>
                <Tooltip>
                   <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground/30 hover:text-muted-foreground transition-colors cursor-help" />
                   </TooltipTrigger>
                   <TooltipContent className="w-full max-w-xs text-[10px] font-medium leading-relaxed bg-neutral-950 border-white/10">
                      {desc}
                   </TooltipContent>
                </Tooltip>
              </div>
            </div>
            
            <div className="relative h-2 bg-neutral-900 rounded-full overflow-hidden border border-white/5 shadow-inner">
              <div
                className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)]", glow)}
                style={{ width: `${rep[key]}%` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
            </div>
          </div>
        ))}
      </div>
    </Surface>
  );
}
