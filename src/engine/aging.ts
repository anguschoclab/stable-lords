/**
 * Aging System — warriors age each week and may face forced retirement at old age.
 * 
 * - Warriors age +1 year every 52 weeks (1 game year)
 * - At age 30+, each week there's a growing chance of forced retirement
 * - At age 40, forced retirement is guaranteed
 * - Aging penalties apply to SP and DF after age 28
 */
import type { GameState } from "@/types/state.types";
import type { Warrior, WarriorStatus } from "@/types/warrior.types";
import { computeWarriorStats } from "./skillCalc";

const WEEKS_PER_YEAR = 52;
const AGING_PENALTY_START = 28;
const FORCED_RETIRE_MIN = 30;
const FORCED_RETIRE_MAX = 40;

import { type StateImpact } from "./impacts";
import type { IRNGService } from "@/engine/core/rng";
import { SeededRNGService } from "@/engine/core/rng";

/** Compute the aging impact of the current week. */
export function computeAgingImpact(state: GameState, rng: IRNGService): StateImpact {
  const ageEvents: string[] = [];
  const rosterUpdates = new Map<string, Partial<Warrior>>();
  const toRetire: string[] = [];

  // Age warriors every 52 weeks
  if (state.week % WEEKS_PER_YEAR === 0) {
    for (const w of state.roster) {
      const newAge = (w.age ?? 18) + 1;
      const update: Partial<Warrior> = { age: newAge };

      if (newAge > AGING_PENALTY_START) {
        const penalty = Math.floor((newAge - AGING_PENALTY_START) / 3);
        if (penalty > 0) {
           const newAttrs = { ...w.attributes, 
             SP: Math.max(3, w.attributes.SP - 1), 
             DF: Math.max(3, w.attributes.DF - 1) 
           };
           const { baseSkills, derivedStats } = computeWarriorStats(newAttrs, w.style);
           Object.assign(update, { attributes: newAttrs, baseSkills, derivedStats });
           ageEvents.push(`${w.name} shows signs of aging (SP/DF declining).`);
        }
      }
      rosterUpdates.set(w.id, update);
    }
  }

  // Check for forced retirement
  for (const w of state.roster) {
    const age = (rosterUpdates.get(w.id)?.age ?? w.age) ?? 18;
    if (age >= FORCED_RETIRE_MAX) {
      toRetire.push(w.id);
      ageEvents.push(`${w.name} (age ${age}) has been forced to retire — too old to fight.`);
    } else if (age >= FORCED_RETIRE_MIN) {
      const retireChance = (age - FORCED_RETIRE_MIN) / (FORCED_RETIRE_MAX - FORCED_RETIRE_MIN) * 0.15;
      if (rng.next() < retireChance) {
        toRetire.push(w.id);
        ageEvents.push(`${w.name} (age ${age}) has decided to hang up the blade.`);
      }
    }
  }

  // Handle retirement in impacts (Simplified for now - can refine graveyard movement later)
  if (toRetire.length > 0) {
    toRetire.forEach(id => {
       const existing = rosterUpdates.get(id) || {};
       rosterUpdates.set(id, { ...existing, status: "Retired" as WarriorStatus }); 
    });
  }

  return {
    rosterUpdates,
    newsletterItems: ageEvents.length > 0 ? [{ id: rng.uuid(), week: state.week, title: "Aging Report", items: ageEvents }] : []
  };
}

/** Process aging for all warriors at week-end. Legacy wrapper. */
export function processAging(state: GameState): GameState {
  const rng = new SeededRNGService(state.week * 997 + 3);
  const impact = computeAgingImpact(state, rng);
  let roster = [...state.roster];
  const retired = [...state.retired];

  if (impact.rosterUpdates) {
    impact.rosterUpdates.forEach((update, id) => {
       const w = roster.find(r => r.id === id);
       if (w) {
         const updated = { ...w, ...update };
         if (updated.status === "Retired") {
            roster = roster.filter(r => r.id !== id);
            retired.push({ ...updated, retiredWeek: state.week });
         } else {
            roster = roster.map(r => r.id === id ? updated : r);
         }
       }
    });
  }

  return { 
    ...state, 
    roster, 
    retired, 
    newsletter: impact.newsletterItems ? [...state.newsletter, ...impact.newsletterItems] : state.newsletter 
  };
}
