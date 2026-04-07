import { describe, it, expect } from "vitest";
import { computeWeeklyBreakdown, processEconomy } from "@/engine/economy";
import type { GameState, Warrior } from "@/types/game";
import { FightingStyle, type FightSummary } from "@/types/game";
import { createFreshState } from "@/engine/factories";

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
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: "Active",
    age: 20,
    ...overrides,
  } as Warrior;
}

describe("Economy Engine", () => {
  const baseState = createFreshState("test-seed");
  
  describe("computeWeeklyBreakdown", () => {
    it("should calculate zero net when there is no activity and no warriors", () => {
      const state = { ...baseState, week: 1, roster: [], arenaHistory: [] };
      const breakdown = computeWeeklyBreakdown(state as GameState);
      expect(breakdown.totalIncome).toBe(0);
      expect(breakdown.totalExpenses).toBe(0);
      expect(breakdown.net).toBe(0);
    });

    it("should calculate correct expenses for warrior upkeep, trainers, and training", () => {
      const state = { ...baseState, week: 1 };
      const w1 = makeTestWarrior({ name: "Alice", fame: 0 });
      const w2 = makeTestWarrior({ name: "Bob", fame: 0 });
      state.roster = [w1, w2];

      state.trainers = [{
        id: "t1", name: "Trainer Dan", focus: "Aggression",
        tier: "Novice", contractWeeksLeft: 5, fame: 1, age: 40
      }];

      state.trainingAssignments = [
        { warriorId: w1.id, attribute: "ST", type: "attribute" }
      ];

      const breakdown = computeWeeklyBreakdown(state as GameState);

      // Expenses (from economyConstants.ts):
      // Warriors: 2 * (60 + 0 fame premium) = 120
      // Trainers: 1 * 10 = 10
      // Training: 1 * 20 = 20
      // Total expenses: 150
      expect(breakdown.totalExpenses).toBe(150);
    });

    it("should calculate correct income for fight purses, win bonuses, and fame", () => {
      const state = { ...baseState, week: 5, fame: 10 };
      const w1 = makeTestWarrior({ name: "Alice", id: "p1" });
      state.roster = [w1];

      state.arenaHistory = [
        {
          id: "f1", week: 5,
          warriorIdA: "p1", warriorIdD: "e1",
          winner: "A", 
        } as FightSummary,
        {
          id: "f2", week: 5,
          warriorIdA: "e2", warriorIdD: "p1",
          winner: "A",
        } as FightSummary
      ];

      const breakdown = computeWeeklyBreakdown(state as GameState);

      // Income (from economyConstants.ts):
      // Fight Purses: 2 * 180 = 360
      // Win Bonuses: 1 * 100 = 100
      // Fame Dividends: 10 * 0.5 = 5
      // Total income: 465
      expect(breakdown.totalIncome).toBe(465);
    });
  });

  describe("processEconomy", () => {
    it("should update game state treasury and add ledger entries immutably", () => {
      const state = { ...baseState, week: 3, treasury: 100, fame: 5 };
      const w1 = makeTestWarrior({ name: "Alice", id: "p1", fame: 0 });
      state.roster = [w1];

      state.arenaHistory = [
        {
          id: "f1", week: 3,
          warriorIdA: "p1", warriorIdD: "e1",
          winner: "A",
        } as FightSummary
      ];

      const newState = processEconomy(state as GameState);

      // Income: 5 * 0.5 (fame) = 3 + 180 (fight) + 100 (win) = 283
      // Expenses: 60 (upkeep) = 60
      // Net = 223
      // Expected new treasury = 100 + 223 = 323

      expect(newState.treasury).toBe(323);
      expect(newState.ledger.length).toBeGreaterThan(0);
    });
  });
});
