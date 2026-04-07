import type { GameState } from "@/types/state.types";
import type { Warrior } from "@/types/warrior.types";
import type { FightOutcome } from "@/types/combat.types";
import { calculateXP, applyXP } from "@/engine/progression";
import { checkDiscovery } from "@/engine/favorites";
import { updateEntityInList } from "@/utils/stateUtils";
import { SeededRNG } from "@/utils/random";
import { generateId } from "@/utils/idUtils";

export function handleProgressions(s: GameState, wA: Warrior, wD: Warrior, outcome: FightOutcome, tags: string[], week: number, rivalStableId?: string, seed?: number): GameState {
  // XP
  const seedA = (seed ?? 0) + 1;
  const seedD = (seed ?? 0) + 2;

  s.roster = updateEntityInList(s.roster, wA.id, w => applyXP(w, calculateXP(outcome, "A", tags), seedA).warrior);
  
  if (!rivalStableId) {
    s.roster = updateEntityInList(s.roster, wD.id, w => applyXP(w, calculateXP(outcome, "D", tags), seedD).warrior);
  }
  
  // Favorites Discovery
  const discRng = new SeededRNG((seed ?? 0) + 3);
  [wA, !rivalStableId ? wD : null].forEach(w => {
    if (!w) return;
    const disc = checkDiscovery(w, () => discRng.next());
    if (disc.updated) {
      s.roster = updateEntityInList(s.roster, w.id, rw => ({ ...rw, favorites: w.favorites }));
      if (disc.hints.length > 0) {
        s.newsletter = [...(s.newsletter || []), { id: generateId(discRng, "newsletter"), week, title: "Training Insight", items: disc.hints }];
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
