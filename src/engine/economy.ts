/**
 * Economy engine — weekly income/expenses processed at week advance.
 *
 * Income sources:
 *  - Fight purses: 50g per fight participated
 *  - Win bonus: +30g per win
 *  - Fame bonus: fame × 2 per week
 *
 * Expenses:
 *  - Warrior upkeep: 20g per warrior per week
 *  - Trainer salaries: 35g per active trainer per week
 *  - Training costs: 15g per warrior in training
 */
import type { GameState, LedgerEntry } from "@/types/game";

const FIGHT_PURSE = 75; // Increased from 60 to 75 to reward active stable management
const WIN_BONUS = 30;
const FAME_MULTIPLIER = 2;
const WARRIOR_UPKEEP = 30; // Increased from 25 to 30 to penalize large idle rosters
const TRAINER_SALARY = 35;
const TRAINING_COST = 20; // Increased training cost to make early-game recruits more of a risk

export interface WeeklyBreakdown {
  income: { label: string; amount: number }[];
  expenses: { label: string; amount: number }[];
  totalIncome: number;
  totalExpenses: number;
  net: number;
}

/** Compute a projected breakdown for the current state (before advancing). */
export function computeWeeklyBreakdown(state: GameState): WeeklyBreakdown {
  const week = state.week;
  const playerWarriorNames = new Set(state.roster.map((w) => w.name));

  let fightCount = 0;
  let winCount = 0;

  // ⚡ Bolt: Fast backward search in O(1) instead of an O(N) filter.
  // We can break early because `arenaHistory` is guaranteed chronological.
  for (let i = state.arenaHistory.length - 1; i >= 0; i--) {
    const f = state.arenaHistory[i];
    if (f.week !== week) break;

    const aIsPlayer = playerWarriorNames.has(f.a);
    const dIsPlayer = playerWarriorNames.has(f.d);
    if (aIsPlayer) { fightCount++; if (f.winner === "A") winCount++; }
    if (dIsPlayer) { fightCount++; if (f.winner === "D") winCount++; }
  }

  const income: { label: string; amount: number }[] = [];
  if (fightCount > 0) income.push({ label: `Fight purses (${fightCount})`, amount: fightCount * FIGHT_PURSE });
  if (winCount > 0) income.push({ label: `Win bonuses (${winCount})`, amount: winCount * WIN_BONUS });
  if (state.fame > 0) income.push({ label: "Fame dividends", amount: state.fame * FAME_MULTIPLIER });

  const expenses: { label: string; amount: number }[] = [];
  if (state.roster.length > 0) expenses.push({ label: `Warrior upkeep (${state.roster.length})`, amount: state.roster.length * WARRIOR_UPKEEP });
  if (state.trainers.length > 0) expenses.push({ label: `Trainer salaries (${state.trainers.length})`, amount: state.trainers.length * TRAINER_SALARY });
  const trainingCount = (state.trainingAssignments ?? []).length;
  if (trainingCount > 0) expenses.push({ label: `Training fees (${trainingCount})`, amount: trainingCount * TRAINING_COST });

  // ⚡ Bolt: Optimized calculation over constant size small arrays.
  let totalIncome = 0;
  for (let i = 0; i < income.length; i++) totalIncome += income[i].amount;

  let totalExpenses = 0;
  for (let i = 0; i < expenses.length; i++) totalExpenses += expenses[i].amount;

  return { income, expenses, totalIncome, totalExpenses, net: totalIncome - totalExpenses };
}

/** Process economy at week-end. Adds ledger entries and updates gold. */
export function processEconomy(state: GameState): GameState {
  const breakdown = computeWeeklyBreakdown(state);
  const entries: LedgerEntry[] = [];

  for (const i of breakdown.income) {
    entries.push({ week: state.week, label: i.label, amount: i.amount, category: "fight" });
  }
  for (const e of breakdown.expenses) {
    entries.push({ week: state.week, label: e.label, amount: -e.amount, category: "upkeep" });
  }

  return {
    ...state,
    gold: (state.gold ?? 0) + breakdown.net,
    ledger: [...(state.ledger ?? []), ...entries],
  };
}
