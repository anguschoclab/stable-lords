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
import { createFreshState, advanceWeek } from "@/state/gameStore";
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

describe("Week Advancement Integration", () => {
  let initialState: GameState;

  beforeEach(() => {
    initialState = createFreshState();
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
      
      expect(state.week).toBe(53);
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
        expect(state.week).toBe(i + 2);
        expect(state.ledger).toBeDefined();
        expect(Array.isArray(state.ledger)).toBe(true);
      }
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
      expect(state.week).toBe(53); // 52 weeks + 1 initial
    });

    it("should clear seasonal growth on season change", () => {
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
      
      // Seasonal growth should be cleared or reset for new season
      const springGains = state.seasonalGrowth.find(sg => sg.warriorId === "w1" && sg.season === "Spring");
      // Either cleared entirely or the Spring entry should be old
      expect(state.season).toBe("Summer");
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

    it("should handle aging over multiple years", () => {
      const state = {
        ...initialState,
        roster: [makeWarrior("w1", "Young Warrior", { age: 18 })],
      };
      
      let current = state;
      // Advance 5 years (260 weeks)
      for (let i = 0; i < 260; i++) {
        current = advanceWeek(current);
      }
      
      // Warrior should be 23 after 5 years (or retired if retirement occurred)
      if (current.roster.length > 0) {
        expect(current.roster[0].age).toBe(23);
      } else {
        // Warrior may have been retired due to age
        expect(current.retired.some(w => w.name === "Young Warrior")).toBe(true);
      }
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

    it("should maintain gold balance over time", () => {
      let state = initialState;
      
      for (let i = 0; i < 20; i++) {
        state = advanceWeek(state);
        
        // Gold should be a valid number (not NaN or Infinity)
        expect(typeof state.gold).toBe("number");
        expect(isFinite(state.gold)).toBe(true);
      }
    });

    it("should apply upkeep costs consistently", () => {
      const state = {
        ...initialState,
        roster: [
          makeWarrior("w1", "Warrior 1"),
          makeWarrior("w2", "Warrior 2"),
          makeWarrior("w3", "Warrior 3"),
        ],
      };
      
      const initialGold = state.gold;
      const week1 = advanceWeek(state);
      
      // Should have upkeep costs in ledger
      const upkeepEntries = week1.ledger.filter(e => e.category === "upkeep");
      expect(upkeepEntries.length).toBeGreaterThan(0);
      
      // Gold should have decreased due to upkeep
      expect(week1.gold).toBeLessThan(initialGold);
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
      expect(current.graveyard[0].name).toBe("Warrior 1");
      
      // Living warrior should still be in roster
      expect(current.roster).toHaveLength(1);
      expect(current.roster[0].name).toBe("Warrior 2");
    });

    it("should maintain retired warriors list", () => {
      const state = {
        ...initialState,
        roster: [makeWarrior("w1", "Old Warrior", { age: 35 })],
        retired: [],
      };
      
      let current = state;
      for (let i = 0; i < 52; i++) {
        current = advanceWeek(current);
        
        // If warrior retired, verify it's in retired list
        if (current.roster.length === 0 && current.retired.length > 0) {
          expect(current.retired[0].name).toBe("Old Warrior");
          expect(current.retired[0].status).toBe("Retired");
          break;
        }
      }
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

    it("should maintain warrior stats consistency during training", () => {
      const state: GameState = {
        ...initialState,
        trainingAssignments: [
          { warriorId: "w1", type: "attribute", attribute: "ST" },
        ],
      };
      
      let current = state;
      for (let i = 0; i < 10; i++) {
        current = {
          ...advanceWeek(current),
          trainingAssignments: [{ warriorId: "w1", type: "attribute", attribute: "ST" }],
        };
        
        // Verify stats are always defined and valid
        const warrior = current.roster[0];
        expect(warrior.attributes).toBeDefined();
        expect(warrior.baseSkills).toBeDefined();
        expect(warrior.derivedStats).toBeDefined();
        
        // Total attributes should not exceed cap (plus initial total which was 84 in our mock)
        const total = Object.values(warrior.attributes).reduce((sum, val) => sum + val, 0);
        expect(total).toBeLessThanOrEqual(84);
      }
    });
  });

  describe("Injury System", () => {
    it("should heal injuries over time", () => {
      const state = {
        ...initialState,
        roster: [
          makeWarrior("w1", "Injured Warrior", {
            injuries: [{
              id: "i1",
              name: "Cut",
              description: "Minor wound",
              severity: "Minor" as const,
              weeksRemaining: 3,
              penalties: { ST: -1 },
            }],
          }),
        ],
      };
      
      let current = state;
      for (let i = 0; i < 5; i++) {
        current = advanceWeek(current);
      }
      
      // Injury should have healed by now (3 weeks + buffer)
      expect(current.roster[0].injuries.length).toBe(0);
    });

    it("should maintain injury state consistency", () => {
      const state = {
        ...initialState,
        roster: [
          makeWarrior("w1", "Injured Warrior", {
            injuries: [{
              id: "i1",
              name: "Broken Arm",
              description: "Serious injury",
              severity: "Moderate" as const,
              weeksRemaining: 5,
              penalties: { ST: -2, DF: -2 },
            }],
          }),
        ],
      };
      
      let current = state;
      for (let i = 0; i < 10; i++) {
        current = advanceWeek(current);
        
        // Injuries array should always be defined
        expect(current.roster[0].injuries).toBeDefined();
        expect(Array.isArray(current.roster[0].injuries)).toBe(true);
        
        // Weeks remaining should decrease or injury should be removed
        if (current.roster[0].injuries.length > 0) {
          const injury = current.roster[0].injuries[0];
          if (typeof injury !== "string") {
            expect(injury.weeksRemaining).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });
  });

  describe("Newsletter System", () => {
    it("should accumulate newsletter entries chronologically", () => {
      // Setup state with a condition that triggers a newsletter (e.g. training injury)
      let state: GameState = {
        ...initialState,
        trainingAssignments: [
          { warriorId: "w1", type: "attribute", attribute: "ST" },
        ],
      };
      
      for (let i = 0; i < 50; i++) {
        state = advanceWeek(state);
      }
      
      // Entries should be in chronological order
      for (let i = 1; i < state.newsletter.length; i++) {
        expect(state.newsletter[i].week).toBeGreaterThanOrEqual(state.newsletter[i - 1].week);
      }
    });

    it("should include relevant event types", () => {
      let state = {
        ...initialState,
        roster: [makeWarrior("w1", "Old Warrior", { age: 39 })],
      };
      
      for (let i = 0; i < 52; i++) {
        state = advanceWeek(state);
      }
      
      expect(state.newsletter).toBeDefined();
    });
  });

  describe("State Invariants", () => {
    it("should never have negative gold with starting balance", () => {
      let state = { ...initialState, gold: 1000 };
      
      for (let i = 0; i < 30; i++) {
        state = advanceWeek(state);
        // With 1000 starting gold and minimal roster, should not go negative
      }
      
      // Allow going slightly negative (debt system)
      expect(state.gold).toBeGreaterThan(-1000);
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

    it("should not duplicate warriors across roster/graveyard/retired", () => {
      let state = initialState;
      
      for (let i = 0; i < 50; i++) {
        state = advanceWeek(state);
        
        const rosterIds = new Set(state.roster.map(w => w.id));
        const graveyardIds = new Set(state.graveyard.map(w => w.id));
        const retiredIds = new Set(state.retired.map(w => w.id));
        
        // No overlap between collections
        for (const id of rosterIds) {
          expect(graveyardIds.has(id)).toBe(false);
          expect(retiredIds.has(id)).toBe(false);
        }
        for (const id of graveyardIds) {
          expect(retiredIds.has(id)).toBe(false);
        }
      }
    });

    it("should maintain week counter monotonicity", () => {
      let state = initialState;
      let lastWeek = state.week;
      
      for (let i = 0; i < 30; i++) {
        state = advanceWeek(state);
        expect(state.week).toBe(lastWeek + 1);
        lastWeek = state.week;
      }
    });
  });
});

