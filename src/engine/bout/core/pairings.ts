import { GameState, Warrior } from "@/types/game";
import { isFightReady } from "@/engine/warriorStatus";
import { generateMatchCard } from "@/engine/matchmaking/bracketEngine";

export interface BoutPairing {
  a: Warrior;
  d: Warrior;
  isRivalry: boolean;
  rivalStable?: string;
  rivalStableId?: string;
}

export function generatePairings(state: GameState): BoutPairing[] {
  const matchCard = generateMatchCard(state);
  if (matchCard.length > 0) {
    return matchCard.map(mp => ({
      a: mp.playerWarrior,
      d: mp.rivalWarrior,
      isRivalry: mp.isRivalryBout,
      rivalStable: mp.rivalStable.owner.stableName,
      rivalStableId: mp.rivalStable.owner.id,
    }));
  }

  const activeWarriors = state.roster.filter(w => isFightReady(w));
  const pairings: BoutPairing[] = [];
  const pairedIds = new Set<string>();
  for (let i = 0; i < activeWarriors.length; i++) {
    if (pairedIds.has(activeWarriors[i].id)) continue;
    for (let j = i + 1; j < activeWarriors.length; j++) {
      if (pairedIds.has(activeWarriors[j].id) || activeWarriors[i].stableId === activeWarriors[j].stableId) continue;
      pairings.push({ a: activeWarriors[i], d: activeWarriors[j], isRivalry: false });
      pairedIds.add(activeWarriors[i].id);
      pairedIds.add(activeWarriors[j].id);
      break;
    }
  }
  return pairings;
}
