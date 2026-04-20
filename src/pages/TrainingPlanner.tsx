/**
 * Training Planner — Trainability advisor with potential ceilings,
 * burn warnings, and seasonal cap visualization.
 */
import React, { useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import {
  ATTRIBUTE_KEYS, ATTRIBUTE_LABELS, STYLE_DISPLAY_NAMES,
  type Attributes, type FightingStyle
} from "@/types/shared.types";
import type { Warrior } from "@/types/state.types";
import { computeGainChance } from "@/engine/training";
import { potentialRating, potentialGrade, diminishingReturnsFactor } from "@/engine/potential";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dumbbell, AlertTriangle, Lock, Star, BarChart3, Target, Activity
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Surface } from "@/components/ui/Surface";
import { cn } from "@/lib/utils";
import { WarriorLink } from "@/components/EntityLink";

/* ── Burn Risk Assessment ──────────────────────────────── */

interface BurnWarning {
  attribute: keyof Attributes;
  reason: string;
  severity: "low" | "medium" | "high";
}

function assessBurnRisks(warrior: Warrior, trainers: import("@/types/shared.types").Trainer[]): BurnWarning[] {
  const warnings: BurnWarning[] = [];
  const age = warrior.age ?? 18;

  for (const key of ATTRIBUTE_KEYS) {
    if (key === "SZ") continue;

    const val = warrior.attributes[key];
    const pot = warrior.potential?.[key];
    const chance = computeGainChance(warrior, key, trainers);

    // At or near potential ceiling
    if (pot !== undefined) {
      if (val >= pot) {
        warnings.push({ attribute: key, reason: `At potential ceiling (${pot})`, severity: "high" });
      } else if (val >= pot - 1) {
        warnings.push({ attribute: key, reason: `1 point from ceiling (${pot})`, severity: "medium" });
      }
    }

    // Very low gain chance
    if (chance < 0.2 && val < 25) {
      warnings.push({ attribute: key, reason: `Very low gain chance (${Math.round(chance * 100)}%)`, severity: "medium" });
    }

    // Age penalty
    if (age > 30) {
      warnings.push({ attribute: key, reason: `Age penalty active (age ${age})`, severity: "low" });
    }
  }

  return warnings;
}

/* ── Trainability Score ──────────────────────────────────── */

function computeTrainability(warrior: Warrior, trainers: import("@/types/shared.types").Trainer[]): number {
  let totalChance = 0;
  let trainable = 0;
  for (const key of ATTRIBUTE_KEYS) {
    if (key === "SZ") continue;
    const val = warrior.attributes[key];
    const pot = warrior.potential?.[key];
    if (val >= 25 || (pot !== undefined && val >= pot)) continue;
    totalChance += computeGainChance(warrior, key, trainers);
    trainable++;
  }
  return trainable > 0 ? Math.round((totalChance / trainable) * 100) : 0;
}

/* ── Burn Warnings Component ──────────────────────────────── */

function BurnWarnings({ burns }: { burns: BurnWarning[] }) {
  const visibleBurns = burns.filter(b => b.severity !== "low");
  if (visibleBurns.length === 0) return null;

  return (
    <div className="mt-3 pt-2 border-t border-border/50 space-y-1">
      {visibleBurns.map((b, i) => (
        <div key={i} className={`flex items-center gap-2 text-[10px] ${
          b.severity === "high" ? "text-destructive" : "text-amber-500"
        }`}>
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <span className="font-medium">{ATTRIBUTE_LABELS[b.attribute]}:</span>
          <span>{b.reason}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Attribute Row Component ─────────────────────────────── */

function AttributeRow({ attr }: { attr: {
  key: keyof Attributes;
  val: number;
  pot?: number;
  chance: number;
  seasonGain: number;
  capped: boolean;
  seasonCapped: boolean;
  drFactor: number;
} }) {
  const chancePct = Math.round(attr.chance * 100);
  const isRecommended = !attr.capped && !attr.seasonCapped && attr.chance >= 0.4;

  return (
    <div className={`flex items-center gap-2 py-1 px-2 rounded ${attr.capped ? "opacity-40" : ""}`}>
      <span className="text-xs w-16 font-medium flex items-center gap-1">
        {attr.key === "SZ" && <Lock className="h-2.5 w-2.5" />}
        {ATTRIBUTE_LABELS[attr.key]}
      </span>

      {/* Current / Potential bar */}
      <div className="flex-1 relative">
        <div className="h-3 bg-muted rounded-full overflow-hidden relative">
          {/* Potential ceiling indicator */}
          {attr.pot !== undefined && (
            <div
              className="absolute top-0 h-full border-r-2 border-arena-gold/50"
              style={{ left: `${(attr.pot / 25) * 100}%` }}
            />
          )}
          {/* Current value */}
          <div
            className={`h-full rounded-full transition-all ${
              attr.capped ? "bg-muted-foreground/30" :
              attr.drFactor < 0.5 ? "bg-amber-500/70" :
              "bg-primary"
            }`}
            style={{ width: `${(attr.val / 25) * 100}%` }}
          />
        </div>
      </div>

      <span className="text-xs font-mono w-5 text-right">{attr.val}</span>
      {attr.pot !== undefined && (
        <span className="text-[9px] font-mono text-arena-gold w-5 text-right">/{attr.pot}</span>
      )}

      {/* Gain chance */}
      {!attr.capped ? (
        <span className={`text-[10px] font-mono w-10 text-right ${
          chancePct >= 50 ? "text-arena-pop" :
          chancePct >= 30 ? "text-foreground" :
          "text-destructive"
        }`}>
          {chancePct}%
        </span>
      ) : (
        <span className="text-[9px] text-muted-foreground w-10 text-right">MAX</span>
      )}

      {/* Season progress */}
      <div className="w-10 flex gap-0.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < attr.seasonGain ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {isRecommended && <Target className="h-3 w-3 text-arena-pop shrink-0" />}
    </div>
  );
}

/* ── Warrior Planner Card ────────────────────────────────── */

function WarriorPlannerCard({ warrior, trainers, season, seasonalGains }: {
  warrior: Warrior;
  trainers: import("@/types/shared.types").Trainer[];
  season: string;
  seasonalGains: Partial<Record<keyof Attributes, number>>;
}) {
  const burns = useMemo(() => assessBurnRisks(warrior, trainers), [warrior, trainers]);
  const trainability = useMemo(() => computeTrainability(warrior, trainers), [warrior, trainers]);
  const potRating = warrior.potential ? potentialRating(warrior.potential) : null;
  const potGrade = potRating !== null ? potentialGrade(potRating) : null;

  const highBurns = burns.filter(b => b.severity === "high").length;
  const medBurns = burns.filter(b => b.severity === "medium").length;

  const total = ATTRIBUTE_KEYS.reduce((s, k) => s + warrior.attributes[k], 0);

  // Best attributes to train (sorted by gain chance descending, excluding capped)
  const ranked = ATTRIBUTE_KEYS
    .filter((k): k is Exclude<keyof Attributes, "SZ"> => k !== "SZ")
    .map(k => ({
      key: k as keyof Attributes,
      val: warrior.attributes[k],
      pot: warrior.potential?.[k],
      chance: computeGainChance(warrior, k, trainers),
      seasonGain: seasonalGains[k] ?? 0,
      capped: warrior.attributes[k] >= 25 || (warrior.potential?.[k] !== undefined && warrior.attributes[k] >= (warrior.potential?.[k] ?? 0)),
      seasonCapped: (seasonalGains[k] ?? 0) >= 3,
      drFactor: diminishingReturnsFactor(warrior.attributes[k], warrior.potential?.[k]),
    }))
    .sort((a, b) => {
      if (a.capped && !b.capped) return 1;
      if (!a.capped && b.capped) return -1;
      return b.chance - a.chance;
    });

  const gradeColors: Record<string, string> = {
    S: "text-arena-gold",
    A: "text-primary",
    B: "text-arena-pop",
    C: "text-muted-foreground",
    D: "text-destructive",
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="font-display text-base">
              <WarriorLink name={warrior.name} id={warrior.id}>{warrior.name}</WarriorLink>
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono">
              {STYLE_DISPLAY_NAMES[warrior.style as FightingStyle]}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {potGrade && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className={`text-xs font-mono ${gradeColors[potGrade] ?? ""}`}>
                      <Star className="h-3 w-3 mr-0.5" /> {potGrade}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    Potential Rating: {potRating}/100 (Grade {potGrade})
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Badge variant={trainability >= 50 ? "default" : trainability >= 30 ? "secondary" : "outline"} className="text-[10px] font-mono">
              {trainability}% trainable
            </Badge>
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground flex gap-3 mt-1">
          <span>Age {warrior.age ?? "?"}</span>
          <span>Total: {total}/80</span>
          {highBurns > 0 && <span className="text-destructive">⚠ {highBurns} at ceiling</span>}
          {medBurns > 0 && <span className="text-amber-500">⚡ {medBurns} warnings</span>}
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 pt-2">
        {ranked.map(attr => (
          <AttributeRow key={attr.key} attr={attr} />
        ))}

        <BurnWarnings burns={burns} />
      </CardContent>
    </Card>
  );
}

/* ── Main Page ───────────────────────────────────────────── */

export default function TrainingPlanner() {
  const { roster, trainers, seasonalGrowth, season } = useGameStore();
  const activeWarriors = roster.filter(w => w.status === "Active");
  const [selectedId, setSelectedId] = React.useState<string | null>(activeWarriors[0]?.id || null);
  
  const currentTrainers = useMemo(() => trainers ?? [], [trainers]);
  const selectedWarrior = activeWarriors.find(w => w.id === selectedId);

  const seasonalGainsMap = useMemo(() => {
    const map = new Map<string, Partial<Record<keyof Attributes, number>>>();
    const growth = (seasonalGrowth ?? []) as any[];
    for (const sg of growth) {
      if (sg.season === season) {
        map.set(sg.warriorId, sg.gains);
      }
    }
    return map;
  }, [seasonalGrowth, season]);

  // Overall stable trainability
  const avgTrainability = useMemo(() => {
    if (activeWarriors.length === 0) return 0;
    return Math.round(
      activeWarriors.reduce((s, w) => s + computeTrainability(w, currentTrainers), 0) / activeWarriors.length
    );
  }, [activeWarriors, currentTrainers]);

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      <PageHeader
        icon={BarChart3}
        title="Training Planner"
        subtitle="COMMAND · TACTICS · ATTRIBUTE DEVELOPMENT"
        actions={
          <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest bg-secondary/20 backdrop-blur-md px-6 py-3 border border-white/5">
            <div className="text-center">
              <div className="text-xl font-display font-black text-primary">{avgTrainability}%</div>
              <div className="text-muted-foreground/50">AVG TRAINABILITY</div>
            </div>
            <div className="text-center ml-6 border-l border-white/10 pl-6">
              <div className="text-xl font-display font-black">{activeWarriors.length}</div>
              <div className="text-muted-foreground/50">ACTIVE</div>
            </div>
            <div className="text-center ml-6 border-l border-white/10 pl-6">
              <div className="text-xl font-display font-black">{currentTrainers.filter(t => t.contractWeeksLeft > 0).length}</div>
              <div className="text-muted-foreground/50">TRAINERS</div>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Archetype D: Left Rail Roster (span-4) */}
        <aside className="lg:col-span-4 space-y-4 sticky top-6">
           <div className="flex items-center gap-3 px-2">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">STABLE_ROSTER</span>
              <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
           </div>
           
           <Surface variant="glass" className="p-0 border-white/5 max-h-[700px] overflow-y-auto thin-scrollbar">
              {activeWarriors.map(warrior => {
                const isSelected = warrior.id === selectedId;
                const trainability = computeTrainability(warrior, currentTrainers);
                
                return (
                  <button
                    key={warrior.id}
                    onClick={() => setSelectedId(warrior.id)}
                    className={cn(
                      "w-full text-left p-4 border-b border-white/5 last:border-0 flex items-center gap-3 transition-all",
                      isSelected ? "bg-primary/10 border-l-4 border-l-primary" : "hover:bg-white/[0.02]"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-black uppercase truncate", isSelected ? "text-primary" : "")}>{warrior.name}</p>
                      <p className="text-[9px] text-muted-foreground uppercase mt-1">Trainability: {trainability}%</p>
                    </div>
                    {isSelected && <Activity className="h-3.5 w-3.5 text-primary animate-pulse" />}
                  </button>
                );
              })}
           </Surface>
        </aside>

        {/* Right Rail Viewport (span-8) */}
        <main className="lg:col-span-8">
           {selectedWarrior ? (
             <div className="space-y-6">
                <WarriorPlannerCard
                  warrior={selectedWarrior}
                  trainers={currentTrainers}
                  season={season}
                  seasonalGains={seasonalGainsMap.get(selectedWarrior.id) ?? {}}
                />
                
                <Surface variant="glass" className="flex flex-wrap gap-8 p-6 bg-secondary/10">
                   <div className="flex flex-col gap-2">
                      <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">Growth Markers</span>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                          <div className="h-2 w-4 bg-primary" /> Current
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                          <div className="h-2 w-0.5 border-r-2 border-arena-gold" /> Potential
                        </div>
                      </div>
                   </div>
                   
                   <div className="h-10 w-px bg-white/5" />
                   
                   <div className="flex flex-col gap-2">
                       <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">Advisory</span>
                       <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                        <Target className="h-3.5 w-3.5 text-arena-pop" /> Optimized Gain Path
                      </div>
                   </div>
                </Surface>
             </div>
           ) : (
             <Surface variant="glass" className="py-32 text-center border-dashed">
                <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-10" />
                <p className="font-display font-black uppercase tracking-widest text-sm text-muted-foreground/30">Select_Warrior_To_Plan</p>
             </Surface>
           )}
        </main>
      </div>
    </div>
  );
}
