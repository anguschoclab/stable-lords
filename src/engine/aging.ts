/**
 * Aging System — warriors age each week and may face forced retirement at old age.
 * 
 * - Warriors age +1 year every 52 weeks (1 game year)
 * - At age 30+, each week there's a growing chance of forced retirement
 * - At age 40, forced retirement is guaranteed
 * - Aging penalties apply to SP and DF after age 28
 */
import type { GameState, Warrior } from "@/types/game";
import { computeWarriorStats } from "./skillCalc";

const WEEKS_PER_YEAR = 52;
const AGING_PENALTY_START = 28;
const FORCED_RETIRE_MIN = 30;
const FORCED_RETIRE_MAX = 40;

/** Process aging for all warriors at week-end. */
export function processAging(state: GameState): GameState {
  const ageEvents: string[] = [];
  let roster = [...state.roster];
  const graveyard = [...state.graveyard];
  const retired = [...state.retired];

  // Age warriors every 52 weeks
  if (state.week % WEEKS_PER_YEAR === 0) {
    roster = roster.map((w) => {
      const newAge = (w.age ?? 18) + 1;
      let updated = { ...w, age: newAge };

      // Apply aging penalties after threshold
      if (newAge > AGING_PENALTY_START) {
        const penalty = Math.floor((newAge - AGING_PENALTY_START) / 3);
        if (penalty > 0) {
          const newAttrs = { ...updated.attributes };
          newAttrs.SP = Math.max(3, newAttrs.SP - (penalty > 0 ? 1 : 0));
          newAttrs.DF = Math.max(3, newAttrs.DF - (penalty > 0 ? 1 : 0));
          if (newAttrs.SP !== updated.attributes.SP || newAttrs.DF !== updated.attributes.DF) {
            const { baseSkills, derivedStats } = computeWarriorStats(newAttrs, updated.style);
            updated = { ...updated, attributes: newAttrs, baseSkills, derivedStats };
            ageEvents.push(`${updated.name} shows signs of aging (SP/DF declining).`);
          }
        }
      }

      return updated;
    });
  }

  // Check for forced retirement
  const toRetire: string[] = [];
  for (const w of roster) {
    const age = w.age ?? 18;
    if (age >= FORCED_RETIRE_MAX) {
      toRetire.push(w.id);
      ageEvents.push(`${w.name} (age ${age}) has been forced to retire — too old to fight.`);
    } else if (age >= FORCED_RETIRE_MIN) {
      const retireChance = (age - FORCED_RETIRE_MIN) / (FORCED_RETIRE_MAX - FORCED_RETIRE_MIN) * 0.15;
      if (Math.random() < retireChance) {
        toRetire.push(w.id);
        ageEvents.push(`${w.name} (age ${age}) has decided to hang up the blade.`);
      }
    }
  }

  if (toRetire.length > 0) {
    for (const id of toRetire) {
      const w = roster.find((r) => r.id === id);
      if (w) {
        retired.push({ ...w, status: "Retired", retiredWeek: state.week });
      }
    }
    roster = roster.filter((w) => !toRetire.includes(w.id));
  }

  const newsletter = ageEvents.length > 0
    ? [...state.newsletter, { week: state.week, title: "Aging Report", items: ageEvents }]
    : state.newsletter;

  return { ...state, roster, retired, graveyard, newsletter };
}
