import React from "react";
import { Badge } from "@/components/ui/badge";
import { Eye, Coins, Target, Terminal, AlertTriangle, ShieldAlert, Microscope, Info, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/Surface";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ScoutReportData, ScoutQuality } from "@/types/game";
import { STYLE_DISPLAY_NAMES, ATTRIBUTE_KEYS } from "@/types/game";
import { getScoutCost } from "@/engine/scouting";
import { cn } from "@/lib/utils";

interface ScoutReportDetailsProps {
  report: ScoutReportData | null;
  warriorName: string;
  treasury: number;
  onScout: (quality: ScoutQuality) => void;
}

export function ScoutReportDetails({ report, warriorName, treasury, onScout }: ScoutReportDetailsProps) {
  const QUALITIES: ScoutQuality[] = ["Basic", "Detailed", "Expert"];

  if (!report) {
    return (
      <Surface variant="glass" className="border-border/40 shadow-2xl relative overflow-hidden group">
        <div className="absolute -right-12 -bottom-12 opacity-5 transform rotate-12 group-hover:scale-110 transition-transform duration-1000">
           <Target className="h-48 w-48 text-primary" />
        </div>
        
        <div className="space-y-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
               <div className="p-2 rounded-none bg-primary/10 border border-primary/20">
                  <Terminal className="h-4 w-4 text-primary" />
               </div>
               <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary leading-none">Scouting_Protocol_Pending</h4>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed font-display max-w-md">
              Establish a tactical deep-scan on <span className="text-white font-black uppercase tracking-tight decoration-primary/40 underline decoration-2 underline-offset-4">{warriorName}</span> to uncover their combat signatures and metabolic thresholds.
            </p>
          </div>
          
          <div className="grid gap-3 pt-4">
            {QUALITIES.map((q) => {
              const cost = getScoutCost(q);
              const canAfford = treasury >= cost;
              return (
                <button aria-label="button"
                  key={q}
                  disabled={!canAfford}
                  onClick={() => onScout(q)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-none border transition-all relative group/btn",
                    canAfford 
                      ? q === "Expert" 
                        ? "bg-primary text-white border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] hover:scale-[1.02]" 
                        : "bg-neutral-900/60 border-white/5 hover:border-primary/40 hover:bg-white/5"
                      : "bg-neutral-900/40 border-white/5 opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-2 rounded-none transition-colors border",
                      q === "Expert" ? "bg-white/10 border-white/20" : "bg-neutral-800 border-white/5 group-hover/btn:bg-primary/20 group-hover/btn:border-primary/20 group-hover/btn:text-primary"
                    )}>
                      <Eye className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] block leading-none mb-1">{q} INFRARED_SCAN</span>
                       <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Precision: {q === "Expert" ? "99.9%" : q === "Detailed" ? "85%" : "60%"}</span>
                    </div>
                  </div>

                  <div className={cn(
                    "px-3 py-1.5 rounded-none border flex items-center gap-2 font-mono font-black text-xs",
                    q === "Expert" ? "bg-black/20 border-white/10 text-white" : "bg-black border-white/5 text-arena-gold"
                  )}>
                    <Coins className="h-3.5 w-3.5" /> {cost}G
                  </div>
                  
                  {q === "Expert" && canAfford && (
                    <div className="absolute inset-0 bg-white/5 animate-pulse rounded-none pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </Surface>
    );
  }

  return (
    <Surface variant="glass" padding="none" className="border-primary/40 shadow-[0_0_40px_rgba(var(--primary-rgb),0.15)] overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
      
      <div className="p-6 border-b border-white/5 bg-primary/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="p-2.5 rounded-none bg-primary text-white shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]">
              <Microscope className="h-5 w-5" />
           </div>
           <div>
              <h3 className="font-display font-black uppercase text-base tracking-tight leading-none mb-1">{report.warriorName}</h3>
              <div className="flex items-center gap-2">
                 <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-none bg-primary/10 border border-primary/20">
                    <span className="text-[8px] font-black uppercase tracking-widest text-primary leading-none">{report.quality} SCAN COMPLETED</span>
                 </div>
                 <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">PROTOCOL_ACTIVE</span>
              </div>
           </div>
        </div>
        
        <Tooltip>
           <TooltipTrigger asChild>
              <button aria-label="More Info" className="p-2 rounded-none bg-neutral-900 border border-white/5 hover:border-primary/40 transition-colors">
                 <Info className="h-4 w-4 text-muted-foreground/40" />
              </button>
           </TooltipTrigger>
           <TooltipContent className="w-full max-w-60 text-[10px] font-medium leading-relaxed bg-neutral-950 border-white/10 uppercase tracking-widest">
              Deep scan report established for the current combat cycle. Intelligence degrades over time.
           </TooltipContent>
        </Tooltip>
      </div>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 opacity-40 group">
               <Target className="h-3 w-3 text-primary group-hover:scale-110 transition-transform" />
               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground leading-none">Combat Style</span>
            </div>
            <div className="text-sm font-black uppercase tracking-widest text-foreground ml-5 border-l-2 border-primary/20 pl-3">
              {STYLE_DISPLAY_NAMES[report.style as keyof typeof STYLE_DISPLAY_NAMES] ?? report.style}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 opacity-40">
               <Swords className="h-3 w-3 text-secondary" />
               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground leading-none">Historical Loadout</span>
            </div>
            <div className="text-sm font-mono font-black text-foreground ml-5 border-l-2 border-secondary/20 pl-3">
              {report.record}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">ATTRIBUTE_MATRIX</span>
             <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-border/20 to-transparent" />
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {ATTRIBUTE_KEYS.map((key) => {
              const range = report.attributeRanges[key];
              if (!range) return null;
              return (
                <div key={key} className="flex items-center group">
                  <div className="w-20 shrink-0">
                     <span className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-widest group-hover:text-primary/60 transition-colors">{key}</span>
                  </div>
                  <div className="flex-1 h-8 bg-neutral-900 rounded border border-white/5 px-4 flex items-center group-hover:border-primary/20 transition-all">
                    <span className="text-xs font-mono font-black text-foreground">{range}</span>
                    <div className="ml-auto flex gap-1 items-baseline">
                       <div className="h-1.5 w-1 bg-primary/40 rounded-full" />
                       <div className="h-2.5 w-1 bg-primary/60 rounded-full" />
                       <div className="h-2 w-1 bg-primary/20 rounded-full" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {(report.suspectedOE || report.knownInjuries.length > 0) && (
          <Surface variant="glass" className="bg-black/40 border-border/20 p-6 space-y-6">
            {report.suspectedOE && (
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-destructive/40">
                     <AlertTriangle className="h-3.5 w-3.5" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-none">Suspected OE</span>
                  </div>
                  <span className="text-xl font-mono font-black text-destructive/80 ml-5 block leading-none">{report.suspectedOE}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary/40">
                     <ShieldAlert className="h-3.5 w-3.5" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-none">Suspected AL</span>
                  </div>
                  <span className="text-xl font-mono font-black text-primary ml-5 block leading-none">{report.suspectedAL}</span>
                </div>
              </div>
            )}

            {report.knownInjuries.length > 0 && (
              <div className="pt-4 border-t border-white/5 space-y-3">
                <div className="flex items-center gap-2">
                   <div className="p-1 rounded bg-destructive/10 border border-destructive/20">
                      <ShieldAlert className="h-3 w-3 text-destructive" />
                   </div>
                   <span className="text-[9px] font-black uppercase tracking-widest text-destructive/60">Documented_Tissue_Damage</span>
                </div>
                <div className="flex flex-wrap gap-2 ml-7">
                  {report.knownInjuries.map((injury, idx) => (
                    <Badge key={idx} variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-destructive/5 text-destructive border-destructive/30 px-2 py-0.5 rounded-none">
                       {injury}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Surface>
        )}

        <div className="relative group">
          <Terminal className="absolute -left-6 top-1 h-4 w-4 text-primary/10 group-hover:text-primary transition-colors" />
          <div className="bg-neutral-900 rounded-none p-5 border border-white/5 border-l-4 border-l-primary/40 italic">
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">"{report.notes}"</p>
          </div>
        </div>

        {report.quality !== "Expert" && (
          <button aria-label="button"
            className="w-full h-12 bg-primary/10 border border-primary/20 rounded-none hover:bg-primary hover:text-white transition-all group/expand"
            onClick={() => onScout(report.quality === "Basic" ? "Detailed" : "Expert")}
          >
            <div className="flex items-center justify-center gap-3">
               <Eye className="h-4 w-4 group-hover/expand:scale-110 transition-transform" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Elevate_Tactical_Precision</span>
            </div>
          </button>
        )}
      </div>
    </Surface>
  );
}
