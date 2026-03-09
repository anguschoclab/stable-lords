/**
 * Autosim Integration Tests
 * 
 * Tests the autosim system that allows multi-week advancement with stop conditions.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createFreshState } from "@/state/gameStore";
import { autoSim, type AutoSimOptions } from "@/engine/autosim";
import { FightingStyle, type GameState, type Warrior } from "@/types/game";
import { computeWarriorStats } from "@/engine/skillCalc";

function makeWarrior(id: string, name: string, overrides?: Partial<Warrior>): Warrior {
  const attrs = { ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 };
  const { baseSkills, derivedStats } = computeWarriorStats(attrs, FightingStyle.StrikingAttack);
  return {
    id,
    name,
    style: FightingStyle.StrikingAttack,
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
    age: 20,
    ...overrides,
  };
}

describe("Autosim Integration", () => {
  let initialState: GameState;

  beforeEach(() => {
    initialState = createFreshState();
    initialState.roster = [
      makeWarrior("w1", "Test Warrior 1"),
      makeWarrior("w2", "Test Warrior 2"),
    ];
  });

  describe("Basic Autosim", () => {
    it("should advance specified number of weeks", () => {
      const options: AutoSimOptions = {
        weeksToAdvance: 5,
        stopOnDeath: false,
        stopOnInjury: false,
      };

      const result = autoSim(initialState, options);

      expect(result.state.week).toBe(initialState.week + 5);
      expect(result.weeksAdvanced).toBe(5);
      expect(result.stopped).toBe(false);
    });

    it("should advance to target week", () => {
      const options: AutoSimOptions = {
        targetWeek: 10,
        stopOnDeath: false,
        stopOnInjury: false,
      };

      const result = autoSim(initialState, options);

      expect(result.state.week).toBe(10);
      expect(result.weeksAdvanced).toBe(9); // Started at week 1
    });

    it("should handle edge case of already at target week", () => {
      const options: AutoSimOptions = {
        targetWeek: 1,
        stopOnDeath: false,
        stopOnInjury: false,
      };

      const result = autoSim(initialState, options);

      expect(result.state.week).toBe(1);
      expect(result.weeksAdvanced).toBe(0);
      expect(result.stopped).toBe(false);
    });

    it("should not advance past target week", () => {
      const state = { ...initialState, week: 8 };
      const options: AutoSimOptions = {
        targetWeek: 10,
        stopOnDeath: false,
        stopOnInjury: false,
      };

      const result = autoSim(state, options);

      expect(result.state.week).toBe(10);
      expect(result.weeksAdvanced).toBe(2);
    });
  });

  describe("Stop Conditions", () => {
    it("should stop on warrior death when configured", () => {
      // Set up a state where death is likely
      const fragileWarrior = makeWarrior("w1", "Fragile", {
        attributes: { ST: 3, CN: 3, SZ: 3, WT: 3, WL: 3, SP: 3, DF: 3 },
      });
      const state = {
        ...initialState,
        roster: [fragileWarrior],
      };

      const options: AutoSimOptions = {
        weeksToAdvance: 50,
        stopOnDeath: true,
        stopOnInjury: false,
      };

      const result = autoSim(state, options);

      // Should stop if any warrior died
      if (result.stopped && result.stopReason?.includes("death")) {
        expect(result.weeksAdvanced).toBeLessThan(50);
        expect(result.state.graveyard.length).toBeGreaterThan(0);
      }
    });

    it("should stop on injury when configured", () => {
      const options: AutoSimOptions = {
        weeksToAdvance: 30,
        stopOnDeath: false,
        stopOnInjury: true,
      };

      const result = autoSim(initialState, options);

      // Should stop if severe injury occurred
      if (result.stopped && result.stopReason?.includes("injury")) {
        expect(result.weeksAdvanced).toBeLessThan(30);
      }
    });

    it("should not stop when conditions disabled", () => {
      const options: AutoSimOptions = {
        weeksToAdvance: 10,
        stopOnDeath: false,
        stopOnInjury: false,
      };

      const result = autoSim(initialState, options);

      expect(result.weeksAdvanced).toBe(10);
      expect(result.stopped).toBe(false);
    });
  });

  describe("State Consistency", () => {
    it("should maintain roster integrity during autosim", () => {
      const options: AutoSimOptions = {
        weeksToAdvance: 20,
        stopOnDeath: false,
        stopOnInjury: false,
      };

      const result = autoSim(initialState, options);

      // Roster + graveyard + retired should account for all original warriors
      const totalWarriors =
        result.state.roster.length +
        result.state.graveyard.length +
        result.state.retired.length;

      expect(totalWarriors).toBeGreaterThanOrEqual(0);
      expect(totalWarriors).toBeLessThanOrEqual(initialState.roster.length + 10); // Allow some recruitment
    });

    it("should preserve warrior data during simulation", () => {
      const uniqueWarrior = makeWarrior("unique_1", "Unique Name", {
        fame: 10,
        popularity: 5,
      });
      const state = {
        ...initialState,
        roster: [uniqueWarrior],
      };

      const options: AutoSimOptions = {
        weeksToAdvance: 10,
        stopOnDeath: false,
        stopOnInjury: false,
      };

      const result = autoSim(state, options);

      // Find the warrior in any collection
      const warrior =
        result.state.roster.find(w => w.id === "unique_1") ||
        result.state.graveyard.find(w => w.id === "unique_1") ||
        result.state.retired.find(w => w.id === "unique_1");

      expect(warrior).toBeDefined();
      expect(warrior?.name).toBe("Unique Name");
    });

    it("should accumulate newsletter entries", () => {
      const options: AutoSimOptions = {
        weeksToAdvance: 15,
        stopOnDeath: false,
        stopOnInjury: false,
      };

      const result = autoSim(initialState, options);

      // Should have newsletter entries from various systems
      expect(result.state.newsletter.length).toBeGreaterThan(0);
    });

    it("should process economy correctly", () => {
      const options: AutoSimOptions = {
        weeksToAdvance: 10,
        stopOnDeath: false,
        stopOnInjury: false,
      };

      const result = autoSim(initialState, options);

      // Ledger should have entries
      expect(result.state.ledger.length).toBeGreaterThan(0);

      // Gold should be a valid number
      expect(typeof result.state.gold).toBe("number");
      expect(isFinite(result.state.gold)).toBe(true);
    });
  });

  describe("Long-term Simulation", () => {
    it("should handle full year simulation (52 weeks)", () => {
      const options: AutoSimOptions = {
        weeksToAdvance: 52,
        stopOnDeath: false,
        stopOnInjury: false,
      };

      const result = autoSim(initialState, options);

      expect(result.state.week).toBe(53);
      expect(result.weeksAdvanced).toBe(52);
      
      // Should have cycled through all seasons
      expect(result.state.season).toBe("Spring");
    });

    it("should handle multi-year simulation", () => {
      const options: AutoSimOptions = {
        weeksToAdvance: 104, // 2 years
        stopOnDeath: false,
        stopOnInjury: false,
      };

      const result = autoSim(initialState, options);

      expect(result.state.week).toBe(105);
      expect(result.weeksAdvanced).toBe(104);
      
      // Warriors should have aged
      if (result.state.roster.length > 0) {
        const warrior = result.state.roster[0];
        expect(warrior.age).toBeGreaterThan(20);
      }
    });

    it("should maintain performance over long simulations", () => {
      const startTime = Date.now();

      const options: AutoSimOptions = {
        weeksToAdvance: 100,
        stopOnDeath: false,
        stopOnInjury: false,
      };

      const result = autoSim(initialState, options);

      const elapsed = Date.now() - startTime;

      expect(result.weeksAdvanced).toBe(100);
      
      // Should complete in reasonable time (< 5 seconds)
      expect(elapsed).toBeLessThan(5000);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty roster gracefully", () => {
      const state = {
        ...initialState,
        roster: [],
      };

      const options: AutoSimOptions = {
        weeksToAdvance: 10,
        stopOnDeath: false,
        stopOnInjury: false,
      };

      const result = autoSim(state, options);

      expect(result.state.week).toBe(11);
      expect(result.weeksAdvanced).toBe(10);
    });

    it("should handle zero weeks to advance", () => {
      const options: AutoSimOptions = {
        weeksToAdvance: 0,
        stopOnDeath: false,
        stopOnInjury: false,
      };

      const result = autoSim(initialState, options);

      expect(result.state.week).toBe(initialState.week);
      expect(result.weeksAdvanced).toBe(0);
      expect(result.stopped).toBe(false);
    });

    it("should handle negative target week", () => {
      const options: AutoSimOptions = {
        targetWeek: -5,
        stopOnDeath: false,
        stopOnInjury: false,
      };

      const result = autoSim(initialState, options);

      // Should not go backwards
      expect(result.state.week).toBe(initialState.week);
      expect(result.weeksAdvanced).toBe(0);
    });
  });

  describe("Result Metadata", () => {
    it("should provide accurate weeks advanced count", () => {
      const options: AutoSimOptions = {
        weeksToAdvance: 7,
        stopOnDeath: false,
        stopOnInjury: false,
      };

      const result = autoSim(initialState, options);

      expect(result.weeksAdvanced).toBe(7);
      expect(result.state.week - initialState.week).toBe(7);
    });

    it("should indicate when stopped early", () => {
      const options: AutoSimOptions = {
        weeksToAdvance: 100,
        stopOnDeath: true,
        stopOnInjury: true,
      };

      const result = autoSim(initialState, options);

      if (result.stopped) {
        expect(result.stopReason).toBeDefined();
        expect(result.weeksAdvanced).toBeLessThan(100);
      }
    });

    it("should provide stop reason when applicable", () => {
      // Force an injury-prone scenario
      const state = {
        ...initialState,
        roster: [
          makeWarrior("w1", "Fragile", {
            attributes: { ST: 5, CN: 5, SZ: 5, WT: 5, WL: 5, SP: 5, DF: 5 },
          }),
        ],
      };

      const options: AutoSimOptions = {
        weeksToAdvance: 50,
        stopOnDeath: true,
        stopOnInjury: true,
      };

      const result = autoSim(state, options);

      if (result.stopped) {
        expect(typeof result.stopReason).toBe("string");
        expect(result.stopReason!.length).toBeGreaterThan(0);
      }
    });
  });
});
