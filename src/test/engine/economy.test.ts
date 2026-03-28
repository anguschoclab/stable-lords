import { describe, it, expect } from "vitest";
import { computeWeeklyBreakdown, processEconomy } from "@/engine/economy";
import type { GameState, Warrior } from "@/types/game";
import { FightingStyle } from "@/types/game";
import { createFreshState } from "@/state/gameStore";

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
  };
}

describe("Economy Engine", () => {
  describe("computeWeeklyBreakdown", () => {
    it("should calculate zero net when there is no activity and no warriors", () => {
      const state = createFreshState();
      state.week = 1;

      const breakdown = computeWeeklyBreakdown(state);

      expect(breakdown.income).toHaveLength(0);
      expect(breakdown.expenses).toHaveLength(0);
      expect(breakdown.totalIncome).toBe(0);
      expect(breakdown.totalExpenses).toBe(0);
      expect(breakdown.net).toBe(0);
    });

    it("should calculate correct expenses for warrior upkeep, trainers, and training", () => {
      const state = createFreshState();
      state.week = 1;

      // Setup expenses: 2 warriors, 1 trainer, 1 training assignment
      const w1 = makeTestWarrior({ name: "Alice" });
      const w2 = makeTestWarrior({ name: "Bob" });
      state.roster = [w1, w2];

      state.trainers = [{
        contractWeeksLeft: 5, tier: "Apprentice",
        id: "t1", name: "Trainer Dan", specialty: "ST", effectTier: "Apprentice",
        salary: 35, // Not used by the engine which hardcodes TRAINER_SALARY to 35, but providing for completeness
        isAssigned: true, age: 40, portrait: 1, flavor: "Tough"
      }];

      state.trainingAssignments = [
        { warriorId: w1.id, focus: "ST", assignedTrainerId: "t1" }
      ];

      const breakdown = computeWeeklyBreakdown(state);

      // Expenses:
      // Warriors: 2 * 45 = 90
      // Trainers: 1 * 35 = 35
      // Training: 1 * 20 = 20
      // Total expenses: 145
      expect(breakdown.totalExpenses).toBe(145);

      const expenseLabels = breakdown.expenses.map(e => e.label);
      expect(expenseLabels).toContain("Warrior upkeep (2)");
      expect(expenseLabels).toContain("Trainer salaries (1)");
      expect(expenseLabels).toContain("Training fees (1)");

      expect(breakdown.expenses.find(e => e.label.includes("Warrior upkeep"))?.amount).toBe(90);
      expect(breakdown.expenses.find(e => e.label.includes("Trainer salaries"))?.amount).toBe(35);
      expect(breakdown.expenses.find(e => e.label.includes("Training fees"))?.amount).toBe(20);
    });

    it("should calculate correct income for fight purses, win bonuses, and fame", () => {
      const state = createFreshState();
      state.week = 5;
      state.fame = 10;

      const w1 = makeTestWarrior({ name: "Alice" });
      state.roster = [w1]; // Need the warrior in the roster so the engine knows it's a player warrior

      // Setup income: 2 fights, 1 win
      // ⚡ Bolt: Make sure they are chronological (f3 then f1 then f2)
      // because computeWeeklyBreakdown breaks early if f.week !== week.
      state.arenaHistory = [
        {
          // Previous week fight, shouldn't count
          id: "f3", week: 4, season: "Spring",
          a: "Alice", d: "Enemy 3",
          aStable: "Player", dStable: "Rival 3",
          winner: "A",
          loser: "D",
          aInjuries: [], dInjuries: [], type: "Standard"
        } as any,
        {
          id: "f1", week: 5, season: "Spring",
          a: "Alice", d: "Enemy 1",
          aStable: "Player", dStable: "Rival 1",
          winner: "A", // Player won
          loser: "D",
          aInjuries: [], dInjuries: [], type: "Standard"
        } as any,
        {
          id: "f2", week: 5, season: "Spring",
          a: "Enemy 2", d: "Alice",
          aStable: "Rival 2", dStable: "Player",
          winner: "A", // Player lost
          loser: "D",
          aInjuries: [], dInjuries: [], type: "Standard"
        } as any
      ];

      const breakdown = computeWeeklyBreakdown(state);

      // Income:
      // Fights: 2 * 100 = 200
      // Wins: 1 * 40 = 40
      // Fame: 10 * 2 = 20
      // Total income: 260
      expect(breakdown.totalIncome).toBe(260);

      const incomeLabels = breakdown.income.map(i => i.label);
      expect(incomeLabels).toContain("Fight purses (2)");
      expect(incomeLabels).toContain("Win bonuses (1)");
      expect(incomeLabels).toContain("Fame dividends");

      expect(breakdown.income.find(i => i.label.includes("Fight purses"))?.amount).toBe(200);
      expect(breakdown.income.find(i => i.label.includes("Win bonuses"))?.amount).toBe(40);
      expect(breakdown.income.find(i => i.label.includes("Fame dividends"))?.amount).toBe(20);
    });

    it("should accurately compute net income", () => {
      const state = createFreshState();
      state.week = 2;
      state.fame = 5; // +10 gold

      const w1 = makeTestWarrior({ name: "Alice" });
      state.roster = [w1]; // -20 gold

      state.arenaHistory = [
        {
          id: "f1", week: 2, season: "Spring",
          a: "Alice", d: "Enemy",
          aStable: "Player", dStable: "Rival",
          winner: "D", // lost fight: +50 gold purse, +0 win bonus
          loser: "A",
          aInjuries: [], dInjuries: [], type: "Standard"
        }
      ];

      const breakdown = computeWeeklyBreakdown(state);

      // Income: 10 (fame) + 100 (fight) = 110
      // Expenses: 45 (upkeep) = 45
      // Net = 65
      expect(breakdown.net).toBe(65);
    });
  });

  describe("processEconomy", () => {
    it("should update game state gold and add ledger entries immutably", () => {
      const state = createFreshState();
      state.week = 3;
      state.gold = 100;
      state.fame = 5; // +10 gold

      const w1 = makeTestWarrior({ name: "Alice" });
      state.roster = [w1]; // -30 gold

      state.arenaHistory = [
        {
          id: "f1", week: 3, season: "Spring",
          a: "Alice", d: "Enemy",
          aStable: "Player", dStable: "Rival",
          winner: "A", // won fight: +75 gold purse, +30 win bonus
          loser: "D",
          aInjuries: [], dInjuries: [], type: "Standard"
        }
      ];

      const prevStateRef = { ...state };
      const prevLedgerRef = [...(state.ledger || [])];

      const newState = processEconomy(state);

      // Income: 10 (fame) + 100 (fight) + 40 (win) = 150
      // Expenses: 45 (upkeep) = 45
      // Net = 105
      // Expected new gold = 100 + 105 = 205

      expect(newState.gold).toBe(205);

      // Verify immutability
      expect(newState).not.toBe(state);
      expect(newState.ledger).not.toBe(state.ledger);
      expect(state.gold).toBe(100);

      // Verify ledger entries
      const newLedgerEntries = newState.ledger.slice(prevLedgerRef.length);

      // Should have 3 income entries and 1 expense entry
      expect(newLedgerEntries).toHaveLength(4);

      const fightPurseEntry = newLedgerEntries.find(e => e.label.includes("Fight purses"));
      expect(fightPurseEntry).toBeDefined();
      expect(fightPurseEntry?.amount).toBe(100);
      expect(fightPurseEntry?.category).toBe("fight");
      expect(fightPurseEntry?.week).toBe(3);

      const winBonusEntry = newLedgerEntries.find(e => e.label.includes("Win bonuses"));
      expect(winBonusEntry).toBeDefined();
      expect(winBonusEntry?.amount).toBe(40);
      expect(winBonusEntry?.category).toBe("fight");
      expect(winBonusEntry?.week).toBe(3);

      const fameEntry = newLedgerEntries.find(e => e.label.includes("Fame dividends"));
      expect(fameEntry).toBeDefined();
      expect(fameEntry?.amount).toBe(10);
      expect(fameEntry?.category).toBe("fight");
      expect(fameEntry?.week).toBe(3);

      const upkeepEntry = newLedgerEntries.find(e => e.label.includes("Warrior upkeep"));
      expect(upkeepEntry).toBeDefined();
      expect(upkeepEntry?.amount).toBe(-45); // Expenses are recorded as negative amounts
      expect(upkeepEntry?.category).toBe("upkeep");
      expect(upkeepEntry?.week).toBe(3);
    });

    it("should handle missing optional arrays correctly", () => {
      const state = createFreshState();
      // Force some arrays to undefined to test safety (if they were undefined)
      // Note: createFreshState provides empty arrays by default
      const partialState = {
        ...state,
        week: 1,
        gold: 50,
        fame: 0,
        roster: [],
        arenaHistory: [],
        trainers: [],
        ledger: undefined, // Test undefined ledger
      } as unknown as GameState;

      const newState = processEconomy(partialState);

      expect(newState.gold).toBe(50);
      expect(Array.isArray(newState.ledger)).toBe(true);
      expect(newState.ledger).toHaveLength(0);
    });
  });
});
