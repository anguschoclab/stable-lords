/**
 * Weekly Matchmaking Orchestrator
 *
 * Single entry point for the week-tick matchmaking decision. Today this
 * wraps the legacy BoutSimulationPass behaviour — it exists so future work
 * (min-viable-arena checks, tournament AI-fill, cross-stable pairing via
 * MatchScoringService) can land behind the `featureFlags.weeklyMatchmaker`
 * flag without touching every call site.
 */
import type { GameState, Warrior, RivalStableData } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { getFeatureFlags } from '@/engine/featureFlags';

export interface MatchmakingPairing {
  a: Warrior;
  d: Warrior;
  score: number;
  isRivalry: boolean;
}

export interface MatchmakingPlan {
  pairings: MatchmakingPairing[];
  /** If false, the arena lacked two eligible fighters across stables. */
  viable: boolean;
  /** Reason codes for telemetry / UI surfacing. */
  reasons: string[];
}

/**
 * Eligibility gate — alive, healthy enough to fight, and not in recovery.
 * Mirrors the gate used inside BoutSimulationPass so the orchestrator is a
 * drop-in substitute once the feature flag flips on.
 */
function isEligible(w: Warrior): boolean {
  if (w.isDead || w.status === 'Dead') return false;
  if (w.status === 'Injured' || w.status === 'Recovering') return false;
  return true;
}

/**
 * Build a set of candidate pairings for the upcoming week. Cross-stable only;
 * prefers higher-scored matches (fame gap, rivalry, record similarity) as
 * weighted by MatchScoringService.
 */
export function planWeeklyMatches(state: GameState, _rng: IRNGService): MatchmakingPlan {
  const reasons: string[] = [];
  const flags = getFeatureFlags();
  if (!flags.weeklyMatchmaker) {
    return { pairings: [], viable: false, reasons: ['feature_flag_off'] };
  }

  const playerEligible = state.roster.filter(isEligible);
  const rivalEligible: Array<{ warrior: Warrior; stable: RivalStableData }> = [];
  for (const r of state.rivals ?? []) {
    for (const w of r.roster) if (isEligible(w)) rivalEligible.push({ warrior: w, stable: r });
  }

  if (playerEligible.length === 0 || rivalEligible.length === 0) {
    reasons.push('min_viable_arena_failed');
    return { pairings: [], viable: false, reasons };
  }

  // Lightweight scoring — fame proximity + rivalry bonus. We keep MatchScoringService
  // for detailed booking flow; this is just the "who fights whom this week" rubric.
  const pairings: MatchmakingPairing[] = [];
  const rivalries = state.rivalries ?? [];
  const isStableRivalry = (a?: string, b?: string) =>
    !!a &&
    !!b &&
    rivalries.some(
      (r) => (r.stableIdA === a && r.stableIdB === b) || (r.stableIdB === a && r.stableIdA === b)
    );
  for (const pw of playerEligible) {
    let best: { rw: Warrior; stable: RivalStableData; score: number } | null = null;
    for (const { warrior: rw, stable } of rivalEligible) {
      const fameGap = Math.abs((pw.fame ?? 0) - (rw.fame ?? 0));
      const rivalryBonus = isStableRivalry(pw.stableId, stable.owner.id) ? 100 : 0;
      const score = 100 + rivalryBonus + Math.max(0, 30 - fameGap * 3);
      if (!best || score > best.score) best = { rw, stable, score };
    }
    if (best) {
      pairings.push({
        a: pw,
        d: best.rw,
        score: best.score,
        isRivalry: isStableRivalry(pw.stableId, best.stable.owner.id),
      });
    }
  }

  reasons.push(`paired_${pairings.length}`);
  return { pairings, viable: pairings.length > 0, reasons };
}
