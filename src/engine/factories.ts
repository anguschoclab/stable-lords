import { 
  type GameState, type Warrior, FightingStyle, 
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
  const favorites = generateFavorites(style, rng ? () => rng.next() : Math.random);
  
  return {
    id: id ?? generateId(rng),
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
    age: 18 + Math.floor((rng ? rng.next() : Math.random()) * 8),
    favorites,
    ...overrides,
  };
}

/**
 * Creates the initial, default game state for a new game.
 */
export function createFreshState(): GameState {
  return {
    meta: {
      gameName: "Stable Lords",
      version: "2.0.0",
      createdAt: new Date().toISOString(),
    },
    ftueComplete: false,
    ftueStep: 0,
    coachDismissed: [],
    player: {
      id: "owner_1",
      name: "You",
      stableName: "My Stable",
      fame: 0,
      renown: 0,
      titles: 0,
    },
    fame: 0,
    popularity: 0,
    treasury: 500,
    ledger: [],
    week: 1,
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
  };
}
