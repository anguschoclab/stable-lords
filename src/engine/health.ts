import { type GameState, type Warrior, type InjuryData } from "@/types/game";
import { tickInjuries } from "@/engine/injuries";
import { clearExpiredRest } from "@/engine/matchmaking";
import { type StateImpact } from "./impacts";

/**
 * Health Impact calculation — extracted from the legacy pipeline.
 * Processes injury ticks and recovers rested status.
 */
export function computeHealthImpact(state: GameState): StateImpact {
  const injuryNews: string[] = [];
  const rosterUpdates = new Map<string, Partial<Warrior>>();

  for (const w of state.roster) {
    const injuryObjects = (w.injuries || []).filter((i): i is InjuryData => typeof i !== "string");
    if (injuryObjects.length === 0) continue;
    
    const result = tickInjuries(injuryObjects);
    if (result.healed.length > 0) {
      injuryNews.push(`${w.name} recovered from ${result.healed.join(", ")}.`);
    }
    
    // Always update the roster with the new injury state (decremented weeksRemaining or empty)
    rosterUpdates.set(w.id, { injuries: result.active });
  }

  return {
    rosterUpdates,
    newsletterItems: injuryNews.length > 0 ? [{ week: state.week, title: "Medical Report", items: injuryNews }] : []
  };
}

export const applyHealthUpdates: (state: GameState) => GameState = (state) => {
  const impact = computeHealthImpact(state);
  let roster = [...state.roster];
  
  if (impact.rosterUpdates) {
    impact.rosterUpdates.forEach((update, id) => {
      roster = roster.map(w => w.id === id ? { ...w, ...update } : w);
    });
  }

  const s = { 
    ...state, 
    roster,
    restStates: clearExpiredRest(state.restStates || [], state.week)
  };

  if (impact.newsletterItems && impact.newsletterItems.length > 0) {
    s.newsletter = [...(s.newsletter || []), ...impact.newsletterItems];
  }

  return s;
};
