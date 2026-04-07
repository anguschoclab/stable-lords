import type { GameState, SeasonalGrowth } from "@/types/state.types";
import type { Warrior, InjuryData } from "@/types/warrior.types";
import { tickInjuries } from "@/engine/injuries";
import { clearExpiredRest } from "@/engine/matchmaking/historyLogic";
import { type StateImpact } from "./impacts";
import { SeededRNG } from "@/utils/random";

/**
 * Health Impact calculation — extracted from the legacy pipeline.
 * Processes injury ticks and recovers rested status.
 */
export function computeHealthImpact(state: GameState): StateImpact {
  const injuryNews: string[] = [];
  const rosterUpdates = new Map<string, Partial<Warrior>>();
  const rng = new SeededRNG(state.week);

  for (const w of state.roster) {
    const updates: Partial<Warrior> = {};
    let changed = false;

    // ── Fatigue Decay (-25 per week) ──
    if (w.fatigue && w.fatigue > 0) {
      updates.fatigue = Math.max(0, w.fatigue - 25);
      changed = true;
    }

    // ── Injury Ticking ──
    const injuryObjects = (w.injuries || []).filter((i): i is InjuryData => typeof i !== "string");
    if (injuryObjects.length > 0) {
      const result = tickInjuries(injuryObjects);
      if (result.healed.length > 0) {
        injuryNews.push(`${w.name} recovered from ${result.healed.join(", ")}.`);
      }
      updates.injuries = result.active;
      changed = true;
    }
    
    if (changed) {
      rosterUpdates.set(w.id, updates);
    }
  }

  return {
    rosterUpdates,
    newsletterItems: injuryNews.length > 0 ? [{ id: new SeededRNG(state.week).uuid("newsletter"), week: state.week, title: "Medical Report", items: injuryNews }] : []
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
