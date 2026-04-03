import { Warrior, LedgerEntry } from "@/types/game";

export interface StateImpact {
  goldDelta?: number;
  fameDelta?: number;
  rosterUpdates?: Map<string, Partial<Warrior>>;
  newsletterItems?: { week: number; title: string; items: string[] }[];
  ledgerEntries?: LedgerEntry[];
  newPoolRecruits?: any[];
}

export { resolveImpacts } from "./services/impactService";
export { mergeImpacts } from "./core/impactMerger";
