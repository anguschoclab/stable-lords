/**
 * FightSummary Factory
 * Eliminates DRY violation of FightSummary object construction in tournament resolvers
 */
import type { Warrior } from '@/types/warrior.types';
import type { FightOutcome } from '@/types/combat.types';
import type { FightSummary } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

export interface FightSummaryParams {
  warriorA: Warrior;
  warriorD: Warrior;
  outcome: FightOutcome;
  week: number;
  tournamentId?: string;
  tournamentName?: string;
  rng: { uuid: (prefix?: string) => string } | IRNGService;
}

/**
 * Creates a standardized FightSummary object
 * Used by both tournament resolution systems to ensure consistency
 */
export function createFightSummary(params: FightSummaryParams): FightSummary {
  const { warriorA, warriorD, outcome, week, tournamentId, tournamentName, rng } = params;

  // Generate unique ID
  const id = typeof rng.uuid === 'function' ? rng.uuid('bout') : (rng as IRNGService).uuid();

  // Build title
  const title = tournamentName
    ? `${warriorA.name} vs ${warriorD.name} (${tournamentName})`
    : `${warriorA.name} vs ${warriorD.name}`;

  // Extract transcript from outcome log
  const transcript = outcome.log?.map((e) => e.text || '') || [];

  return {
    id,
    week,
    phase: 'resolution',
    tournamentId,
    title,
    a: warriorA.name,
    d: warriorD.name,
    warriorIdA: warriorA.id,
    warriorIdD: warriorD.id,
    stableIdA: warriorA.stableId,
    stableIdD: warriorD.stableId,
    winner: outcome.winner,
    by: outcome.by,
    styleA: warriorA.style,
    styleD: warriorD.style,
    transcript,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Convenience function for non-tournament bouts
 */
export function createBoutSummary(
  warriorA: Warrior,
  warriorD: Warrior,
  outcome: FightOutcome,
  week: number,
  rng: { uuid: (prefix?: string) => string } | IRNGService
): FightSummary {
  return createFightSummary({
    warriorA,
    warriorD,
    outcome,
    week,
    rng,
  });
}

/**
 * Creates a minimal fight summary for arena history
 * Used when full bout details aren't needed
 */
export function createMinimalFightSummary(
  warriorA: Warrior,
  warriorD: Warrior,
  winner: 'A' | 'D' | null,
  by: FightOutcome['by'],
  week: number,
  rng: { uuid: (prefix?: string) => string } | IRNGService
): FightSummary {
  const id = typeof rng.uuid === 'function' ? rng.uuid('bout') : (rng as IRNGService).uuid();

  return {
    id,
    week,
    phase: 'resolution',
    title: `${warriorA.name} vs ${warriorD.name}`,
    a: warriorA.name,
    d: warriorD.name,
    warriorIdA: warriorA.id,
    warriorIdD: warriorD.id,
    stableIdA: warriorA.stableId,
    stableIdD: warriorD.stableId,
    winner,
    by,
    styleA: warriorA.style,
    styleD: warriorD.style,
    transcript: [],
    createdAt: new Date().toISOString(),
  };
}
