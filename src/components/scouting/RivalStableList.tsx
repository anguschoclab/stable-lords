import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Surface } from "@/components/ui/Surface";
import type { RivalStableData } from "@/types/game";
import { cn } from "@/lib/utils";
import { StableCrest } from "@/components/crest/StableCrest";

interface RivalStableListProps {
  rivals: RivalStableData[];
  selectedRivalId: string | null;
  onSelectRival: (id: string) => void;
}

export function RivalStableList({ rivals, selectedRivalId, onSelectRival }: RivalStableListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-2">
        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Rival_Asset_Inventory</h3>
        <div className="h-px flex-1 bg-border/20" />
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {rivals.map((rival) => (
          <Tooltip key={rival.owner.id}>
            <TooltipTrigger asChild>
              <button
                aria-label={`Select rival stable ${rival.owner.stableName}`}
                className={cn(
                  "w-full text-left group relative outline-none",
                  selectedRivalId === rival.owner.id ? "z-10" : "z-0"
                )}
                onClick={() => onSelectRival(rival.owner.id)}
              >
                <Surface
                  variant={selectedRivalId === rival.owner.id ? "paper" : "glass"}
                  padding="none"
                  className={cn(
                    "transition-all border bg-neutral-900/60 overflow-hidden",
                    selectedRivalId === rival.owner.id 
                      ? "border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]" 
                      : "border-white/5 hover:border-white/20 hover:bg-white/5"
                  )}
                >
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 flex items-center justify-center rounded-none border transition-all overflow-hidden",
                        selectedRivalId === rival.owner.id 
                          ? "border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" 
                          : "border-white/10 group-hover:border-white/20"
                      )}>
                        {rival.crest ? (
                          <StableCrest crest={rival.crest} size="sm" />
                        ) : (
                          <div className="h-full w-full bg-neutral-800 flex items-center justify-center">
                            <span className="text-[8px] text-muted-foreground">?</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <span className={cn(
                          "font-display font-black text-sm uppercase tracking-tight transition-colors",
                          selectedRivalId === rival.owner.id ? "text-primary" : "text-foreground"
                        )}>{rival.owner.stableName}</span>
                        <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                          <span className="flex items-center gap-1.5 font-mono">
                            <Users className="h-3 w-3" /> {rival.roster.filter((w) => w.status === "Active").length} ASSETS
                          </span>
                          <span className="h-1 w-1 rounded-full bg-border/40" />
                          <span className="text-primary/60 font-bold">{rival.owner.personality}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {selectedRivalId === rival.owner.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
                </Surface>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-glass-card border-border/40 shadow-xl p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">SELECT_STABLE_ASSET</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
