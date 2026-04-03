import { GameState, Warrior } from "@/types/game";
import { updateEntityInList } from "@/utils/stateUtils";
import type { StateImpact } from "../index";

export type ImpactHandler = (state: GameState, value: any) => void;

export const impactHandlers: Record<keyof StateImpact, ImpactHandler> = {
  goldDelta: (state, value: number) => { state.gold = (state.gold ?? 0) + value; },
  fameDelta: (state, value: number) => { state.fame = (state.fame ?? 0) + value; },
  rosterUpdates: (state, value: Map<string, Partial<Warrior>>) => {
    value.forEach((update, id) => { state.roster = updateEntityInList(state.roster, id, (w) => ({ ...w, ...update })); });
  },
  newsletterItems: (state, value: any[]) => { state.newsletter = [...state.newsletter, ...value]; },
  ledgerEntries: (state, value: any[]) => { state.ledger = [...(state.ledger ?? []), ...value]; },
  newPoolRecruits: () => { }
};
