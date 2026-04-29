import type { RivalStableData, GameState, Trainer } from '@/types/state.types';
import { checkBudget } from './budgetWorker';
import { logAgentAction, type AgentContext } from '../agentCore';

const HIRE_COST: Record<string, number> = { Novice: 50, Seasoned: 100, Master: 200 };

/**
 * StaffWorker: Handles hiring and firing of trainers.
 * Implements "Risk-Tiered Execution" for staffing.
 */
export function processStaff(
  rival: RivalStableData,
  state: GameState,
  hiringPool: Trainer[],
  _context?: AgentContext
): { updatedRival: RivalStableData; gazetteItems: string[]; updatedHiringPool: Trainer[] } {
  let updatedRival = { ...rival };
  const currentTrainers = [...(updatedRival.trainers || [])];
  let currentTreasury = updatedRival.treasury;
  let currentPool = [...hiringPool];
  const gazetteItems: string[] = [];

  const intent = updatedRival.strategy?.intent ?? 'CONSOLIDATION';
  const week = state.week;

  // 1. Hiring logic (Medium/High Risk)
  if (intent !== 'RECOVERY' && currentTrainers.length < 2 && currentPool.length > 0) {
    const affordable = currentPool.filter((t) => (HIRE_COST[t.tier] ?? 0) < currentTreasury - 300);
    if (affordable.length > 0) {
      // Intent-gated specialty preference: pick within preferred focus first, fall back to best tier
      const preferredFocus =
        intent === 'VENDETTA' || intent === 'AGGRESSIVE_EXPANSION'
          ? 'Aggression'
          : intent === 'EXPANSION'
          ? 'Endurance'
          : null;

      const focusCandidates =
        preferredFocus ? affordable.filter((t) => t.focus === preferredFocus) : [];
      const pool = focusCandidates.length > 0 ? focusCandidates : affordable;

      const first = pool[0];
      if (!first) {
        throw new Error('Pool is unexpectedly empty');
      }
      const best = pool.reduce(
        (max, current) => ((HIRE_COST[current.tier] ?? 0) > (HIRE_COST[max.tier] ?? 0) ? current : max),
        first
      );
      const hireCost = HIRE_COST[best.tier] ?? 0;
      const budgetReport = checkBudget(updatedRival, hireCost, 'STAFF');

      if (budgetReport.isAffordable) {
        currentTreasury -= hireCost;
        currentTrainers.push(best);
        currentPool = currentPool.filter((t) => t.id !== best.id);

        updatedRival = { ...updatedRival, treasury: currentTreasury, trainers: currentTrainers };
        updatedRival = logAgentAction(
          updatedRival,
          'STAFF',
          `Hired trainer ${best.name} (${best.tier}).`,
          budgetReport.riskTier,
          week
        );
        gazetteItems.push(
          `👔 STAFF: ${updatedRival.owner.stableName} hired ${best.name} (${best.tier}) to lead their training camp.`
        );
      }
    }
  }

  // 2. Firing logic (RECOVERY Tier + Regional Risk)
  const isSolemn = state.crowdMood === 'Solemn';
  const isRainy = state.weather === 'Rainy';
  const underPressure = currentTreasury < 500 && (isSolemn || isRainy);

  if (intent === 'RECOVERY' || currentTreasury < 100 || underPressure) {
    if (currentTrainers.length > 0) {
      const fired = currentTrainers.pop();
      if (fired) {
        updatedRival = { ...updatedRival, treasury: currentTreasury, trainers: currentTrainers };
        const riskReason = isSolemn
          ? 'solemn crowd dampening income'
          : isRainy
            ? 'stormy weather risks'
            : 'budget constraints';
        updatedRival = logAgentAction(
          updatedRival,
          'STAFF',
          `Released trainer ${fired.name} due to ${riskReason}.`,
          'Low',
          week
        );
        gazetteItems.push(
          `📉 DOWNSIZING: ${updatedRival.owner.stableName} has released trainer ${fired.name} due to ${riskReason}.`
        );
      }
    }
  }

  return { updatedRival, gazetteItems, updatedHiringPool: currentPool };
}
