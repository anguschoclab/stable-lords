import { GameState, Warrior, FightOutcome } from "@/types/game";
import { rollForInjury } from "@/engine/injuries";
import { addRestState } from "@/engine/matchmaking/historyLogic";
import { updateEntityInList } from "@/utils/stateUtils";

export function handleInjuries(s: GameState, wA: Warrior, wD: Warrior, outcome: FightOutcome, week: number, rivalStableId?: string) {
  let injured = false;
  const names: string[] = [];
  
  if (outcome.by === "KO") {
    const victimId = outcome.winner === "A" ? wD.id : wA.id;
    s.restStates = addRestState(s.restStates || [], victimId, "KO", week);
  }
  
  const injA = rollForInjury(wA, outcome, "A");
  if (injA) { 
    injured = true; 
    names.push(wA.name); 
    s.roster = updateEntityInList(s.roster, wA.id, w => ({ ...w, injuries: [...(w.injuries || []), injA] }));
  }
  
  if (!rivalStableId) {
    const injD = rollForInjury(wD, outcome, "D");
    if (injD) { 
        injured = true; 
        names.push(wD.name); 
        s.roster = updateEntityInList(s.roster, wD.id, w => ({ ...w, injuries: [...(w.injuries || []), injD] }));
    }
  }
  return { s, injured, injuredNames: names };
}
