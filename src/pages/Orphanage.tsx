/**
 * Stable Lords — Orphanage FTUE Flow
 * Dynamic warrior selection → Tutorial bout → Summary
 */
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useGameStore } from "@/state/useGameStore";
import { makeWarrior } from "@/state/gameStore";
import { simulateFight, defaultPlanForWarrior } from "@/engine";
import { generateRivalStables } from "@/engine/rivals";
import { generateRecruitPool } from "@/engine/recruitment";
import { FightingStyle, STYLE_DISPLAY_NAMES, ATTRIBUTE_KEYS, ATTRIBUTE_LABELS, type Warrior, type FightSummary } from "@/types/game";
import { computeWarriorStats, DAMAGE_LABELS } from "@/engine/skillCalc";
import { generatePotential } from "@/engine/potential";
import { LoreArchive } from "@/lore/LoreArchive";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatBadge } from "@/components/ui/StatBadge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Swords, ArrowRight, ArrowLeft, Sparkles, Skull, Shield,
  CheckCircle2, Trophy, Zap, RefreshCw, User, MapPin, Brain,
} from "lucide-react";
import { generateOrphanPool } from "@/data/orphanPool";

const STEP_LABELS = ["Establish Identity", "Choose Warriors", "First Blood", "Your Story Begins"];

export default function Orphanage() {
  const { state, doInitializeStable, doDraftInitialRoster, setState, returnToTitle } = useGameStore();
  
  const initialStep = !state.player.stableName ? 0 : 1;
  const [step, setStep] = useState(initialStep);
  const [stableInput, setStableInput] = useState(state.player.stableName || "");
  const [ownerInput, setOwnerInput] = useState(state.player.name || "");
  
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [poolSeed, setPoolSeed] = useState(() => Date.now());
  const [boutResult, setBoutResult] = useState<{
    a: Warrior; d: Warrior;
    outcome: ReturnType<typeof simulateFight>;
    summary: FightSummary;
  } | null>(null);

  // Dynamic orphan pool
  const orphanPool = useMemo(() => generateOrphanPool(8, poolSeed), [poolSeed]);

  const stableName = state.player.stableName;
  const ownerName = state.player.name;

  const rerollPool = useCallback(() => {
    setPoolSeed(Date.now());
    setSelected(new Set());
  }, []);

  const toggleWarrior = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 3) next.add(id);
      return next;
    });
  }, []);

  const selectedWarriors = useMemo(
    () => orphanPool.filter((w) => selected.has(w.id)),
    [selected, orphanPool]
  );

  const runTutorialBout = useCallback(() => {
    if (selectedWarriors.length < 2) return;
    const [poolA, poolB] = selectedWarriors;
    const wA = makeWarrior(poolA.id, poolA.name, poolA.style, poolA.attrs);
    const wB = makeWarrior(poolB.id, poolB.name, poolB.style, poolB.attrs);
    const planA = defaultPlanForWarrior(wA);
    const planB = defaultPlanForWarrior(wB);
    const outcome = simulateFight(planA, planB, wA, wB);
    const tags = outcome.post?.tags ?? [];

    const summary: FightSummary = {
      id: `ftue_${Date.now()}`,
      week: 1,
      phase: "resolution",
      title: `${wA.name} vs ${wB.name}`,
      a: wA.name,
      d: wB.name,
      winner: outcome.winner,
      by: outcome.by,
      styleA: wA.style,
      styleD: wB.style,
      flashyTags: tags,
      fameDeltaA: outcome.winner === "A" ? 1 : 0,
      fameDeltaD: outcome.winner === "D" ? 1 : 0,
      transcript: outcome.log.map((e) => e.text),
      createdAt: new Date().toISOString(),
    };

    setBoutResult({ a: wA, d: wB, outcome, summary });
  }, [selectedWarriors]);

  const finishFTUE = useCallback(() => {
    let seed = Date.now();
    const rng = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

    const warriors = selectedWarriors.map((pw) => {
      const potential = generatePotential(pw.attrs, "Promising", rng);
      const w = makeWarrior(
        `w_${Date.now()}_${Math.floor(Math.random() * 1e5)}_${pw.id}`,
        pw.name,
        pw.style,
        pw.attrs,
        { potential, age: pw.age }
      );
      if (boutResult) {
        const wasA = pw.name === boutResult.a.name;
        const wasD = pw.name === boutResult.d.name;
        if (wasA || wasD) {
          const won = (wasA && boutResult.outcome.winner === "A") || (wasD && boutResult.outcome.winner === "D");
          const killed = boutResult.outcome.by === "Kill" && won;
          return {
            ...w,
            fame: won ? 1 : 0,
            popularity: won ? 1 : 0,
            career: { wins: won ? 1 : 0, losses: won ? 0 : 1, kills: killed ? 1 : 0 },
            flair: (boutResult.outcome.post?.tags ?? []).includes("Flashy") && won ? ["Flashy"] : [],
          };
        }
      }
      return w;
    });

    const deadWarriorName = boutResult?.outcome.by === "Kill"
      ? (boutResult.outcome.winner === "A" ? boutResult.d.name : boutResult.a.name)
      : null;

    const aliveWarriors = warriors.filter((w) => w.name !== deadWarriorName);
    const deadWarriors = warriors
      .filter((w) => w.name === deadWarriorName)
      .map((w) => ({
        ...w,
        status: "Dead" as const,
        deathWeek: 1,
        deathCause: "Killed in first arena bout",
        killedBy: boutResult?.outcome.winner === "A" ? boutResult.a.name : boutResult?.d.name,
        isDead: true,
        dateOfDeath: `Week 1, ${state.season}`,
      }));

    const generatedRivals = generateRivalStables(23, Date.now());
    const rivals = generatedRivals.map((r) => ({
      owner: r.owner,
      roster: r.roster,
      motto: r.template.motto,
      origin: r.template.origin,
      philosophy: r.template.philosophy,
      tier: r.template.tier,
    }));

    const usedNames = new Set<string>();
    aliveWarriors.forEach(w => usedNames.add(w.name));
    deadWarriors.forEach(w => usedNames.add(w.name));
    rivals.forEach(r => r.roster.forEach(w => usedNames.add(w.name)));

    const recruitPool = generateRecruitPool(100, 1, usedNames, Date.now() + 1);

    const newState = {
      ...state,
      isFTUE: false,
      ftueComplete: true,
      roster: aliveWarriors,
      graveyard: [...state.graveyard, ...deadWarriors],
      rivals,
      recruitPool,
      arenaHistory: boutResult ? [boutResult.summary] : [],
    };

    if (boutResult) {
      LoreArchive.signalFight(boutResult.summary);
    }

    setState(newState);
  }, [state, setState, selectedWarriors, boutResult]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="font-display font-semibold text-foreground">{STEP_LABELS[step]}</span>
            <span>Step {step + 1} of {STEP_LABELS.length}</span>
          </div>
          <Progress value={((step + 1) / STEP_LABELS.length) * 100} className="h-2" />
        </div>

        {/* Step 0: Identity */}
        {step === 0 && (
          <Card className="border-primary/30">
            <CardHeader><CardTitle className="font-display text-xl">Establish Your Identity</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Name</label>
                <input type="text" value={ownerInput} onChange={(e) => setOwnerInput(e.target.value)}
                  className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm" placeholder="e.g. Master Thorne" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Stable Name</label>
                <input type="text" value={stableInput} onChange={(e) => setStableInput(e.target.value)}
                  className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm" placeholder="e.g. The Iron Sentinels" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={returnToTitle} className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>
                <Button disabled={!ownerInput.trim() || !stableInput.trim()} onClick={() => { doInitializeStable(ownerInput.trim(), stableInput.trim()); setStep(1); }} className="flex-1 gap-2">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Choose Warriors */}
        {step === 1 && (
          <div className="space-y-4">
            <Card className="border-primary/30">
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-sm mb-4">Choose 3 warriors to form your starting stable.</p>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono">{selected.size}/3 selected</Badge>
                  <Button variant="ghost" size="sm" onClick={rerollPool} className="gap-1.5 text-xs text-muted-foreground"><RefreshCw className="h-3 w-3" /> New batch</Button>
                </div>
              </CardContent>
            </Card>
            <div className="grid gap-3">
              {orphanPool.map((pw) => {
                const isSelected = selected.has(pw.id);
                const stats = computeWarriorStats(pw.attrs, pw.style);
                return (
                  <Card key={pw.id} onClick={() => toggleWarrior(pw.id)} className={`cursor-pointer ${isSelected ? "border-primary bg-primary/5" : "hover:border-primary/30"}`}>
                    <CardContent className="p-4 flex flex-row justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-display font-bold">{pw.name}</span>
                          <StatBadge styleName={pw.style} variant="secondary" showFullName />
                        </div>
                        <p className="text-[11px] text-muted-foreground italic">{pw.lore}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-mono">HP: {stats.derivedStats.hp}</div>
                        <div className="text-[10px] font-mono">END: {stats.derivedStats.endurance}</div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(0)} className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>
              <Button onClick={() => { setStep(2); runTutorialBout(); }} disabled={selected.size < 3} className="flex-1 gap-2" size="lg">To the Arena <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {/* Step 2: First Blood */}
        {step === 2 && boutResult && (
          <div className="space-y-4">
            <Card className="border-primary/30"><CardHeader><CardTitle className="font-display text-xl">First Blood</CardTitle></CardHeader>
              <CardContent>
                <div className="text-center py-4 space-y-4">
                  <div className="flex justify-center gap-4 items-center">
                    <span className="font-display font-bold">{boutResult.a.name}</span>
                    <span className="text-muted-foreground">vs</span>
                    <span className="font-display font-bold">{boutResult.d.name}</span>
                  </div>
                  <Badge className={boutResult.outcome.by === "Kill" ? "bg-destructive" : "bg-primary"}>
                    {boutResult.outcome.winner ? `${boutResult.outcome.winner === "A" ? boutResult.a.name : boutResult.d.name} wins by ${boutResult.outcome.by}` : "Draw"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4" /> Back</Button>
              <Button onClick={() => setStep(3)} className="flex-1">Continue <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {/* Step 3: Finalize */}
        {step === 3 && (
          <Card className="border-primary/30">
            <CardHeader><CardTitle className="font-display text-2xl">Your Story Begins</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">Stable registered. Warriors chosen. The arena awaits.</p>
              <Button onClick={finishFTUE} className="w-full" size="lg"><Zap className="h-4 w-4 mr-2" /> Enter Arena Hub</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
