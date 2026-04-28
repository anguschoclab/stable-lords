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
export type PlayerThreatLevel = 'Dominant' | 'Moderate' | 'Neutral';

export interface AgentContext {
  rival: RivalStableData;
  state: GameState;
  meta: Record<string, number>;
  budgetReport?: BudgetReport; // ⚡ Bolt: Cache budget report for the week
  playerThreatLevel: PlayerThreatLevel;
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
    currentIntent: 'CONSOLIDATION',
  };

  // ⚡ Continuous Alignment: Compute meta awareness from current arena history (use cached if available)
  const meta = state.cachedMetaDrift || computeMetaDrift(state.arenaHistory || []);

  // ⚡ Bolt: Pre-compute budget report for the week
  const budgetReport = checkBudget(rival, 0, 'OTHER'); // Zero cost for baseline report

  // Player threat level from realm rankings — rivals use this to decide VENDETTA targets
  const playerThreatLevel = computePlayerThreatLevel(state);

  return {
    rival: { ...rival, agentMemory },
    state,
    meta,
    budgetReport,
    playerThreatLevel,
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
  let currentIntent: AIIntent = rival.agentMemory?.currentIntent || 'CONSOLIDATION';
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
 * Resets seasonRecord on week 1 (season boundary).
 */
export function consolidateAgentMemory(
  rival: RivalStableData,
  currentWeek: number
): RivalStableData {
  if (!rival.agentMemory) return rival;

  const lastTreasury = rival.agentMemory.lastTreasury;
  const currentTreasury = rival.treasury;
  const burnRate = lastTreasury - currentTreasury;

  const isSeasonBoundary = currentWeek === 1;
  const seasonRecord = isSeasonBoundary
    ? {
        wins: 0,
        losses: 0,
        kills: 0,
        rosterSizeAtSeasonStart: rival.roster.filter((w) => w.status === 'Active').length,
      }
    : rival.agentMemory.seasonRecord;

  return {
    ...rival,
    agentMemory: {
      ...rival.agentMemory,
      lastTreasury: currentTreasury,
      burnRate,
      ...(seasonRecord !== undefined ? { seasonRecord } : {}),
    },
  };
}

/**
 * Computes how threatening the player is relative to the world,
 * based on their best warrior's realm ranking vs the world median.
 */
export function computePlayerThreatLevel(state: GameState): PlayerThreatLevel {
  const rankings = state.realmRankings;
  if (!rankings || Object.keys(rankings).length === 0) return 'Neutral';

  const playerWarriorIds = new Set((state.roster || []).map((w) => w.id));
  let playerBestRank: number | null = null;
  for (const [id, entry] of Object.entries(rankings)) {
    if (!playerWarriorIds.has(id as import('@/types/shared.types').WarriorId)) continue;
    if (playerBestRank === null || entry.overallRank < playerBestRank) {
      playerBestRank = entry.overallRank;
    }
  }

  if (playerBestRank === null) return 'Neutral';

  const totalRanked = Object.keys(rankings).length;
  const percentile = playerBestRank / Math.max(1, totalRanked);

  if (percentile <= 0.15) return 'Dominant';
  if (percentile <= 0.4) return 'Moderate';
  return 'Neutral';
}
