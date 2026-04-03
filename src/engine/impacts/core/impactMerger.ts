import type { StateImpact } from "../index";

export function mergeImpacts(impacts: StateImpact[]): StateImpact {
  const merged: StateImpact = { goldDelta: 0, fameDelta: 0, rosterUpdates: new Map(), newsletterItems: [], ledgerEntries: [] };
  for (const imp of impacts) {
    if (imp.goldDelta) merged.goldDelta! += imp.goldDelta;
    if (imp.fameDelta) merged.fameDelta! += imp.fameDelta;
    if (imp.rosterUpdates) {
      imp.rosterUpdates.forEach((val, key) => { const existing = merged.rosterUpdates!.get(key) || {}; merged.rosterUpdates!.set(key, { ...existing, ...val }); });
    }
    if (imp.newsletterItems) merged.newsletterItems!.push(...imp.newsletterItems);
    if (imp.ledgerEntries) merged.ledgerEntries!.push(...imp.ledgerEntries);
  }
  return merged;
}
