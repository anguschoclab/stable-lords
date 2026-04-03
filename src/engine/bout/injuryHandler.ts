import { GameState, Warrior, FightOutcome, RivalStableData } from "@/types/game";
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
  
  // 1. Process Warrior A (Usually Player, but let's be safe)
  const injA = rollForInjury(wA, outcome, "A");
  if (injA) { 
    injured = true; 
    names.push(wA.name); 
    const isPlayer = s.roster.some(w => w.id === wA.id);
    if (isPlayer) {
      s.roster = updateEntityInList(s.roster, wA.id, w => ({ ...w, injuries: [...(w.injuries || []), injA] }));
    } else if (rivalStableId) {
      s.rivals = (s.rivals || []).map(r => r.owner.id === rivalStableId
        ? { ...r, roster: updateEntityInList(r.roster, wA.id, w => ({ ...w, injuries: [...(w.injuries || []), injA] })) }
        : r);
    }
  }
  
  // 2. Process Warrior D (Usually Rival)
  const injD = rollForInjury(wD, outcome, "D");
  if (injD) { 
    injured = true; 
    names.push(wD.name); 
    const isPlayer = s.roster.some(w => w.id === wD.id);
    if (isPlayer) {
      s.roster = updateEntityInList(s.roster, wD.id, w => ({ ...w, injuries: [...(w.injuries || []), injD] }));
    } else if (rivalStableId) {
      s.rivals = (s.rivals || []).map(r => r.owner.id === rivalStableId
        ? { ...r, roster: updateEntityInList(r.roster, wD.id, w => ({ ...w, injuries: [...(w.injuries || []), injD] })) }
        : r);
    }
  }

  return { s, injured, injuredNames: names };
}
