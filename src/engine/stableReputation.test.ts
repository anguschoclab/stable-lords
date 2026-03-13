import { describe, it, expect } from "vitest";
import { computeStableReputation, computeRivalReputation } from "./stableReputation";
import type { GameState, Warrior, FightSummary, NewsletterItem } from "@/types/game";

function createMockWarrior(overrides: Partial<Warrior> = {}): Warrior {
  return {
    id: "w1",
    name: "Test Warrior",
    status: "Active",
    fame: 0,
    popularity: 0,
    style: "SlashingAttack" as any,
    attributes: {} as any,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    ...overrides,
  };
}

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    roster: [],
    newsletter: [],
    arenaHistory: [],
    graveyard: [],
    trainingAssignments: [],
    trainers: [],
    fame: 0,
    player: {
      stableName: "Test Stable",
    } as any,
    ...overrides,
  } as GameState;
}

describe("Stable Reputation", () => {
  describe("computeStableReputation", () => {
    describe("Fame calculation", () => {
      it("calculates 0 fame for an empty roster with no mentions and 0 base fame", () => {
        const state = createMockGameState({ roster: [], newsletter: [], fame: 0 });
        const rep = computeStableReputation(state);
        expect(rep.fame).toBe(0);
      });

      it("calculates average fame for top 5 warriors", () => {
        const roster = [
          createMockWarrior({ id: "w1", fame: 10 }),
          createMockWarrior({ id: "w2", fame: 20 }),
          createMockWarrior({ id: "w3", fame: 30 }),
          createMockWarrior({ id: "w4", fame: 40 }),
          createMockWarrior({ id: "w5", fame: 50 }),
          createMockWarrior({ id: "w6", fame: 5 }), // Should be excluded from top 5
        ];

        // Top 5: 50, 40, 30, 20, 10 -> Avg = 30
        // Formula: avgFame * 3 = 90

        const state = createMockGameState({ roster });
        const rep = computeStableReputation(state);
        expect(rep.fame).toBe(90);
      });

      it("adds base fame to the calculation", () => {
        const roster = [
          createMockWarrior({ id: "w1", fame: 10 }),
        ];

        // Avg = 10 -> avgFame * 3 = 30
        // base fame = 15 -> 45

        const state = createMockGameState({ roster, fame: 15 });
        const rep = computeStableReputation(state);
        expect(rep.fame).toBe(45);
      });

      it("adds gazette mentions to the fame calculation", () => {
        const newsletter: NewsletterItem[] = [
          { week: 1, title: "News 1", items: ["Mention for Test Stable"] },
          { week: 2, title: "News 2", items: ["Another mention for Test Stable", "Irrelevant"] },
          { week: 3, title: "News 3", items: ["Irrelevant item"] }, // Not a mention
        ];

        // 2 mentions * 0.5 = 1.0
        // No roster -> avgFame 0
        // No base fame

        const state = createMockGameState({ newsletter });
        const rep = computeStableReputation(state);
        expect(rep.fame).toBe(1); // 1.0 rounded to 1
      });

      it("caps fame at 100", () => {
         const roster = [
          createMockWarrior({ id: "w1", fame: 100 }), // Avg 100 -> * 3 = 300
        ];

        const state = createMockGameState({ roster });
        const rep = computeStableReputation(state);
        expect(rep.fame).toBe(100);
      });

      it("excludes non-active warriors from the average fame calculation", () => {
        const roster = [
          createMockWarrior({ id: "w1", fame: 100, status: "Dead" }),
          createMockWarrior({ id: "w2", fame: 100, status: "Retired" }),
          createMockWarrior({ id: "w3", fame: 10, status: "Active" }),
        ];

        // Top 5 active: [w3] -> avg 10 -> * 3 = 30
        const state = createMockGameState({ roster });
        const rep = computeStableReputation(state);
        expect(rep.fame).toBe(30);
      });
    });

    describe("Notoriety calculation", () => {
      it("calculates notoriety from total kills across roster and graveyard", () => {
        const roster = [
          createMockWarrior({ career: { wins: 0, losses: 0, kills: 2 } }),
        ];
        const graveyard = [
          createMockWarrior({ career: { wins: 0, losses: 0, kills: 3 } }),
        ];

        // totalKills = 2, graveyardKills = 3
        // killBouts = 0
        // Raw = (2 + 3) * 2 + 0 = 10
        // Notoriety = 10 * 2 = 20

        const state = createMockGameState({ roster, graveyard });
        const rep = computeStableReputation(state);
        expect(rep.notoriety).toBe(20);
      });

      it("adds notoriety from kill bouts in history", () => {
        const arenaHistory = [
          { by: "Kill" } as FightSummary,
          { by: "KO" } as FightSummary,
          { by: "Kill" } as FightSummary,
        ];

        // killBouts = 2
        // Raw = 2 * 1 = 2
        // Notoriety = 2 * 2 = 4

        const state = createMockGameState({ arenaHistory });
        const rep = computeStableReputation(state);
        expect(rep.notoriety).toBe(4);
      });

      it("caps notoriety at 100", () => {
        const roster = [
          createMockWarrior({ career: { wins: 0, losses: 0, kills: 50 } }),
        ];
        // Raw = (50) * 2 = 100
        // Notoriety = 100 * 2 = 200 => capped at 100

        const state = createMockGameState({ roster });
        const rep = computeStableReputation(state);
        expect(rep.notoriety).toBe(100);
      });
    });

    describe("Honor calculation", () => {
      it("starts with base 50 honor and reduces by 3 for each total kill", () => {
         const roster = [
          createMockWarrior({ career: { wins: 0, losses: 0, kills: 5 } }),
        ];

        // Base = 50, totalKills = 5 -> -15
        // Expected: 35

        const state = createMockGameState({ roster });
        const rep = computeStableReputation(state);
        expect(rep.honor).toBe(35);
      });

      it("increases honor by 0.5 for each clean bout in history", () => {
         const arenaHistory = [
          { by: "KO", winner: "A" } as FightSummary,
          { by: "Exhaustion", winner: "D" } as FightSummary,
          { by: "Draw", winner: null } as FightSummary, // Excluded because winner is null
          { by: "Kill", winner: "A" } as FightSummary, // Excluded because by is Kill
        ];

        // Clean bouts = 2
        // Base 50 + 2 * 0.5 = 51

        const state = createMockGameState({ arenaHistory });
        const rep = computeStableReputation(state);
        expect(rep.honor).toBe(51);
      });

      it("bounds honor between 0 and 100", () => {
        // Test lower bound
        let state = createMockGameState({ roster: [createMockWarrior({ career: { wins: 0, losses: 0, kills: 50 } })] });
        let rep = computeStableReputation(state);
        expect(rep.honor).toBe(0); // 50 - 150 = -100 => 0

        // Test upper bound
        const arenaHistory = Array(150).fill({ by: "KO", winner: "A" } as FightSummary);
        state = createMockGameState({ arenaHistory });
        rep = computeStableReputation(state);
        expect(rep.honor).toBe(100); // 50 + 150*0.5 = 125 => 100
      });
    });

    describe("Adaptability calculation", () => {
      it("calculates adaptability from unique active styles", () => {
        const roster = [
          createMockWarrior({ style: "SlashingAttack" as any, status: "Active" }),
          createMockWarrior({ style: "AimedBlow" as any, status: "Active" }),
          createMockWarrior({ style: "SlashingAttack" as any, status: "Active" }), // Duplicate style
          createMockWarrior({ style: "Evasive" as any, status: "Dead" }), // Excluded because Dead
        ];

        // Unique active styles = 2 (SlashingAttack, AimedBlow)
        // Raw = 2 * 8 = 16

        const state = createMockGameState({ roster });
        const rep = computeStableReputation(state);
        expect(rep.adaptability).toBe(16);
      });

      it("calculates adaptability from training assignments and trainers", () => {
        const trainingAssignments = [
          { warriorId: "w1", type: "attribute", attribute: "str" },
          { warriorId: "w2", type: "recovery" },
        ] as any[];

        const trainers = [{}, {}] as any[];

        // trainingCount = 2 -> 2 * 3 = 6
        // trainers.length = 2 -> 2 * 2 = 4
        // Raw = 10

        const state = createMockGameState({ trainingAssignments, trainers });
        const rep = computeStableReputation(state);
        expect(rep.adaptability).toBe(10);
      });
    });
  });

  describe("computeRivalReputation", () => {
    // Basic test for rival reputation to ensure no crash and coverage
    it("computes reputation for a rival stable", () => {
      const roster = [
        createMockWarrior({ fame: 20, career: { wins: 5, losses: 2, kills: 1 }, style: "SlashingAttack" as any }),
      ];
      const arenaHistory: FightSummary[] = [];
      const rep = computeRivalReputation(roster, arenaHistory, "Rival Stable");

      // Fame: Avg 20 -> 20 * 3 = 60
      expect(rep.fame).toBe(60);

      // Notoriety: 1 kill * 4 = 4
      expect(rep.notoriety).toBe(4);

      // Honor: Base 50 + (clean bouts 7-1=6) * 0.3 - (1 kill * 3) = 50 + 1.8 - 3 = 48.8 -> 49
      expect(rep.honor).toBe(49);

      // Adaptability: 1 style * 10 = 10
      expect(rep.adaptability).toBe(10);
    });
  });
});
