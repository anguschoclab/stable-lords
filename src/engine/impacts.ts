import type { GameState, LedgerEntry, NewsletterItem } from "@/types/state.types";
import type { Warrior } from "@/types/warrior.types";
import type { PoolWarrior } from "@/engine/recruitment";
import { updateEntityInList } from "@/utils/stateUtils";

export interface StateImpact { treasuryDelta?: number; fameDelta?: number; rosterUpdates?: Map<string, Partial<Warrior>>; newsletterItems?: NewsletterItem[]; ledgerEntries?: LedgerEntry[]; newPoolRecruits?: PoolWarrior[]; }

type ImpactHandler<K extends keyof StateImpact> = (state: GameState, value: Exclude<StateImpact[K], undefined>) => void;

const impactHandlers: { [K in keyof StateImpact]-?: ImpactHandler<K> } = {
  treasuryDelta: (state, value) => { state.treasury = (state.treasury ?? 0) + value; },
  fameDelta: (state, value) => { state.fame = (state.fame ?? 0) + value; },
  rosterUpdates: (state, value) => {
    value.forEach((update, id) => { state.roster = updateEntityInList(state.roster, id, (w) => ({ ...w, ...update })); });
  },
  newsletterItems: (state, value) => { state.newsletter = [...state.newsletter, ...value]; },
  ledgerEntries: (state, value) => { state.ledger = [...(state.ledger ?? []), ...value]; },
  newPoolRecruits: () => { }
};

export function resolveImpacts(state: GameState, impacts: StateImpact[]): GameState {
  const newState = { ...state };
  for (const impact of impacts) {
    for (const key of Object.keys(impact) as Array<keyof StateImpact>) {
      const value = impact[key];
      if (value !== undefined) {
        const handler = impactHandlers[key] as ImpactHandler<typeof key>;
        if (handler) {
          handler(newState, value as never); // Typesafe by construction, but TypeScript loses the generic linkage when iterating Object.keys
        }
      }
    }
  }
  return newState;
}

export function mergeImpacts(impacts: StateImpact[]): StateImpact {
  const merged: StateImpact = { treasuryDelta: 0, fameDelta: 0, rosterUpdates: new Map(), newsletterItems: [], ledgerEntries: [] };
  for (const imp of impacts) {
    if (imp.treasuryDelta) merged.treasuryDelta! += imp.treasuryDelta;
    if (imp.fameDelta) merged.fameDelta! += imp.fameDelta;
    if (imp.rosterUpdates) {
      imp.rosterUpdates.forEach((val, key) => { const existing = merged.rosterUpdates!.get(key) || {}; merged.rosterUpdates!.set(key, { ...existing, ...val }); });
    }
    if (imp.newsletterItems) merged.newsletterItems!.push(...imp.newsletterItems);
    if (imp.ledgerEntries) merged.ledgerEntries!.push(...imp.ledgerEntries);
  }
  return merged;
}
