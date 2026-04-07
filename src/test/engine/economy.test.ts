import { describe, it, expect } from "vitest";
import { computeWeeklyBreakdown, processEconomy } from "@/engine/economy";
import type { GameState, Warrior } from "@/types/game";
import { FightingStyle } from "@/types/shared.types";
import { createFreshState } from "@/engine/factories";
import { type FightSummary } from "@/types/combat.types";

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
  const baseState = createFreshState();
  
  describe("computeWeeklyBreakdown", () => {
    it("should calculate zero net when there is no activity and no warriors", () => {
      const state = { ...baseState, week: 1, roster: [], arenaHistory: [] };

      const breakdown = computeWeeklyBreakdown(state as GameState);

      expect(breakdown.income).toHaveLength(0);
      expect(breakdown.expenses).toHaveLength(0);
      expect(breakdown.totalIncome).toBe(0);
      expect(breakdown.totalExpenses).toBe(0);
      expect(breakdown.net).toBe(0);
    });

    it("should calculate correct expenses for warrior upkeep, trainers, and training", () => {
      const state = { ...baseState, week: 1 };

      const w1 = makeTestWarrior({ name: "Alice" });
      const w2 = makeTestWarrior({ name: "Bob" });
      state.roster = [w1, w2];

      state.trainers = [{
        id: "t1", name: "Trainer Dan", focus: "Aggression",
        tier: "Novice", contractWeeksLeft: 5, fame: 1, age: 40
      }];

      state.trainingAssignments = [
        { warriorId: w1.id, attribute: "ST", type: "attribute" }
      ];

      const breakdown = computeWeeklyBreakdown(state as GameState);

      // Expenses:
      // Warriors: 2 * (20 + 0 fame premium) = 40 (Base is 20 in 1.0)
      // Trainers: 1 * 10 = 10 (Novice tier)
      // Training: 1 * 15 = 15
      // Total expenses: 65
      // Wait, let's verify base values in economy.ts or constants.
      // Based on code: WARRIOR_UPKEEP_BASE(20) + famePremium(0) = 20 per warrior.
      // TRAINER_WEEKLY_SALARY[Novice] = 10.
      // TRAINING_COST = 15.
      // 20*2 + 10 + 15 = 65.
      
      expect(breakdown.totalExpenses).toBe(65);
    });

    it("should calculate correct income for fight purses, win bonuses, and fame", () => {
      const state = { ...baseState, week: 5, fame: 10 };
      const w1 = makeTestWarrior({ name: "Alice", id: "p1" });
      state.roster = [w1];

      state.arenaHistory = [
        {
          id: "f1", week: 5,
          a: "Alice", d: "Enemy 1",
          warriorIdA: "p1", warriorIdD: "e1",
          winner: "A", 
          by: "Decision",
          styleA: "StrikingAttack", styleD: "WallOfSteel"
        } as FightSummary,
        {
          id: "f2", week: 5,
          a: "Enemy 2", d: "Alice",
          warriorIdA: "e2", warriorIdD: "p1",
          winner: "A",
          by: "KO",
          styleA: "Brawler", styleD: "StrikingAttack"
        } as FightSummary
      ];

      const breakdown = computeWeeklyBreakdown(state as GameState);

      // Income:
      // Fights: 2 * 50 = 100
      // Wins: 1 * 30 = 30
      // Fame: 10 * 2 = 20
      // Total income: 150
      expect(breakdown.totalIncome).toBe(150);
    });
  });

  describe("processEconomy", () => {
    it("should update game state treasury and add ledger entries immutably", () => {
      const state = { ...baseState, week: 3, treasury: 100, fame: 5 };
      const w1 = makeTestWarrior({ name: "Alice", id: "p1" });
      state.roster = [w1];

      state.arenaHistory = [
        {
          id: "f1", week: 3,
          warriorIdA: "p1", warriorIdD: "e1",
          winner: "A",
          by: "KO",
        } as FightSummary
      ];

      const newState = processEconomy(state as GameState);

      // Income: 5 * 2 (fame) = 10 + 50 (fight) + 30 (win) = 90
      // Expenses: 20 (upkeep) = 20
      // Net = 70
      // Expected new treasury = 100 + 70 = 170

      expect(newState.treasury).toBe(170);
      expect(newState.ledger.length).toBeGreaterThan(0);
    });
  });
});
