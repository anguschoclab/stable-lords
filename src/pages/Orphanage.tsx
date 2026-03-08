/**
 * Stable Lords — Orphanage FTUE Flow
 * Warrior selection → Tutorial bout → Summary
 * (Stable naming now handled on Start Game page)
 */
import React, { useState, useMemo, useCallback } from "react";
import { useGame } from "@/state/GameContext";
import { makeWarrior } from "@/state/gameStore";
import { simulateFight, defaultPlanForWarrior, fameFromTags } from "@/engine";
import { FightingStyle, STYLE_DISPLAY_NAMES, ATTRIBUTE_KEYS, ATTRIBUTE_LABELS, type Warrior, type FightSummary } from "@/types/game";
import { computeWarriorStats, DAMAGE_LABELS } from "@/engine/skillCalc";
import { LoreArchive } from "@/lore/LoreArchive";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Swords, ArrowRight, ArrowLeft, Sparkles, Skull, Shield, CheckCircle2, Trophy, Zap } from "lucide-react";

// ── Warrior Pool ────────────────────────────────────────────────────────────

interface PoolWarrior {
  id: string;
  name: string;
  style: FightingStyle;
  attrs: { ST: number; CN: number; SZ: number; WT: number; WL: number; SP: number; DF: number };
  lore: string;
}

const ORPHAN_POOL: PoolWarrior[] = [
  { id: "orp_1", name: "KRAGOS", style: FightingStyle.BashingAttack, attrs: { ST: 17, CN: 14, SZ: 12, WT: 7, WL: 11, SP: 5, DF: 4 }, lore: "A hulking youth raised in the quarry pits. Swings first, asks never." },
  { id: "orp_2", name: "SILVANE", style: FightingStyle.ParryRiposte, attrs: { ST: 9, CN: 8, SZ: 8, WT: 15, WL: 11, SP: 9, DF: 10 }, lore: "Quick-witted and patient. Waits for the perfect opening, then strikes." },
  { id: "orp_3", name: "THORNE", style: FightingStyle.LungingAttack, attrs: { ST: 12, CN: 9, SZ: 10, WT: 11, WL: 10, SP: 13, DF: 5 }, lore: "All speed, no fear. Dashes in with reckless abandon." },
  { id: "orp_4", name: "ASHARA", style: FightingStyle.AimedBlow, attrs: { ST: 8, CN: 7, SZ: 7, WT: 17, WL: 12, SP: 5, DF: 14 }, lore: "Precise and deadly. Targets weak points with surgical accuracy." },
  { id: "orp_5", name: "GORLAK", style: FightingStyle.WallOfSteel, attrs: { ST: 14, CN: 13, SZ: 11, WT: 9, WL: 13, SP: 5, DF: 5 }, lore: "An iron wall. Grinds opponents down through sheer attrition." },
  { id: "orp_6", name: "VEXIA", style: FightingStyle.SlashingAttack, attrs: { ST: 11, CN: 8, SZ: 9, WT: 10, WL: 10, SP: 11, DF: 11 }, lore: "Fluid and relentless. Her blade traces arcs that are beautiful and lethal." },
  { id: "orp_7", name: "FERRIK", style: FightingStyle.StrikingAttack, attrs: { ST: 15, CN: 11, SZ: 10, WT: 8, WL: 12, SP: 7, DF: 7 }, lore: "Solid fundamentals. A reliable fighter who lands clean, heavy strikes." },
  { id: "orp_8", name: "MORKA", style: FightingStyle.TotalParry, attrs: { ST: 7, CN: 16, SZ: 9, WT: 11, WL: 15, SP: 6, DF: 6 }, lore: "Impossible to put down. Endures punishment that would fell lesser warriors." },
];

const STEP_LABELS = ["Choose Warriors", "First Blood", "Your Story Begins"];

export default function Orphanage() {
  const { state, setState, returnToTitle } = useGame();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [boutResult, setBoutResult] = useState<{
    a: Warrior; d: Warrior;
    outcome: ReturnType<typeof simulateFight>;
    summary: FightSummary;
  } | null>(null);

  // Names come from state (set on start page)
  const stableName = state.player.stableName;
  const ownerName = state.player.name;

  // ── Step 0: Choose Warriors ──────────────────────────────────────────────

  const toggleWarrior = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 3) next.add(id);
      return next;
    });
  }, []);

  const selectedWarriors = useMemo(
    () => ORPHAN_POOL.filter((w) => selected.has(w.id)),
    [selected]
  );

  // ── Step 1: Tutorial Bout ────────────────────────────────────────────────

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

  // ── Step 2: Finalize & Enter Game ────────────────────────────────────────

  const finishFTUE = useCallback(() => {
    const warriors = selectedWarriors.map((pw) => {
      const w = makeWarrior(
        `w_${Date.now()}_${Math.floor(Math.random() * 1e5)}_${pw.id}`,
        pw.name,
        pw.style,
        pw.attrs
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
      }));

    const newState = {
      ...state,
      ftueComplete: true,
      ftueStep: undefined,
      fame: 1,
      popularity: 1,
      roster: aliveWarriors,
      graveyard: [...state.graveyard, ...deadWarriors],
      arenaHistory: boutResult ? [boutResult.summary] : [],
      newsletter: [
        {
          week: 1,
          title: "Arena Gazette",
          items: [
            `${stableName} enters the arena under ${ownerName}'s command!`,
            ...(boutResult
              ? [
                  `First bout: ${boutResult.a.name} vs ${boutResult.d.name} — ${
                    boutResult.outcome.winner
                      ? `${boutResult.outcome.winner === "A" ? boutResult.a.name : boutResult.d.name} wins by ${boutResult.outcome.by}`
                      : "Draw"
                  }${boutResult.outcome.by === "Kill" ? " ☠️" : ""}`,
                ]
              : []),
            `${aliveWarriors.length} warriors stand ready. The arena awaits.`,
          ],
        },
      ],
    };

    if (boutResult) {
      LoreArchive.signalFight(boutResult.summary);
    }

    setState(newState);
  }, [state, setState, selectedWarriors, boutResult, ownerName, stableName]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="font-display font-semibold text-foreground">{STEP_LABELS[step]}</span>
            <span>Step {step + 1} of {STEP_LABELS.length}</span>
          </div>
          <Progress value={((step + 1) / STEP_LABELS.length) * 100} className="h-2" />
        </div>

        {/* Step 0: Choose Warriors */}
        {step === 0 && (
          <div className="space-y-4">
            <Card className="border-primary/30">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  The Orphanage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-1">
                  Welcome, <span className="text-foreground font-semibold">{ownerName}</span> of <span className="text-foreground font-semibold">{stableName}</span>.
                </p>
                <p className="text-muted-foreground text-sm mb-4">
                  These orphans have been training for this moment. Choose <span className="text-foreground font-semibold">3 warriors</span> to
                  form your starting stable.
                </p>
                <Badge variant="outline" className="mb-4 font-mono">
                  {selected.size}/3 selected
                </Badge>
              </CardContent>
            </Card>

            <div className="grid gap-3">
              {ORPHAN_POOL.map((pw) => {
                const isSelected = selected.has(pw.id);
                const stats = computeWarriorStats(pw.attrs, pw.style);
                return (
                  <Card
                    key={pw.id}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary ring-1 ring-primary/50 bg-primary/5"
                        : selected.size >= 3
                        ? "opacity-50"
                        : "hover:border-primary/30"
                    }`}
                    onClick={() => toggleWarrior(pw.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                            <span className="font-display font-bold text-foreground">{pw.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {STYLE_DISPLAY_NAMES[pw.style]}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground italic mb-2">{pw.lore}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            {ATTRIBUTE_KEYS.map((k) => (
                              <span key={k}>
                                <span className="font-mono text-foreground/70">{k}</span>{" "}
                                <span className={pw.attrs[k] >= 13 ? "text-primary font-semibold" : pw.attrs[k] <= 6 ? "text-destructive" : ""}>
                                  {pw.attrs[k]}
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right text-xs space-y-1 ml-3">
                          <div>HP <span className="font-mono font-semibold">{stats.derivedStats.hp}</span></div>
                          <div>DMG <span className="font-mono font-semibold">{DAMAGE_LABELS[stats.derivedStats.damage]}</span></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={returnToTitle} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={() => { setStep(1); runTutorialBout(); }}
                disabled={selected.size < 3}
                className="flex-1 gap-2"
                size="lg"
              >
                <Swords className="h-4 w-4" />
                To the Arena — First Blood
              </Button>
            </div>
          </div>
        )}

        {/* Step 1: Tutorial Bout */}
        {step === 1 && boutResult && (
          <div className="space-y-4">
            <Card className="border-primary/30">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  <Swords className="h-5 w-5 text-primary" />
                  First Blood
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  The crowd roars as your first two warriors step into the arena. This is what it's all about.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display font-bold">{boutResult.a.name}</span>
                  <Badge variant="outline" className="text-xs">{STYLE_DISPLAY_NAMES[boutResult.a.style]}</Badge>
                  <span className="text-muted-foreground text-sm">vs</span>
                  <span className="font-display font-bold">{boutResult.d.name}</span>
                  <Badge variant="outline" className="text-xs">{STYLE_DISPLAY_NAMES[boutResult.d.style]}</Badge>
                </div>

                <div className="text-center py-4">
                  <Badge
                    className={`text-base px-4 py-1.5 ${
                      boutResult.outcome.by === "Kill"
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {boutResult.outcome.by === "Kill" && <Skull className="h-4 w-4 mr-1.5" />}
                    {boutResult.outcome.winner
                      ? `${boutResult.outcome.winner === "A" ? boutResult.a.name : boutResult.d.name} wins by ${boutResult.outcome.by}!`
                      : "Draw!"}
                  </Badge>
                  {boutResult.outcome.by === "Kill" && (
                    <p className="text-sm text-destructive mt-2">
                      {boutResult.outcome.winner === "A" ? boutResult.d.name : boutResult.a.name} has fallen. The arena claims its first blood.
                    </p>
                  )}
                </div>

                {(boutResult.outcome.post?.tags ?? []).length > 0 && (
                  <div className="flex gap-2 justify-center">
                    {(boutResult.outcome.post?.tags ?? []).map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs gap-1">
                        <Sparkles className="h-3 w-3" /> {t}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="space-y-1 text-sm text-muted-foreground border-l-2 border-primary/20 pl-3 max-h-[200px] overflow-y-auto">
                  {boutResult.outcome.log.map((e, j) => (
                    <p key={j}>
                      <span className="text-xs text-muted-foreground/60 mr-2">Min {e.minute}</span>
                      {e.text}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(0)} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={() => setStep(2)}
                className="flex-1 gap-2"
                size="lg"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Summary & Enter Game */}
        {step === 2 && (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="font-display text-2xl flex items-center gap-3">
                <Trophy className="h-6 w-6 text-primary" />
                Your Story Begins
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                <span className="text-foreground font-semibold">{stableName}</span> is registered.
                The crowd knows your name. The Gazette has printed your first headline.
                Now — forge legends.
              </p>

              <div className="space-y-3">
                <div className="rounded-lg bg-secondary p-4 border border-border">
                  <div className="text-xs text-muted-foreground mb-1">Stable Master</div>
                  <div className="font-display font-semibold">{ownerName}</div>
                </div>
                <div className="rounded-lg bg-secondary p-4 border border-border">
                  <div className="text-xs text-muted-foreground mb-1">Starting Roster</div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedWarriors.map((pw) => {
                      const isDead = boutResult?.outcome.by === "Kill" &&
                        ((boutResult.outcome.winner === "A" && pw.name === boutResult.d.name) ||
                         (boutResult.outcome.winner === "D" && pw.name === boutResult.a.name));
                      return (
                        <Badge key={pw.id} variant={isDead ? "destructive" : "outline"} className="gap-1.5">
                          {isDead && <Skull className="h-3 w-3" />}
                          {pw.name}
                          <span className="text-muted-foreground">{STYLE_DISPLAY_NAMES[pw.style]}</span>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                {boutResult && (
                  <div className="rounded-lg bg-secondary p-4 border border-border">
                    <div className="text-xs text-muted-foreground mb-1">First Bout Result</div>
                    <div className="text-sm">
                      {boutResult.outcome.winner
                        ? `${boutResult.outcome.winner === "A" ? boutResult.a.name : boutResult.d.name} defeated ${
                            boutResult.outcome.winner === "A" ? boutResult.d.name : boutResult.a.name
                          } by ${boutResult.outcome.by}`
                        : "Draw"}
                    </div>
                  </div>
                )}
              </div>

              <Button onClick={finishFTUE} className="w-full gap-2" size="lg">
                <Zap className="h-4 w-4" />
                Enter the Arena Hub
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
