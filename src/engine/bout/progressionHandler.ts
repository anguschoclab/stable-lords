import type { GameState } from "@/types/state.types";
import type { Warrior } from "@/types/warrior.types";
import type { FightOutcome } from "@/types/combat.types";
import type { IRNGService } from "@/engine/core/rng/IRNGService";
import { calculateXP, applyXP } from "@/engine/progression";
import { checkDiscovery } from "@/engine/favorites";
import { updateEntityInList } from "@/utils/stateUtils";
import { generateId } from "@/utils/idUtils";

export function handleProgressions(s: GameState, wA: Warrior, wD: Warrior, outcome: FightOutcome, tags: string[], week: number, rivalStableId?: string, rng?: IRNGService): GameState {
  // XP
  s.roster = updateEntityInList(s.roster, wA.id, w => applyXP(w, calculateXP(outcome, "A", tags), rng).warrior);

  if (!rivalStableId) {
    s.roster = updateEntityInList(s.roster, wD.id, w => applyXP(w, calculateXP(outcome, "D", tags), rng).warrior);
  }
  
  // Favorites Discovery
  const discRng = rng;
  [wA, !rivalStableId ? wD : null].forEach(w => {
    if (!w) return;
    const disc = checkDiscovery(w, () => discRng ? discRng.next() : Math.random());
    if (disc.updated) {
      s.roster = updateEntityInList(s.roster, w.id, rw => ({ ...rw, favorites: w.favorites }));
      if (disc.hints.length > 0) {
        s.newsletter = [...(s.newsletter || []), { id: discRng ? discRng.uuid() : generateId(undefined, "newsletter"), week, title: "Training Insight", items: disc.hints }];
      }
    }
  });

  // Upset / Giant Killer Flair
  if (outcome.winner) {
    const winner = outcome.winner === "A" ? wA : wD;
    const loser = outcome.winner === "A" ? wD : wA;
    if (loser.fame >= (winner.fame || 0) + 10 && (loser.fame || 0) >= (winner.fame || 0) * 2 && !winner.flair.includes("Giant Killer")) {
       s.roster = updateEntityInList(s.roster, winner.id, rw => ({ ...rw, flair: [...rw.flair, "Giant Killer"] }));
    }
  }
  return s;
}
