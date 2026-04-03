import { GameState, Warrior, FightOutcome } from "@/types/game";
import { updateEntityInList } from "@/utils/stateUtils";
import { addMatchRecord } from "@/engine/matchmaking/historyLogic";

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
): GameState {
  const updateW = (w: Warrior, f: number, p: number, win: boolean, kill: boolean) => ({
    ...w, 
    fame: Math.max(0, (w.fame || 0) + f), 
    popularity: Math.max(0, (w.popularity || 0) + p),
    career: { 
      ...w.career, 
      wins: (w.career.wins || 0) + (win ? 1 : 0), 
      losses: (w.career.losses || 0) + (!win ? 1 : 0), 
      kills: (w.career.kills || 0) + (kill ? 1 : 0) 
    },
    flair: win && tags.includes("Flashy") ? Array.from(new Set([...w.flair, "Flashy"])) : w.flair,
  });

  s.roster = updateEntityInList(s.roster, wA.id, w => updateW(w, fameA, popA, outcome.winner === "A", outcome.winner === "A" && outcome.by === "Kill"));
  
  if (!rivalStableId) {
    s.roster = updateEntityInList(s.roster, wD.id, w => updateW(w, fameD, popD, outcome.winner === "D", outcome.winner === "D" && outcome.by === "Kill"));
  } else {
    s.rivals = (s.rivals || []).map(r => r.owner.id === rivalStableId 
      ? { ...r, roster: updateEntityInList(r.roster, wD.id, w => updateW(w, fameD, 0, outcome.winner === "D", outcome.winner === "D" && outcome.by === "Kill")) } 
      : r);
    s.matchHistory = addMatchRecord(s.matchHistory || [], wA.id, wD.id, rivalStableId, s.week);
  }
  
  return s;
}
