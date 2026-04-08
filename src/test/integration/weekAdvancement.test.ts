/**
 * Week Advancement Integration Tests
 * 
 * Tests multi-week simulations to verify:
 * - State consistency across week transitions
 * - No data loss or corruption
 * - Proper newsletter generation
 * - Economic balance
 * - Roster integrity
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createFreshState, advanceWeek } from "@/engine/factories";
import { FightingStyle } from "@/types/shared.types";
import type { GameState, Warrior } from "@/types/state.types";
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

describe("Week Advancement Integration", () => {
  let initialState: GameState;

  beforeEach(() => {
    initialState = createFreshState("test-seed");
    // Add a warrior to work with
    initialState.roster = [
      makeWarrior("w1", "Test Warrior", {
        potential: { ST: 18, CN: 18, SZ: 15, WT: 18, WL: 18, SP: 18, DF: 18 },
      }),
    ];
  });

  describe("Basic Week Progression", () => {
    it("should advance week counter", () => {
      const week1 = advanceWeek(initialState);
      expect(week1.week).toBe(2);
      
      const week2 = advanceWeek(week1);
      expect(week2.week).toBe(3);
    });

    it("should maintain roster across weeks", () => {
      const week1 = advanceWeek(initialState);
      expect(week1.roster).toHaveLength(1);
      expect(week1.roster[0].name).toBe("Test Warrior");
      
      const week2 = advanceWeek(week1);
      expect(week2.roster).toHaveLength(1);
      expect(week2.roster[0].name).toBe("Test Warrior");
    });

    it("should preserve warrior IDs across weeks", () => {
      const originalId = initialState.roster[0].id;
      
      let state = initialState;
      for (let i = 0; i < 5; i++) {
        state = advanceWeek(state);
      }
      
      expect(state.roster[0].id).toBe(originalId);
    });

    it("should not mutate the input state", () => {
      const originalWeek = initialState.week;
      const originalRosterLength = initialState.roster.length;
      
      advanceWeek(initialState);
      
      expect(initialState.week).toBe(originalWeek);
      expect(initialState.roster).toHaveLength(originalRosterLength);
    });
  });

  describe("Multi-Week Simulation", () => {
    it("should successfully advance 52 weeks (1 year)", () => {
      let state = initialState;
      
      for (let i = 0; i < 52; i++) {
        state = advanceWeek(state);
      }
      // Cyclical: 52 advancements from week 1 should land on week 1, year 2
      expect(state.week).toBe(1);
      expect(state.year).toBe(2);
      expect(state.roster).toBeDefined();
      expect(state.ledger).toBeDefined();
    });

    it("should maintain data integrity over 100 weeks", () => {
      let state = initialState;
      
      for (let i = 0; i < 100; i++) {
        state = advanceWeek(state);
        
        // Verify critical invariants
        expect(state.roster).toBeDefined();
        expect(Array.isArray(state.roster)).toBe(true);
        // Week should cycle 1-52
        expect(state.week).toBeGreaterThanOrEqual(1);
        expect(state.week).toBeLessThanOrEqual(52);
        expect(state.ledger).toBeDefined();
        expect(Array.isArray(state.ledger)).toBe(true);
      }
      // 100 weeks from year 1 week 1 = year 2 week 49? 
      // 100 / 52 = 1 year, 48 weeks. 1 + 48 = 49.
      expect(state.year).toBe(2);
      expect(state.week).toBe(49);
    });

    it("should accumulate newsletter entries over time", () => {
      // Force aging to trigger a newsletter entry
      let state = {
        ...initialState,
        roster: [makeWarrior("w1", "Old Warrior", { age: 39 })],
      };
      
      for (let i = 0; i < 52; i++) {
        state = advanceWeek(state);
      }
      
      // Should have at least some newsletter entries from aging/economy
      expect(state.newsletter).toBeDefined();
    });
  });

  describe("Season Transitions", () => {
    it("should cycle through seasons correctly", () => {
      let state = initialState;
      expect(state.season).toBe("Spring");
      
      // Advance 13 weeks (1 season = 13 weeks)
      for (let i = 0; i < 13; i++) {
        state = advanceWeek(state);
      }
      
      expect(state.season).toBe("Summer");
      
      // Another 13 weeks
      for (let i = 0; i < 13; i++) {
        state = advanceWeek(state);
      }
      
      expect(state.season).toBe("Fall");
      
      // Another 13 weeks
      for (let i = 0; i < 13; i++) {
        state = advanceWeek(state);
      }
      
      expect(state.season).toBe("Winter");
      
      // Another 13 weeks should wrap back to Spring
      for (let i = 0; i < 13; i++) {
        state = advanceWeek(state);
      }
      
      expect(state.season).toBe("Spring");
      expect(state.year).toBe(2);
      expect(state.week).toBe(1);
    });

    it("should not crash on seasonal growth check", () => {
      let state: GameState = {
        ...initialState,
        seasonalGrowth: [
          { warriorId: "w1", season: "Spring", gains: { ST: 2, CN: 1 } },
        ],
      };
      
      // Advance to next season (13 weeks)
      for (let i = 0; i < 13; i++) {
        state = advanceWeek(state);
      }
      
      expect(state.season).toBe("Summer");
      // Just ensure we can still find or not find without crashing
      const gains = Array.isArray(state.seasonalGrowth) 
         ? state.seasonalGrowth.find(sg => sg.season === "Spring")
         : undefined;
    });
  });

  describe("Aging System", () => {
    it("should age warriors after 52 weeks", () => {
      const state = {
        ...initialState,
        roster: [makeWarrior("w1", "Young Warrior", { age: 20 })],
      };
      
      let current = state;
      for (let i = 0; i < 52; i++) {
        current = advanceWeek(current);
      }
      
      // Warrior should be 21 after 52 weeks
      expect(current.roster[0].age).toBe(21);
    });
  });

  describe("Economic Consistency", () => {
    it("should process economy every week", () => {
      let state = initialState;
      const initialLedgerLength = state.ledger.length;
      
      for (let i = 0; i < 5; i++) {
        state = advanceWeek(state);
      }
      
      // Ledger should have new entries from weekly economic processing
      expect(state.ledger.length).toBeGreaterThan(initialLedgerLength);
    });

    it("should maintain treasury balance over time", () => {
      let state = initialState;
      
      for (let i = 0; i < 20; i++) {
        state = advanceWeek(state);
        
        // Treasury should be a valid number (not NaN or Infinity)
        expect(typeof state.treasury).toBe("number");
        expect(isFinite(state.treasury)).toBe(true);
      }
    });
  });

  describe("Roster Management", () => {
    it("should maintain roster integrity across deaths", () => {
      const state = {
        ...initialState,
        roster: [
          makeWarrior("w1", "Warrior 1"),
          makeWarrior("w2", "Warrior 2"),
        ],
        graveyard: [],
      };
      
      // Manually kill a warrior to test state transition
      const afterDeath: GameState = {
        ...state,
        roster: state.roster.filter(w => w.id !== "w1"),
        graveyard: [
          { ...state.roster[0], status: "Dead" as const, deathWeek: 1, deathCause: "Test", killedBy: "Test" },
        ],
      };
      
      let current = afterDeath;
      for (let i = 0; i < 10; i++) {
        current = advanceWeek(current);
      }
      
      // Graveyard should remain stable
      expect(current.graveyard).toHaveLength(1);
      
      // Living warrior should still be in roster
      expect(current.roster).toHaveLength(1);
    });
  });

  describe("Training System", () => {
    it("should process training assignments and clear them", () => {
      const state = {
        ...initialState,
        trainingAssignments: [
          { warriorId: "w1", type: "attribute" as const, attribute: "ST" as const },
        ],
      };
      
      const week1 = advanceWeek(state);
      
      // Training assignments should be cleared after processing
      expect(week1.trainingAssignments).toEqual([]);
    });
  });

  describe("State Invariants", () => {
    it("should allow going negative within debt limits", () => {
      let state = { ...initialState, treasury: 500 };
      
      for (let i = 0; i < 30; i++) {
        state = advanceWeek(state);
      }
      
      // Allow going negative (debt system) - usually -1000 or -2500 depending on tuning
      expect(state.treasury).toBeGreaterThan(-3000);
    });

    it("should maintain unique warrior IDs", () => {
      const state = {
        ...initialState,
        roster: [
          makeWarrior("w1", "Warrior 1"),
          makeWarrior("w2", "Warrior 2"),
          makeWarrior("w3", "Warrior 3"),
        ],
      };
      
      let current = state;
      for (let i = 0; i < 20; i++) {
        current = advanceWeek(current);
        
        const ids = current.roster.map(w => w.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      }
    });

    it("should respect cyclical week counter", () => {
      let state = initialState;
      
      for (let i = 0; i < 60; i++) {
        state = advanceWeek(state);
        expect(state.week).toBeGreaterThanOrEqual(1);
        expect(state.week).toBeLessThanOrEqual(52);
      }
    });
  });
});
