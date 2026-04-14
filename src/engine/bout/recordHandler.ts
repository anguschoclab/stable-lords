import type { GameState, RivalStableData } from "@/types/state.types";
import type { Warrior } from "@/types/warrior.types";
import type { FightOutcome } from "@/types/combat.types";
import { updateEntityInList } from "@/utils/stateUtils";
import { addMatchRecord } from "@/engine/matchmaking/historyLogic";
import { StateImpact } from "@/engine/impacts";

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
    flair: win && tags.includes("Flashy") ? Array.from(new Set([...(w.flair || []), "Flashy"])) : w.flair,
  });

  rosterUpdates.set(wA.id, updateW(wA, fameA, popA, outcome.winner === "A", outcome.winner === "A" && outcome.by === "Kill"));
  
  if (!rivalStableId) {
    rosterUpdates.set(wD.id, updateW(wD, fameD, popD, outcome.winner === "D", outcome.winner === "D" && outcome.by === "Kill"));
  } else {
    const rival = (s.rivals || []).find(r => r.owner.id === rivalStableId);
    if (rival) {
      const updatedRoster = updateEntityInList(rival.roster, wD.id, w => updateW(w, fameD, 0, outcome.winner === "D", outcome.winner === "D" && outcome.by === "Kill"));
      rivalsUpdates.set(rivalStableId, { roster: updatedRoster });
    }
  }
  
  const impact: StateImpact = { rosterUpdates, rivalsUpdates };
  return impact;
}
