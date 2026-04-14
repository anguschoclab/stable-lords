import {
  type GameState,
  type Warrior,
  type OwnerPersonality, type FightSummary
} from "@/types/state.types";
import { type PoolWarrior } from "@/engine/recruitment";
import narrativeContent from "@/data/narrativeContent.json";
import type { NarrativeContent } from "@/types/narrative.types";
import { FightingStyle } from "@/types/shared.types";
import { computeWarriorStats } from "@/engine/skillCalc";
import { generateFavorites } from "@/engine/favorites";
import { generateId } from "@/utils/idUtils";
import type { IRNGService } from "@/engine/core/rng/IRNGService";
import { SeededRNGService } from "@/engine/core/rng/SeededRNGService";

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
  rng?: IRNGService
): Warrior {
  const { baseSkills, derivedStats } = computeWarriorStats(attrs, style);
  const favorites = generateFavorites(style, rng ? () => rng.next() : () => 0.5);
    
  return {
    id: id ?? (rng ? rng.uuid() : generateId(undefined, "warrior")),
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
  export function createFreshState(seed: string, createdAt: string = new Date().toISOString()): GameState {
    const numericSeed = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const rng = new SeededRNGService(numericSeed);
    
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
        id: "stable-player",
        name: "You",
        stableName: "Dragon's Hearth",
        fame: 0,
        renown: 0,
        titles: 0,
      },
      fame: 0,
      popularity: 0,
      treasury: 1000, 
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

    // 2. Generate Initial Rivals (4 Stables) - Seeded selection
    const RIVAL_NAMES = (narrativeContent as NarrativeContent).recruitment.rival_stable_names;
    const PERSONALITIES: OwnerPersonality[] = ["Aggressive", "Methodical", "Showman", "Pragmatic", "Tactician"];

    // Shuffle and pick 4
    const pool = [...RIVAL_NAMES];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1));
      const temp = pool[i];
      const temp2 = pool[j];
      if (temp !== undefined && temp2 !== undefined) {
        pool[i] = temp2;
        pool[j] = temp;
      }
    }

    state.rivals = pool.slice(0, 4).map((name) => {
      const personalityIndex = Math.floor(rng.next() * PERSONALITIES.length);
      return {
        id: rng.uuid(),
        fame: 100,
        treasury: 1500 + Math.floor(rng.next() * 1000),
        owner: {
          id: rng.uuid(),
          name: `Lord ${name.split(" ")[0]}`,
          stableName: name,
          personality: PERSONALITIES[personalityIndex],
          philosophy: "Winning at all costs",
          fame: 100,
          renown: 10,
          titles: 0,
        },
        roster: [],
        ledger: [],
      };
    });

    // 3. Generate Initial Recruitment Pool (6 warriors) - Seeded stats
    const initialStyles = [
      FightingStyle.AimedBlow, 
      FightingStyle.BashingAttack, 
      FightingStyle.LungingAttack, 
      FightingStyle.SlashingAttack, 
      FightingStyle.StrikingAttack, 
      FightingStyle.WallOfSteel
    ];
    
    state.recruitPool = initialStyles.map((style, i) => {
      // Use rng for initial attributes (10 +/- 3)
      const attrBase = () => 7 + Math.floor(rng.next() * 7);
      const attrs = {
        ST: attrBase(), CN: attrBase(), SZ: attrBase(), 
        WT: attrBase(), WL: attrBase(), SP: attrBase(), DF: attrBase()
      };
      
      const baseWarrior = makeWarrior(rng.uuid(), `Recruit ${i + 1}`, style, attrs, {}, rng);
      return {
        ...baseWarrior,
        cost: 150 + Math.floor(rng.next() * 150),
        tier: "Common",
        lore: (narrativeContent as NarrativeContent).recruitment.origin[0], // Seeded fallback
        addedWeek: 1,
        potential: { ST: 1, CN: 1, SZ: 1, WT: 1, WL: 1, SP: 1, DF: 1 }
      } as PoolWarrior;
    });

    return state;
  }export function makeFightSummary(overrides: Partial<FightSummary> = {}): FightSummary {
  return {
    id: `fight-${Math.random().toString(36).substr(2, 9)}`,
    week: 1,
    a: "Attacker",
    d: "Defender",
    warriorIdA: "warrior-a",
    warriorIdD: "warrior-d",
    styleA: "Brawler" as any,
    styleD: "Balanced" as any,
    winner: "A",
    by: "KO",
    title: "Practice Match",
    transcript: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}
