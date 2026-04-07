import { 
  type GameState, type Warrior, type PoolWarrior, FightingStyle, 
  ATTRIBUTE_KEYS, ATTRIBUTE_MAX 
} from "@/types/game";
import { computeWarriorStats } from "@/engine/skillCalc";
import { generateFavorites } from "@/engine/favorites";
import { generateId } from "@/utils/idUtils";
import { SeededRNG } from "@/utils/random";

/**
 * Warrior Factory - creates a new warrior with calculated stats and favorites.
 *
 * @param id - Optional ID (if not provided, one will be generated)
 * @param name - Warrior name
 * @param style - Fighting style
 * @param attrs - Base attributes
 * @param overrides - Partial warrior properties to override defaults
 * @param rng - Optional SeededRNG for deterministic generation
 */
export function makeWarrior(
  id: string | undefined,
  name: string,
  style: FightingStyle,
  attrs: { ST: number; CN: number; SZ: number; WT: number; WL: number; SP: number; DF: number },
  overrides?: Partial<Warrior>,
  rng?: SeededRNG
): Warrior {
  const { baseSkills, derivedStats } = computeWarriorStats(attrs, style);
  const favorites = generateFavorites(style, rng ? () => rng.next() : () => 0.5);
  
  return {
    id: id ?? generateId(rng, "war"),
    name,
    style,
    attributes: attrs,
    baseSkills,
    derivedStats,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: "Active",
    age: 18 + Math.floor((rng ? rng.next() : 0.5) * 8),
    favorites,
    ...overrides,
  };
}

  /**
   * Creates the initial, deterministic game state for a new game.
   */
  export function createFreshState(seed: string = "stable-lords-1.0", createdAt: string = new Date().toISOString()): GameState {
    // Simple numeric hash for the string seed
    const numericSeed = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const rng = new SeededRNG(numericSeed);
    
    // 1. Core State
    const state: GameState = {
      meta: {
        gameName: "Stable Lords",
        version: "2.1.0-hardened",
        createdAt,
      },
      ftueComplete: false,
      ftueStep: 0,
      coachDismissed: [],
      player: {
        id: "stb_p1",
        name: "You",
        stableName: "Dragon's Hearth",
        fame: 0,
        renown: 0,
        titles: 0,
      },
      fame: 0,
      popularity: 0,
      treasury: 1000, // Balanced starting capital
      ledger: [],
      week: 1,
      year: 1,
      phase: "planning",
      season: "Spring",
      weather: "Clear",
      roster: [],
      graveyard: [],
      retired: [],
      arenaHistory: [],
      newsletter: [],
      gazettes: [],
      hallOfFame: [],
      crowdMood: "Calm",
      tournaments: [],
      trainers: [],
      hiringPool: [],
      trainingAssignments: [],
      seasonalGrowth: [],
      rivals: [],
      scoutReports: [],
      restStates: [],
      rivalries: [],
      matchHistory: [],
      playerChallenges: [],
      playerAvoids: [],
      recruitPool: [],
      rosterBonus: 0,
      ownerGrudges: [],
      insightTokens: [],
      moodHistory: [],
      settings: {
        featureFlags: {
          tournaments: true,
          scouting: true,
        },
      },
      isFTUE: true,
      unacknowledgedDeaths: [],
      day: 0,
      isTournamentWeek: false,
      activeTournamentId: undefined,
      promoters: {},
      boutOffers: {},
      realmRankings: {},
      awards: [],
    };

    // 2. Generate Initial Rivals (4 Stables)
    const rivalNames = ["Iron Crown", "Shadow Blades", "Golden Lions", "Silent Storm"];
    state.rivals = rivalNames.map((name, i) => ({
      id: `stb_rival_${i + 1}`,
      fame: 100,
      treasury: 2000,
      owner: {
        id: `own_rival_${i + 1}`,
        name: `Lord ${name.split(" ")[0]}`,
        stableName: name,
        personality: "Aggressive",
        philosophy: "Winning at all costs",
        fame: 100,
        renown: 10,
        titles: 0,
      },
      roster: [],
      ledger: [],
    }));

    // 3. Generate Initial Recruitment Pool (6 warriors)
    const initialStyles = [
      FightingStyle.AimedBlow, 
      FightingStyle.BashingAttack, 
      FightingStyle.LungingAttack, 
      FightingStyle.SlashingAttack, 
      FightingStyle.StrikingAttack, 
      FightingStyle.WallOfSteel
    ];
    state.recruitPool = initialStyles.map((style, i) => {
      const baseWarrior = makeWarrior(`war_init_${i + 1}`, `Recruit ${i + 1}`, style, { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 }, {}, rng);
      return {
        ...baseWarrior,
        baseSkills: baseWarrior.baseSkills!,
        derivedStats: baseWarrior.derivedStats!,
        favorites: baseWarrior.favorites!,
        cost: 200,
        tier: "Common",
        lore: "A wanderer seeking glory.",
        addedWeek: 1,
        potential: { ST: 1, CN: 1, SZ: 1, WT: 1, WL: 1, SP: 1, DF: 1 }
      } as PoolWarrior;
    });

    return state;
  }
