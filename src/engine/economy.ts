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

const FIGHT_PURSE = 50;
const WIN_BONUS = 30;
const FAME_MULTIPLIER = 2;
const WARRIOR_UPKEEP = 20;
const TRAINER_SALARY = 35;
const TRAINING_COST = 15;

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
  const fightsThisWeek = state.arenaHistory.filter((f) => f.week === week);
  const playerWarriorNames = new Set(state.roster.map((w) => w.name));

  let fightCount = 0;
  let winCount = 0;
  for (const f of fightsThisWeek) {
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

  const totalIncome = income.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

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
