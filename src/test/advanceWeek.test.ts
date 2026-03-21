/**
 * advanceWeek pipeline tests — verifies execution order, immutability,
 * and correct state transitions for each pipeline step.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all engine modules to track call order
const callOrder: string[] = [];

vi.mock("@/engine/training", () => ({
  processTraining: vi.fn((state) => {
    callOrder.push("training");
    return { ...state, _trainRan: true };
  }),
}));

vi.mock("@/engine/economy", () => ({
  processEconomy: vi.fn((state) => {
    callOrder.push("economy");
    return { ...state, _econRan: true };
  }),
  computeWeeklyBreakdown: vi.fn(() => ({ income: [], expenses: [], totalIncome: 0, totalExpenses: 0, net: 0 })),
}));

vi.mock("@/engine/aging", () => ({
  processAging: vi.fn((state) => {
    callOrder.push("aging");
    return { ...state, _agingRan: true };
  }),
}));

vi.mock("@/engine/injuries", () => ({
  tickInjuries: vi.fn(() => ({ active: [], healed: [] })),
}));

vi.mock("@/engine/matchmaking", () => ({
  clearExpiredRest: vi.fn((restStates) => {
    callOrder.push("restStates");
    return restStates;
  }),
  runAIvsAIBouts: vi.fn((state) => {
    callOrder.push("aiBouts");
    return { updatedRivals: state.rivals, gazetteItems: [] };
  }),
}));

vi.mock("@/engine/recruitment", () => ({
  partialRefreshPool: vi.fn((pool) => {
    callOrder.push("recruitment");
    return pool;
  }),
  aiDraftFromPool: vi.fn((pool, rivals) => {
    callOrder.push("aiDraft");
    return { updatedPool: pool, updatedRivals: rivals, gazetteItems: [] };
  }),
}));

import { advanceWeek, createFreshState } from "@/state/gameStore";
import type { GameState, Warrior } from "@/types/game";
import { FightingStyle } from "@/types/game";

function makeTestWarrior(overrides: Partial<Warrior> = {}): Warrior {
  return {
    id: `w_${Math.random().toString(36).slice(2)}`,
    name: "TestWarrior",
    style: FightingStyle.StrikingAttack,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame: 5,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 3, losses: 1, kills: 0 },
    champion: false,
    status: "Active",
    age: 20,
    ...overrides,
  };
}

function makeStateWithRivals(): GameState {
  const state = createFreshState();
  state.roster = [makeTestWarrior({ name: "Hero" })];
  state.rivals = [
    {
      owner: { id: "rival1", name: "Rival Owner", stableName: "Iron Wolves", fame: 10, renown: 0, titles: 0 },
      roster: [makeTestWarrior({ name: "GROND", stableId: "rival1" })],
      tier: "Established",
      philosophy: "Brute Force",
    },
  ];
  state.recruitPool = [{ id: "pool1", name: "Orphan1" } as any];
  return state;
}

describe("advanceWeek pipeline", () => {
  beforeEach(() => {
    callOrder.length = 0;
    vi.clearAllMocks();
  });

  it("executes pipeline steps in the correct order", () => {
    const state = makeStateWithRivals();
    advanceWeek(state);

    expect(callOrder).toEqual([
      "training",
      "economy",
      "aging",
      "restStates",
      "aiBouts",
      "recruitment",
      "aiDraft",
    ]);
  });

  it("does not mutate the original state", () => {
    const state = makeStateWithRivals();
    const originalWeek = state.week;
    const originalGold = state.gold;
    const originalRosterRef = state.roster;

    const next = advanceWeek(state);

    // Original untouched
    expect(state.week).toBe(originalWeek);
    expect(state.gold).toBe(originalGold);
    expect(state.roster).toBe(originalRosterRef);

    // New state advanced
    expect(next.week).toBe(originalWeek + 1);
    expect(next).not.toBe(state);
  });

  it("increments week by 1", () => {
    const state = createFreshState();
    state.week = 5;
    const next = advanceWeek(state);
    expect(next.week).toBe(6);
  });

  it("cycles seasons correctly at week 14 (Spring → Summer)", () => {
    const state = createFreshState();
    state.week = 13;
    state.season = "Spring";
    const next = advanceWeek(state);
    expect(next.week).toBe(14);
    expect(next.season).toBe("Summer");
  });

  it("cycles seasons: Fall → Winter at week 40", () => {
    const state = createFreshState();
    state.week = 39;
    state.season = "Fall";
    const next = advanceWeek(state);
    expect(next.week).toBe(40);
    expect(next.season).toBe("Winter");
  });

  it("wraps season back to Spring after Winter", () => {
    const state = createFreshState();
    state.week = 52;
    state.season = "Winter";
    const next = advanceWeek(state);
    expect(next.week).toBe(53);
    expect(next.season).toBe("Spring");
  });

  it("passes training output to economy (pipeline chaining)", async () => {
    const { processTraining } = await import("@/engine/training") as any;
    const { processEconomy } = await import("@/engine/economy") as any;

    const state = createFreshState();
    advanceWeek(state);

    const trainingOutput = processTraining.mock.results[0].value;
    expect(processEconomy).toHaveBeenCalledWith(trainingOutput);
  });

  it("passes economy output to aging (pipeline chaining)", async () => {
    const { processEconomy } = await import("@/engine/economy") as any;
    const { processAging } = await import("@/engine/aging") as any;

    const state = createFreshState();
    advanceWeek(state);

    const economyOutput = processEconomy.mock.results[0].value;
    expect(processAging).toHaveBeenCalledWith(economyOutput);
  });

  it("skips AI bouts when no rivals exist", () => {
    callOrder.length = 0;
    const state = createFreshState();
    state.rivals = [];
    advanceWeek(state);

    expect(callOrder).not.toContain("aiBouts");
  });

  it("resets recruit pool on season change", () => {
    const state = createFreshState();
    state.week = 13; // Season boundary
    state.season = "Spring";
    state.recruitPool = [{ id: "p1" } as any, { id: "p2" } as any];
    const next = advanceWeek(state);
    expect(next.recruitPool).toEqual([]);
  });

  it("heals injuries and generates newsletter", async () => {
    const state = createFreshState();
    state.roster = [
      makeTestWarrior({
        name: "Wounded",
        injuries: [
          { id: "i1", name: "Cut", description: "A cut", severity: "Minor", weeksRemaining: 1, penalties: {} },
        ],
      }),
    ];

    // tickInjuries mock returns healed
    const { tickInjuries } = await import("@/engine/injuries") as any;
    tickInjuries.mockReturnValueOnce({ active: [], healed: ["Cut"] });

    const next = advanceWeek(state);

    // Should have a medical report newsletter
    const medReport = next.newsletter.find(n => n.title === "Medical Report");
    expect(medReport).toBeDefined();
    expect(medReport!.items[0]).toContain("Wounded");
    expect(medReport!.items[0]).toContain("Cut");
  });
});
