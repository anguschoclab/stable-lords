/**
 * Recruitment Engine — procedural warrior generation with quality tiers,
 * pool management, and AI draft behavior.
 * Implements Stable_Lords_Orphanage_Recruitment_Spec_v1.0
 */
import { FightingStyle, type Attributes, type AttributePotential, type BaseSkills, type DerivedStats, type WarriorFavorites } from "@/types/game";
import { computeWarriorStats } from "./skillCalc";
import { generatePotential } from "./potential";
import { generateFavorites } from "./favorites";

// ─── Types ────────────────────────────────────────────────────────────────

export type RecruitTier = "Common" | "Promising" | "Exceptional" | "Prodigy";

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
  addedWeek: number;
  favorites: WarriorFavorites;
}

// ─── Constants ────────────────────────────────────────────────────────────

const TIER_POINTS: Record<RecruitTier, [number, number]> = {
  Common: [66, 70],
  Promising: [70, 74],
  Exceptional: [74, 78],
  Prodigy: [78, 82],
};

export const TIER_COST: Record<RecruitTier, number> = {
  Common: 100,
  Promising: 150,
  Exceptional: 250,
  Prodigy: 400,
};

export const TIER_STARS: Record<RecruitTier, number> = {
  Common: 0,
  Promising: 1,
  Exceptional: 2,
  Prodigy: 3,
};

const REFRESH_COST = 50;
export { REFRESH_COST };

// ─── Name Pool ────────────────────────────────────────────────────────────

const NAME_POOL = [
  "ARAK", "BRIX", "CARN", "DRAV", "ESKA", "FAEL", "GRIX", "HASK",
  "IVOR", "JETT", "KAEL", "LYNX", "MORD", "NYX", "ORIN", "PYKE",
  "QUIL", "RASK", "SORN", "TAHL", "URSA", "VALK", "WREN", "XAEL",
  "YGOR", "ZETH", "BANE", "CROW", "DUSK", "EDGE", "FLUX", "GALE",
  "HAZE", "IRON", "JADE", "KNOT", "LASH", "MACE", "NAIL", "OMEN",
  "PYRE", "RAZE", "SCAR", "TUSK", "VICE", "WOLF", "AXEL", "BLITZ",
  "CRAG", "DIRK", "ECHO", "FLAK", "GRIM", "HAWK", "INK", "JINX",
  "KITE", "LURK", "MOSS", "NOCK", "OPUS", "PALE", "ROOK", "SLAG",
  "TORN", "ULRIC", "VEX", "WYRM", "XENO", "YOKE", "ZINC", "ASHE",
  "BOSK", "CHAR", "DALE", "ETCH", "FERN", "GHOL", "HELM", "ISLE",
  "JOLT", "KERN", "LOOM", "MIRK", "NARD", "OPAL", "PITH", "RIME",
  "SILT", "TARN", "VALE", "WOAD", "ZEAL", "BRAGG", "CLASH", "DREAD",
  "FORGE", "GLINT", "HAVOK", "KREEL", "LANCE", "MAUL", "RASP", "SCALD",
];

// ─── Lore Templates ───────────────────────────────────────────────────────

const STYLE_BLURBS: Partial<Record<FightingStyle, string[]>> = {
  [FightingStyle.AimedBlow]: ["Precise and calculating.", "Every strike finds its mark."],
  [FightingStyle.BashingAttack]: ["Raw power incarnate.", "Swings first, asks never."],
  [FightingStyle.LungingAttack]: ["A blur of speed and steel.", "Dashes in without fear."],
  [FightingStyle.ParryLunge]: ["Patience followed by explosion.", "Waits, then strikes like a viper."],
  [FightingStyle.ParryRiposte]: ["A master of counter-fighting.", "Punishes every mistake."],
  [FightingStyle.ParryStrike]: ["Efficient and deadly.", "Economy of motion, maximum damage."],
  [FightingStyle.SlashingAttack]: ["Arcs of steel fill the air.", "Wide, sweeping cuts that never stop."],
  [FightingStyle.StrikingAttack]: ["Clean, direct, devastating.", "No wasted motion."],
  [FightingStyle.TotalParry]: ["An immovable fortress.", "Impossible to put down."],
  [FightingStyle.WallOfSteel]: ["Constant blade motion.", "A whirling wall of defense and attack."],
};

const ORIGIN_TEMPLATES = [
  "Found fighting for scraps in the pit districts.",
  "Orphaned at twelve, trained in the yards.",
  "A former soldier seeking glory.",
  "Quiet, watchful, and dangerous.",
  "Born in the arena's shadow.",
  "Escaped the mines with nothing but fury.",
  "Raised by pit-fighters since childhood.",
  "A street brawler with untapped potential.",
  "Sold to the arena by a desperate family.",
  "Survived the border wars. Now fights for coin.",
];

// ─── Seeded RNG ───────────────────────────────────────────────────────────

function seededRng(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// ─── Generation ───────────────────────────────────────────────────────────

function rollTier(rng: () => number): RecruitTier {
  const r = rng();
  if (r < 0.05) return "Prodigy";
  if (r < 0.20) return "Exceptional";
  if (r < 0.50) return "Promising";
  return "Common";
}

function distributeAttributes(rng: () => number, total: number): Attributes {
  const attrs: Attributes = { ST: 3, CN: 3, SZ: 3, WT: 3, WL: 3, SP: 3, DF: 3 };
  let pool = total - 21; // 21 is base (7 × 3)
  const keys: (keyof Attributes)[] = ["ST", "CN", "SZ", "WT", "WL", "SP", "DF"];

  while (pool > 0) {
    const key = keys[Math.floor(rng() * keys.length)];
    const max = Math.min(pool, 21 - attrs[key]); // recruit cap is 21
    if (max <= 0) continue;
    const add = Math.min(max, Math.floor(rng() * 3) + 1);
    attrs[key] += add;
    pool -= add;
  }
  return attrs;
}

function generateLore(rng: () => number, style: FightingStyle): string {
  const origin = ORIGIN_TEMPLATES[Math.floor(rng() * ORIGIN_TEMPLATES.length)];
  const blurbs = STYLE_BLURBS[style] || ["A fighter with something to prove."];
  const blurb = blurbs[Math.floor(rng() * blurbs.length)];
  return `${origin} ${blurb}`;
}

export function generateRecruit(
  rng: () => number,
  usedNames: Set<string>,
  week: number,
  forceTier?: RecruitTier
): PoolWarrior {
  const tier = forceTier ?? rollTier(rng);
  const [minPts, maxPts] = TIER_POINTS[tier];
  const total = minPts + Math.floor(rng() * (maxPts - minPts + 1));
  const attributes = distributeAttributes(rng, total);

  const styles = Object.values(FightingStyle);
  const style = styles[Math.floor(rng() * styles.length)];

  // Pick unique name
  let name: string;
  let attempts = 0;
  do {
    name = NAME_POOL[Math.floor(rng() * NAME_POOL.length)];
    attempts++;
  } while (usedNames.has(name) && attempts < 200);
  usedNames.add(name);

  const { baseSkills, derivedStats } = computeWarriorStats(attributes, style);
  const potential = generatePotential(attributes, tier, rng);
  const favorites = generateFavorites(style, rng);

  return {
    id: `recruit_${Date.now()}_${Math.floor(rng() * 1e6)}`,
    name,
    style,
    attributes,
    potential,
    baseSkills,
    derivedStats,
    tier,
    cost: TIER_COST[tier],
    age: 16 + Math.floor(rng() * 6),
    lore: generateLore(rng, style),
    addedWeek: week,
    favorites,
  };
}

// ─── Pool Management ──────────────────────────────────────────────────────

export function generateRecruitPool(
  count: number,
  week: number,
  usedNames: Set<string>,
  seed?: number
): PoolWarrior[] {
  const rng = seededRng(seed ?? (week * 9973 + 42));
  const pool: PoolWarrior[] = [];

  // Guarantee at least one Promising+ warrior
  pool.push(generateRecruit(rng, usedNames, week, rng() < 0.3 ? "Exceptional" : "Promising"));

  for (let i = 1; i < count; i++) {
    pool.push(generateRecruit(rng, usedNames, week));
  }

  return pool;
}

/** Partial weekly refresh — replace oldest 1-2 warriors */
export function partialRefreshPool(
  pool: PoolWarrior[],
  week: number,
  usedNames: Set<string>
): PoolWarrior[] {
  if (pool.length === 0) return generateRecruitPool(5, week, usedNames);

  const sorted = [...pool].sort((a, b) => a.addedWeek - b.addedWeek);
  const removeCount = Math.min(2, Math.max(1, Math.floor(pool.length * 0.3)));
  const remaining = sorted.slice(removeCount);

  // Rebuild used names from remaining
  const remainingNames = new Set(remaining.map(w => w.name));
  const allUsed = new Set([...usedNames, ...remainingNames]);

  const rng = seededRng(week * 7919 + 31);
  const newWarriors: PoolWarrior[] = [];
  for (let i = 0; i < removeCount; i++) {
    newWarriors.push(generateRecruit(rng, allUsed, week));
  }

  // Ensure pool stays at 5
  const result = [...remaining, ...newWarriors];
  while (result.length < 4) {
    result.push(generateRecruit(rng, allUsed, week));
  }

  return result;
}

/** Full manual refresh (costs gold) */
export function fullRefreshPool(
  week: number,
  usedNames: Set<string>
): PoolWarrior[] {
  return generateRecruitPool(5, week, usedNames, Date.now());
}

// ─── AI Draft ─────────────────────────────────────────────────────────────

import type { RivalStableData } from "@/types/game";
import type { OwnerPersonality } from "@/types/game";

const PERSONALITY_STYLE_PREFS: Record<OwnerPersonality, FightingStyle[]> = {
  Aggressive: [FightingStyle.BashingAttack, FightingStyle.LungingAttack, FightingStyle.SlashingAttack, FightingStyle.StrikingAttack],
  Methodical: [FightingStyle.ParryStrike, FightingStyle.ParryRiposte, FightingStyle.WallOfSteel],
  Showman: [FightingStyle.AimedBlow, FightingStyle.SlashingAttack, FightingStyle.LungingAttack],
  Pragmatic: [FightingStyle.StrikingAttack, FightingStyle.ParryStrike, FightingStyle.WallOfSteel],
  Tactician: [FightingStyle.ParryRiposte, FightingStyle.ParryLunge, FightingStyle.AimedBlow],
};

export function aiDraftFromPool(
  pool: PoolWarrior[],
  rivals: RivalStableData[],
  week: number
): { updatedPool: PoolWarrior[]; updatedRivals: RivalStableData[]; gazetteItems: string[] } {
  // AI recruitment every 4 weeks
  if (week % 4 !== 0) return { updatedPool: pool, updatedRivals: rivals, gazetteItems: [] };

  const remainingPool = [...pool];
  const updatedRivals = rivals.map(r => ({ ...r, roster: [...r.roster] }));
  const gazetteItems: string[] = [];

  for (const rival of updatedRivals) {
    const activeCount = rival.roster.filter(w => w.status === "Active").length;
    if (activeCount >= 4) continue; // roster full enough
    if (remainingPool.length === 0) break;

    const personality = rival.owner.personality ?? "Pragmatic";
    const prefs = PERSONALITY_STYLE_PREFS[personality] || [];

    // Score candidates
    let bestIdx = -1;
    let bestScore = -Infinity;
    for (let i = 0; i < remainingPool.length; i++) {
      const w = remainingPool[i];
      let score = 0;
      // Style fit
      if (prefs.includes(w.style)) score += 20;
      // Quality
      score += TIER_STARS[w.tier] * 10;
      // Cost penalty (AI has implied budget)
      score -= w.cost * 0.02;

      if (score > bestScore) { bestScore = score; bestIdx = i; }
    }

    if (bestIdx >= 0) {
      const recruit = remainingPool[bestIdx];
      remainingPool.splice(bestIdx, 1);

      // Add to rival roster as a Warrior
      rival.roster.push({
        id: `rival_recruit_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
        name: recruit.name,
        style: recruit.style,
        attributes: recruit.attributes,
        potential: recruit.potential,
        baseSkills: recruit.baseSkills,
        derivedStats: recruit.derivedStats,
        fame: 0,
        popularity: 0,
        titles: [],
        injuries: [],
        flair: [],
        career: { wins: 0, losses: 0, kills: 0 },
        champion: false,
        status: "Active",
        age: recruit.age,
        stableId: rival.owner.id,
      });

      gazetteItems.push(`${rival.owner.stableName} signed ${recruit.name} (${recruit.tier}).`);
    }
  }

  return { updatedPool: remainingPool, updatedRivals, gazetteItems };
}
