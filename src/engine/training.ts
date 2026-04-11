import type { GameState, SeasonalGrowth } from "@/types/state.types";
import type { Warrior, InjuryData } from "@/types/warrior.types";
import type { IRNGService } from "@/engine/core/rng";
import { SeededRNGService } from "@/engine/core/rng";
import { updateEntityInList } from "@/utils/stateUtils";
import { type StateImpact } from "./impacts";
import { 
  computeGainChance, 
  processRecovery, 
  processAttributeTraining, 
  rollForTrainingInjury, 
  type TrainingResult 
} from "./training/trainingGains";
import { getHealingTrainerBonus } from "./training/coachLogic";

// ─── Exports for backward compatibility ───
export { computeGainChance };

export interface TrainingImpact {
  updatedRoster: Warrior[];
  updatedSeasonalGrowth: SeasonalGrowth[];
  results: TrainingResult[];
}

/**
 * Compute the impact of training assignments for the current week.
 * Returns a pure impact object without modifying game state directly.
 */
export function computeTrainingImpact(state: GameState, rng: IRNGService): TrainingImpact {
  if (!state.trainingAssignments || state.trainingAssignments.length === 0) {
    return { updatedRoster: state.roster, updatedSeasonalGrowth: state.seasonalGrowth ?? [], results: [] };
  }

  const results: TrainingResult[] = [];
  let currentRoster = [...state.roster];
  let seasonalGrowth = [...(state.seasonalGrowth ?? [])];
  const healingBonus = getHealingTrainerBonus(state.trainers ?? []);

  for (const assignment of state.trainingAssignments) {
    const warrior = currentRoster.find(w => w.id === assignment.warriorId);
    if (!warrior) continue;

    // ── Recovery Mode ──
    if (assignment.type === "recovery") {
      const { updatedInjuries, message } = processRecovery(warrior, healingBonus);
      currentRoster = updateEntityInList(currentRoster, warrior.id, w => ({ 
        ...w, 
        injuries: updatedInjuries as InjuryData[] 
      }));
      results.push({ type: "recovery", warriorId: warrior.id, message });
      continue;
    }

    // ── Attribute Training ──
    const attr = assignment.attribute;
    if (!attr) continue;

    const { updatedWarrior, updatedSeasonalGrowth, result, hardCapped } = processAttributeTraining(warrior, attr, state, seasonalGrowth, rng);

    if (result.message !== "") {
      results.push(result);
    }

    if (updatedWarrior) {
      currentRoster = updateEntityInList(currentRoster, warrior.id, () => updatedWarrior);
    }

    if (updatedSeasonalGrowth) {
      seasonalGrowth = updatedSeasonalGrowth;
    }

    // Skip injury rolls if training was blocked/capped
    if (hardCapped || (result.type === "blocked" && result.message !== "")) {
      continue;
    }

    // ── Training Injury Roll ──
    const { injury, result: injuryResult } = rollForTrainingInjury(updatedWarrior || warrior, healingBonus, rng);
    if (injury && injuryResult) {
      currentRoster = updateEntityInList(currentRoster, warrior.id, w => ({ 
        ...w, 
        injuries: [...w.injuries, injury] as InjuryData[] 
      }));
      results.push(injuryResult);
    }
  }

  return { updatedRoster: currentRoster, updatedSeasonalGrowth: seasonalGrowth, results };
}

export function processTraining(state: GameState): GameState {
  const rngService = new SeededRNGService(state.week * 555 + 1);
  const impact = computeTrainingImpact(state, rngService);
  const { impact: stateImpact, seasonalGrowth } = trainingImpactToStateImpact(state, impact, rngService);
  
  const newState = { ...state, seasonalGrowth, trainingAssignments: [] };
  if (stateImpact.newsletterItems) {
    newState.newsletter = [...newState.newsletter, ...stateImpact.newsletterItems];
  }
  
  stateImpact.rosterUpdates?.forEach((update: Partial<Warrior>, id: string) => {
    newState.roster = updateEntityInList(newState.roster, id, w => ({ ...w, ...update }));
  });

  return newState;
}

/**
 * Convert a TrainingImpact to a generic StateImpact for the pipeline.
 */
export function trainingImpactToStateImpact(
  state: GameState,
  impact: TrainingImpact,
  rng: IRNGService
): { impact: StateImpact; seasonalGrowth: SeasonalGrowth[]; results: TrainingResult[] } {
  const rosterUpdates = new Map<string, Partial<Warrior>>();
  
  impact.updatedRoster.forEach(w => {
    const original = state.roster.find(r => r.id === w.id);
    if (original && original !== w) {
      // 🛠️ 1.0 Hardening: Return ONLY changed fields to avoid overwriting Aging/Health passes
      const delta: Partial<Warrior> = {
        baseSkills: w.baseSkills,
        derivedStats: w.derivedStats,
        fatigue: w.fatigue ?? 0,
        injuries: w.injuries,
      };
      
      rosterUpdates.set(w.id, delta);
    }
  });

  const newsItems = impact.results
    .filter(r => r.type !== "blocked")
    .map(r => r.message);

  return {
    impact: {
      rosterUpdates,
      newsletterItems: newsItems.length > 0 ? [{
        id: rng.uuid("newsletter"), // 🆔 Schema compliance: add ID
        week: state.week,
        title: "Training Report",
        items: newsItems
      }] : []
    },
    seasonalGrowth: impact.updatedSeasonalGrowth,
    results: impact.results
  };
}
