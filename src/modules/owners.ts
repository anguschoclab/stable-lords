/**
 * Owners module — scoring owners by Fame / Renown / Titles.
 */
import type { Owner } from "@/types/game";

export type OwnerScore = {
  id: string;
  score: number;
  rank: number;
};

export function computeOwnerScore(o: Owner): number {
  return o.fame * 1.25 + o.renown * 1.0 + o.titles * 10;
}

export function rankOwners(owners: Owner[]): OwnerScore[] {
  const scored = owners.map((o) => ({ id: o.id, score: computeOwnerScore(o) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s, i) => ({ ...s, rank: i + 1 }));
}
