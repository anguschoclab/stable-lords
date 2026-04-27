import type {
  GameState,
  RivalStableData,
  AIEvent,
  AIAgentMemory,
  AIIntent,
} from '@/types/state.types';
import { hashStr } from '../../utils/random';
import { computeMetaDrift } from '../metaDrift';
import type { BudgetReport } from './workers/budgetWorker';
import { checkBudget } from './workers/budgetWorker';

/**
 * LeadAgent Orchestrator
 * Encapsulates the turn logic for a single rival stable.
 * Implements "Skeptical Memory" and "Hierarchical Delegation".
 */
export interface AgentContext {
  rival: RivalStableData;
  state: GameState;
  meta: Record<string, number>;
  budgetReport?: BudgetReport; // ⚡ Bolt: Cache budget report for the week
}

export function createAgentContext(rival: RivalStableData, state: GameState): AgentContext {
  // ⚡ Skeptical Memory: Initialize memory if missing
  const agentMemory: AIAgentMemory = rival.agentMemory || {
    lastTreasury: rival.treasury,
    burnRate: 0,
    metaAwareness: {},
    knownRivals: state.rivals
      ? state.rivals.map((r) => r.owner.id).filter((id) => id !== rival.owner.id)
      : [],
    currentIntent: 'SURVIVAL',
  };

  // ⚡ Continuous Alignment: Compute meta awareness from current arena history (use cached if available)
  const meta = state.cachedMetaDrift || computeMetaDrift(state.arenaHistory || []);

  // ⚡ Bolt: Pre-compute budget report for the week
  const budgetReport = checkBudget(rival, 0, 'OTHER'); // Zero cost for baseline report

  return {
    rival: { ...rival, agentMemory },
    state,
    meta,
    budgetReport,
  };
}

/**
 * Logs an event to the agent's action history, maintaining "Daemon Limits" (pruning old logs).
 */
export function logAgentAction(
  rival: RivalStableData,
  type: AIEvent['type'],
  description: string,
  riskTier: AIEvent['riskTier'],
  week: number
): RivalStableData {
  const eventIndex = (rival.actionHistory || []).length;
  const eventId = `event-${hashStr(`${rival.owner.id}|${week}|${type}|${description}|${eventIndex}`).toString(16)}`;
  const newEvent: AIEvent = {
    id: eventId,
    week,
    type,
    description,
    riskTier,
  };
  const actionHistory = [newEvent, ...(rival.actionHistory || [])].slice(0, 20);

  // ⚡ Intent Recognition: Infer intent from action type
  let currentIntent: AIIntent = rival.agentMemory?.currentIntent || 'SURVIVAL';
  if (type === 'FINANCE' && (description.includes('hoard') || description.includes('saving')))
    currentIntent = 'WEALTH_ACCUMULATION';
  if (
    type === 'STRATEGY' &&
    (description.includes('aggressive') || description.includes('dominance'))
  )
    currentIntent = 'AGGRESSIVE_EXPANSION';
  if (type === 'ROSTER' && (description.includes('scout') || description.includes('diversify')))
    currentIntent = 'ROSTER_DIVERSITY';

  const agentMemory = { ...(rival.agentMemory || {}), currentIntent };
  return { ...rival, actionHistory, agentMemory: agentMemory as AIAgentMemory };
}

/**
 * Background Consolidation: Updates burn rate and long-term memory.
 */
export function consolidateAgentMemory(
  rival: RivalStableData,
  currentWeek: number
): RivalStableData {
  if (!rival.agentMemory) return rival;

  const lastTreasury = rival.agentMemory.lastTreasury;
  const currentTreasury = rival.treasury;
  const burnRate = lastTreasury - currentTreasury;

  return {
    ...rival,
    agentMemory: {
      ...rival.agentMemory,
      lastTreasury: currentTreasury,
      burnRate,
    },
  };
}
