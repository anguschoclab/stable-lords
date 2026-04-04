import { type GameState, type RivalStableData, type Trainer, type Season } from "@/types/game";
import { processStaff } from "./workers/staffWorker";
import { processRoster } from "./workers/rosterWorker";
import { consolidateAgentMemory, createAgentContext } from "./agentCore";

import { 
  FIGHT_PURSE, 
  WIN_BONUS, 
  FAME_DIVIDEND, 
  WARRIOR_UPKEEP_BASE,
  TRAINER_WEEKLY_SALARY
} from "@/data/economyConstants";

/**
 * processAIStable - The Lead Agent Orchestrator for a Rival Stable.
 * Implements "Hierarchical Delegation" and "Context Isolation".
 */
export function processAIStable(
  rival: RivalStableData,
  state: GameState
): { updatedRival: RivalStableData; isBankrupt: boolean; gazetteItems: string[]; updatedHiringPool: Trainer[] } {
  // 1. Initialize Context & Skeptical Memory
  const context = createAgentContext(rival, state);
  let updatedRival = { ...context.rival };
  const activeRoster = updatedRival.roster.filter(w => w.status === "Active");
  let currentHiringPool = [...(state.hiringPool || [])];
  const gazetteItems: string[] = [];

  // 2. Calculate Weekly Income (Fights + Fame)
  let weeklyIncome = 0;
  const weekFights = state.arenaHistory.filter(f => f.week === state.week);
  for (const f of weekFights) {
    const isOwnerA = updatedRival.owner.id === f.stableA;
    const isOwnerD = updatedRival.owner.id === f.stableD;
    if (isOwnerA || isOwnerD) {
      weeklyIncome += FIGHT_PURSE;
      if ((isOwnerA && f.winner === "A") || (isOwnerD && f.winner === "D")) {
        weeklyIncome += WIN_BONUS;
      }
    }
  }
  const weeklyIncomeFromFights = weeklyIncome; // Bouts income
  const fameDividend = Math.round((updatedRival.owner.fame || 0) * FAME_DIVIDEND);
  weeklyIncome = weeklyIncomeFromFights + fameDividend;

  // 3. Delegate to Workers (Hierarchical Delegation)
  
  // A) StaffWorker (Hiring/Firing)
  const staffResult = processStaff(updatedRival, state, currentHiringPool);
  updatedRival = staffResult.updatedRival;
  currentHiringPool = staffResult.updatedHiringPool;
  gazetteItems.push(...staffResult.gazetteItems);

  // B) RosterWorker (Training/Gear)
  const rosterSeed = state.week * 8123 + (updatedRival.owner.id.length * 101); 
  updatedRival = processRoster(updatedRival, state.week, state.season, rosterSeed);

  // 4. Calculate Final Expenses
  let weeklyExpenses = 0; // Removed 20g hidden tax for parity
  
  // 🏛️ Unification: Fame-bracketed upkeep for AI
  const rosterUpkeep = activeRoster.reduce((sum, w) => {
    const famePremium = Math.floor((w.fame || 0) / 10) * 10;
    return sum + WARRIOR_UPKEEP_BASE + famePremium;
  }, 0);
  weeklyExpenses += rosterUpkeep;

  weeklyExpenses += (updatedRival.trainers || []).reduce((sum, t) => sum + (TRAINER_WEEKLY_SALARY[t.tier] || 10), 0);

  // 5. Update Gold & Check Bankruptcy (Risk Control)
  const goldDelta = weeklyIncome - weeklyExpenses;
  const newGold = updatedRival.gold + goldDelta;
  const isBankrupt = newGold <= 0;
  
  updatedRival.gold = newGold;

  if (isBankrupt) {
    gazetteItems.push(`📉 BANKRUPTCY: ${updatedRival.owner.stableName} has collapsed under its debts.`);
  }

  // 6. Background Consolidation: Prune logs and update burn rate in memory
  updatedRival = consolidateAgentMemory(updatedRival, state.week);

  return {
    updatedRival,
    isBankrupt,
    gazetteItems,
    updatedHiringPool: currentHiringPool
  };
}
