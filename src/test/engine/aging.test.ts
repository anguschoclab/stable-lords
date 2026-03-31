import { describe, it, expect, vi, beforeEach } from "vitest";
import { processAging } from "@/engine/aging";
import type { GameState, Warrior, Attributes } from "@/types/game";
import { FightingStyle } from "@/types/game";
import { computeWarriorStats } from "@/engine/skillCalc";
import { SeededRNG } from "@/utils/random";

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
    phase: "Planning",
    gazettes: [],
    playerChallenges: [],
    playerAvoids: [],
    activeTournamentId: undefined,
    isFTUE: false,
    unacknowledgedDeaths: [],
  } as unknown as GameState;
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
  beforeEach(() => {
    // Default mock to avoid retirement unless requested
    vi.spyOn(SeededRNG.prototype, "next").mockReturnValue(0.99);
  });

  it("does not apply penalties to a warrior under the age penalty start limit", () => {
    const w = makeWarrior("w1", 27, { SP: 15, DF: 15 });
    const state = makeGameState(52, [w]);

    const newState = processAging(state);

    expect(newState.roster[0].age).toBe(28);
    expect(newState.roster[0].attributes.SP).toBe(15);
    expect(newState.roster[0].attributes.DF).toBe(15);
  });

  it("applies penalty to SP and DF when age exceeds AGING_PENALTY_START", () => {
    const w = makeWarrior("w1", 31, { SP: 15, DF: 15 });
    const state = makeGameState(52, [w]);

    const newState = processAging(state);

    expect(newState.roster[0].age).toBe(32);
    expect(newState.roster[0].attributes.SP).toBe(14);
    expect(newState.roster[0].attributes.DF).toBe(14);
  });

  it("adds a newsletter event when aging penalties are applied", () => {
    const w = makeWarrior("w1", 31, { SP: 15, DF: 15 });
    const state = makeGameState(52, [w]);

    const newState = processAging(state);

    expect(newState.newsletter.length).toBe(1);
    expect(newState.newsletter[0].title).toBe("Aging Report");
  });
});

describe("processAging — forced retirement", () => {
  it("guarantees retirement for a warrior at FORCED_RETIRE_MAX (40+)", () => {
    const w = makeWarrior("w1", 40);
    const state = makeGameState(10, [w]);

    const newState = processAging(state);

    expect(newState.roster.length).toBe(0);
    expect(newState.retired.length).toBe(1);
  });

  it("can force retirement with a low random roll", () => {
    const w = makeWarrior("w1", 35);
    const state = makeGameState(12, [w]);

    // Retire chance at 35 is 0.075. Set mock to 0.01 to trigger.
    vi.spyOn(SeededRNG.prototype, "next").mockReturnValue(0.01);

    const newState = processAging(state);
    expect(newState.roster.length).toBe(0);
    expect(newState.retired.length).toBe(1);
  });

  it("does not force retirement with a high random roll", () => {
    const w = makeWarrior("w1", 35);
    const state = makeGameState(12, [w]);

    vi.spyOn(SeededRNG.prototype, "next").mockReturnValue(0.99);

    const newState = processAging(state);
    expect(newState.roster.length).toBe(1);
  });
});
