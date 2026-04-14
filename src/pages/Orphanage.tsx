/**
 * Stable Lords — Orphanage FTUE Flow
 * Codex Sanguis design: Roman enrollment / gladiatorial intake aesthetic
 * Dynamic warrior selection → Tutorial bout → Summary
 */
import React, { useState, useMemo, useCallback } from "react";
import { useGameStore } from "@/state/useGameStore";
import { makeWarrior } from "@/engine/factories";
import { simulateFight, defaultPlanForWarrior } from "@/engine";
import { generateRivalStables } from "@/engine/rivals";
import { generateRecruitPool } from "@/engine/recruitment";
import {
  FightingStyle, STYLE_DISPLAY_NAMES, ATTRIBUTE_KEYS, ATTRIBUTE_LABELS,
  type Warrior, type FightSummary,
} from "@/types/game";
import { computeWarriorStats } from "@/engine/skillCalc";
import { generatePotential } from "@/engine/potential";
import { SeededRNGService } from "@/engine/core/rng/SeededRNGService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatBadge } from "@/components/ui/WarriorBadges";
import { Progress } from "@/components/ui/progress";
import {
  Swords, ArrowRight, ArrowLeft, Skull,
  CheckCircle2, Zap, RefreshCw, Flame,
} from "lucide-react";
import { generateOrphanPool } from "@/data/orphanPool";

const STEP_LABELS = [
  "Establish Identity",
  "Choose Warriors",
  "First Blood",
  "Your Story Begins",
];

const STEP_SUBTITLES = [
  "Register your name in the Imperial Ledger",
  "Select three gladiators from the intake pool",
  "Witness the first trial of steel",
  "Your dynasty of blood begins now",
];

// ─── Ornamental Step Progress ──────────────────────────────────────────────────

function StepProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="space-y-2">
      {/* Step indicator row */}
      <div className="flex items-center justify-between">
        <div>
          <span className="font-display font-bold text-sm text-foreground">
            {STEP_LABELS[step]}
          </span>
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mt-0.5">
            {STEP_SUBTITLES[step]}
          </p>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground/40 font-black uppercase tracking-widest">
          {step + 1} / {total}
        </span>
      </div>
      {/* Warm amber progress bar */}
      <div className="h-1 bg-[#1A1208] border border-[rgba(60,42,22,0.5)] overflow-hidden">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${((step + 1) / total) * 100}%`,
            background:
              "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--accent)/0.8) 100%)",
            boxShadow: "0 0 8px hsl(var(--accent)/0.3)",
          }}
        />
      </div>
    </div>
  );
}

// ─── Warrior Registration Card ─────────────────────────────────────────────────

function WarriorCard({
  warrior,
  isSelected,
  canSelect,
  onClick,
}: {
  warrior: ReturnType<typeof generateOrphanPool>[number];
  isSelected: boolean;
  canSelect: boolean;
  onClick: () => void;
}) {
  const stats = computeWarriorStats(warrior.attrs, warrior.style);

  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer transition-all duration-200 group ${
        !canSelect && !isSelected ? "opacity-50 pointer-events-none" : ""
      }`}
      style={{
        background: isSelected
          ? "linear-gradient(145deg, rgba(135,34,40,0.12) 0%, rgba(135,34,40,0.06) 100%)"
          : "linear-gradient(145deg, #150F08 0%, #110C07 100%)",
        border: isSelected
          ? "1px solid rgba(135,34,40,0.5)"
          : "1px solid rgba(60,42,22,0.7)",
        borderTopColor: isSelected
          ? "rgba(200,80,88,0.4)"
          : "rgba(100,70,36,0.35)",
      }}
    >
      {/* Selected indicator — crimson top line */}
      {isSelected && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{
            background:
              "linear-gradient(90deg, transparent, hsl(var(--primary)/0.8) 30%, hsl(var(--primary)) 50%, hsl(var(--primary)/0.8) 70%, transparent)",
          }}
        />
      )}

      <div className="p-4 flex items-start gap-3">
        {/* Selection checkbox — wax seal style */}
        <div
          className="shrink-0 mt-0.5 w-5 h-5 flex items-center justify-center"
          style={{
            background: isSelected
              ? "hsl(var(--primary))"
              : "rgba(20,15,8,0.8)",
            border: isSelected
              ? "1px solid hsl(var(--primary)/0.6)"
              : "1px solid rgba(60,42,22,0.8)",
          }}
        >
          {isSelected && <CheckCircle2 className="h-3 w-3 text-foreground" />}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-display font-bold text-sm text-foreground">
              {warrior.name}
            </span>
            <StatBadge styleName={warrior.style} variant="secondary" showFullName />
          </div>
          <p className="text-[10px] text-muted-foreground/60 italic leading-relaxed line-clamp-2">
            {warrior.lore}
          </p>
        </div>

        {/* Engraved stats — right column */}
        <div className="shrink-0 text-right space-y-1">
          <div className="flex items-center justify-end gap-1">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">HP</span>
            <span className="text-[11px] font-mono font-black text-foreground/80">
              {stats.derivedStats.hp}
            </span>
          </div>
          <div className="flex items-center justify-end gap-1">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">END</span>
            <span className="text-[11px] font-mono font-black text-foreground/80">
              {stats.derivedStats.endurance}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Orphanage() {
  const state = useGameStore();
  const { initializeStable, setRoster, setState, returnToTitle } = state;

  const initialStep = !state.player.stableName ? 0 : 1;
  const [step, setStep] = useState(initialStep);
  const [stableInput, setStableInput] = useState(state.player.stableName || "");
  const [ownerInput, setOwnerInput] = useState(state.player.name || "");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [poolSeedValue, setPoolSeedValue] = useState(12345);

  const rng = useMemo(() => new SeededRNGService(poolSeedValue), [poolSeedValue]);
  const orphanPool = useMemo(
    () => generateOrphanPool(8, poolSeedValue),
    [poolSeedValue]
  );

  const [boutResult, setBoutResult] = useState<{
    a: Warrior;
    d: Warrior;
    outcome: ReturnType<typeof simulateFight>;
    summary: FightSummary;
  } | null>(null);

  const stableName = state.player.stableName;
  const ownerName = state.player.name;

  const rerollPool = useCallback(() => {
    setPoolSeedValue((prev) => (prev * 1103515245 + 12345) & 0x7fffffff);
    setSelected(new Set());
  }, []);

  const toggleWarrior = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 3) {
        next.add(id);
      }
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
      warriorIdA: wA.id,
      warriorIdD: wB.id,
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
    const finishRng = new SeededRNGService(poolSeedValue + 999);

    const warriors = selectedWarriors.map((pw) => {
      const potential = generatePotential(pw.attrs, "Promising", () =>
        finishRng.next()
      );
      const w = makeWarrior(
        finishRng.uuid(),
        pw.name,
        pw.style,
        pw.attrs,
        { potential, age: pw.age },
        finishRng
      );
      if (boutResult) {
        const wasA = pw.name === boutResult.a.name;
        const wasD = pw.name === boutResult.d.name;
        if (wasA || wasD) {
          const won =
            (wasA && boutResult.outcome.winner === "A") ||
            (wasD && boutResult.outcome.winner === "D");
          const killed =
            boutResult.outcome.by === "Kill" && won;
          return {
            ...w,
            fame: won ? 1 : 0,
            popularity: won ? 1 : 0,
            career: {
              wins: won ? 1 : 0,
              losses: won ? 0 : 1,
              kills: killed ? 1 : 0,
            },
            flair:
              (boutResult.outcome.post?.tags ?? []).includes("Flashy") && won
                ? ["Flashy"]
                : [],
          };
        }
      }
      return w;
    });

    const deadWarriorName =
      boutResult?.outcome.by === "Kill"
        ? boutResult.outcome.winner === "A"
          ? boutResult.d.name
          : boutResult.a.name
        : null;

    const aliveWarriors = warriors.filter((w) => w.name !== deadWarriorName);
    const deadWarriors = warriors
      .filter((w) => w.name === deadWarriorName)
      .map((w) => ({
        ...w,
        status: "Dead" as const,
        deathWeek: 1,
        deathCause: "Killed in first arena bout",
        killedBy:
          boutResult?.outcome.winner === "A"
            ? boutResult.a.name
            : boutResult?.d.name,
        isDead: true,
        dateOfDeath: `Week 1, ${state.season}`,
      }));

    const rivals = generateRivalStables(23, poolSeedValue + 777);

    const usedNames = new Set<string>();
    aliveWarriors.forEach((w) => usedNames.add(w.name));
    deadWarriors.forEach((w) => usedNames.add(w.name));
    rivals.forEach((r) => r.roster.forEach((w) => usedNames.add(w.name)));

    const recruitPool = generateRecruitPool(
      100,
      1,
      usedNames,
      new SeededRNGService(poolSeedValue + 888)
    );

    setState((draft: any) => {
      draft.isFTUE = false;
      draft.ftueComplete = true;
      draft.roster = aliveWarriors;
      draft.graveyard = [...state.graveyard, ...deadWarriors];
      draft.rivals = rivals;
      draft.recruitPool = recruitPool;
      draft.arenaHistory = boutResult ? [boutResult.summary] : [];
    });
  }, [state, setState, selectedWarriors, boutResult, poolSeedValue]);

  // ─── Shell ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{ background: "#0C0806" }}
    >
      {/* Atmospheric warmth */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute -top-20 -left-20 w-96 h-96 opacity-30 torch-flicker"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(200,140,20,0.15) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(201,151,42,0.3) 50%, transparent)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-xl space-y-6">

        {/* Progress */}
        <StepProgress step={step} total={STEP_LABELS.length} />

        {/* ── Step 0: Identity ────────────────────────────────────────────────── */}
        {step === 0 && (
          <div
            className="p-7 space-y-6"
            style={{
              background: "linear-gradient(145deg, #150F08 0%, #110C07 60%, #140E08 100%)",
              border: "1px solid rgba(60,42,22,0.9)",
              borderTopColor: "rgba(100,70,36,0.5)",
            }}
          >
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">
                Establish Your Identity
              </h2>
              <p className="text-xs text-muted-foreground/60 mt-1 leading-relaxed">
                Your name and stable name will be recorded in the Imperial Ledger
                for all time.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-accent/70">
                  Your Name
                </label>
                <input
                  type="text"
                  value={ownerInput}
                  onChange={(e) => setOwnerInput(e.target.value)}
                  className="w-full h-10 px-3 text-sm"
                  placeholder="e.g. Master Thorne"
                  style={{
                    background: "#0A0705",
                    border: "1px solid rgba(60,42,22,0.8)",
                    color: "hsl(var(--foreground))",
                    outline: "none",
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-accent/70">
                  Stable Name
                </label>
                <input
                  type="text"
                  value={stableInput}
                  onChange={(e) => setStableInput(e.target.value)}
                  className="w-full h-10 px-3 text-sm"
                  placeholder="e.g. The Iron Sentinels"
                  style={{
                    background: "#0A0705",
                    border: "1px solid rgba(60,42,22,0.8)",
                    color: "hsl(var(--foreground))",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                onClick={returnToTitle}
                className="gap-2 border-[rgba(60,42,22,0.8)] bg-transparent hover:bg-white/5 text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                disabled={!ownerInput.trim() || !stableInput.trim()}
                onClick={() => {
                  initializeStable(ownerInput.trim(), stableInput.trim());
                  setStep(1);
                }}
                className="flex-1 gap-2 font-display font-bold tracking-wider uppercase"
              >
                Proceed <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 1: Choose Warriors ──────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Header card */}
            <div
              className="px-5 py-4 flex items-center justify-between"
              style={{
                background: "#110C07",
                border: "1px solid rgba(60,42,22,0.7)",
                borderTopColor: "rgba(100,70,36,0.35)",
              }}
            >
              <div>
                <p className="text-xs text-muted-foreground/70 leading-relaxed">
                  Choose{" "}
                  <strong className="text-foreground">3 gladiators</strong> from
                  the intake pool to form your starting stable.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div
                    className="px-2.5 py-0.5 text-[10px] font-mono font-black"
                    style={{
                      background: "rgba(20,15,8,0.8)",
                      border: "1px solid rgba(60,42,22,0.6)",
                      color: selected.size === 3
                        ? "hsl(var(--accent))"
                        : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {selected.size}/3 SELECTED
                  </div>
                </div>
              </div>
              <button
                onClick={rerollPool}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-accent transition-colors px-3 py-2"
              >
                <RefreshCw className="h-3 w-3" />
                New Batch
              </button>
            </div>

            {/* Warrior cards */}
            <div className="space-y-1.5">
              {orphanPool.map((pw) => (
                <WarriorCard
                  key={pw.id}
                  warrior={pw}
                  isSelected={selected.has(pw.id)}
                  canSelect={selected.size < 3 || selected.has(pw.id)}
                  onClick={() => toggleWarrior(pw.id)}
                />
              ))}
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                onClick={() => setStep(0)}
                className="gap-2 border-[rgba(60,42,22,0.8)] bg-transparent hover:bg-white/5 text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={() => {
                  setStep(2);
                  runTutorialBout();
                }}
                disabled={selected.size < 3}
                className="flex-1 gap-2 font-display font-bold tracking-wider uppercase"
                size="lg"
              >
                To the Arena <Swords className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: First Blood ──────────────────────────────────────────────── */}
        {step === 2 && boutResult && (
          <div className="space-y-4">
            <div
              className="p-7 space-y-6"
              style={{
                background: "linear-gradient(145deg, #150F08 0%, #110C07 100%)",
                border: "1px solid rgba(135,34,40,0.4)",
                borderTopColor: "rgba(200,80,88,0.3)",
              }}
            >
              {/* Blood top line */}
              <div
                className="absolute top-0 left-6 right-6 h-0.5 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, hsl(var(--primary)/0.7) 30%, hsl(var(--primary)) 50%, hsl(var(--primary)/0.7) 70%, transparent)",
                }}
              />

              <div>
                <h2 className="font-display text-xl font-bold text-foreground">
                  First Blood
                </h2>
                <p className="text-xs text-muted-foreground/50 mt-0.5">
                  The arena witnessed the first trial
                </p>
              </div>

              {/* Fighter matchup */}
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center">
                  <span className="font-display font-bold text-base text-foreground">
                    {boutResult.a.name}
                  </span>
                  <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mt-0.5">
                    {STYLE_DISPLAY_NAMES[boutResult.a.style as FightingStyle] || boutResult.a.style}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <Swords className="h-5 w-5 text-muted-foreground/30" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">
                    vs
                  </span>
                </div>

                <div className="text-center">
                  <span className="font-display font-bold text-base text-foreground">
                    {boutResult.d.name}
                  </span>
                  <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mt-0.5">
                    {STYLE_DISPLAY_NAMES[boutResult.d.style as FightingStyle] || boutResult.d.style}
                  </div>
                </div>
              </div>

              {/* Result declaration */}
              <div
                className="p-4 text-center"
                style={{
                  background:
                    boutResult.outcome.by === "Kill"
                      ? "rgba(135,34,40,0.12)"
                      : "rgba(201,151,42,0.06)",
                  border: `1px solid ${
                    boutResult.outcome.by === "Kill"
                      ? "rgba(135,34,40,0.4)"
                      : "rgba(201,151,42,0.25)"
                  }`,
                }}
              >
                {boutResult.outcome.winner ? (
                  <div>
                    <div
                      className="font-display font-black text-lg uppercase tracking-wide"
                      style={{
                        color:
                          boutResult.outcome.by === "Kill"
                            ? "hsl(var(--arena-blood))"
                            : "hsl(var(--arena-gold))",
                        textShadow:
                          boutResult.outcome.by === "Kill"
                            ? "0 0 12px hsl(var(--arena-blood)/0.5)"
                            : "0 0 12px hsl(var(--arena-gold)/0.4)",
                      }}
                    >
                      {boutResult.outcome.winner === "A"
                        ? boutResult.a.name
                        : boutResult.d.name}{" "}
                      victorious
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">
                      by {boutResult.outcome.by}
                      {boutResult.outcome.by === "Kill" && (
                        <Skull className="h-3 w-3 inline ml-1.5 text-destructive/70" />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="font-display font-black text-lg uppercase tracking-wide text-muted-foreground">
                    Draw
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="gap-2 border-[rgba(60,42,22,0.8)] bg-transparent hover:bg-white/5 text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="flex-1 gap-2 font-display font-bold tracking-wider uppercase"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Your Story Begins ────────────────────────────────────────── */}
        {step === 3 && (
          <div
            className="p-7 space-y-6 text-center"
            style={{
              background: "linear-gradient(145deg, #150F08 0%, #110C07 60%, #140E08 100%)",
              border: "1px solid rgba(201,151,42,0.3)",
              borderTopColor: "rgba(201,151,42,0.6)",
            }}
          >
            {/* Gold top ornament */}
            <div
              className="absolute top-0 left-6 right-6 h-0.5 pointer-events-none"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(201,151,42,0.7) 30%, rgba(201,151,42,1) 50%, rgba(201,151,42,0.7) 70%, transparent)",
              }}
            />

            <div className="space-y-2">
              <div
                className="w-16 h-16 mx-auto flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(201,151,42,0.15), rgba(201,151,42,0.05))",
                  border: "1px solid rgba(201,151,42,0.3)",
                }}
              >
                <Flame className="h-8 w-8 text-accent" />
              </div>
              <h2 className="font-display text-2xl font-black text-foreground">
                Your Story Begins
              </h2>
              <p className="text-sm text-muted-foreground/70 leading-relaxed max-w-[280px] mx-auto">
                Stable registered. Warriors enrolled. The imperial commission
                has been notified. The arena awaits.
              </p>
            </div>

            <div
              className="h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(201,151,42,0.2) 40%, rgba(201,151,42,0.2) 60%, transparent)",
              }}
            />

            <Button
              onClick={finishFTUE}
              className="w-full h-12 gap-2 font-display font-bold tracking-wider uppercase"
              size="lg"
            >
              <Zap className="h-4 w-4 fill-current" />
              Enter the Arena Hub
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
