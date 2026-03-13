import { describe, it, expect, vi } from "vitest";
import { processAging } from "./aging";
import { FightingStyle, type GameState, type Warrior } from "@/types/game";

function createMockWarrior(overrides: Partial<Warrior> = {}): Warrior {
  return {
    id: "w1",
    name: "Test Warrior",
    style: FightingStyle.AimedBlow,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: "Active",
    age: 20,
    ...overrides,
  };
}

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    meta: { gameName: "Stable Lords", version: "1.0", createdAt: new Date().toISOString() },
    ftueComplete: true,
    coachDismissed: [],
    player: {
      id: "p1",
      name: "Player 1",
      stableName: "Test Stable",
      fame: 0,
      renown: 0,
      titles: 0,
    },
    fame: 0,
    popularity: 0,
    gold: 0,
    ledger: [],
    week: 52, // End of a year to trigger aging
    season: "Spring",
    roster: [],
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
    settings: {
      featureFlags: { tournaments: false, scouting: false },
    },
    ...overrides,
  };
}

describe("processAging", () => {
  describe("Aging Penalties", () => {
    it("should not apply penalty for warriors turning exactly the threshold age (28)", () => {
      const warrior = createMockWarrior({ age: 27, attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 } });
      const state = createMockGameState({ roster: [warrior] });

      const newState = processAging(state);
      const updatedWarrior = newState.roster[0];

      expect(updatedWarrior.age).toBe(28);
      expect(updatedWarrior.attributes.SP).toBe(10);
      expect(updatedWarrior.attributes.DF).toBe(10);
    });

    it("should not apply penalty for warriors turning 29 (penalty calculation rounds down to 0)", () => {
      const warrior = createMockWarrior({ age: 28, attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 } });
      const state = createMockGameState({ roster: [warrior] });

      const newState = processAging(state);
      const updatedWarrior = newState.roster[0];

      expect(updatedWarrior.age).toBe(29);
      expect(updatedWarrior.attributes.SP).toBe(10);
      expect(updatedWarrior.attributes.DF).toBe(10);
    });

    it("should apply a -1 penalty to SP and DF for a warrior turning 31", () => {
      const warrior = createMockWarrior({ age: 30, attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 } });
      const state = createMockGameState({ roster: [warrior] });

      const newState = processAging(state);
      const updatedWarrior = newState.roster[0];

      expect(updatedWarrior.age).toBe(31);
      expect(updatedWarrior.attributes.SP).toBe(9); // 10 - 1
      expect(updatedWarrior.attributes.DF).toBe(9); // 10 - 1

      // Should also recalculate baseSkills and derivedStats
      expect(updatedWarrior.baseSkills).toBeDefined();
      expect(updatedWarrior.derivedStats).toBeDefined();

      // Check newsletter event
      const newsletter = newState.newsletter;
      expect(newsletter).toHaveLength(1);
      expect(newsletter[0].title).toBe("Aging Report");
      expect(newsletter[0].items[0]).toContain("shows signs of aging");
    });

    it("should apply a -1 penalty to SP and DF for a warrior turning 34", () => {
      const warrior = createMockWarrior({ age: 33, attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 } });
      const state = createMockGameState({ roster: [warrior] });

      const newState = processAging(state);
      const updatedWarrior = newState.roster[0];

      // Even if (34 - 28) / 3 = 2, the code limits the penalty per tick to 1 per year if penalty > 0
      expect(updatedWarrior.age).toBe(34);
      expect(updatedWarrior.attributes.SP).toBe(9); // 10 - 1
      expect(updatedWarrior.attributes.DF).toBe(9); // 10 - 1
    });

    it("should not reduce SP or DF below the minimum of 3", () => {
      const warrior = createMockWarrior({ age: 30, attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 3, DF: 3 } });
      const state = createMockGameState({ roster: [warrior] });

      const newState = processAging(state);
      const updatedWarrior = newState.roster[0];

      expect(updatedWarrior.age).toBe(31);
      expect(updatedWarrior.attributes.SP).toBe(3); // Cannot drop below 3
      expect(updatedWarrior.attributes.DF).toBe(3); // Cannot drop below 3

      // If no change to attributes, should not add a newsletter event
      const newsletter = newState.newsletter;
      expect(newsletter).toHaveLength(0);
    });
  });

  describe("Forced Retirement", () => {
    it("should force a warrior to retire at age 40", () => {
      const warrior = createMockWarrior({ age: 39 });
      const state = createMockGameState({ roster: [warrior] });

      const newState = processAging(state);

      // The warrior is aged up to 40
      expect(newState.roster).toHaveLength(0);
      expect(newState.retired).toHaveLength(1);
      const retiredWarrior = newState.retired[0];
      expect(retiredWarrior.id).toBe("w1");
      expect(retiredWarrior.status).toBe("Retired");
      expect(retiredWarrior.retiredWeek).toBe(52);

      const newsletter = newState.newsletter;
      expect(newsletter).toHaveLength(1);
      // Since they aged up and suffered an aging penalty too, the report has two items.
      expect(newsletter[0].items).toEqual(
        expect.arrayContaining([
          expect.stringContaining("forced to retire — too old to fight."),
          expect.stringContaining("shows signs of aging (SP/DF declining).")
        ])
      );
    });

    it("should allow a warrior between 30 and 39 a chance to retire", () => {
      // Mock Math.random to always return a value smaller than the threshold
      const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.01);

      const warrior = createMockWarrior({ age: 31 }); // Turns 32
      const state = createMockGameState({ roster: [warrior] });

      const newState = processAging(state);

      expect(newState.roster).toHaveLength(0);
      expect(newState.retired).toHaveLength(1);
      const retiredWarrior = newState.retired[0];
      expect(retiredWarrior.age).toBe(32);
      expect(retiredWarrior.status).toBe("Retired");

      const newsletter = newState.newsletter;
      expect(newsletter).toHaveLength(1);
      expect(newsletter[0].items).toEqual(
        expect.arrayContaining([
          expect.stringContaining("decided to hang up the blade."),
          expect.stringContaining("shows signs of aging (SP/DF declining).")
        ])
      );

      randomSpy.mockRestore();
    });

    it("should not retire a warrior between 30 and 39 if the chance check fails", () => {
      // Mock Math.random to always return a value higher than the threshold (1.0)
      const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.99);

      const warrior = createMockWarrior({ age: 31 }); // Turns 32
      const state = createMockGameState({ roster: [warrior] });

      const newState = processAging(state);

      expect(newState.roster).toHaveLength(1);
      expect(newState.retired).toHaveLength(0);

      randomSpy.mockRestore();
    });
  });
});
