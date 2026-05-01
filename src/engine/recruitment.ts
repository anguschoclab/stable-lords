import {
  FightingStyle,
  type Attributes,
  type BaseSkills,
  type DerivedStats,
} from '@/types/shared.types';
import { type StyleMeta } from './metaDrift';
import {
  type AttributePotential,
  type WarriorFavorites,
  type WarriorLineage,
} from '@/types/warrior.types';
import { computeWarriorStats } from './skillCalc';
import { generatePotential } from './potential';
import { generateFavorites } from './favorites';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import narrativeContent from '@/data/narrativeContent.json';
import type { NarrativeContent } from '@/types/narrative.types';
import { TRAITS, generateTraits } from '@/engine/traits';
import { ARCHETYPE_NAMES } from '@/data/names/archetypeNames';
import { STYLE_ARCHETYPE, generateArchetypeAttrs } from '@/engine/factories/statGeneration';
import { generateLore, generateOrigin } from '@/engine/narrative/loreGenerator';

// ─── Types ────────────────────────────────────────────────────────────────

export type RecruitTier = 'Common' | 'Promising' | 'Exceptional' | 'Prodigy';

export interface PoolWarrior {
  id: string;
  name: string;
  style: FightingStyle;
  attributes: Attributes;
  potential: AttributePotential;
  baseSkills: BaseSkills;
  derivedStats: DerivedStats;
  tier: RecruitTier;
  cost: number;
  age: number;
  lore: string;
  origin?: string;
  traits: string[];
  addedWeek: number;
  favorites: WarriorFavorites;
  lineage?: WarriorLineage;
}

// ─── Constants ────────────────────────────────────────────────────────────

// TIER data is now fetched from narrativeContent.json
const getTierData = (tier: RecruitTier) =>
  (narrativeContent as NarrativeContent).recruitment.tiers[tier];

export const TIER_COST: Record<RecruitTier, number> = {
  Common: (narrativeContent as NarrativeContent).recruitment.tiers.Common.cost,
  Promising: (narrativeContent as NarrativeContent).recruitment.tiers.Promising.cost,
  Exceptional: (narrativeContent as NarrativeContent).recruitment.tiers.Exceptional.cost,
  Prodigy: (narrativeContent as NarrativeContent).recruitment.tiers.Prodigy.cost,
};

export const TIER_STARS: Record<RecruitTier, number> = {
  Common: (narrativeContent as NarrativeContent).recruitment.tiers.Common.stars,
  Promising: (narrativeContent as NarrativeContent).recruitment.tiers.Promising.stars,
  Exceptional: (narrativeContent as NarrativeContent).recruitment.tiers.Exceptional.stars,
  Prodigy: (narrativeContent as NarrativeContent).recruitment.tiers.Prodigy.stars,
};

const REFRESH_COST = 50;
const DEFAULT_POOL_SIZE = 12; // Increased from 5 to maintain world population
export { REFRESH_COST, DEFAULT_POOL_SIZE };

// ─── Name Pool ────────────────────────────────────────────────────────────

// Name pool is now fetched from narrativeContent.json
const NAME_POOL = (narrativeContent as NarrativeContent).recruitment.names;

// Removed manual seededRng implementation in favor of utils/random

// ─── Generation ───────────────────────────────────────────────────────────

function rollTier(rng: IRNGService): RecruitTier {
  if (rng.next() < 0.05) return 'Prodigy';
  if (rng.next() < 0.2) return 'Exceptional';
  if (rng.next() < 0.5) return 'Promising';
  return 'Common';
}

export function generateRecruit(
  rng: IRNGService,
  usedNames: Set<string>,
  week: number,
  forceTier?: RecruitTier,
  meta?: StyleMeta,
  legacyCandidates: import('@/types/warrior.types').Warrior[] = []
): PoolWarrior {
  const tier = forceTier ?? rollTier(rng);
  const styles = Object.values(FightingStyle);
  let style: FightingStyle;
  let lineage: import('@/types/warrior.types').WarriorLineage | undefined;

  // 🧬 Genetic Bloodlines: 5% chance to be a Legacy recruit
  const isLegacy = rng.next() < 0.05 && legacyCandidates.length > 0;
  if (isLegacy) {
    const parent = rng.pick(legacyCandidates);
    style = parent.style;
    lineage = {
      parentId: parent.id,
      generation: (parent.lineage?.generation ?? 1) + 1,
      pedigree: parent.fame > 2000 ? 'Noble Blood' : 'Legacy',
      mentorName: parent.name,
    };
  } else if (meta) {
    // ⚡ Institutional Style Drift: Bias toward current meta
    const stylesByWeight: FightingStyle[] = [];
    for (const s of Object.values(FightingStyle)) {
      const drift = meta[s] ?? 0;
      const weight = Math.max(1, 5 + drift); // Scale drift (-10..10) to weights (1..15)
      for (let w = 0; w < weight; w++) stylesByWeight.push(s);
    }
    style = rng.pick(stylesByWeight);
  } else {
    style = rng.pick(styles);
  }

  const archetype = STYLE_ARCHETYPE[style];
  const attributes = generateArchetypeAttrs(style, rng);

  // Trait generation — unified TRAITS registry with archetype-aware weighting.
  // Uses snake_case IDs that the combat engine (traits.ts) recognises.
  const traits = generateTraits(rng, archetype);

  // Apply personality attrBonus from traits at recruitment time
  for (const tid of traits) {
    const tdef = TRAITS[tid];
    if (tdef?.effect.attrBonus) {
      for (const [key, bonus] of Object.entries(tdef.effect.attrBonus)) {
        attributes[key as keyof Attributes] += bonus as number;
      }
    }
  }

  // Pick unique name based on Archetype
  let name: string;
  let attempts = 0;
  const namePool = [...ARCHETYPE_NAMES[archetype], ...ARCHETYPE_NAMES.tank];
  do {
    name = namePool.length > 0 ? rng.pick(namePool) : rng.pick(NAME_POOL);
    attempts++;
  } while (usedNames.has(name) && attempts < 200);
  usedNames.add(name);

  const { baseSkills, derivedStats } = computeWarriorStats(attributes, style);
  const potential = generatePotential(attributes, tier, rng);
  const favorites = generateFavorites(style, rng);
  const originStr = generateOrigin(rng);
  const loreStr = generateLore(name, rng);

  return {
    id: rng.uuid(),
    name,
    style,
    attributes,
    potential,
    baseSkills,
    derivedStats,
    tier,
    cost: TIER_COST[tier],
    age: 16 + Math.floor(rng.next() * 6),
    lore: loreStr,
    origin: originStr,
    traits,
    addedWeek: week,
    favorites,
    lineage,
  };
}

// ─── Pool Management ──────────────────────────────────────────────────────

export function generateRecruitPool(
  count: number = DEFAULT_POOL_SIZE,
  week: number,
  usedNames: Set<string>,
  rng?: IRNGService,
  meta?: StyleMeta,
  legacyCandidates: import('@/types/warrior.types').Warrior[] = []
): PoolWarrior[] {
  const rngService = rng || new SeededRNGService(week * 9973 + 42);
  const pool: PoolWarrior[] = [];

  // Guarantee at least two Promising+ warriors in a larger pool
  pool.push(
    generateRecruit(
      rngService,
      usedNames,
      week,
      rngService.next() < 0.3 ? 'Exceptional' : 'Promising',
      meta,
      legacyCandidates
    )
  );
  pool.push(
    generateRecruit(
      rngService,
      usedNames,
      week,
      rngService.next() < 0.1 ? 'Prodigy' : 'Promising',
      meta,
      legacyCandidates
    )
  );

  while (pool.length < count) {
    pool.push(generateRecruit(rngService, usedNames, week, undefined, meta, legacyCandidates));
  }

  return pool;
}

/** Partial weekly refresh — replace oldest 3-4 warriors */
export function partialRefreshPool(
  currentPool: PoolWarrior[],
  week: number,
  usedNames: Set<string>,
  rng?: IRNGService,
  meta?: StyleMeta,
  legacyCandidates: import('@/types/warrior.types').Warrior[] = []
): PoolWarrior[] {
  if (currentPool.length === 0)
    return generateRecruitPool(DEFAULT_POOL_SIZE, week, usedNames, rng, meta, legacyCandidates);

  const sorted = [...currentPool].sort((a, b) => a.addedWeek - b.addedWeek);
  const removeCount = Math.min(4, Math.max(2, Math.floor(currentPool.length * 0.3)));
  const remaining = sorted.slice(removeCount);

  // Rebuild used names from remaining
  const remainingNames = new Set(remaining.map((w) => w.name));
  const allUsed = new Set([...usedNames, ...remainingNames]);

  const rngService = rng || new SeededRNGService(week * 7919 + 31);
  const newWarriors: PoolWarrior[] = [];
  for (let i = 0; i < removeCount; i++) {
    newWarriors.push(generateRecruit(rngService, allUsed, week, undefined, meta, legacyCandidates));
  }

  // Top up to DEFAULT_POOL_SIZE if undersized, then cap so the pool can't grow
  // unbounded when AI drafts are slower than the natural turnover rate. Prior
  // code only enforced the lower bound, so weekly +bonus recruits accumulated
  // forever (1600+ entries after 15 years in the world-health diagnostic).
  const newPool = [...remaining, ...newWarriors];
  while (newPool.length < DEFAULT_POOL_SIZE) {
    newPool.push(generateRecruit(rngService, allUsed, week, undefined, meta, legacyCandidates));
  }
  const POOL_HARD_CAP = DEFAULT_POOL_SIZE * 3; // 36 — comfortable headroom for bonuses without runaway growth
  if (newPool.length > POOL_HARD_CAP) {
    // Drop oldest first so the pool stays fresh
    return newPool.sort((a, b) => a.addedWeek - b.addedWeek).slice(-POOL_HARD_CAP);
  }
  return newPool;
}

/** Full manual refresh (costs gold) */
export function fullRefreshPool(
  week: number,
  usedNames: Set<string>,
  rng?: IRNGService
): PoolWarrior[] {
  const rngService = rng || new SeededRNGService(week * 1337 + 7);
  return generateRecruitPool(DEFAULT_POOL_SIZE, week, usedNames, rngService);
}

// AI Draft behavior has been moved to src/engine/draftService.ts
