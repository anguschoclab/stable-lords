/**
 * AI Rival Stables — generates and manages competing stables.
 * 
 * Rivals have:
 * - A stable name & owner name
 * - A roster of warriors with random attributes
 * - AI fight plans
 * - Personality affecting playstyle
 */
import { FightingStyle, type Warrior, type Owner, type OwnerPersonality } from "@/types/game";
import { computeWarriorStats } from "./skillCalc";

const STABLE_NAMES = [
  "The Iron Wolves", "House of Blades", "Crimson Tide", "Shadow Company",
  "The Bone Crushers", "Steel Serpents", "Thunder Guard", "Blood Ravens",
  "The Night Watch", "Golden Lions", "Ash Reapers", "Storm Breakers",
  "The Warlords", "Obsidian Fang", "Dawn Hammers", "Frost Giants",
];

const OWNER_NAMES = [
  "Marcus Vael", "Sera Blackthorn", "Darius Kord", "Helena Cross",
  "Ragnar Stormborn", "Livia Ashford", "Theron Darkhollow", "Cassandra Vex",
  "Borin Ironhand", "Yara Nightsong", "Aldric Wolfsbane", "Petra Steelheart",
];

const WARRIOR_NAMES = [
  "BRUTUS", "VALKA", "GROND", "SHADE", "TEMPEST", "RAVOK", "AZURA", "FLINT",
  "KIRA", "MAGNUS", "ECHO", "DRAKE", "REAPER", "ONYX", "BLAZE", "STEEL",
  "RAZOR", "FANG", "HAVOC", "VENOM", "TITAN", "SCORCH", "PHANTOM", "HAMMER",
  "GRIM", "BOLT", "IRIS", "CLAW", "STORM", "PIKE", "EMBER", "THORN",
];

const PERSONALITIES: OwnerPersonality[] = ["Aggressive", "Methodical", "Showman", "Pragmatic", "Tactician"];

function seededRng(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

function randomAttrs(rng: () => number): { ST: number; CN: number; SZ: number; WT: number; WL: number; SP: number; DF: number } {
  const attrs = { ST: 3, CN: 3, SZ: 3, WT: 3, WL: 3, SP: 3, DF: 3 };
  let pool = 70 - 21;
  const keys = Object.keys(attrs) as (keyof typeof attrs)[];
  while (pool > 0) {
    const key = keys[Math.floor(rng() * keys.length)];
    const max = Math.min(pool, 25 - attrs[key]);
    if (max <= 0) continue;
    const add = Math.min(max, Math.floor(rng() * 4) + 1);
    attrs[key] += add;
    pool -= add;
  }
  return attrs;
}

export interface RivalStable {
  owner: Owner;
  roster: Warrior[];
}

/** Generate a set of AI rival stables */
export function generateRivalStables(count: number, seed: number): RivalStable[] {
  const rng = seededRng(seed);
  const usedNames = new Set<string>();
  const usedStables = new Set<string>();
  const rivals: RivalStable[] = [];

  for (let i = 0; i < count; i++) {
    // Pick unique stable name
    let stableName: string;
    do {
      stableName = STABLE_NAMES[Math.floor(rng() * STABLE_NAMES.length)];
    } while (usedStables.has(stableName) && usedStables.size < STABLE_NAMES.length);
    usedStables.add(stableName);

    let ownerName: string;
    do {
      ownerName = OWNER_NAMES[Math.floor(rng() * OWNER_NAMES.length)];
    } while (usedNames.has(ownerName) && usedNames.size < OWNER_NAMES.length);
    usedNames.add(ownerName);

    const personality = PERSONALITIES[Math.floor(rng() * PERSONALITIES.length)];

    const owner: Owner = {
      id: `rival_${i}`,
      name: ownerName,
      stableName,
      fame: Math.floor(rng() * 5),
      renown: 0,
      titles: 0,
      personality,
    };

    // Generate 2-4 warriors per rival
    const warriorCount = 2 + Math.floor(rng() * 3);
    const warriors: Warrior[] = [];
    for (let j = 0; j < warriorCount; j++) {
      let wName: string;
      do {
        wName = WARRIOR_NAMES[Math.floor(rng() * WARRIOR_NAMES.length)];
      } while (usedNames.has(wName));
      usedNames.add(wName);

      const styles = Object.values(FightingStyle);
      const style = styles[Math.floor(rng() * styles.length)];
      const attrs = randomAttrs(rng);
      const { baseSkills, derivedStats } = computeWarriorStats(attrs, style);

      warriors.push({
        id: `rival_w_${i}_${j}`,
        name: wName,
        style,
        attributes: attrs,
        baseSkills,
        derivedStats,
        fame: Math.floor(rng() * 3),
        popularity: Math.floor(rng() * 3),
        titles: [],
        injuries: [],
        flair: [],
        career: { wins: 0, losses: 0, kills: 0 },
        champion: false,
        status: "Active",
        age: 18 + Math.floor(rng() * 8),
      });
    }

    rivals.push({ owner, roster: warriors });
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
