import { FightingStyle, type Attributes, type BaseSkills, type DerivedStats } from "@/types/shared.types";
import { type AttributePotential, type WarriorFavorites } from "@/types/warrior.types";
import { computeWarriorStats } from "./skillCalc";
import { generatePotential } from "./potential";
import { generateFavorites } from "./favorites";
import { SeededRNG } from "@/utils/random";
import { generateId } from "@/utils/idUtils";

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
const DEFAULT_POOL_SIZE = 12; // Increased from 5 to maintain world population
export { REFRESH_COST, DEFAULT_POOL_SIZE };

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

// Removed manual seededRng implementation in favor of utils/random

// ─── Generation ───────────────────────────────────────────────────────────

function rollTier(rng: SeededRNG): RecruitTier {
  if (rng.chance(0.05)) return "Prodigy";
  if (rng.chance(0.20)) return "Exceptional";
  if (rng.chance(0.50)) return "Promising";
  return "Common";
}

function distributeAttributes(rng: SeededRNG, total: number): Attributes {
  const attrs: Attributes = { ST: 3, CN: 3, SZ: 3, WT: 3, WL: 3, SP: 3, DF: 3 };
  let pool = total - 21; // 21 is base (7 × 3)
  const keys: (keyof Attributes)[] = ["ST", "CN", "SZ", "WT", "WL", "SP", "DF"];

  while (pool > 0) {
    const key = rng.pick(keys);
    const max = Math.min(pool, 21 - attrs[key]); // recruit cap is 21
    if (max <= 0) continue;
    const add = Math.min(max, rng.roll(1, 3));
    attrs[key] += add;
    pool -= add;
  }
  return attrs;
}

function generateLore(rng: SeededRNG, style: FightingStyle): string {
  const origin = rng.pick(ORIGIN_TEMPLATES);
  const blurbs = STYLE_BLURBS[style] || ["A fighter with something to prove."];
  const blurb = rng.pick(blurbs);
  return `${origin} ${blurb}`;
}

export function generateRecruit(
  rng: SeededRNG,
  usedNames: Set<string>,
  week: number,
  forceTier?: RecruitTier
): PoolWarrior {
  const tier = forceTier ?? rollTier(rng);
  const [minPts, maxPts] = TIER_POINTS[tier];
  const total = rng.roll(minPts, maxPts);
  const attributes = distributeAttributes(rng, total);

  const styles = Object.values(FightingStyle);
  const style = rng.pick(styles);

  // Pick unique name
  let name: string;
  let attempts = 0;
  do {
    name = rng.pick(NAME_POOL);
    attempts++;
  } while (usedNames.has(name) && attempts < 200);
  usedNames.add(name);

  const { baseSkills, derivedStats } = computeWarriorStats(attributes, style);
  const potential = generatePotential(attributes, tier, () => rng.next());
  const favorites = generateFavorites(style, () => rng.next());

  return {
    id: generateId(rng, "warrior"),
    name,
    style,
    attributes,
    potential,
    baseSkills,
    derivedStats,
    tier,
    cost: TIER_COST[tier],
    age: 16 + rng.roll(0, 5),
    lore: generateLore(rng, style),
    addedWeek: week,
    favorites,
  };
}

// ─── Pool Management ──────────────────────────────────────────────────────

export function generateRecruitPool(
  count: number = DEFAULT_POOL_SIZE,
  week: number,
  usedNames: Set<string>,
  seed?: number
): PoolWarrior[] {
  const rng = new SeededRNG(seed ?? (week * 9973 + 42));
  const pool: PoolWarrior[] = [];

  // Guarantee at least two Promising+ warriors in a larger pool
  pool.push(generateRecruit(rng, usedNames, week, rng.chance(0.3) ? "Exceptional" : "Promising"));
  pool.push(generateRecruit(rng, usedNames, week, rng.chance(0.1) ? "Prodigy" : "Promising"));

  while (pool.length < count) {
    pool.push(generateRecruit(rng, usedNames, week));
  }

  return pool;
}

/** Partial weekly refresh — replace oldest 3-4 warriors */
export function partialRefreshPool(
  pool: PoolWarrior[],
  week: number,
  usedNames: Set<string>
): PoolWarrior[] {
  if (pool.length === 0) return generateRecruitPool(DEFAULT_POOL_SIZE, week, usedNames);

  const sorted = [...pool].sort((a, b) => a.addedWeek - b.addedWeek);
  const removeCount = Math.min(4, Math.max(2, Math.floor(pool.length * 0.3)));
  const remaining = sorted.slice(removeCount);

  // Rebuild used names from remaining
  const remainingNames = new Set(remaining.map(w => w.name));
  const allUsed = new Set([...usedNames, ...remainingNames]);

  const rng = new SeededRNG(week * 7919 + 31);
  const newWarriors: PoolWarrior[] = [];
  for (let i = 0; i < removeCount; i++) {
    newWarriors.push(generateRecruit(rng, allUsed, week));
  }

  // Ensure pool stays at size
  const result = [...remaining, ...newWarriors];
  while (result.length < DEFAULT_POOL_SIZE) {
    result.push(generateRecruit(rng, allUsed, week));
  }

  return result;
}

/** Full manual refresh (costs gold) */
export function fullRefreshPool(
  week: number,
  usedNames: Set<string>
): PoolWarrior[] {
  const seed = week * 1337 + 7;
  return generateRecruitPool(DEFAULT_POOL_SIZE, week, usedNames, seed);
}

// AI Draft behavior has been moved to src/engine/draftService.ts
