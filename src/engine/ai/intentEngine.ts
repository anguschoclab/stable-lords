import type { GameState, RivalStableData, AIIntent, AIStrategy } from '@/types/state.types';
import { computeMetaDrift } from '../metaDrift';
import { FightingStyle } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { computePlayerThreatLevel } from './agentCore';

/**
 * Determines the weekly strategic intent for an AI owner.
 * Intent impacts recruitment, training, and matchmaking choices.
 */
export function pickWeeklyIntent(
  rival: RivalStableData,
  state: GameState,
  seed?: number,
  rng?: IRNGService
): AIIntent {
  const rngService = rng || new SeededRNGService(seed ?? state.week * 131 + rival.owner.id.length);
  const personality = rival.owner.personality ?? 'Pragmatic';
  const activeRoster = rival.roster.filter((w) => w.status === 'Active');
  const injuryCount = activeRoster.filter((w) => w.injuries && w.injuries.length > 0).length;

  // ⚡ Environmental Awareness
  const isRainy = state.weather === 'Rainy';

  // ⚡ Continuous Alignment: Meta-Drift Awareness (use cached if available)
  const meta = state.cachedMetaDrift || computeMetaDrift(state.arenaHistory || []);
  const favoredStyles = rival.owner.favoredStyles || [];
  const metaIsHostile = favoredStyles.some((s) => (meta[s] || 0) < -2);

  // Weather Pivot: Avoid the arena if the stable is precision-heavy and it's raining
  const precisionHeavy =
    activeRoster.filter((w) => w.style === 'LUNGING ATTACK').length >= activeRoster.length * 0.5;
  if (isRainy && precisionHeavy && personality !== 'Aggressive') {
    return 'RECOVERY';
  }

  // 1. RECOVERY: High priority if stable is in crisis or season is going badly
  const seasonRecord = rival.agentMemory?.seasonRecord;
  const seasonFightsPlayed = (seasonRecord?.wins ?? 0) + (seasonRecord?.losses ?? 0);
  const seasonWinRate =
    seasonFightsPlayed >= 6
      ? (seasonRecord?.wins ?? 0) / seasonFightsPlayed
      : null;

  if (
    rival.treasury < 200 ||
    (activeRoster.length > 0 && injuryCount / activeRoster.length >= 0.4) ||
    (metaIsHostile && personality === 'Methodical') ||
    (seasonWinRate !== null && seasonWinRate < 0.3)
  ) {
    return 'RECOVERY';
  }

  // 2. VENDETTA: If there is a high-intensity grudge, or the player is dominant
  const hasGrudge = state.ownerGrudges?.some(
    (g) => (g.ownerIdA === rival.owner.id || g.ownerIdB === rival.owner.id) && g.intensity >= 3
  );

  const playerThreat = computePlayerThreatLevel(state);
  const playerThreatVendettaChance =
    playerThreat === 'Dominant' &&
    (personality === 'Aggressive' || personality === 'Showman' || personality === 'Tactician')
      ? 0.25
      : 0;

  const vendettaChance =
    personality === 'Aggressive' ? 0.4 : personality === 'Showman' ? 0.2 : 0.1;
  if (hasGrudge && rngService.next() < vendettaChance) {
    return 'VENDETTA';
  }
  if (playerThreatVendettaChance > 0 && rngService.next() < playerThreatVendettaChance) {
    return 'VENDETTA';
  }

  // 3. WEALTH_ACCUMULATION: Thriving stables with full rosters hoard cash
  if (
    rival.treasury > 1500 &&
    seasonWinRate !== null &&
    seasonWinRate >= 0.6 &&
    (personality === 'Methodical' || personality === 'Pragmatic')
  ) {
    return 'WEALTH_ACCUMULATION';
  }

  // 4. AGGRESSIVE_EXPANSION: Dominant Aggressive stables push for prestige bouts
  const maxRosterSize = personality === 'Aggressive' ? 10 : 8;
  if (
    activeRoster.length >= maxRosterSize &&
    rival.treasury > 1200 &&
    personality === 'Aggressive'
  ) {
    return 'AGGRESSIVE_EXPANSION';
  }

  // 5. ROSTER_DIVERSITY: Stables heavily concentrated in a meta-losing style diversify
  const allStyles = activeRoster.map((w) => w.style);
  if (allStyles.length >= 4) {
    const styleCounts: Record<string, number> = {};
    for (const s of allStyles) styleCounts[s] = (styleCounts[s] ?? 0) + 1;
    const maxConcentration = Math.max(...Object.values(styleCounts)) / allStyles.length;
    const dominantStyle = Object.entries(styleCounts).reduce((a, b) => (b[1] > a[1] ? b : a))[0] as FightingStyle;
    if (maxConcentration >= 0.5 && (meta[dominantStyle] ?? 0) <= -3) {
      return 'ROSTER_DIVERSITY';
    }
  }

  // 6. EXPANSION: If roster is thin — boosted if a known rival has grown recently
  const minSize = personality === 'Aggressive' ? 8 : personality === 'Methodical' ? 5 : 6;
  const knownRivals = rival.agentMemory?.knownRivals ?? [];
  const rivalExpanding = knownRivals.some((rivalId) => {
    const r = state.rivals?.find((rv) => rv.owner.id === rivalId);
    if (!r || !r.agentMemory?.seasonRecord) return false;
    return r.roster.filter((w) => w.status === 'Active').length >
      r.agentMemory.seasonRecord.rosterSizeAtSeasonStart + 1;
  });
  const expansionThreshold = rivalExpanding ? Math.floor(minSize * 0.8) : minSize;
  if (activeRoster.length < expansionThreshold && rival.treasury > 300) {
    return 'EXPANSION';
  }

  // 7. CONSOLIDATION: Default (focus on training and base maintenance)
  return 'CONSOLIDATION';
}

/**
 * ⚡ Skeptical Memory: Verifies if the current strategy still makes sense.
 * Returns true if the plan is "disproved" by current reality.
 */
export function verifyIntentSkepticism(rival: RivalStableData, state: GameState): boolean {
  const strategy = rival.strategy;
  if (!strategy) return true;

  const personality = rival.owner.personality ?? 'Pragmatic';

  // Skepticism Tier 1: Financial Crisis
  if (strategy.intent !== 'RECOVERY' && rival.treasury < 150) return true;

  // Skepticism Tier 2: Roster Depletion
  const activeCount = rival.roster.filter((w) => w.status === 'Active').length;
  if (strategy.intent === 'VENDETTA' && activeCount < 3) return true;

  // Skepticism Tier 3: Meta Hostility (Methodical/Tactician agents only)
  if (personality === 'Methodical' || personality === 'Tactician') {
    const meta = state.cachedMetaDrift || computeMetaDrift(state.arenaHistory || []);
    const favored = rival.owner.favoredStyles || [];
    if (favored.some((s) => (meta[s] || 0) < -4)) return true;
  }

  // Skepticism Tier 4: Environmental Hazard (Strategic Abort)
  const isRainy = state.weather === 'Rainy';
  const precisionHeavy =
    rival.roster.filter((w) => w.status === 'Active' && w.style === 'LUNGING ATTACK').length > 0;
  if (
    isRainy &&
    (strategy.intent === 'VENDETTA' || strategy.intent === 'EXPANSION') &&
    precisionHeavy &&
    personality !== 'Aggressive'
  ) {
    // Strategic Abort: Pause the offensive due to bad weather
    return true;
  }

  return false;
}

/**
 * Updates the AI strategy, either continuing the current plan or picking a new one.
 */
export function updateAIStrategy(
  rival: RivalStableData,
  state: GameState,
  seed?: number
): AIStrategy {
  const current = rival.strategy;

  // ⚡ Skeptical Memory: Verify current plan
  const planDisproved = verifyIntentSkepticism(rival, state);

  // If no strategy, plan expired, or plan is disproved, pick a new one
  if (!current || current.planWeeksRemaining <= 0 || planDisproved) {
    const s = seed ?? state.week * 7919 + rival.owner.id.length * 13;
    const rng = new SeededRNGService(s);
    const intent = pickWeeklyIntent(rival, state, s, rng);

    // Determine the duration of this intent
    const duration =
      intent === 'RECOVERY' ? 2 : intent === 'VENDETTA' ? 6 : intent === 'EXPANSION' ? 3 : 4;

    let targetStableId = undefined;
    if (intent === 'VENDETTA') {
      const g = state.ownerGrudges?.find(
        (g) => (g.ownerIdA === rival.owner.id || g.ownerIdB === rival.owner.id) && g.intensity >= 3
      );
      targetStableId = g?.ownerIdA === rival.owner.id ? g?.ownerIdB : g?.ownerIdA;
      // If no grudge target but player triggered the vendetta, target the player stable
      if (!targetStableId) {
        targetStableId = state.player?.id;
      }
    }

    return {
      intent,
      planWeeksRemaining: duration,
      targetStableId,
    };
  }

  // Otherwise, tick the current strategy
  return {
    ...current,
    planWeeksRemaining: current.planWeeksRemaining - 1,
  };
}
