import type { GameState, RivalStableData, AIIntent, AIStrategy } from "@/types/game";
import { PERSONALITY_CLASH } from "@/data/ownerData";

/**
 * Determines the weekly strategic intent for an AI owner.
 * Intent impacts recruitment, training, and matchmaking choices.
 */
export function pickWeeklyIntent(
  rival: RivalStableData,
  state: GameState
): AIIntent {
  const personality = rival.owner.personality ?? "Pragmatic";
  const activeRoster = rival.roster.filter(w => w.status === "Active");
  const injuryCount = activeRoster.filter(w => w.injuries && w.injuries.length > 0).length;
  
  // 1. RECOVERY: High priority if stable is in crisis
  if (rival.gold < 200 || (activeRoster.length > 0 && injuryCount / activeRoster.length >= 0.4)) {
    return "RECOVERY";
  }

  // 2. VENDETTA: If there is a high-intensity grudge, consider targeting them
  const hasGrudge = state.ownerGrudges?.some(g => 
    (g.ownerIdA === rival.owner.id || g.ownerIdB === rival.owner.id) && g.intensity >= 3
  );
  
  const vendettaChance = personality === "Aggressive" ? 0.4 : personality === "Showman" ? 0.2 : 0.1;
  if (hasGrudge && Math.random() < vendettaChance) {
    return "VENDETTA";
  }

  // 3. EXPANSION: If roster is thin
  const minSize = personality === "Aggressive" ? 8 : personality === "Methodical" ? 5 : 6;
  if (activeRoster.length < minSize && rival.gold > 300) {
    return "EXPANSION";
  }

  // 4. CONSOLIDATION: Default (focus on training and base maintenance)
  return "CONSOLIDATION";
}

/**
 * Updates the AI strategy, either continuing the current plan or picking a new one.
 */
export function updateAIStrategy(
  rival: RivalStableData,
  state: GameState
): AIStrategy {
  const current = rival.strategy;
  
  // If no strategy or plan expired, pick a new one
  if (!current || current.planWeeksRemaining <= 0) {
    const intent = pickWeeklyIntent(rival, state);
    
    // Determine the duration of this intent
    const duration = intent === "RECOVERY" ? 2 : 
                     intent === "VENDETTA" ? 6 : 
                     intent === "EXPANSION" ? 3 : 4;
                     
    let targetStableId = undefined;
    if (intent === "VENDETTA") {
      const g = state.ownerGrudges?.find(g => 
        (g.ownerIdA === rival.owner.id || g.ownerIdB === rival.owner.id) && g.intensity >= 3
      );
      targetStableId = g?.ownerIdA === rival.owner.id ? g?.ownerIdB : g?.ownerIdA;
    }

    return {
      intent,
      planWeeksRemaining: duration,
      targetStableId
    };
  }

  // Otherwise, tick the current strategy
  return {
    ...current,
    planWeeksRemaining: current.planWeeksRemaining - 1
  };
}
