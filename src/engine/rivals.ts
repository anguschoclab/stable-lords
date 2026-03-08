/**
 * AI Rival Stables — generates and manages competing stables.
 * 
 * Each rival stable has:
 * - A thematic stable name, motto, and origin
 * - A named owner with personality & coaching philosophy
 * - A roster of warriors with personality-biased attributes & styles
 * - Preferred fighting style tendencies per stable
 */
import { FightingStyle, type Warrior, type Owner, type OwnerPersonality } from "@/types/game";
import { computeWarriorStats } from "./skillCalc";

// ─── Stable Templates ─────────────────────────────────────────────────────
// Each template defines a unique stable identity that drives generation.

export interface StableTemplate {
  stableName: string;
  motto: string;
  origin: string;
  ownerName: string;
  personality: OwnerPersonality;
  /** Coaching philosophy — affects attribute weighting & style selection */
  philosophy: "Brute Force" | "Speed Kills" | "Iron Defense" | "Balanced" | "Spectacle" | "Cunning" | "Endurance" | "Specialist";
  /** Preferred styles — warriors have higher chance of these */
  preferredStyles: FightingStyle[];
  /** Attribute bias — weights for stat distribution */
  attrBias: Partial<Record<"ST" | "CN" | "SZ" | "WT" | "WL" | "SP" | "DF", number>>;
  /** Thematic warrior name pool */
  warriorNames: string[];
  /** Starting fame range [min, max] */
  fameRange: [number, number];
  /** Roster size range [min, max] */
  rosterRange: [number, number];
  tier: "Minor" | "Established" | "Major" | "Legendary";
}

const STABLE_TEMPLATES: StableTemplate[] = [
  // ── MAJOR STABLES (Established powerhouses) ──
  {
    stableName: "The Iron Wolves",
    motto: "Through iron, victory.",
    origin: "Founded in the forge-cities of the northern reaches, the Iron Wolves have dominated arena combat for decades with brutal, no-nonsense fighting.",
    ownerName: "Ragnar Stormborn",
    personality: "Aggressive",
    philosophy: "Brute Force",
    preferredStyles: [FightingStyle.BashingAttack, FightingStyle.StrikingAttack, FightingStyle.LungingAttack],
    attrBias: { ST: 3, CN: 2, SZ: 2, WL: 1 },
    warriorNames: ["GROND", "BRUK", "THORVALD", "KRAGOS", "FENRIR", "URSAK", "DROGBA", "IRONJAW", "HAMMERFALL", "BALDUR"],
    fameRange: [3, 6],
    rosterRange: [3, 5],
    tier: "Major",
  },
  {
    stableName: "House of Blades",
    motto: "A thousand cuts, one death.",
    origin: "An aristocratic fighting academy that treats swordsmanship as high art. Their warriors are technically brilliant and devastatingly precise.",
    ownerName: "Sera Blackthorn",
    personality: "Methodical",
    philosophy: "Cunning",
    preferredStyles: [FightingStyle.AimedBlow, FightingStyle.SlashingAttack, FightingStyle.ParryRiposte],
    attrBias: { WT: 3, DF: 3, SP: 2 },
    warriorNames: ["AZURA", "WHISPER", "SHADE", "SILKBLADE", "RAPIER", "ECHO", "STILETTO", "IRIS", "NEEDLE", "VIPER"],
    fameRange: [3, 7],
    rosterRange: [3, 5],
    tier: "Major",
  },
  {
    stableName: "The Blood Ravens",
    motto: "We feast on the fallen.",
    origin: "A savage consortium from the eastern wastes. They train warriors in kill-or-be-killed conditions, producing terrifyingly aggressive fighters.",
    ownerName: "Cassandra Vex",
    personality: "Aggressive",
    philosophy: "Spectacle",
    preferredStyles: [FightingStyle.LungingAttack, FightingStyle.BashingAttack, FightingStyle.SlashingAttack],
    attrBias: { ST: 2, SP: 3, WL: 2, DF: 1 },
    warriorNames: ["REAPER", "RAVOK", "BLOODFANG", "CARRION", "TALON", "SCORCH", "HAVOC", "CRIMSON", "MAULER", "DIRGE"],
    fameRange: [2, 5],
    rosterRange: [3, 5],
    tier: "Major",
  },

  // ── ESTABLISHED STABLES (Solid mid-tier) ──
  {
    stableName: "Golden Lions",
    motto: "Glory above all.",
    origin: "Backed by merchant wealth, the Golden Lions recruit promising orphans and train them in spectacle fighting. Their bouts draw the largest crowds.",
    ownerName: "Helena Cross",
    personality: "Showman",
    philosophy: "Spectacle",
    preferredStyles: [FightingStyle.SlashingAttack, FightingStyle.ParryRiposte, FightingStyle.LungingAttack],
    attrBias: { SP: 2, DF: 2, WL: 2, WT: 1 },
    warriorNames: ["BLAZE", "TEMPEST", "PHOENIX", "FLASH", "GLORY", "DAZZLE", "REGAL", "CROWN", "LION", "PRIDE"],
    fameRange: [2, 5],
    rosterRange: [3, 4],
    tier: "Established",
  },
  {
    stableName: "Steel Serpents",
    motto: "Strike when they blink.",
    origin: "A secretive guild of counter-fighters. The Serpents excel at reading opponents and punishing mistakes with lethal precision.",
    ownerName: "Theron Darkhollow",
    personality: "Tactician",
    philosophy: "Cunning",
    preferredStyles: [FightingStyle.ParryRiposte, FightingStyle.ParryLunge, FightingStyle.AimedBlow],
    attrBias: { WT: 3, DF: 2, SP: 2, WL: 1 },
    warriorNames: ["PHANTOM", "VENOM", "COIL", "FANG", "MAMBA", "ADDER", "STRIKE", "AMBUSH", "SHADOW", "SLEEK"],
    fameRange: [1, 4],
    rosterRange: [2, 4],
    tier: "Established",
  },
  {
    stableName: "Ash Reapers",
    motto: "From ashes, we rise to reap.",
    origin: "Born from a mining collapse that killed hundreds, the survivors turned to arena combat. Their warriors are unnaturally tough and fight with desperate ferocity.",
    ownerName: "Borin Ironhand",
    personality: "Pragmatic",
    philosophy: "Endurance",
    preferredStyles: [FightingStyle.TotalParry, FightingStyle.WallOfSteel, FightingStyle.ParryStrike],
    attrBias: { CN: 3, WL: 3, SZ: 1, ST: 1 },
    warriorNames: ["CINDER", "SLAG", "EMBER", "COAL", "FURNACE", "SOOT", "ANVIL", "BELLOWS", "FORGE", "SMELT"],
    fameRange: [1, 4],
    rosterRange: [3, 4],
    tier: "Established",
  },
  {
    stableName: "Storm Breakers",
    motto: "Unstoppable fury.",
    origin: "Coastal raiders turned arena entrepreneurs. Their warriors fight with the reckless abandon of men who've survived the open sea.",
    ownerName: "Yara Nightsong",
    personality: "Aggressive",
    philosophy: "Speed Kills",
    preferredStyles: [FightingStyle.LungingAttack, FightingStyle.SlashingAttack, FightingStyle.StrikingAttack],
    attrBias: { SP: 3, DF: 2, ST: 1, WL: 1 },
    warriorNames: ["BOLT", "STORM", "SURGE", "GALE", "TSUNAMI", "SQUALL", "RIPTIDE", "THUNDER", "WAVE", "CYCLONE"],
    fameRange: [1, 3],
    rosterRange: [2, 4],
    tier: "Established",
  },

  // ── MINOR STABLES (Up-and-comers) ──
  {
    stableName: "Obsidian Fang",
    motto: "One bite is all it takes.",
    origin: "A new stable run by a former champion. Small but dangerous — every warrior is hand-picked for killer instinct.",
    ownerName: "Darius Kord",
    personality: "Pragmatic",
    philosophy: "Specialist",
    preferredStyles: [FightingStyle.StrikingAttack, FightingStyle.AimedBlow, FightingStyle.ParryStrike],
    attrBias: { ST: 2, WT: 2, DF: 2, WL: 1 },
    warriorNames: ["ONYX", "RAZOR", "CLAW", "SHARD", "OBSIDIAN", "FLINT", "JET", "BASALT", "SLATE", "GRANITE"],
    fameRange: [0, 3],
    rosterRange: [2, 3],
    tier: "Minor",
  },
  {
    stableName: "Dawn Hammers",
    motto: "We break what cannot be broken.",
    origin: "Religious zealots who believe combat is divine communion. Their warriors fight with fanatical determination and refuse to yield.",
    ownerName: "Aldric Wolfsbane",
    personality: "Methodical",
    philosophy: "Iron Defense",
    preferredStyles: [FightingStyle.WallOfSteel, FightingStyle.TotalParry, FightingStyle.ParryStrike],
    attrBias: { CN: 3, WL: 3, SZ: 2 },
    warriorNames: ["PIKE", "BULWARK", "BASTION", "RAMPART", "AEGIS", "PHALANX", "TOWER", "MONOLITH", "SENTINEL", "WARDEN"],
    fameRange: [0, 2],
    rosterRange: [2, 3],
    tier: "Minor",
  },
  {
    stableName: "Shadow Company",
    motto: "You won't see us coming.",
    origin: "Former assassins and thieves who found the arena more profitable. Fast, dirty, and unpredictable — they fight to survive, not to impress.",
    ownerName: "Livia Ashford",
    personality: "Tactician",
    philosophy: "Speed Kills",
    preferredStyles: [FightingStyle.AimedBlow, FightingStyle.ParryLunge, FightingStyle.LungingAttack],
    attrBias: { SP: 3, DF: 3, WT: 2 },
    warriorNames: ["GHOST", "WRAITH", "MIRAGE", "SHADE", "DUSK", "GLOOM", "HAZE", "SPECTRE", "BLINK", "VOID"],
    fameRange: [0, 2],
    rosterRange: [2, 3],
    tier: "Minor",
  },
  {
    stableName: "Crimson Tide",
    motto: "The sand turns red for us.",
    origin: "A gladiatorial bloodline stretching back generations. Their warriors are raised from childhood to fight and die in the arena.",
    ownerName: "Marcus Vael",
    personality: "Showman",
    philosophy: "Balanced",
    preferredStyles: [FightingStyle.SlashingAttack, FightingStyle.BashingAttack, FightingStyle.ParryRiposte],
    attrBias: { ST: 1, CN: 1, WT: 1, SP: 1, DF: 1, WL: 1 },
    warriorNames: ["TITAN", "MAGNUS", "BRUTUS", "DRAKE", "COLOSSUS", "GLADIUS", "VALKA", "CENTURION", "PRIMUS", "MAXIMUS"],
    fameRange: [1, 4],
    rosterRange: [3, 4],
    tier: "Established",
  },
  {
    stableName: "Frost Giants",
    motto: "Cold is the grave we dig for you.",
    origin: "Mountain warriors from the frozen north. Enormous and terrifyingly strong, they rely on raw power and size to overwhelm opponents.",
    ownerName: "Petra Steelheart",
    personality: "Pragmatic",
    philosophy: "Brute Force",
    preferredStyles: [FightingStyle.BashingAttack, FightingStyle.StrikingAttack, FightingStyle.WallOfSteel],
    attrBias: { SZ: 4, ST: 3, CN: 2 },
    warriorNames: ["GLACIER", "MAMMOTH", "TUNDRA", "PERMAFROST", "AVALANCHE", "ICECAP", "YETI", "FJORD", "BERG", "HAIL"],
    fameRange: [0, 3],
    rosterRange: [2, 3],
    tier: "Minor",
  },
];

// ─── RNG ──────────────────────────────────────────────────────────────────

function seededRng(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// ─── Attribute Generation ─────────────────────────────────────────────────

function biasedAttrs(
  rng: () => number,
  bias: Partial<Record<"ST" | "CN" | "SZ" | "WT" | "WL" | "SP" | "DF", number>>
): { ST: number; CN: number; SZ: number; WT: number; WL: number; SP: number; DF: number } {
  const attrs = { ST: 3, CN: 3, SZ: 3, WT: 3, WL: 3, SP: 3, DF: 3 };
  let pool = 70 - 21; // 49 points to distribute
  const keys: (keyof typeof attrs)[] = ["ST", "CN", "SZ", "WT", "WL", "SP", "DF"];

  // Build weighted key pool based on bias
  const weightedKeys: (keyof typeof attrs)[] = [];
  for (const k of keys) {
    const w = (bias[k] ?? 1);
    for (let i = 0; i < w; i++) weightedKeys.push(k);
  }

  while (pool > 0) {
    const key = weightedKeys[Math.floor(rng() * weightedKeys.length)];
    const max = Math.min(pool, 25 - attrs[key]);
    if (max <= 0) continue;
    const add = Math.min(max, Math.floor(rng() * 4) + 1);
    attrs[key] += add;
    pool -= add;
  }
  return attrs;
}

// ─── Public Interface ─────────────────────────────────────────────────────

export interface RivalStable {
  owner: Owner;
  roster: Warrior[];
  template: StableTemplate;
}

/** Get all available stable templates */
export function getStableTemplates(): StableTemplate[] {
  return [...STABLE_TEMPLATES];
}

/**
 * Generate rival stables from templates.
 * @param count Number of stables to generate (picks from templates)
 * @param seed Deterministic seed for RNG
 */
export function generateRivalStables(count: number, seed: number): RivalStable[] {
  const rng = seededRng(seed);
  const usedWarriorNames = new Set<string>();
  const rivals: RivalStable[] = [];

  // Shuffle templates and pick `count`
  const shuffled = [...STABLE_TEMPLATES].sort(() => rng() - 0.5);

  // Ensure variety: pick at least 1 Major, balanced minors/established
  const majors = shuffled.filter(t => t.tier === "Major");
  const established = shuffled.filter(t => t.tier === "Established");
  const minors = shuffled.filter(t => t.tier === "Minor");

  const picked: StableTemplate[] = [];
  // Guarantee at least 2 majors, fill with established, then minors
  for (const t of majors) { if (picked.length < Math.min(3, count)) picked.push(t); }
  for (const t of established) { if (picked.length < Math.min(count - 1, count)) picked.push(t); }
  for (const t of minors) { if (picked.length < count) picked.push(t); }
  // If still not enough, add remaining shuffled
  for (const t of shuffled) { if (picked.length < count && !picked.includes(t)) picked.push(t); }

  for (let i = 0; i < Math.min(count, picked.length); i++) {
    const tmpl = picked[i];

    const owner: Owner = {
      id: `rival_${i}`,
      name: tmpl.ownerName,
      stableName: tmpl.stableName,
      fame: tmpl.fameRange[0] + Math.floor(rng() * (tmpl.fameRange[1] - tmpl.fameRange[0] + 1)),
      renown: 0,
      titles: tmpl.tier === "Major" ? Math.floor(rng() * 3) : 0,
      personality: tmpl.personality,
    };

    // Generate warriors
    const [minR, maxR] = tmpl.rosterRange;
    const warriorCount = minR + Math.floor(rng() * (maxR - minR + 1));
    const warriors: Warrior[] = [];

    // Shuffle template warrior names
    const namePool = [...tmpl.warriorNames].sort(() => rng() - 0.5);

    for (let j = 0; j < warriorCount; j++) {
      // Pick unique name from template pool
      let wName: string | undefined;
      for (const n of namePool) {
        if (!usedWarriorNames.has(n)) { wName = n; break; }
      }
      if (!wName) wName = `${tmpl.stableName.split(" ").pop()}_${j}`;
      usedWarriorNames.add(wName);

      // Style selection — biased toward stable's preferred styles
      let style: FightingStyle;
      if (rng() < 0.7 && tmpl.preferredStyles.length > 0) {
        style = tmpl.preferredStyles[Math.floor(rng() * tmpl.preferredStyles.length)];
      } else {
        const styles = Object.values(FightingStyle);
        style = styles[Math.floor(rng() * styles.length)];
      }

      const attrs = biasedAttrs(rng, tmpl.attrBias);
      const { baseSkills, derivedStats } = computeWarriorStats(attrs, style);

      // Major stables start with some career history
      const startingWins = tmpl.tier === "Major" ? Math.floor(rng() * 5) :
                           tmpl.tier === "Established" ? Math.floor(rng() * 3) : 0;
      const startingLosses = tmpl.tier === "Major" ? Math.floor(rng() * 3) :
                              tmpl.tier === "Established" ? Math.floor(rng() * 2) : 0;
      const startingKills = tmpl.tier === "Major" && rng() > 0.7 ? 1 : 0;

      warriors.push({
        id: `rival_w_${i}_${j}`,
        name: wName,
        style,
        attributes: attrs,
        baseSkills,
        derivedStats,
        fame: Math.floor(rng() * (tmpl.fameRange[1] - tmpl.fameRange[0] + 1)) + tmpl.fameRange[0],
        popularity: Math.floor(rng() * 4),
        titles: [],
        injuries: [],
        flair: [],
        career: { wins: startingWins, losses: startingLosses, kills: startingKills },
        champion: false,
        status: "Active",
        age: 17 + Math.floor(rng() * 10),
        stableId: `rival_${i}`,
      });
    }

    rivals.push({ owner, roster: warriors, template: tmpl });
  }

  return rivals;
}

/** Pick a random rival warrior for matchmaking */
export function pickRivalOpponent(
  rivals: RivalStable[],
  excludeNames: Set<string>
): { rival: RivalStable; warrior: Warrior } | null {
  const eligible: { rival: RivalStable; warrior: Warrior }[] = [];
  for (const r of rivals) {
    for (const w of r.roster) {
      if (w.status === "Active" && !excludeNames.has(w.name)) {
        eligible.push({ rival: r, warrior: w });
      }
    }
  }
  if (eligible.length === 0) return null;
  return eligible[Math.floor(Math.random() * eligible.length)];
}
