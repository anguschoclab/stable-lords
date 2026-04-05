import { FightingStyle, type Warrior, type Owner, type RivalStableData, type Trainer } from "@/types/game";
import { computeWarriorStats } from "./skillCalc";
import { STABLE_TEMPLATES, type StableTemplate } from "@/data/stableTemplates";
import { seededRng } from "@/utils/mathUtils";
import { SeededRNG } from "@/utils/random";
export { seededRng };

/**
 * AI Rival Stables — maintains the 23 AI stables that populate the world.
 */

// StableTrainer interface was here, now using Trainer from shared.types

const TRAINER_FIRST_NAMES = [
  "Aldric", "Brenna", "Caius", "Dara", "Eryx", "Fenna", "Galthor", "Hessa",
  "Ivor", "Jelena", "Korvin", "Lysa", "Maegor", "Nira", "Orvald", "Petra",
  "Quintus", "Rhea", "Soren", "Thessa", "Ulric", "Vala", "Wyrd", "Xara",
];

const PHILOSOPHY_TO_FOCUS: Record<string, ("Aggression" | "Defense" | "Endurance" | "Mind" | "Healing")[]> = {
  "Brute Force": ["Aggression", "Aggression", "Endurance"],
  "Speed Kills": ["Aggression", "Mind", "Endurance"],
  "Iron Defense": ["Defense", "Defense", "Endurance"],
  "Balanced": ["Aggression", "Defense", "Mind", "Endurance"],
  "Spectacle": ["Aggression", "Mind", "Healing"],
  "Cunning": ["Mind", "Mind", "Defense"],
  "Endurance": ["Endurance", "Endurance", "Healing"],
  "Specialist": ["Aggression", "Defense", "Mind"],
};

export function getStableTemplates(): StableTemplate[] {
  return [...STABLE_TEMPLATES];
}

/**
 * Generate rival stables from templates.
 * Scaling: Provides bonus gold and stats for expansion stables joining mid-game.
 */
export function generateRivalStables(count: number, seed: number, week: number = 0): RivalStableData[] {
  const rng = seededRng(seed);
  const usedWarriorNames = new Set<string>();
  const usedTrainerNames = new Set<string>();
  const rivals: RivalStableData[] = [];

  // Support for count > templates.length via over-sampling with procedural variance
  const iterations = Math.ceil(count / STABLE_TEMPLATES.length);
  const picked: { tmpl: StableTemplate; iteration: number }[] = [];
  
  for (let iter = 0; iter < iterations; iter++) {
    const shuffled = [...STABLE_TEMPLATES].sort(() => rng() - 0.5);
    shuffled.forEach(tmpl => {
      if (picked.length < count) {
        picked.push({ tmpl, iteration: iter });
      }
    });
  }

  for (let i = 0; i < picked.length; i++) {
    const { tmpl, iteration } = picked[i];
    const stableId = `rival_${i}`;
    
    // Procedural name variance for duplicates
    const nameSuffix = iteration > 0 ? ` [${iteration === 1 ? "II" : iteration === 2 ? "III" : iteration === 3 ? "IV" : "V"}]` : "";
    const stableName = `${tmpl.stableName}${nameSuffix}`;
    const owner: Owner = {
      id: stableId,
      name: iteration > 0 ? `${tmpl.ownerName} ${String.fromCharCode(64 + iteration + 1)}` : tmpl.ownerName,
      stableName: stableName,
      fame: tmpl.fameRange[0] + Math.floor(rng() * (tmpl.fameRange[1] - tmpl.fameRange[0] + 1)),
      renown: tmpl.tier === "Legendary" ? 5 : tmpl.tier === "Major" ? 2 : 0,
      titles: tmpl.tier === "Legendary" ? 2 + Math.floor(rng() * 3) : tmpl.tier === "Major" ? Math.floor(rng() * 3) : 0,
      personality: tmpl.personality,
      metaAdaptation: tmpl.metaAdaptation,
      favoredStyles: tmpl.preferredStyles,
    };

    const [minR, maxR] = tmpl.rosterRange;
    const warriorCount = minR + Math.floor(rng() * (maxR - minR + 1));
    const warriors: Warrior[] = [];
    const namePool = [...tmpl.warriorNames].sort(() => rng() - 0.5);

    for (let j = 0; j < warriorCount; j++) {
      let wName = namePool.find(n => !usedWarriorNames.has(n));
      if (!wName) wName = `${tmpl.stableName.split(" ").pop()?.toUpperCase()}_${j}`;
      usedWarriorNames.add(wName);

      const style = (rng() < 0.7 && tmpl.preferredStyles.length > 0)
        ? tmpl.preferredStyles[Math.floor(rng() * tmpl.preferredStyles.length)]
        : Object.values(FightingStyle)[Math.floor(rng() * Object.values(FightingStyle).length)];

      // Catch-up Attribute Scaling: +1 point per week (cap +40)
      const catchupStats = Math.min(40, week);
      const attrs = biasedAttrs(rng, tmpl.attrBias, catchupStats);
      const { baseSkills, derivedStats } = computeWarriorStats(attrs, style);

      warriors.push({
        id: `rival_w_${i}_${j}`,
        name: wName,
        style,
        attributes: attrs,
        baseSkills,
        derivedStats,
        fame: Math.floor(rng() * (tmpl.fameRange[1] - tmpl.fameRange[0] + 1)) + tmpl.fameRange[0],
        popularity: Math.floor(rng() * 5),
        titles: [], injuries: [], flair: [],
        career: { wins: 0, losses: 0, kills: 0 },
        champion: false, status: "Active",
        stableId,
      });
    }

    const [minT, maxT] = tmpl.trainerRange;
    const trainers = generateStableTrainers(rng, stableId, tmpl.philosophy, minT + Math.floor(rng() * (maxT - minT + 1)), usedTrainerNames, tmpl.tier);
    
    // Initial gold based on tier + weekly catch-up (50g/week)
    const catchupGold = week * 50;
    const initialGold = (tmpl.tier === "Legendary" ? 2000 : tmpl.tier === "Major" ? 1200 : tmpl.tier === "Established" ? 800 : 500) + catchupGold;

    rivals.push({ 
      owner, 
      roster: warriors, 
      gold: initialGold,
      motto: tmpl.motto,
      origin: tmpl.origin,
      philosophy: tmpl.philosophy,
      tier: tmpl.tier,
      trainers,
      strategy: {
        intent: iteration % 3 === 0 ? "EXPANSION" : "CONSOLIDATION",
        planWeeksRemaining: 4 + Math.floor(rng() * 4)
      },
      agentMemory: {
        lastGold: initialGold,
        burnRate: 0,
        metaAwareness: {},
        knownRivals: [],
      },
      actionHistory: []
    });
  }
  return rivals;
}

function biasedAttrs(rng: () => number, bias: Record<string, number>, catchupPool: number = 0) {
  const attrs = { ST: 3, CN: 3, SZ: 3, WT: 3, WL: 3, SP: 3, DF: 3 };
  let pool = (70 - 21) + catchupPool;
  const weighted: (keyof typeof attrs)[] = [];
  for (const k of Object.keys(attrs) as (keyof typeof attrs)[]) {
    const w = bias[k] ?? 1;
    for (let i = 0; i < w; i++) weighted.push(k);
  }
  while (pool > 0) {
    const key = weighted[Math.floor(rng() * weighted.length)];
    const add = Math.min(pool, 25 - attrs[key], Math.floor(rng() * 4) + 1);
    if (add <= 0) continue;
    attrs[key] += add;
    pool -= add;
  }
  return attrs;
}

function generateStableTrainers(rng: () => number, stableId: string, philosophy: string, count: number, usedNames: Set<string>, tier: string): Trainer[] {
  const trainers: Trainer[] = [];
  const focusPool = PHILOSOPHY_TO_FOCUS[philosophy] ?? ["Aggression", "Defense", "Mind"];
  for (let i = 0; i < count; i++) {
    const firstName = TRAINER_FIRST_NAMES[Math.floor(rng() * TRAINER_FIRST_NAMES.length)];
    const focus = focusPool[Math.floor(rng() * focusPool.length)];
    const trainerTier: import("@/types/game").TrainerTier = tier === "Legendary" ? (rng() < 0.3 ? "Master" : "Seasoned") : (rng() < 0.1 ? "Master" : "Novice");
    trainers.push({
      id: `trainer_${stableId}_${i}`,
      name: `${firstName}`,
      tier: trainerTier,
      focus,
      fame: trainerTier === "Master" ? 5 : 1,
      age: 30 + Math.floor(rng() * 35), // Diverse ages for rivals
      contractWeeksLeft: 52,
    });
  }
  return trainers;
}

/**
 * Randomly picks an eligible opponent from a pool of rival stables.
 * Used for AI-vs-AI matchmaking when local pools are empty.
 */
export function pickRivalOpponent(rivals: RivalStableData[], excludeIds: Set<string>, seed?: number): { warrior: Warrior; rival: RivalStableData } | null {
  const allEligible: { warrior: Warrior; rival: RivalStableData }[] = [];
  rivals.forEach(r => {
    r.roster.forEach(w => {
      if (w.status === "Active" && !excludeIds.has(w.id)) {
        allEligible.push({ warrior: w, rival: r });
      }
    });
  });

  if (allEligible.length === 0) return null;
  const rng = new SeededRNG(seed ?? (allEligible.length * 101));
  return rng.pick(allEligible);
}

export function generateRivalryNarrative(stableA: string, stableB: string, warriorA: string, warriorB: string, seed?: number): string {
  const rng = new SeededRNG(seed ?? (stableA.length * 13));
  const templates = [
    `🔥 RIVALRY REPORT: The feud between ${stableA} and ${stableB} rages on — ${warriorA} faced ${warriorB} in a grudge match!`,
    `⚔️ VENDETTA IN THE PITS: ${stableA} vs ${stableB} — ${warriorA} and ${warriorB} settled scores in the arena!`,
    `🏟️ BAD BLOOD: ${stableA} and ${stableB} clashed again as ${warriorA} took on ${warriorB}!`,
  ];
  return rng.pick(templates);
}

/**
 * Calculate rivalry intensity adjustment based on match outcomes.
 * Base (bouts fought) + Death (+5) + Upset (+3).
 */
export function calculateRivalryScore(
  boutsFought: number,
  deathsCount: number,
  upsetsCount: number
): number {
  let score = 0;
  score += Math.floor(boutsFought / 3);
  score += deathsCount * 5;
  score += upsetsCount * 3;
  return Math.max(1, Math.min(5, score));
}
