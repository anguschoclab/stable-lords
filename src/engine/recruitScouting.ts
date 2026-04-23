/**
 * Recruit-potential scouting — deterministic partial-reveal of a recruit's
 * attribute *ceilings* (potential), distinct from opponent intel (see
 * `scouting.ts` which reveals current attributes of existing warriors).
 *
 * The Recruit page's SCOUT [25G] button today flips an `isScouted` flag and
 * shows only the overall grade letter. This module backs that button with
 * real information: given a recruit id + week seed, reveal 2–3 specific
 * attribute ceilings so the player can make targeted signing decisions.
 *
 * Determinism is non-negotiable — scouting the same recruit in the same
 * week must always yield the same reveal so save/load doesn't spring
 * surprises on the player.
 */
import type { AttributePotential } from '@/types/warrior.types';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { hashStr } from '@/utils/random';

const ATTRIBUTE_KEYS = ['ST', 'CN', 'SZ', 'WT', 'WL', 'SP', 'DF'] as const;
type AttrKey = (typeof ATTRIBUTE_KEYS)[number];

export interface PotentialScoutReport {
  recruitId: string;
  week: number;
  /** Subset of potential attributes revealed — keys not present are still hidden. */
  revealed: Partial<Record<AttrKey, number>>;
  /** Plain-language summary derived from the reveal; safe to render directly. */
  summary: string;
}

/**
 * Reveal 2–3 random attribute ceilings from the recruit's AttributePotential.
 * Seed is (week, recruitId) so repeat scouts in the same week match exactly.
 */
export function revealRecruitPotential(
  recruitId: string,
  week: number,
  potential: AttributePotential | undefined
): PotentialScoutReport {
  if (!potential) {
    return {
      recruitId,
      week,
      revealed: {},
      summary: "Scouts couldn't get close enough for specifics.",
    };
  }

  const rng = new SeededRNGService(week * 7919 + hashStr(recruitId));
  const count = rng.next() < 0.5 ? 2 : 3;
  const keys: AttrKey[] = [...ATTRIBUTE_KEYS];
  // Deterministic Fisher-Yates shuffle via the seeded rng.
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [keys[i], keys[j]] = [keys[j]!, keys[i]!];
  }

  const revealed: Partial<Record<AttrKey, number>> = {};
  for (const k of keys.slice(0, count)) {
    revealed[k] = potential[k];
  }

  // Headline is the strongest revealed attribute — gives the player an
  // at-a-glance read without forcing them to parse all three numbers.
  const sorted = Object.entries(revealed).sort((a, b) => (b[1] as number) - (a[1] as number));
  const top = sorted[0];
  const summary = top
    ? `Scouts confirm a ${top[0]} ceiling of ${top[1]}${sorted.length > 1 ? ` (+${sorted.length - 1} more noted)` : ''}.`
    : 'Scouts returned empty-handed.';

  return { recruitId, week, revealed, summary };
}
