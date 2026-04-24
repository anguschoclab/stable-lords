/**
 * Game State Factory - Creates initial game state
 * Extracted from factories.ts to follow SRP
 */
import type { GameState, OwnerPersonality, RivalStableData } from '@/types/state.types';
import { type PoolWarrior } from '@/engine/recruitment';
import narrativeContent from '@/data/narrativeContent.json';
import type { NarrativeContent } from '@/types/narrative.types';
import { FightingStyle, type StableId, type WarriorId } from '@/types/shared.types';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { makeWarrior } from './warriorFactory';
import { generatePotential } from '@/engine/potential';
import { BACKSTORY_IDS } from '@/data/backstories';

/**
 * Creates the initial, deterministic game state for a new game.
 */
export function createFreshState(
  seed: string,
  createdAt: string = new Date().toISOString()
): GameState {
  const numericSeed = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rng = new SeededRNGService(numericSeed);

  // 1. Core State
  const state: GameState = {
    meta: {
      gameName: 'Stable Lords',
      version: '2.1.0-hardened',
      createdAt,
    },
    ftueComplete: false,
    ftueStep: 0,
    coachDismissed: [],
    player: {
      id: 'stable-player' as StableId,
      name: 'You',
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
    phase: 'planning',
    season: 'Spring',
    weather: 'Clear',
    roster: [],
    graveyard: [],
    retired: [],
    arenaHistory: [],
    newsletter: [],
    gazettes: [],
    hallOfFame: [],
    crowdMood: 'Calm',
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
  const PERSONALITIES: OwnerPersonality[] = [
    'Aggressive',
    'Methodical',
    'Showman',
    'Pragmatic',
    'Tactician',
  ];

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

  state.rivals = pool.slice(0, 4).map((name): RivalStableData => {
    const personalityIndex = Math.floor(rng.next() * PERSONALITIES.length);
    const backstoryId = BACKSTORY_IDS[Math.floor(rng.next() * BACKSTORY_IDS.length)]!;
    const ownerId = rng.uuid() as StableId;
    return {
      id: rng.uuid() as StableId,
      fame: 100,
      treasury: 1500 + Math.floor(rng.next() * 1000),
      owner: {
        id: ownerId,
        name: `Lord ${name.split(' ')[0]}`,
        stableName: name,
        personality: PERSONALITIES[personalityIndex],
        backstoryId,
        fame: 100,
        renown: 10,
        titles: 0,
        age: 35 + Math.floor(rng.next() * 25), // Initial age 35-60
        generation: 0,
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
    FightingStyle.WallOfSteel,
  ];

  state.recruitPool = initialStyles.map((style, i) => {
    // Use rng for initial attributes (10 +/- 3)
    const attrBase = () => 7 + Math.floor(rng.next() * 7);
    const attrs = {
      ST: attrBase(),
      CN: attrBase(),
      SZ: attrBase(),
      WT: attrBase(),
      WL: attrBase(),
      SP: attrBase(),
      DF: attrBase(),
    };

    const baseWarrior = makeWarrior(
      rng.uuid() as WarriorId,
      `Recruit ${i + 1}`,
      style,
      attrs,
      {},
      rng
    );
    return {
      ...baseWarrior,
      cost: 150 + Math.floor(rng.next() * 150),
      tier: 'Common',
      lore: (narrativeContent as NarrativeContent).recruitment.origin[0], // Seeded fallback
      addedWeek: 1,
      potential: generatePotential(attrs, 'Common', () => rng.next()),
    } as PoolWarrior;
  });

  return state;
}
