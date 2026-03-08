/**
 * Dynamic Orphanage Pool Generator
 * Generates randomized orphan warriors with thematic names, backstories,
 * personality traits, ages, and style-appropriate attribute spreads.
 */
import { FightingStyle, type Attributes, ATTRIBUTE_KEYS } from "@/types/game";

export interface OrphanWarrior {
  id: string;
  name: string;
  age: number;
  style: FightingStyle;
  attrs: Attributes;
  lore: string;
  trait: string;
  origin: string;
}

// ── Name pools by archetype ─────────────────────────────────────────────

const NAMES_BRUTAL = [
  "KRAGOS", "GORLAK", "BRUTAG", "THUNDRAK", "GARVOK", "IRONJAW",
  "BOLVERK", "SKARN", "GROTHAK", "WULFGAR", "DRAXUS", "MORGUL",
  "KORGAN", "BREKKA", "GRIMMAW", "STONEFIST", "BLOODAXE", "IRONCLAW",
];

const NAMES_AGILE = [
  "SILVANE", "VEXIA", "THORNE", "VYREN", "KAELIS", "NYX",
  "TALYN", "ZEPHYRA", "LYSARA", "MIRAEL", "SYRAH", "ASHARA",
  "DUSKBANE", "SHADOWSTEP", "QUICKBLADE", "SWIFTWIND", "NIGHTWHISPER", "RAZORLEAF",
];

const NAMES_CUNNING = [
  "FERRIK", "MORKA", "OBERON", "MALAKAI", "SEREN", "VHAEL",
  "RAZIEL", "CASSIAN", "EREBUS", "ORPHEUS", "REVENANT", "NOCTIS",
  "GHAEL", "VELKOR", "AURELIAN", "PRIMUS", "DECIMUS", "SEVERAK",
];

const NAMES_MIXED = [
  "VICTUS", "MAXIMAR", "GLADIUS", "SPARTOK", "CENTURAX", "VALORIAN",
  "FANGMAW", "STORMFANG", "SCORPIUS", "RAVENMOOR", "HAWKSTEEL", "DIREWOLF",
  "ASHCLAW", "VIPERTOOTH", "LYNXBLADE", "BEARJAW", "TYRANNUS", "WRAITH",
];

// ── Backstory components ────────────────────────────────────────────────

const ORIGINS = [
  "Found as an infant in the collapsed mines beneath Ironveil",
  "Survived alone in the Ashwood after bandits razed a village",
  "Pulled from the wreckage of a merchant caravan on the Dread Road",
  "Abandoned at the orphanage gates during the Crimson Winter",
  "A dock rat from the harbor slums of Port Kethara",
  "Discovered wandering the battlefield after the Siege of Thornwall",
  "Born in a debtors' prison, raised by the wardens' charity",
  "The sole survivor of a plague ship that washed ashore near Gulltown",
  "Grew up scrapping for scraps in the fighting pits of Dusthollow",
  "A runaway from a traveling circus, scarred but unbroken",
  "Taken from a slave caravan by arena scouts before reaching market",
  "Left on the steps of the Temple of Iron during a blood moon",
  "Raised feral in the sewers beneath the Colosseum district",
  "Escaped a collapsed quarry at age seven, dragging two others to safety",
  "The child of a disgraced gladiator, born in the shadow of the arena",
  "Found clutching a broken sword in the ruins of Fort Ashenmere",
];

const TRAITS = [
  "Fearless", "Calculating", "Savage", "Patient", "Reckless",
  "Stoic", "Hot-blooded", "Methodical", "Cunning", "Relentless",
  "Cold-eyed", "Scrappy", "Iron-willed", "Quiet fury", "Born survivor",
  "Ruthless", "Deceptively calm", "Feral instinct", "Natural leader", "Lone wolf",
];

const LORE_TEMPLATES_BRUTAL: string[] = [
  "A hulking youth who settles every argument with fists. The other orphans give {name} a wide berth.",
  "Massive for {pronoun} age. {name} once broke a training dummy clean in half — on accident.",
  "{name} fights like a cornered beast. No technique, just terrifying raw power.",
  "The strongest orphan anyone can remember. {name} was arm-wrestling adults by age twelve.",
  "Built like a siege engine. {name} doesn't dodge — {pronoun_sub} walks through punishment and keeps swinging.",
];

const LORE_TEMPLATES_AGILE: string[] = [
  "Quick as a shadow and twice as hard to catch. {name} was born to move.",
  "Lightning reflexes. {name} can snatch a thrown knife from the air — and has, more than once.",
  "{name} dances where others merely fight. Every movement is precise, deliberate, lethal.",
  "The fastest hands in the orphanage. {name} strikes before opponents even see it coming.",
  "Lean and whip-fast. {name} treats combat like a deadly performance art.",
];

const LORE_TEMPLATES_CUNNING: string[] = [
  "{name} watches. Waits. Then strikes exactly where it hurts most.",
  "Uncannily perceptive. {name} reads opponents like an open book and exploits every weakness.",
  "Not the biggest, not the fastest — but {name} wins more than anyone. Brains over brawn.",
  "Quiet and observant. {name} has already planned three moves ahead before the fight begins.",
  "{name} fights with eerie precision. Every blow is calculated to inflict maximum damage with minimum effort.",
];

const LORE_TEMPLATES_TANK: string[] = [
  "An iron wall. {name} absorbs punishment that would fell lesser fighters, then grinds opponents down.",
  "{name} doesn't go down. Ever. The other orphans stopped trying to knock {pronoun_obj} out years ago.",
  "Unyielding. {name} treats pain as a suggestion and exhaustion as a myth.",
  "Built to endure. {name} has never been knocked unconscious — not once, not ever.",
  "{name} outlasts everyone. When the dust settles, {pronoun_sub} is always the one still standing.",
];

// ── Style archetype mapping ─────────────────────────────────────────────

type Archetype = "brutal" | "agile" | "cunning" | "tank";

const STYLE_ARCHETYPE: Record<FightingStyle, Archetype> = {
  [FightingStyle.BashingAttack]:   "brutal",
  [FightingStyle.StrikingAttack]:  "brutal",
  [FightingStyle.LungingAttack]:   "agile",
  [FightingStyle.SlashingAttack]:  "agile",
  [FightingStyle.AimedBlow]:       "cunning",
  [FightingStyle.ParryRiposte]:    "cunning",
  [FightingStyle.ParryLunge]:      "cunning",
  [FightingStyle.ParryStrike]:     "cunning",
  [FightingStyle.TotalParry]:      "tank",
  [FightingStyle.WallOfSteel]:     "tank",
};

const ARCHETYPE_NAMES: Record<Archetype, string[]> = {
  brutal:  NAMES_BRUTAL,
  agile:   NAMES_AGILE,
  cunning: NAMES_CUNNING,
  tank:    NAMES_MIXED,
};

const ARCHETYPE_LORE: Record<Archetype, string[]> = {
  brutal:  LORE_TEMPLATES_BRUTAL,
  agile:   LORE_TEMPLATES_AGILE,
  cunning: LORE_TEMPLATES_CUNNING,
  tank:    LORE_TEMPLATES_TANK,
};

// ── Stat spread templates per archetype ─────────────────────────────────

// Each archetype has weighted stat distributions (high, medium, low keys)
const ARCHETYPE_STAT_WEIGHTS: Record<Archetype, { high: (keyof Attributes)[]; mid: (keyof Attributes)[]; low: (keyof Attributes)[] }> = {
  brutal:  { high: ["ST", "CN", "SZ"], mid: ["WL"], low: ["WT", "SP", "DF"] },
  agile:   { high: ["SP", "DF", "WT"], mid: ["ST"], low: ["CN", "SZ", "WL"] },
  cunning: { high: ["WT", "DF", "WL"], mid: ["SP"], low: ["ST", "CN", "SZ"] },
  tank:    { high: ["CN", "WL", "SZ"], mid: ["ST"], low: ["WT", "SP", "DF"] },
};

// ── RNG Helper ──────────────────────────────────────────────────────────

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffled<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Attribute Generation ────────────────────────────────────────────────

function generateAttrs(archetype: Archetype, rng: () => number): Attributes {
  const weights = ARCHETYPE_STAT_WEIGHTS[archetype];
  const attrs: Attributes = { ST: 3, CN: 3, SZ: 3, WT: 3, WL: 3, SP: 3, DF: 3 };
  let pool = 70 - 21; // 49 to distribute

  // Distribute to high stats first (11-17 range)
  for (const key of weights.high) {
    const add = Math.floor(rng() * 7) + 8; // 8-14 more (total 11-17)
    const clamped = Math.min(add, pool, 22); // max 25 total
    attrs[key] += clamped;
    pool -= clamped;
  }

  // Mid stats (7-12 range)
  for (const key of weights.mid) {
    const add = Math.floor(rng() * 6) + 4; // 4-9 more (total 7-12)
    const clamped = Math.min(add, pool, 22);
    attrs[key] += clamped;
    pool -= clamped;
  }

  // Distribute remaining to low stats
  const lowKeys = shuffled(weights.low, rng);
  for (const key of lowKeys) {
    if (pool <= 0) break;
    const add = Math.min(Math.floor(rng() * 5) + 2, pool, 22); // 2-6 more (total 5-9)
    attrs[key] += add;
    pool -= add;
  }

  // Distribute any leftover evenly
  while (pool > 0) {
    const key = pick(ATTRIBUTE_KEYS as unknown as (keyof Attributes)[], rng);
    if (attrs[key] < 25) {
      attrs[key]++;
      pool--;
    }
  }

  return attrs;
}

// ── Lore Generation ─────────────────────────────────────────────────────

function generateLore(name: string, archetype: Archetype, rng: () => number): string {
  const template = pick(ARCHETYPE_LORE[archetype], rng);
  const isFemName = ["VEXIA", "SILVANE", "ASHARA", "ZEPHYRA", "LYSARA", "MIRAEL", "SYRAH", "NYX", "NIGHTWHISPER", "RAZORLEAF", "SWIFTWIND"].includes(name);
  return template
    .replace(/\{name\}/g, name)
    .replace(/\{pronoun\}/g, isFemName ? "her" : "his")
    .replace(/\{pronoun_sub\}/g, isFemName ? "she" : "he")
    .replace(/\{pronoun_obj\}/g, isFemName ? "her" : "him");
}

// ── Main Generator ──────────────────────────────────────────────────────

export function generateOrphanPool(count: number = 8, seed?: number): OrphanWarrior[] {
  const rng = seededRng(seed ?? Date.now());
  const styles = Object.values(FightingStyle);
  const usedNames = new Set<string>();
  const pool: OrphanWarrior[] = [];

  // Ensure style variety: pick at least one from each archetype
  const guaranteedStyles = shuffled([
    pick([FightingStyle.BashingAttack, FightingStyle.StrikingAttack], rng),
    pick([FightingStyle.LungingAttack, FightingStyle.SlashingAttack], rng),
    pick([FightingStyle.AimedBlow, FightingStyle.ParryRiposte, FightingStyle.ParryLunge, FightingStyle.ParryStrike], rng),
    pick([FightingStyle.TotalParry, FightingStyle.WallOfSteel], rng),
  ], rng);

  for (let i = 0; i < count; i++) {
    const style = i < guaranteedStyles.length ? guaranteedStyles[i] : pick(styles, rng);
    const archetype = STYLE_ARCHETYPE[style];

    // Pick unique name from archetype pool + mixed
    const namePool = [...ARCHETYPE_NAMES[archetype], ...NAMES_MIXED].filter(n => !usedNames.has(n));
    const name = namePool.length > 0 ? pick(namePool, rng) : `ORPHAN_${i}`;
    usedNames.add(name);

    const age = Math.floor(rng() * 5) + 15; // 15-19
    const attrs = generateAttrs(archetype, rng);
    const origin = pick(ORIGINS, rng);
    const trait = pick(TRAITS, rng);
    const lore = generateLore(name, archetype, rng);

    pool.push({
      id: `orp_${i}_${Math.floor(rng() * 1e6)}`,
      name,
      age,
      style,
      attrs,
      lore,
      trait,
      origin,
    });
  }

  return pool;
}
