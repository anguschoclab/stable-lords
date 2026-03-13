import { describe, it, expect, vi } from "vitest";
import { processAging } from "./aging";
import type { GameState, Warrior, Attributes } from "@/types/game";
import { FightingStyle } from "@/types/game";
import { computeWarriorStats } from "./skillCalc";

// ─── Test Helpers ─────────────────────────────────────────────────────────

function makeWarrior(
  id: string,
  age: number,
  attrs: Partial<Attributes> = {}
): Warrior {
  const fullAttrs: Attributes = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10, ...attrs };
  const { baseSkills, derivedStats } = computeWarriorStats(fullAttrs, FightingStyle.StrikingAttack);

  return {
    id,
    name: `Warrior ${id}`,
    style: FightingStyle.StrikingAttack,
    attributes: fullAttrs,
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
    age,
  };
}

function makeGameState(week: number, roster: Warrior[]): GameState {
  return {
    meta: { gameName: "Test", version: "1.0", createdAt: "" },
    ftueComplete: true,
    coachDismissed: [],
    player: { id: "p1", name: "Player", stableName: "Stable", fame: 0, renown: 0, titles: 0 },
    fame: 0,
    popularity: 0,
    gold: 0,
    ledger: [],
    week,
    season: "Spring",
    roster,
    graveyard: [],
    retired: [],
    arenaHistory: [],
    newsletter: [],
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
    recruitPool: [],
    rosterBonus: 0,
    ownerGrudges: [],
    insightTokens: [],
    moodHistory: [],
    settings: { featureFlags: { tournaments: false, scouting: false } },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe("processAging — basic aging", () => {
  it("increments age by 1 on multiples of 52 weeks", () => {
    const w = makeWarrior("w1", 20);
    const state = makeGameState(52, [w]);

    const newState = processAging(state);

    expect(newState.roster[0].age).toBe(21);
  });

  it("does not increment age on non-multiples of 52 weeks", () => {
    const w = makeWarrior("w1", 20);
    const state = makeGameState(51, [w]);

    const newState = processAging(state);

    expect(newState.roster[0].age).toBe(20);
  });
});

describe("processAging — aging penalties", () => {
  it("does not apply penalties to a warrior under the age penalty start limit", () => {
    // AGING_PENALTY_START is 28
    const w = makeWarrior("w1", 27, { SP: 15, DF: 15 });
    const state = makeGameState(52, [w]);

    const newState = processAging(state);

    // Warrior turns 28, shouldn't face penalty until over 28
    expect(newState.roster[0].age).toBe(28);
    expect(newState.roster[0].attributes.SP).toBe(15);
    expect(newState.roster[0].attributes.DF).toBe(15);
  });

  it("applies penalty to SP and DF when age exceeds AGING_PENALTY_START", () => {
    // We stub Math.random to avoid retirement
    vi.spyOn(Math, "random").mockReturnValue(0.99);

    // If current age is 31, turns 32
    // Penalty = Math.floor((32 - 28) / 3) = Math.floor(4/3) = 1
    const w = makeWarrior("w1", 31, { SP: 15, DF: 15 });
    const state = makeGameState(52, [w]);

    const newState = processAging(state);

    expect(newState.roster[0].age).toBe(32);
    expect(newState.roster[0].attributes.SP).toBe(14); // 15 - 1
    expect(newState.roster[0].attributes.DF).toBe(14); // 15 - 1

    vi.restoreAllMocks();
  });

  it("recomputes baseSkills and derivedStats when penalties apply", () => {
    // We stub Math.random to avoid retirement
    vi.spyOn(Math, "random").mockReturnValue(0.99);

    // Breakpoint bonus changes at 13 -> 12. If SP/DF is 13, minus 1 drops it to 12.
    // Breakpoint drops from 2 to 1, ensuring a skill calculation difference.
    const w = makeWarrior("w1", 34, { SP: 13, DF: 13 });
    const originalBaseSkills = { ...w.baseSkills };
    const state = makeGameState(52, [w]);

    const newState = processAging(state);

    // Turns 35. Penalty = Math.floor((35 - 28) / 3) = 2. Will subtract 1 from SP and DF
    expect(newState.roster[0].age).toBe(35);
    expect(newState.roster[0].attributes.SP).toBe(12);
    expect(newState.roster[0].attributes.DF).toBe(12);

    // Since SP/DF dropped below 13, their breakpoint bonus decreased, altering DEF/INI/RIP etc.
    expect(newState.roster[0].baseSkills).not.toEqual(originalBaseSkills);

    vi.restoreAllMocks();
  });

  it("adds a newsletter event when aging penalties are applied", () => {
    // We stub Math.random to avoid retirement
    vi.spyOn(Math, "random").mockReturnValue(0.99);

    const w = makeWarrior("w1", 31, { SP: 15, DF: 15 });
    const state = makeGameState(52, [w]);

    const newState = processAging(state);

    expect(newState.newsletter.length).toBe(1);
    expect(newState.newsletter[0].title).toBe("Aging Report");
    expect(newState.newsletter[0].items[0]).toContain("shows signs of aging (SP/DF declining)");

    vi.restoreAllMocks();
  });

  it("does not drop SP or DF below the minimum of 3", () => {
    // We stub Math.random to avoid retirement
    vi.spyOn(Math, "random").mockReturnValue(0.99);

    // If turns 35, penalty > 0, minus 1
    const w = makeWarrior("w1", 34, { SP: 3, DF: 3 });
    const state = makeGameState(52, [w]);

    const newState = processAging(state);

    expect(newState.roster[0].attributes.SP).toBe(3);
    expect(newState.roster[0].attributes.DF).toBe(3);

    vi.restoreAllMocks();
  });
});

describe("processAging — forced retirement", () => {
  it("guarantees retirement for a warrior at FORCED_RETIRE_MAX (40+)", () => {
    // FORCED_RETIRE_MAX = 40
    const w = makeWarrior("w1", 40);
    const state = makeGameState(10, [w]); // Any week, retirement check is run every week

    const newState = processAging(state);

    expect(newState.roster.length).toBe(0);
    expect(newState.retired.length).toBe(1);
    expect(newState.retired[0].id).toBe("w1");
    expect(newState.retired[0].status).toBe("Retired");
    expect(newState.retired[0].retiredWeek).toBe(10);
  });

  it("can force a warrior to retire between FORCED_RETIRE_MIN and FORCED_RETIRE_MAX with a low random roll", () => {
    // FORCED_RETIRE_MIN = 30
    const w = makeWarrior("w1", 35);
    const state = makeGameState(12, [w]);

    // retireChance = (35 - 30) / (40 - 30) * 0.15 = (5 / 10) * 0.15 = 0.5 * 0.15 = 0.075
    // Stub random to a value below 0.075 to trigger retirement
    vi.spyOn(Math, "random").mockReturnValue(0.05);

    const newState = processAging(state);

    expect(newState.roster.length).toBe(0);
    expect(newState.retired.length).toBe(1);
    expect(newState.retired[0].id).toBe("w1");

    vi.restoreAllMocks();
  });

  it("does not force a warrior to retire between FORCED_RETIRE_MIN and FORCED_RETIRE_MAX with a high random roll", () => {
    const w = makeWarrior("w1", 35);
    const state = makeGameState(12, [w]);

    // retireChance = 0.075
    // Stub random to a value above 0.075 so they stay active
    vi.spyOn(Math, "random").mockReturnValue(0.10);

    const newState = processAging(state);

    expect(newState.roster.length).toBe(1);
    expect(newState.retired.length).toBe(0);

    vi.restoreAllMocks();
  });

  it("adds a newsletter event upon forced retirement", () => {
    const w = makeWarrior("w1", 41);
    const state = makeGameState(20, [w]);

    const newState = processAging(state);

    expect(newState.newsletter.length).toBe(1);
    expect(newState.newsletter[0].title).toBe("Aging Report");
    expect(newState.newsletter[0].items[0]).toContain("has been forced to retire");
  });

  it("adds a newsletter event upon probabilistic retirement", () => {
    const w = makeWarrior("w1", 32);
    const state = makeGameState(20, [w]);

    // Trigger retirement
    vi.spyOn(Math, "random").mockReturnValue(0.01);

    const newState = processAging(state);

    expect(newState.newsletter.length).toBe(1);
    expect(newState.newsletter[0].title).toBe("Aging Report");
    expect(newState.newsletter[0].items[0]).toContain("has decided to hang up the blade");

    vi.restoreAllMocks();
  });
});
