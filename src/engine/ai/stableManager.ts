import type {
  GameState,
  RivalStableData,
  AIIntent,
  AIStrategy,
  Trainer,
} from '@/types/state.types';
import type { Season } from '@/types/shared.types';
import { processStaff } from './workers/staffWorker';
import { processRoster } from './workers/rosterWorker';
import { consolidateAgentMemory, createAgentContext } from './agentCore';
import { StateImpact, mergeImpacts } from '@/engine/impacts';

import {
  FIGHT_PURSE,
  WIN_BONUS,
  FAME_DIVIDEND,
  WARRIOR_UPKEEP_BASE,
  TRAINER_WEEKLY_SALARY,
} from '@/data/economyConstants';

/**
 * processAIStable - The Lead Agent Orchestrator for a Rival Stable.
 * Implements "Hierarchical Delegation" and "Context Isolation".
 */
export function processAIStable(
  rival: RivalStableData,
  state: GameState
): {
  updatedRival: RivalStableData;
  isBankrupt: boolean;
  gazetteItems: string[];
  updatedHiringPool: Trainer[];
  impact: StateImpact;
} {
  // 1. Initialize Context & Skeptical Memory
  const context = createAgentContext(rival, state);
  let updatedRival = { ...context.rival };
  const activeRoster = updatedRival.roster.filter((w) => w.status === 'Active');
  let currentHiringPool = [...(state.hiringPool || [])];
  const gazetteItems: string[] = [];
  const impacts: StateImpact[] = [];

  // ── Fatigue Decay for AI Warriors (-25 per week) ──
  updatedRival.roster = updatedRival.roster.map((w) => {
    if (w.status === 'Active' && w.fatigue && w.fatigue > 0) {
      return { ...w, fatigue: Math.max(0, w.fatigue - 25) };
    }
    return w;
  });

  // 2. Calculate Weekly Income (Fights + Fame)
  // NOTE on tick ordering: `weekPipelineService.runWeekPipeline` runs
  // `BoutSimulationPass` → `resolveImpacts` to produce `settledState` before
  // calling `RivalStrategyPass`. That means `state.arenaHistory` already
  // reflects this week's bouts when we read it here — no stale N-1 income.
  let weeklyIncome = 0;
  const weekFights = state.arenaHistory.filter((f) => f.week === state.week);
  for (const f of weekFights) {
    const isOwnerA = updatedRival.owner.id === f.stableA;
    const isOwnerD = updatedRival.owner.id === f.stableD;
    if (isOwnerA || isOwnerD) {
      weeklyIncome += FIGHT_PURSE;
      if ((isOwnerA && f.winner === 'A') || (isOwnerD && f.winner === 'D')) {
        weeklyIncome += WIN_BONUS;
      }
    }
  }
  const weeklyIncomeFromFights = weeklyIncome; // Bouts income
  const fameDividend = Math.round((updatedRival.owner.fame || 0) * FAME_DIVIDEND);
  weeklyIncome = weeklyIncomeFromFights + fameDividend;

  // 3. Delegate to Workers (Hierarchical Delegation)

  // A) StaffWorker (Hiring/Firing)
  const staffResult = processStaff(updatedRival, state, currentHiringPool, context);
  updatedRival = staffResult.updatedRival;
  currentHiringPool = staffResult.updatedHiringPool;
  gazetteItems.push(...staffResult.gazetteItems);
  impacts.push({ hiringPool: currentHiringPool });

  // B) RosterWorker (Training/Gear)
  const rosterSeed = state.week * 8123 + updatedRival.owner.id.length * 101;
  // `processRoster` takes 5 args; the previous 6th (`context`) was silently
  // dropped and has been removed. Agent context flows via `updatedRival` state.
  updatedRival = processRoster(updatedRival, state.week, state.season, rosterSeed);

  // 4. Calculate Final Expenses
  let weeklyExpenses = 0; // Removed 20g hidden tax for parity

  // 🏛️ Unification: Fame-bracketed upkeep for AI
  const rosterUpkeep = activeRoster.reduce((sum, w) => {
    const famePremium = Math.floor((w.fame || 0) / 10) * 10;
    return sum + WARRIOR_UPKEEP_BASE + famePremium;
  }, 0);
  weeklyExpenses += rosterUpkeep;

  weeklyExpenses += (updatedRival.trainers || []).reduce(
    (sum, t) => sum + (TRAINER_WEEKLY_SALARY[t.tier] || 10),
    0
  );

  // 5. Update Treasury & Check Bankruptcy (Risk Control)
  const treasuryDelta = weeklyIncome - weeklyExpenses;
  const newTreasury = updatedRival.treasury + treasuryDelta;
  // 🏛️ 1.0 Hardening: League Subsidy (Prevent economic death spiral)
  const SUBSIDY_FLOOR = 500;
  let isBankrupt = false;
  if (newTreasury < SUBSIDY_FLOOR) {
      const subsidy = SUBSIDY_FLOOR - (newTreasury < 0 ? 0 : newTreasury);
      updatedRival.treasury = SUBSIDY_FLOOR;
      gazetteItems.push(`🏛️ SUBSIDY: ${updatedRival.owner.stableName} received ${subsidy}g from the League of Lords to maintain operations.`);
  } else {
      updatedRival.treasury = newTreasury;
  }

  // Milestone detection — narrow parity with the player's own-stable gazette.
  // Fires once per threshold crossing this tick: fame (100, 250, 500), cumulative
  // roster wins (50, 100, 250). Uses `rival` (pre-tick) vs `updatedRival` to
  // detect the crossing edge so we don't re-fire every week once over-threshold.
  const fameBefore = rival.owner.fame ?? 0;
  const fameAfter = updatedRival.owner.fame ?? 0;
  for (const t of [100, 250, 500]) {
    if (fameBefore < t && fameAfter >= t) {
      gazetteItems.push(`🏛 ${updatedRival.owner.stableName} has reached ${t} fame.`);
    }
  }
  const winsBefore = rival.roster.reduce((s, w) => s + (w.career?.wins ?? 0), 0);
  const winsAfter = updatedRival.roster.reduce((s, w) => s + (w.career?.wins ?? 0), 0);
  for (const t of [50, 100, 250]) {
    if (winsBefore < t && winsAfter >= t) {
      gazetteItems.push(`⚔ ${updatedRival.owner.stableName} tallied its ${t}th career win.`);
    }
  }

  // 6. Background Consolidation: Prune logs and update burn rate in memory
  updatedRival = consolidateAgentMemory(updatedRival, state.week);

  // Collect impact for this rival
  const rivalsUpdates = new Map<string, Partial<RivalStableData>>();
  rivalsUpdates.set(rival.owner.id, updatedRival);
  impacts.push({ rivalsUpdates });

  // console.log(`[AIStable] ${updatedRival.owner.stableName} | Pop: ${updatedRival.roster.length} | T: ${updatedRival.treasury}`);

  return {
    updatedRival,
    isBankrupt,
    gazetteItems,
    updatedHiringPool: currentHiringPool,
    impact: mergeImpacts(impacts),
  };
}
