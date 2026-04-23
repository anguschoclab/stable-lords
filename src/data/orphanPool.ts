/**
 * Dynamic Orphanage Pool Generator
 * Generates randomized orphan warriors with thematic names, backstories,
 * personality traits, ages, and style-appropriate attribute spreads.
 */
import { FightingStyle, type Attributes, ATTRIBUTE_KEYS } from "@/types/game";
import type { AttributePotential } from "@/types/warrior.types";
import { generatePotential } from "@/engine/potential";
import type { FightPlan } from "@/types/shared.types";

export interface OrphanWarrior {
  id: string;
  name: string;
  age: number;
  style: FightingStyle;
  attrs: Attributes;
  lore: string;
  trait: string;
  origin: string;
  potential: AttributePotential;
}

// ── Name pools by archetype ─────────────────────────────────────────────

const NAMES_BRUTAL = [
  "KRAGOS", "GORLAK", "BRUTAG", "THUNDRAK", "GARVOK", "IRONJAW",
  "BOLVERK", "SKARN", "GROTHAK", "WULFGAR", "DRAXUS", "MORGUL",
  "KORGAN", "BREKKA", "GRIMMAW", "STONEFIST", "BLOODAXE", "IRONCLAW",
  "KRAKEN", "OX", "HAMMER", "ANVIL", "BULL", "BOAR", "MAMMOTH", "TITAN",
  "COLOSSUS", "JUGGERNAUT", "RAZOR", "GOLIATH", "BEHEMOTH", "IRONBULL",
  "WARHAMMER", "CRUSHER", "BREAKER", "STOMPER", "GRIM", "BASTION"
];

const NAMES_AGILE = [
  "SILVANE", "VEXIA", "THORNE", "VYREN", "KAELIS", "NYX",
  "TALYN", "ZEPHYRA", "LYSARA", "MIRAEL", "SYRAH", "ASHARA",
  "DUSKBANE", "SHADOWSTEP", "QUICKBLADE", "SWIFTWIND", "NIGHTWHISPER", "RAZORLEAF",
  "WISP", "GHOST", "MIST", "DART", "BOLT", "STRIKE", "FLASH", "COBRA",
  "KESTREL", "HAWK", "FALCON", "VIPER", "SCORPION", "SILVER", "QUICKSILVER",
  "SHADE", "WHISPER", "ZEPHYR", "ECHO", "GOSSAMER"
];

const NAMES_CUNNING = [
  "FERRIK", "MORKA", "OBERON", "MALAKAI", "SEREN", "VHAEL",
  "RAZIEL", "CASSIAN", "EREBUS", "ORPHEUS", "REVENANT", "NOCTIS",
  "GHAEL", "VELKOR", "AURELIAN", "PRIMUS", "DECIMUS", "SEVERAK",
  "FOX", "JACKAL", "RAVEN", "CROW", "OWL", "SNAKE", "SPIDER", "WEB",
  "TRICKSTER", "JESTER", "PHANTOM", "ENIGMA", "MYSTIC", "SAGE", "ORACLE",
  "PROPHET", "SCRIBE", "SCHOLAR", "CIPHER", "VEIL"
];

const NAMES_MIXED = [
  "VICTUS", "MAXIMAR", "GLADIUS", "SPARTOK", "CENTURAX", "VALORIAN",
  "FANGMAW", "STORMFANG", "SCORPIUS", "RAVENMOOR", "HAWKSTEEL", "DIREWOLF",
  "ASHCLAW", "VIPERTOOTH", "LYNXBLADE", "BEARJAW", "TYRANNUS", "WRAITH",
  "WOLF", "HOUND", "BEAR", "LION", "TIGER", "LEOPARD", "PANTHER", "CHIMERA",
  "HYDRA", "DRAKE", "DRAGON", "PHOENIX", "GRIFFIN", "MANTICORE", "SPHINX",
  "BASILISK", "WYVERN", "LEGION", "VANGUARD"
];

// ── Lore & Backstory ─────────────────────────────────────────────────────

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
  "A former temple acolyte who traded prayers for a practice sword",
  "Left at a roadside inn during a summer festival, raised by the kitchen staff",
  "Found in the ruins of a library, clutching a scroll on anatomy",
  "Escaped from a salt mine after a cave-in killed the guards",
  "The child of a fallen knight, found wandering the high mountain passes",
  "A stowaway from the distant Southern Isles, discovered in a spice crate",
  "Born during a solar eclipse, considered an omen of blood and iron",
  "Survived the burning of the Great Forest by hiding in a hollow log",
  "A street urchin who won a bet with an arena recruiter",
  "Found under the floorboards of a tailor shop after a city riot",
  "The only survivor of a mountain pass avalanche",
  "Raised by a retired trainer in a remote fishing village",
  "Found adrift on a raft in the middle of the Great Sea",
  "Discovered in the heart of a hedge maze, silent and watchful"
];

const CHILDHOOD_TRAITS = [
  "was known for stealing bread from the temple kitchen",
  "spent nights watching the stars from the orphanage roof",
  "often got into fights with the older boys and won",
  "preferred the company of stray dogs to other children",
  "secretly practiced with a heavy wooden branch in the woods",
  "would spend hours drawing technical diagrams in the dirt",
  "earned a reputation as a peacemaker among the street urchins",
  "could hold their breath for three minutes in the harbor pits",
  "was obsessed with the stories of the old arena champions",
  "learned to move without making a single sound in the shadows",
  "developed a freakish grip strength from climbing the quarry walls",
  "spent their few coins on medical scrolls instead of food",
  "would sit in silence for hours, observing the birds of prey",
  "was the only one brave enough to explore the haunted ruins",
  "taught themselves to fight by imitating the arena trainees",
  "became a local legend for never backing down from a challenge"
];

const DEFINING_MOMENTS = [
  "until a recruiter saw them handle a practice sword with natural grace",
  "but everything changed when they saved the Headmistress from a fire",
  "growing into a restless youth with a hunger for the arena's glory",
  "waiting for the day they could finally leave the slums behind",
  "now seeking a master who can turn that raw potential into lethality",
  "possessing a gaze that suggests they have seen more than their share of blood",
  "driven by a quiet, burning desire to prove their worth to the world",
  "carrying the weight of their past with a grim, unyielding determination",
  "ready to trade their freedom for the chance to strike back at fate",
  "looking for the one fight that will finally set them free",
  "with a spirit that refuses to be broken by the grinding poverty of the pits",
  "now standing at the threshold of a legacy they are eager to claim"
];

// ── Mechanical Traits ────────────────────────────────────────────────────

export interface TraitData {
  modifiers: Partial<FightPlan>;
  attrBonus?: Partial<Attributes>;
  description: string;
}

export const TRAIT_DATA: Record<string, TraitData> = {
  "Aggressive": {
    modifiers: { OE: 4, AL: -2, killDesire: 5 },
    attrBonus: { ST: 1, WL: 1 },
    description: "Fights with reckless abandon, favoring strength over defense."
  },
  "Disciplined": {
    modifiers: { AL: 3, OE: -1, feintTendency: 5 },
    attrBonus: { DF: 1, WL: 1 },
    description: "Calm and focused, waiting for the perfect moment to strike."
  },
  "Cunning": {
    modifiers: { feintTendency: 10, AL: 2, killDesire: -2 },
    attrBonus: { SP: 1, DF: 1 },
    description: "Favors trickery and misdirection to find the killing blow."
  },
  "Sturdy": {
    modifiers: { AL: -3, OE: -2, killDesire: -5 },
    attrBonus: { CN: 1, SZ: 1 },
    description: "An unbreakable wall that outlasts any opponent."
  },
  "Feral": {
    modifiers: { OE: 6, AL: -4, killDesire: 10 },
    attrBonus: { ST: 1, SP: 1 },
    description: "Fights with a savage, unpredictable intensity."
  },
  "Merciless": {
    modifiers: { killDesire: 15, OE: 2 },
    attrBonus: { ST: 1, WL: 1 },
    description: "Relentlessly pursues the kill, ignoring all distractions."
  },
  "Calculated": {
    modifiers: { feintTendency: 8, AL: 4, OE: -3 },
    attrBonus: { SP: 1, DF: 1 },
    description: "Every move is a deliberate setup for a final strike."
  },
  "Resilient": {
    modifiers: { AL: -2, killDesire: -8 },
    attrBonus: { CN: 2 },
    description: "Absorbs punishment that would fell a lesser warrior."
  },
  "Evasive": {
    modifiers: { AL: 10, OE: -5, feintTendency: 5 },
    attrBonus: { SP: 2 },
    description: "A ghost on the sand, near-impossible to pin down."
  },
  "Brutal": {
    modifiers: { OE: 8, killDesire: 5, AL: -5 },
    attrBonus: { ST: 2 },
    description: "Values raw power and crushing impact above all else."
  }
};

const TRAITS = Object.keys(TRAIT_DATA);

// ── Archetypes ───────────────────────────────────────────────────────────

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

const ARCHETYPE_STAT_WEIGHTS: Record<Archetype, { high: (keyof Attributes)[]; mid: (keyof Attributes)[]; low: (keyof Attributes)[] }> = {
  brutal:  { high: ["ST", "CN", "SZ"], mid: ["WL"], low: ["WT", "SP", "DF"] },
  agile:   { high: ["SP", "DF", "WT"], mid: ["ST"], low: ["CN", "SZ", "WL"] },
  cunning: { high: ["WT", "DF", "WL"], mid: ["SP"], low: ["ST", "CN", "SZ"] },
  tank:    { high: ["CN", "WL", "SZ"], mid: ["ST"], low: ["WT", "SP", "DF"] },
};

// ── RNG & Helpers ────────────────────────────────────────────────────────

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

// ── Generation Logic ─────────────────────────────────────────────────────

function generateAttrs(archetype: Archetype, rng: () => number): Attributes {
  const weights = ARCHETYPE_STAT_WEIGHTS[archetype];
  const attrs: Attributes = { ST: 3, CN: 3, SZ: 3, WT: 3, WL: 3, SP: 3, DF: 3 };
  
  const totalPoints = 70 + (Math.floor(rng() * 7) - 2); 
  let pool = totalPoints - 21;

  for (const key of weights.high) {
    const add = Math.floor(rng() * 7) + 8;
    const clamped = Math.min(add, pool, 22);
    attrs[key] += clamped;
    pool -= clamped;
  }

  for (const key of weights.mid) {
    const add = Math.floor(rng() * 6) + 4;
    const clamped = Math.min(add, pool, 22);
    attrs[key] += clamped;
    pool -= clamped;
  }

  const lowKeys = shuffled(weights.low, rng);
  for (const key of lowKeys) {
    if (pool <= 0) break;
    const add = Math.min(Math.floor(rng() * 5) + 2, pool, 22);
    attrs[key] += add;
    pool -= add;
  }

  while (pool > 0) {
    const key = pick(ATTRIBUTE_KEYS as unknown as (keyof Attributes)[], rng);
    if (attrs[key] < 25) {
      attrs[key]++;
      pool--;
    }
  }

  return attrs;
}

function generateLore(name: string, rng: () => number): string {
  const childhood = pick(CHILDHOOD_TRAITS, rng);
  const defining = pick(DEFINING_MOMENTS, rng);
  return `${name} ${childhood}, ${defining}.`;
}

export function generateOrphanPool(count: number = 8, seed?: number): OrphanWarrior[] {
  const rng = seededRng(seed ?? Date.now());
  const styles = Object.values(FightingStyle);
  const usedNames = new Set<string>();
  const pool: OrphanWarrior[] = [];

  const guaranteedStyles = shuffled([
    pick([FightingStyle.BashingAttack, FightingStyle.StrikingAttack], rng),
    pick([FightingStyle.LungingAttack, FightingStyle.SlashingAttack], rng),
    pick([FightingStyle.AimedBlow, FightingStyle.ParryRiposte, FightingStyle.ParryLunge, FightingStyle.ParryStrike], rng),
    pick([FightingStyle.TotalParry, FightingStyle.WallOfSteel], rng),
  ], rng);

  for (let i = 0; i < count; i++) {
    const style = i < guaranteedStyles.length ? guaranteedStyles[i] : pick(styles, rng);
    const archetype = STYLE_ARCHETYPE[style];

    const namePool = [...ARCHETYPE_NAMES[archetype], ...NAMES_MIXED].filter(n => !usedNames.has(n));
    const name = namePool.length > 0 ? pick(namePool, rng) : `ORPHAN_${i}`;
    usedNames.add(name);

    const age = Math.floor(rng() * 5) + 15;
    const attrs = generateAttrs(archetype, rng);
    const origin = pick(ORIGINS, rng);
    const trait = pick(TRAITS, rng);
    const lore = generateLore(name, rng);
    
    const rarityRoll = rng();
    let tier: "Common" | "Promising" | "Exceptional" | "Prodigy" = "Common";
    if (rarityRoll > 0.99) tier = "Prodigy";
    else if (rarityRoll > 0.95) tier = "Exceptional";
    else if (rarityRoll > 0.82) tier = "Promising";
    
    const traitData = TRAIT_DATA[trait];
    if (traitData.attrBonus) {
      for (const [key, bonus] of Object.entries(traitData.attrBonus)) {
        attrs[key as keyof Attributes] += bonus;
      }
    }
    
    const potential = generatePotential(attrs, tier, rng);

    pool.push({
      id: `orp_${i}_${Math.floor(rng() * 1e6)}`,
      name,
      age,
      style,
      attrs,
      lore,
      trait,
      origin,
      potential,
    });
  }

  return pool;
}
