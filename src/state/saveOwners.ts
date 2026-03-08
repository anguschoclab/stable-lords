/**
 * Persistence helpers for Owners — localStorage-backed.
 */
import type { OwnerPersonality } from "@/types/game";

export type OwnerPersist = {
  id: string;
  name: string;
  stableName: string;
  fame: number;
  renown: number;
  titles: number;
  personality?: OwnerPersonality;
};

const KEY = "sl.owners.v1";

export function loadOwners(): OwnerPersist[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveOwners(list: OwnerPersist[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

export function upsertOwner(owner: OwnerPersist) {
  const list = loadOwners();
  const idx = list.findIndex((o) => o.id === owner.id);
  if (idx >= 0) list[idx] = owner;
  else list.push(owner);
  saveOwners(list);
}

export function bumpOwnerFame(id: string, amt: number) {
  const list = loadOwners();
  const o = list.find((x) => x.id === id);
  if (o) {
    o.fame = Math.max(0, (o.fame || 0) + amt);
    saveOwners(list);
  }
}

export function bumpOwnerRenown(id: string, amt: number) {
  const list = loadOwners();
  const o = list.find((x) => x.id === id);
  if (o) {
    o.renown = Math.max(0, (o.renown || 0) + amt);
    saveOwners(list);
  }
}

export function addOwnerTitle(id: string) {
  const list = loadOwners();
  const o = list.find((x) => x.id === id);
  if (o) {
    o.titles = (o.titles || 0) + 1;
    saveOwners(list);
  }
}
