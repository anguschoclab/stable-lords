import { FightingStyle, type Attributes, ATTRIBUTE_KEYS } from '@/types/game';
import { pick, shuffled } from '@/utils/random';

type Archetype = 'brutal' | 'agile' | 'cunning' | 'tank';

export const STYLE_ARCHETYPE: Record<FightingStyle, Archetype> = {
  [FightingStyle.BashingAttack]: 'brutal',
  [FightingStyle.StrikingAttack]: 'brutal',
  [FightingStyle.LungingAttack]: 'agile',
  [FightingStyle.SlashingAttack]: 'agile',
  [FightingStyle.AimedBlow]: 'cunning',
  [FightingStyle.ParryRiposte]: 'cunning',
  [FightingStyle.ParryLunge]: 'cunning',
  [FightingStyle.ParryStrike]: 'cunning',
  [FightingStyle.TotalParry]: 'tank',
  [FightingStyle.WallOfSteel]: 'tank',
};

const ARCHETYPE_STAT_WEIGHTS: Record<
  Archetype,
  { high: (keyof Attributes)[]; mid: (keyof Attributes)[]; low: (keyof Attributes)[] }
> = {
  brutal: { high: ['ST', 'CN', 'SZ'], mid: ['WL'], low: ['WT', 'SP', 'DF'] },
  agile: { high: ['SP', 'DF', 'WT'], mid: ['ST'], low: ['CN', 'SZ', 'WL'] },
  cunning: { high: ['WT', 'DF', 'WL'], mid: ['SP'], low: ['ST', 'CN', 'SZ'] },
  tank: { high: ['CN', 'WL', 'SZ'], mid: ['ST'], low: ['WT', 'SP', 'DF'] },
};

/**
 * Generates attributes intelligently distributed based on the fighting style's archetype.
 * @param style The fighting style to base the stats on.
 * @param rng Optional RNG generator.
 * @returns The generated Attributes object.
 */
export function generateArchetypeAttrs(style: FightingStyle, rng?: () => number): Attributes {
  const r = rng || Math.random;
  const archetype = STYLE_ARCHETYPE[style];
  const weights = ARCHETYPE_STAT_WEIGHTS[archetype];
  const attrs: Attributes = { ST: 3, CN: 3, SZ: 3, WT: 3, WL: 3, SP: 3, DF: 3 };

  const totalPoints = 70 + (Math.floor(r() * 7) - 2); // 68 to 74
  let pool = totalPoints - 21; // 21 is base sum (7 * 3)

  for (const key of weights.high) {
    const add = Math.floor(r() * 7) + 8;
    const clamped = Math.min(add, pool, 22);
    attrs[key] += clamped;
    pool -= clamped;
  }

  for (const key of weights.mid) {
    const add = Math.floor(r() * 6) + 4;
    const clamped = Math.min(add, pool, 22);
    attrs[key] += clamped;
    pool -= clamped;
  }

  const lowKeys = shuffled(weights.low, r);
  for (const key of lowKeys) {
    if (pool <= 0) break;
    const add = Math.min(Math.floor(r() * 5) + 2, pool, 22);
    attrs[key] += add;
    pool -= add;
  }

  while (pool > 0) {
    const key = pick(ATTRIBUTE_KEYS as unknown as (keyof Attributes)[], r);
    if (attrs[key] < 25) {
      attrs[key]++;
      pool--;
    }
  }

  return attrs;
}
