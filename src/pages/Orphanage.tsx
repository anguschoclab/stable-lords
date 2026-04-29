/**
 * Stable Lords — Orphanage FTUE Flow
 * Codex Sanguis design: Roman enrollment / gladiatorial intake aesthetic
 * Dynamic warrior selection → Tutorial bout → Summary
 */
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGameStore, type GameStore } from '@/state/useGameStore';
import { makeWarrior } from '@/engine/factories';
import { simulateFight, defaultPlanForWarrior } from '@/engine';
import { generateRivalStables } from '@/engine/rivals';
import { generateRecruitPool } from '@/engine/recruitment';
import { generatePromoters } from '@/engine/promoters/promoterGenerator';
import { runRankingsPass } from '@/engine/pipeline/passes/RankingsPass';
import { runPromoterPass } from '@/engine/pipeline/passes/PromoterPass';
import { resolveImpacts } from '@/engine/impacts';
import type { Promoter, GameState } from '@/types/state.types';
import type { Warrior, FightSummary } from '@/types/game';
import { generatePotential } from '@/engine/potential';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { generateOrphanPool, TRAIT_DATA } from '@/data/orphanPool';
import { createBoutSummary } from '@/engine/core/fightSummaryFactory';
import StepProgress from '@/components/orphanage/StepProgress';
import IdentityStep from '@/components/orphanage/IdentityStep';
import WarriorSelectionStep from '@/components/orphanage/WarriorSelectionStep';
import FirstBloodStep from '@/components/orphanage/FirstBloodStep';
import StoryBeginsStep from '@/components/orphanage/StoryBeginsStep';

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Orphanage() {
  const navigate = useNavigate();
  const state = useGameStore();
  const { initializeStable, setState, returnToTitle, saveCurrentState } = state;

  const initialStep = !state.player.stableName ? 0 : 1;
  const [step, setStep] = useState(initialStep);
  const [stableInput, setStableInput] = useState(state.player.stableName || '');
  const [ownerInput, setOwnerInput] = useState(state.player.name || '');

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [poolSeedValue, setPoolSeedValue] = useState(() => Math.floor(Math.random() * 1000000));

  const orphanPool = useMemo(() => generateOrphanPool(8, poolSeedValue), [poolSeedValue]);

  const [boutResult, setBoutResult] = useState<{
    a: Warrior;
    d: Warrior;
    outcome: ReturnType<typeof simulateFight>;
    summary: FightSummary;
  } | null>(null);

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

    const summary = createBoutSummary(wA, wB, outcome, 1, { uuid: () => `ftue_${Date.now()}` });
    summary.flashyTags = tags;
    summary.fameDeltaA = outcome.winner === 'A' ? 1 : 0;
    summary.fameDeltaD = outcome.winner === 'D' ? 1 : 0;

    setBoutResult({ a: wA, d: wB, outcome, summary });
  }, [selectedWarriors]);

  const finishFTUE = useCallback(() => {
    const finishRng = new SeededRNGService(poolSeedValue + 999);

    const warriors = selectedWarriors.map((pw) => {
      // Use the orphan's pre-generated potential (or regenerate if somehow missing)
      const potential =
        pw.potential ?? generatePotential(pw.attrs, 'Common', () => finishRng.next());
      // Build base plan and merge trait-based modifiers
      const basePlan = defaultPlanForWarrior(makeWarrior(undefined, pw.name, pw.style, pw.attrs));
      const traitData = TRAIT_DATA[pw.trait];
      const traitMods = traitData?.modifiers ?? {};
      const plan = { ...basePlan, ...traitMods };
      const w = makeWarrior(
        finishRng.uuid(),
        pw.name,
        pw.style,
        pw.attrs,
        {
          potential,
          age: pw.age,
          plan,
          traits: [pw.trait],
          lore: pw.lore,
          origin: pw.origin,
        },
        finishRng
      );
      if (boutResult) {
        const wasA = pw.name === boutResult.a.name;
        const wasD = pw.name === boutResult.d.name;
        if (wasA || wasD) {
          const won =
            (wasA && boutResult.outcome.winner === 'A') ||
            (wasD && boutResult.outcome.winner === 'D');
          const killed = boutResult.outcome.by === 'Kill' && won;
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
              (boutResult.outcome.post?.tags ?? []).includes('Flashy') && won ? ['Flashy'] : [],
          };
        }
      }
      return w;
    });

    const deadWarriorName =
      boutResult?.outcome.by === 'Kill'
        ? boutResult.outcome.winner === 'A'
          ? boutResult.d.name
          : boutResult.a.name
        : null;

    const aliveWarriors = warriors.filter((w) => w.name !== deadWarriorName);
    const deadWarriors = warriors
      .filter((w) => w.name === deadWarriorName)
      .map((w) => ({
        ...w,
        status: 'Dead' as const,
        deathWeek: 1,
        deathCause: 'Killed in first arena bout',
        killedBy: boutResult?.outcome.winner === 'A' ? boutResult.a.name : boutResult?.d.name,
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

    const promotersArray = generatePromoters(30, poolSeedValue + 999);
    const promoters: Record<string, Promoter> = {};
    promotersArray.forEach((p) => {
      promoters[p.id] = p;
    });

    // Build a minimal state snapshot to seed rankings + offers
    const seedState: GameState = {
      ...(state as unknown as GameState),
      isFTUE: false,
      ftueComplete: true,
      roster: aliveWarriors,
      rivals,
      promoters,
      boutOffers: {},
      realmRankings: {},
    };
    const seeded = resolveImpacts(seedState, [
      runRankingsPass(seedState),
      runPromoterPass(seedState),
    ]);

    setState((draft: GameStore) => {
      draft.isFTUE = false;
      draft.ftueComplete = true;
      draft.roster = aliveWarriors;
      draft.graveyard = [...state.graveyard, ...deadWarriors];
      draft.rivals = rivals;
      draft.recruitPool = recruitPool;
      draft.arenaHistory = boutResult ? [boutResult.summary] : [];
      draft.promoters = seeded.promoters;
      draft.boutOffers = seeded.boutOffers;
      draft.realmRankings = seeded.realmRankings;
    });
    saveCurrentState();

    // Navigate to command center after FTUE
    navigate({ to: '/command' });
  }, [state, setState, selectedWarriors, boutResult, poolSeedValue, saveCurrentState, navigate]);

  // ─── Shell ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{ background: '#0C0806' }}
    >
      {/* Atmospheric warmth */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute -top-20 -left-20 w-96 h-96 opacity-30 torch-flicker"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(200,140,20,0.15) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(201,151,42,0.3) 50%, transparent)',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-xl space-y-6">
        {/* Progress */}
        <StepProgress step={step} total={4} />

        {/* ── Step 0: Identity ────────────────────────────────────────────────── */}
        {step === 0 && (
          <IdentityStep
            ownerInput={ownerInput}
            setOwnerInput={setOwnerInput}
            stableInput={stableInput}
            setStableInput={setStableInput}
            onBack={returnToTitle}
            onSubmit={() => {
              initializeStable(ownerInput.trim(), stableInput.trim());
              setStep(1);
            }}
          />
        )}

        {/* ── Step 1: Choose Warriors ──────────────────────────────────────────── */}
        {step === 1 && (
          <WarriorSelectionStep
            orphanPool={orphanPool}
            selected={selected}
            onToggleWarrior={toggleWarrior}
            onRerollPool={rerollPool}
            onBack={() => setStep(0)}
            onNext={() => {
              setStep(2);
              runTutorialBout();
            }}
          />
        )}

        {/* ── Step 2: First Blood ──────────────────────────────────────────────── */}
        {step === 2 && boutResult && (
          <FirstBloodStep
            boutResult={boutResult}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {/* ── Step 3: Your Story Begins ────────────────────────────────────────── */}
        {step === 3 && <StoryBeginsStep onFinish={finishFTUE} />}
      </div>
    </div>
  );
}
