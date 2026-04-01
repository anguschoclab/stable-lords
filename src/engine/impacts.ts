import { GameState, Warrior, LedgerEntry } from "@/types/game";
import { updateEntityInList } from "@/utils/stateUtils";

/**
 * State Impact — A pure object describing a set of changes to apply to the GameState.
 */
export interface StateImpact {
  goldDelta?: number;
  fameDelta?: number;
  rosterUpdates?: Map<string, Partial<Warrior>>;
  newsletterItems?: { week: number; title: string; items: string[] }[];
  ledgerEntries?: LedgerEntry[];
  newPoolRecruits?: any[]; // Simplified for now
}

/**
 * Resolve a collection of impacts into a final GameState.
 * This is the "Single Point of Mutation" for the advancement pipeline.
 */
export function resolveImpacts(state: GameState, impacts: StateImpact[]): GameState {
  const newState = { ...state };

  for (const impact of impacts) {
    // 1. Gold
    if (impact.goldDelta) {
      newState.gold = (newState.gold ?? 0) + impact.goldDelta;
    }

    // 2. Fame
    if (impact.fameDelta) {
      newState.fame = (newState.fame ?? 0) + impact.fameDelta;
    }

    // 3. Roster Updates
    if (impact.rosterUpdates) {
      impact.rosterUpdates.forEach((update, id) => {
        newState.roster = updateEntityInList(newState.roster, id, (w) => ({
          ...w,
          ...update
        }));
      });
    }

    // 4. Newsletter
    if (impact.newsletterItems) {
      newState.newsletter = [...newState.newsletter, ...impact.newsletterItems];
    }

    // 5. Ledger
    if (impact.ledgerEntries) {
      newState.ledger = [...(newState.ledger ?? []), ...impact.ledgerEntries];
    }
  }

  return newState;
}

/**
 * Merge multiple impacts into one (optional helper).
 */
export function mergeImpacts(impacts: StateImpact[]): StateImpact {
  const merged: StateImpact = {
    goldDelta: 0,
    fameDelta: 0,
    rosterUpdates: new Map(),
    newsletterItems: [],
    ledgerEntries: []
  };

  for (const imp of impacts) {
    if (imp.goldDelta) merged.goldDelta! += imp.goldDelta;
    if (imp.fameDelta) merged.fameDelta! += imp.fameDelta;
    
    if (imp.rosterUpdates) {
      imp.rosterUpdates.forEach((val, key) => {
        const existing = merged.rosterUpdates!.get(key) || {};
        merged.rosterUpdates!.set(key, { ...existing, ...val });
      });
    }

    if (imp.newsletterItems) merged.newsletterItems!.push(...imp.newsletterItems);
    if (imp.ledgerEntries) merged.ledgerEntries!.push(...imp.ledgerEntries);
  }

  return merged;
}
