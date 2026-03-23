import { describe, it, expect, vi } from 'vitest';
import { generateMatchCard, addRestState, clearExpiredRest, runAIvsAIBouts } from '../engine/matchmaking';
import type { GameState, Warrior, RivalStableData, RestState, Rivalry, MatchRecord } from '../types/game';
import type { InjuryData } from '../../src/types/game';

// Import FightingStyle to use a valid one
import { FightingStyle } from '../types/game';

// Helper to create a dummy warrior
function createWarrior(id: string, overrides: Partial<Warrior> = {}): Warrior {
  return {
    id,
    name: `Warrior ${id}`,
    style: FightingStyle.AimedBlow, // Default to a valid FightingStyle from STYLE_SEEDS
    attributes: { ST: 5, CN: 5, SZ: 5, WT: 5, WL: 5, SP: 5, DF: 5, str: 5, agi: 5, end: 5 },
    derivedStats: { maxHp: 50, hp: 50, ap: 10, init: 10, def: 5, apMax: 10 },
    skills: { ATT: 10, DEF: 10, EV: 10, BLK: 10, DMG: 10, PEN: 10 },
    traits: [],
    equipment: {},
    career: { wins: 0, losses: 0, kills: 0, highestRank: "Newblood" },
    fame: 0,
    status: "Active",
    potential: 5,
    wage: 10,
    age: 20,
    morale: 50,
    energy: 100,
    experience: 0,
    ...overrides,
  } as unknown as Warrior;
}

// Helper to create a dummy rival stable
function createRivalStable(id: string, name: string, warriors: Warrior[]): RivalStableData {
  return {
    owner: {
      id,
      name: `Owner ${id}`,
      stableName: name,
      personality: "Pragmatic" as const,
      fame: 0,
      renown: 0,
      titles: 0,
    },
    roster: warriors,
  } as RivalStableData;
}

// Base mock game state
function createMockGameState(): GameState {
  return {
    week: 1,
    player: {
      id: "player1",
      name: "Player",
      stableName: "Player Stable",
      funds: 1000,
      fame: 10,
      bloodGems: 0,
      day: 1,
      actionsRemaining: 3,
    },
    roster: [],
    rivals: [],
    trainers: [],
    market: [],
    inventory: [],
    facilities: {
      barracks: 1,
      trainingPits: 1,
      apothecary: 1,
      scouting: 1,
      armory: 1,
    },
    facilityProgress: {},
    gazetteItems: [],
    trainingAssignments: [],
    restStates: [],
    rivalries: [],
    matchHistory: [],
    arenaHistory: [],
    ownerTraits: [],
  } as unknown as GameState; // Using unknown as we only supply what we need for matchmaking
}

describe("Eligibility Rules", () => {
  it("filters out warriors that are not 'Active'", () => {
    const state = createMockGameState();
    state.roster = [
      createWarrior("w1", { status: "Active" }),
      createWarrior("w2", { status: "Dead" }),
      createWarrior("w3", { status: "Retired" }),
    ];
    state.rivals = [
      createRivalStable("r1", "Rival 1", [
        createWarrior("r_w1", { status: "Active" }),
      ]),
    ];

    const card = generateMatchCard(state);

    // w1 is the only eligible player warrior. Should pair with r_w1.
    expect(card.length).toBe(1);
    expect(card[0].playerWarrior.id).toBe("w1");
  });

  it("filters out warriors with severe injuries", () => {
    const state = createMockGameState();
    // In injuries.ts: isTooInjuredToFight returns true if severity === "Severe" AND weeksRemaining > 2
    state.roster = [
      createWarrior("w1", { status: "Active", injuries: [{ severity: "Severe", weeksRemaining: 3 } as InjuryData] }), // too injured
      createWarrior("w2", { status: "Active", injuries: [{ severity: "Severe", weeksRemaining: 1 } as InjuryData] }),    // eligible
    ];
    state.rivals = [
      createRivalStable("r1", "Rival 1", [
        createWarrior("r_w1", { status: "Active" }),
        createWarrior("r_w2", { status: "Active", injuries: [{ severity: "Severe", weeksRemaining: 3 } as InjuryData] }), // rival too injured
      ]),
    ];

    const card = generateMatchCard(state);

    // w2 is eligible, w1 is not. Only 1 bout should be generated since w2 takes the only eligible rival (r_w1)
    expect(card.length).toBe(1);
    expect(card[0].playerWarrior.id).toBe("w2");
    expect(card[0].rivalWarrior.id).toBe("r_w1"); // r_w2 shouldn't be picked
  });

  it("filters out warriors assigned to rest that extends past current week", () => {
    const state = createMockGameState();
    state.week = 5;
    state.roster = [
      createWarrior("w1"), // Eligible
      createWarrior("w2"), // Resting
    ];
    state.rivals = [
      createRivalStable("r1", "Rival 1", [
        createWarrior("r_w1"), // Resting
        createWarrior("r_w2"), // Eligible
      ]),
    ];
    state.restStates = [
      { warriorId: "w2", restUntilWeek: 6 }, // Resting until week 6 (current is 5)
      { warriorId: "r_w1", restUntilWeek: 7 }, // Resting until week 7
    ];

    const card = generateMatchCard(state);

    expect(card.length).toBe(1);
    expect(card[0].playerWarrior.id).toBe("w1");
    expect(card[0].rivalWarrior.id).toBe("r_w2");
  });

  it("allows warriors whose rest expires on the current week", () => {
    const state = createMockGameState();
    state.week = 5;
    state.roster = [
      createWarrior("w1"),
    ];
    state.rivals = [
      createRivalStable("r1", "Rival 1", [
        createWarrior("r_w1"),
      ]),
    ];
    state.restStates = [
      { warriorId: "w1", restUntilWeek: 5 }, // Rest expires this week, so eligible
    ];

    const card = generateMatchCard(state);

    expect(card.length).toBe(1);
    expect(card[0].playerWarrior.id).toBe("w1");
  });

  it("filters out warriors assigned to training", () => {
    const state = createMockGameState();
    state.roster = [
      createWarrior("w1"), // Eligible
      createWarrior("w2"), // Training
    ];
    state.rivals = [
      createRivalStable("r1", "Rival 1", [
        createWarrior("r_w1"), // Eligible
      ]),
    ];
    state.trainingAssignments = [
      { warriorId: "w2", type: "attribute" as const, attribute: "ST" as const },
    ];

    const card = generateMatchCard(state);

    expect(card.length).toBe(1);
    expect(card[0].playerWarrior.id).toBe("w1");
  });
});

describe("Rest Enforcement", () => {
  it("addRestState adds 1 week of rest for a KO outcome", () => {
    let restStates: RestState[] = [];
    restStates = addRestState(restStates, "w1", "KO", 10);

    expect(restStates.length).toBe(1);
    expect(restStates[0].warriorId).toBe("w1");
    expect(restStates[0].restUntilWeek).toBe(11);
  });

  it("addRestState does not add rest for non-KO outcomes", () => {
    let restStates: RestState[] = [];
    restStates = addRestState(restStates, "w1", "Submission", 10);
    restStates = addRestState(restStates, "w2", "Decision", 10);
    restStates = addRestState(restStates, "w3", "Kill", 10);

    expect(restStates.length).toBe(0);
  });

  it("clearExpiredRest removes rest states that expire this week or earlier", () => {
    const restStates: RestState[] = [
      { warriorId: "w1", restUntilWeek: 9 },  // expired last week
      { warriorId: "w2", restUntilWeek: 10 }, // expires this week
      { warriorId: "w3", restUntilWeek: 11 }, // active rest
      { warriorId: "w4", restUntilWeek: 12 }, // active rest
    ];

    const cleared = clearExpiredRest(restStates, 10);

    expect(cleared.length).toBe(2);
    expect(cleared.map(r => r.warriorId)).toEqual(["w3", "w4"]);
  });
});

describe("Repeat Avoidance", () => {
  it("avoids pairing warriors who fought in the last 2 weeks", () => {
    const state = createMockGameState();
    state.week = 10;

    const pw = createWarrior("p1", { fame: 50 }); // p1 has 50 fame
    state.roster = [pw];

    // Create two identical rival warriors. One fought recently, one hasn't.
    const rw1 = createWarrior("r1", { fame: 50 }); // Fought in week 9
    const rw2 = createWarrior("r2", { fame: 50 }); // Has never fought p1

    state.rivals = [
      createRivalStable("s1", "Stable 1", [rw1]),
      createRivalStable("s2", "Stable 2", [rw2]),
    ];

    // Add match history for week 9
    state.matchHistory = [
      { week: 8, playerWarriorId: "p1", opponentWarriorId: "r1", opponentStableId: "s1" },
      { week: 9, playerWarriorId: "p1", opponentWarriorId: "r1", opponentStableId: "s1" },
    ];

    const card = generateMatchCard(state);

    // The engine should highly prefer pairing p1 with r2 over r1 due to repeat penalty
    expect(card.length).toBe(1);
    expect(card[0].rivalWarrior.id).toBe("r2");
    expect(card[0].rivalStable.owner.id).toBe("s2");
  });

  it("allows rematches if they fought more than 2 weeks ago", () => {
    const state = createMockGameState();
    state.week = 10;

    const pw = createWarrior("p1", { fame: 50 });
    state.roster = [pw];

    // We only give it one option to fight, to make sure the match still happens
    const rw1 = createWarrior("r1", { fame: 50 }); // Fought in week 7

    state.rivals = [
      createRivalStable("s1", "Stable 1", [rw1]),
    ];

    // Add match history for week 7 (3 weeks ago)
    state.matchHistory = [
      { week: 7, playerWarriorId: "p1", opponentWarriorId: "r1", opponentStableId: "s1" },
    ];

    const card = generateMatchCard(state);

    // It should pair them since the penalty only applies to the last 2 weeks (>= week-2)
    expect(card.length).toBe(1);
    expect(card[0].rivalWarrior.id).toBe("r1");
  });
});

describe("Rivalry-Weighted Booking", () => {
  it("favors pairing warriors from rival stables", () => {
    const state = createMockGameState();
    state.week = 10;

    // Player has one warrior
    const pw = createWarrior("p1", { fame: 50 });
    state.roster = [pw];

    // Create two identical rival warriors in different stables
    const rw1 = createWarrior("r1", { fame: 50 });
    const rw2 = createWarrior("r2", { fame: 50 });

    state.rivals = [
      createRivalStable("s1", "Stable 1", [rw1]),
      createRivalStable("s2", "Stable 2", [rw2]),
    ];

    // Set up a rivalry with Stable 1
    state.rivalries = [
      {
        stableIdA: state.player.id,
        stableIdB: "s1",
        intensity: 5,
        reason: "Feud",
        startWeek: 5,
      },
    ];

    const card = generateMatchCard(state);

    // Due to rivalry bonus (+50), it should overwhelmingly pick r1 from s1
    expect(card.length).toBe(1);
    expect(card[0].rivalWarrior.id).toBe("r1");
    expect(card[0].rivalStable.owner.id).toBe("s1");
    expect(card[0].isRivalryBout).toBe(true);
  });

  it("adds rivalry coverage items to gazette in AI vs AI bouts", () => {
    const state = createMockGameState();
    state.week = 10;

    // Create two rival stables with one active warrior each
    const rw1 = createWarrior("r1", { fame: 50 });
    const rw2 = createWarrior("r2", { fame: 50 });

    state.rivals = [
      createRivalStable("s1", "Stable 1", [rw1]),
      createRivalStable("s2", "Stable 2", [rw2]),
    ];

    // Set up a rivalry between AI stables
    state.rivalries = [
      {
        stableIdA: "s1",
        stableIdB: "s2",
        intensity: 5,
        reason: "Feud",
        startWeek: 5,
      },
    ];

    const result = runAIvsAIBouts(state);

    // They should have fought
    expect(result.results.length).toBe(1);
    expect(result.results[0].stableA).toBe("Stable 1");
    expect(result.results[0].stableB).toBe("Stable 2");

    // Verify that a rivalry gazette item was added
    const hasRivalryCoverage = result.gazetteItems.some((item: string) =>
      item.includes("RIVALRY") || item.includes("VENDETTA") || item.includes("BAD BLOOD") || item.includes("BLOOD FEUD")
    );
    expect(hasRivalryCoverage).toBe(true);
  });
});
