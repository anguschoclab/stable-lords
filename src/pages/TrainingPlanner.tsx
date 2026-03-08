/**
 * Training Planner — Trainability advisor with potential ceilings,
 * burn warnings, and seasonal cap visualization.
 */
import React, { useMemo } from "react";
import { useGame } from "@/state/GameContext";
import {
  ATTRIBUTE_KEYS, ATTRIBUTE_LABELS, STYLE_DISPLAY_NAMES,
  type Warrior, type Attributes,
} from "@/types/game";
import { computeGainChance } from "@/engine/training";
import { potentialRating, potentialGrade, diminishingReturnsFactor, canGrow } from "@/engine/potential";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dumbbell, AlertTriangle, TrendingUp, Flame, Lock, Star, BarChart3, Target,
} from "lucide-react";
import { WarriorLink } from "@/components/EntityLink";

/* ── Burn Risk Assessment ──────────────────────────────── */

interface BurnWarning {
  attribute: keyof Attributes;
  reason: string;
  severity: "low" | "medium" | "high";
}

function assessBurnRisks(warrior: Warrior, trainers: any[]): BurnWarning[] {
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

function computeTrainability(warrior: Warrior, trainers: any[]): number {
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

/* ── Warrior Planner Card ────────────────────────────────── */

function WarriorPlannerCard({ warrior, trainers, season, seasonalGains }: {
  warrior: Warrior;
  trainers: any[];
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
    .filter(k => k !== "SZ")
    .map(k => ({
      key: k,
      val: warrior.attributes[k],
      pot: warrior.potential?.[k],
      chance: computeGainChance(warrior, k, trainers),
      seasonGain: seasonalGains[k] ?? 0,
      capped: warrior.attributes[k] >= 25 || (warrior.potential?.[k] !== undefined && warrior.attributes[k] >= warrior.potential![k]),
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
              {STYLE_DISPLAY_NAMES[warrior.style]}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {potGrade && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger>
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
        {ranked.map(attr => {
          const chancePct = Math.round(attr.chance * 100);
          const isRecommended = !attr.capped && !attr.seasonCapped && attr.chance >= 0.4;

          return (
            <div key={attr.key} className={`flex items-center gap-2 py-1 px-2 rounded ${attr.capped ? "opacity-40" : ""}`}>
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
        })}

        {/* Burn Warnings */}
        {burns.filter(b => b.severity !== "low").length > 0 && (
          <div className="mt-3 pt-2 border-t border-border/50 space-y-1">
            {burns.filter(b => b.severity !== "low").map((b, i) => (
              <div key={i} className={`flex items-center gap-2 text-[10px] ${
                b.severity === "high" ? "text-destructive" : "text-amber-500"
              }`}>
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span className="font-medium">{ATTRIBUTE_LABELS[b.attribute]}:</span>
                <span>{b.reason}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Main Page ───────────────────────────────────────────── */

export default function TrainingPlanner() {
  const { state } = useGame();
  const activeWarriors = state.roster.filter(w => w.status === "Active");
  const trainers = state.trainers ?? [];

  const seasonalGainsMap = useMemo(() => {
    const map = new Map<string, Partial<Record<keyof Attributes, number>>>();
    for (const sg of (state.seasonalGrowth ?? [])) {
      if (sg.season === state.season) {
        map.set(sg.warriorId, sg.gains);
      }
    }
    return map;
  }, [state.seasonalGrowth, state.season]);

  // Overall stable trainability
  const avgTrainability = useMemo(() => {
    if (activeWarriors.length === 0) return 0;
    return Math.round(
      activeWarriors.reduce((s, w) => s + computeTrainability(w, trainers), 0) / activeWarriors.length
    );
  }, [activeWarriors, trainers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-secondary via-card to-secondary p-6 sm:p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-wide">Training Planner</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl">
            Analyze potential ceilings, identify training burn risks, and plan optimal attribute development.
            <span className="text-foreground/70"> Green dots show seasonal cap progress (3/season).</span>
          </p>
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-primary">{avgTrainability}%</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Trainability</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-foreground">{activeWarriors.length}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Active Warriors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-muted-foreground">{trainers.filter(t => t.contractWeeksLeft > 0).length}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Active Trainers</div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="p-3 flex flex-wrap gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><div className="h-2 w-4 bg-primary rounded-full" /> Current</span>
          <span className="flex items-center gap-1"><div className="h-2 w-0.5 border-r-2 border-arena-gold/50" /> Potential Ceiling</span>
          <span className="flex items-center gap-1"><div className="h-2 w-4 bg-amber-500/70 rounded-full" /> Diminishing Returns</span>
          <span className="flex items-center gap-1"><Target className="h-3 w-3 text-arena-pop" /> Recommended</span>
          <span className="flex items-center gap-1">
            <div className="flex gap-0.5">{[0,1,2].map(i => <div key={i} className="h-1.5 w-2 rounded-full bg-muted" />)}</div>
            Season Progress (0/3)
          </span>
        </CardContent>
      </Card>

      {/* Warrior Cards */}
      {activeWarriors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Dumbbell className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No active warriors. Recruit some first!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {activeWarriors.map(warrior => (
            <WarriorPlannerCard
              key={warrior.id}
              warrior={warrior}
              trainers={trainers}
              season={state.season}
              seasonalGains={seasonalGainsMap.get(warrior.id) ?? {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}
