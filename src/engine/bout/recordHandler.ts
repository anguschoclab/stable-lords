import type { GameState, RivalStableData } from "@/types/state.types";
import type { Warrior } from "@/types/warrior.types";
import type { FightOutcome } from "@/types/combat.types";
import { updateEntityInList } from "@/utils/stateUtils";
import { StateImpact } from "@/engine/impacts";
import { updateWarriorAfterBout } from "./warriorStateUpdater";

export function applyRecords(
  s: GameState, 
  wA: Warrior, 
  wD: Warrior, 
  outcome: FightOutcome, 
  tags: string[], 
  fameA: number, 
  popA: number, 
  fameD: number, 
  popD: number, 
  rivalStableId?: string
): StateImpact {
  const rosterUpdates = new Map<string, Partial<Warrior>>();
  const rivalsUpdates = new Map<string, Partial<RivalStableData>>();

  rosterUpdates.set(wA.id, updateWarriorAfterBout(wA, fameA, popA, outcome.winner === "A", outcome.winner === "A" && outcome.by === "Kill", tags));

  if (!rivalStableId) {
    rosterUpdates.set(wD.id, updateWarriorAfterBout(wD, fameD, popD, outcome.winner === "D", outcome.winner === "D" && outcome.by === "Kill", tags));
  } else {
    const rival = (s.rivals || []).find(r => r.owner.id === rivalStableId);
    if (rival) {
      const updatedRoster = updateEntityInList(rival.roster, wD.id, w => updateWarriorAfterBout(w, fameD, 0, outcome.winner === "D", outcome.winner === "D" && outcome.by === "Kill", tags));
      rivalsUpdates.set(rivalStableId, { roster: updatedRoster });
    }
  }
  
  const impact: StateImpact = { rosterUpdates, rivalsUpdates };
  return impact;
}
