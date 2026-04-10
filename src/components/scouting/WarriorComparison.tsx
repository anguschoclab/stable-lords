import React, { useMemo, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UserRoundSearch, Swords, Crosshair, Zap, Hexagon, BarChart3, TrendingUp } from "lucide-react";
import { Surface } from "@/components/ui/Surface";
import type { RivalStableData, Warrior } from "@/types/game";
import { ATTRIBUTE_KEYS, STYLE_DISPLAY_NAMES } from "@/types/game";
import { WarriorNameTag, StatBadge } from "@/components/ui/WarriorBadges";
import { ComparisonBar } from "./ComparisonBar";
import { cn } from "@/lib/utils";

interface WarriorComparisonProps {
  rivals: RivalStableData[];
  playerRoster: Warrior[];
}

export function WarriorComparison({ rivals, playerRoster }: WarriorComparisonProps) {
  const [wIdA, setWIdA] = useState<string | null>(null);
  const [wIdB, setWIdB] = useState<string | null>(null);

  const allWarriors = useMemo(() => {
    const list: { warrior: Warrior; stable: string }[] = [];
    for (const w of playerRoster.filter(w => w.status === "Active")) list.push({ warrior: w, stable: "User Stable" });
    for (const r of rivals) {
      for (const w of r.roster.filter(w => w.status === "Active")) list.push({ warrior: w, stable: r.owner.stableName });
    }
    return list;
  }, [rivals, playerRoster]);

  const entryA = useMemo(() => allWarriors.find(e => e.warrior.id === wIdA), [allWarriors, wIdA]);
  const entryB = useMemo(() => allWarriors.find(e => e.warrior.id === wIdB), [allWarriors, wIdB]);

  if (allWarriors.length < 2) {
    return (
      <Surface variant="glass" className="py-24 text-center border-dashed border-border/40 flex flex-col items-center gap-4">
        <UserRoundSearch className="h-12 w-12 text-muted-foreground opacity-20" />
        <div className="space-y-1">
          <p className="text-sm font-display font-black uppercase tracking-tight text-muted-foreground">Personnel Database Depleted</p>
          <p className="text-xs text-muted-foreground/60 italic">Ensure at least two active combatants are registered in the global registry.</p>
        </div>
      </Surface>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-8">
        {[{ sel: wIdA, setSel: setWIdA, other: wIdB, label: "Asset_Alpha", color: "primary" },
          { sel: wIdB, setSel: setWIdB, other: wIdA, label: "Asset_Beta", color: "accent" }].map(({ sel, setSel, other, label, color }) => (
          <div key={label} className="space-y-4">
            <div className="flex items-center gap-3 px-2">
               <div className={cn(
                 "p-1 px-2 rounded-md border",
                 color === "primary" ? "bg-primary/10 border-primary/20 text-primary" : "bg-accent/10 border-accent/20 text-accent"
               )}>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">{label}</span>
               </div>
               <div className={cn(
                 "h-px flex-1 bg-gradient-to-r via-border/20 to-transparent",
                 color === "primary" ? "from-primary/20" : "from-accent/20"
               )} />
            </div>
            
            <div className="grid grid-cols-1 gap-1.5 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {allWarriors.map(({ warrior: w, stable }) => (
                <Tooltip key={w.id}>
                  <TooltipTrigger asChild>
                    <button
                      aria-label={`Select ${w.name} from ${stable} for ${label} position`}
                      onClick={() => setSel(w.id === sel ? null : w.id)}
                      disabled={w.id === other}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border transition-all relative outline-none",
                        sel === w.id
                          ? color === "primary" 
                            ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]" 
                            : "border-accent bg-accent/10 shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)]"
                          : w.id === other
                          ? "border-white/5 opacity-10 cursor-not-allowed grayscale"
                          : "border-white/5 bg-neutral-900/60 hover:border-white/20 hover:bg-white/5"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <WarriorNameTag id={w.id} name={w.name} useCrown={false} />
                        <StatBadge styleName={w.style as import("@/types/game").FightingStyle} />
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-widest">{stable}</span>
                         {sel === w.id && <Hexagon className={cn("h-3 w-3 animate-pulse", color === "primary" ? "text-primary" : "text-accent")} />}
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side={label === "Asset_Alpha" ? "left" : "right"} className="bg-neutral-950 border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest">ASSIGN_TO_{label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        ))}
      </div>

      {entryA && entryB && (
        <div className="space-y-6">
          <Surface variant="glass" padding="none" className="border-border/40 relative overflow-hidden flex items-center justify-between p-8">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            
            <div className="text-center flex-1 relative z-10 space-y-3">
              <h4 className="text-[9px] font-black tracking-[0.4em] text-primary uppercase leading-none opacity-40">Personnel_Alpha</h4>
              <h3 className="font-display font-black uppercase text-xl tracking-tighter text-foreground leading-none">{entryA.warrior.name}</h3>
              <div className="flex flex-col items-center gap-1">
                 <span className="text-[9px] text-muted-foreground/60 font-black tracking-widest uppercase">{STYLE_DISPLAY_NAMES[entryA.warrior.style as keyof typeof STYLE_DISPLAY_NAMES] ?? entryA.warrior.style}</span>
                 <span className="text-[8px] text-primary font-bold uppercase tracking-tighter opacity-40">{entryA.stable}</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center mx-12 relative z-10">
               <div className="p-3 rounded-full bg-neutral-900 border border-white/5 shadow-inner">
                  <Swords className="h-5 w-5 text-muted-foreground/60" />
               </div>
               <span className="text-[9px] font-black text-muted-foreground/20 tracking-[0.5em] uppercase mt-4">SYNC</span>
            </div>

            <div className="text-center flex-1 relative z-10 space-y-3">
              <h4 className="text-[9px] font-black tracking-[0.4em] text-accent uppercase leading-none opacity-40">Personnel_Beta</h4>
              <h3 className="font-display font-black uppercase text-xl tracking-tighter text-foreground leading-none">{entryB.warrior.name}</h3>
              <div className="flex flex-col items-center gap-1">
                 <span className="text-[9px] text-muted-foreground/60 font-black tracking-widest uppercase">{STYLE_DISPLAY_NAMES[entryB.warrior.style as keyof typeof STYLE_DISPLAY_NAMES] ?? entryB.warrior.style}</span>
                 <span className="text-[8px] text-accent font-bold uppercase tracking-tighter opacity-40">{entryB.stable}</span>
              </div>
            </div>
          </Surface>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Surface variant="glass" className="border-border/40 space-y-6">
               <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                     <BarChart3 className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Attribute Matrix</h3>
               </div>
               <div className="space-y-4">
                  {ATTRIBUTE_KEYS.map(key => (
                    <ComparisonBar 
                      key={key} 
                      label={key} 
                      valA={entryA.warrior.attributes[key] ?? 0} 
                      valB={entryB.warrior.attributes[key] ?? 0} 
                      maxVal={25} 
                      colorA="bg-primary" 
                      colorB="bg-accent" 
                    />
                  ))}
               </div>
            </Surface>

            <Surface variant="glass" className="border-border/40 space-y-6">
               <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                     <TrendingUp className="h-4 w-4 text-accent" />
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Career Trajectory</h3>
               </div>
               <div className="space-y-4">
                  <ComparisonBar label="Wins" valA={entryA.warrior.career.wins} valB={entryB.warrior.career.wins} maxVal={Math.max(entryA.warrior.career.wins, entryB.warrior.career.wins, 1)} colorA="bg-primary" colorB="bg-accent" />
                  <ComparisonBar label="Losses" valA={entryA.warrior.career.losses} valB={entryB.warrior.career.losses} maxVal={Math.max(entryA.warrior.career.losses, entryB.warrior.career.losses, 1)} colorA="bg-primary" colorB="bg-accent" />
                  <ComparisonBar label="Fatalities" valA={entryA.warrior.career.kills} valB={entryB.warrior.career.kills} maxVal={Math.max(entryA.warrior.career.kills, entryB.warrior.career.kills, 1)} colorA="bg-primary" colorB="bg-accent" />
                  <ComparisonBar label="Prestige" valA={entryA.warrior.fame ?? 0} valB={entryB.warrior.fame ?? 0} maxVal={Math.max(entryA.warrior.fame ?? 0, entryB.warrior.fame ?? 0, 1)} colorA="bg-primary" colorB="bg-accent" />
                  <ComparisonBar label="Popularity" valA={entryA.warrior.popularity ?? 0} valB={entryB.warrior.popularity ?? 0} maxVal={Math.max(entryA.warrior.popularity ?? 0, entryB.warrior.popularity ?? 0, 1)} colorA="bg-primary" colorB="bg-accent" />
               </div>
            </Surface>
          </div>
        </div>
      )}

      {(!entryA || !entryB) && (
        <Surface variant="glass" className="py-24 text-center border-dashed border-border/40 flex flex-col items-center gap-4">
          <Crosshair className="h-12 w-12 text-muted-foreground opacity-20" />
          <div className="space-y-1">
            <p className="text-sm font-display font-black uppercase tracking-tight text-muted-foreground">Target Acquisition Pending</p>
            <p className="text-xs text-muted-foreground/60 italic">Select two personnel markers from the tactile grid to establish engagement analysis.</p>
          </div>
        </Surface>
      )}
    </div>
  );
}
