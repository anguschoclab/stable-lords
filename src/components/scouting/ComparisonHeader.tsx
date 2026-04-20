import React from "react";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight } from "lucide-react";
import { Surface } from "@/components/ui/Surface";
import type { RivalStableData } from "@/types/game";

interface ComparisonHeaderProps {
  rivalA: RivalStableData;
  rivalB: RivalStableData;
}

export function ComparisonHeader({ rivalA, rivalB }: ComparisonHeaderProps) {
  return (
    <Surface variant="glass" padding="none" className="p-8 border-border/40 relative overflow-hidden flex items-center justify-between">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <div className="text-center flex-1 relative z-10 space-y-4">
        <h4 className="text-[10px] font-black tracking-[0.4em] text-primary uppercase leading-none opacity-60">Asset Alpha</h4>
        <h3 className="font-display font-black uppercase text-2xl tracking-tighter text-foreground leading-none">{rivalA.owner.stableName}</h3>
        <div className="flex justify-center">
           <Badge variant="outline" className="text-[10px] font-black tracking-widest uppercase border-primary/20 bg-primary/10 text-primary py-1 px-3 rounded-none">{rivalA.tier}</Badge>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center mx-12 relative z-10">
         <div className="p-3 rounded-full bg-neutral-900 border border-white/5 shadow-inner">
            <ArrowLeftRight className="h-6 w-6 text-muted-foreground/40" />
         </div>
         <span className="text-[9px] font-black text-muted-foreground/20 tracking-[0.5em] uppercase mt-4">VS</span>
      </div>

      <div className="text-center flex-1 relative z-10 space-y-4">
        <h4 className="text-[10px] font-black tracking-[0.4em] text-accent uppercase leading-none opacity-60">Asset Beta</h4>
        <h3 className="font-display font-black uppercase text-2xl tracking-tighter text-foreground leading-none">{rivalB.owner.stableName}</h3>
        <div className="flex justify-center">
           <Badge variant="outline" className="text-[10px] font-black tracking-widest uppercase border-accent/20 bg-accent/10 text-accent py-1 px-3 rounded-none">{rivalB.tier}</Badge>
        </div>
      </div>
    </Surface>
  );
}
