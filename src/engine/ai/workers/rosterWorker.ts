import type { RivalStableData } from "@/types/state.types";
import type { Warrior } from "@/types/warrior.types";
import type { Season } from "@/types/shared.types";
import { checkBudget } from "./budgetWorker";
import { computeWarriorStats } from "../../skillCalc";
import { logAgentAction, type AgentContext } from "../agentCore";
import type { IRNGService } from "@/engine/core/rng";
import { SeededRNGService } from "@/engine/core/rng";

/**
 * RosterWorker: Handles training and equipment.
 * Implements "Risk-Tiered Execution" for gear.
 */
export function processRoster(
  rival: RivalStableData,
  currentWeek: number,
  season?: Season,
  seed?: number,
  rng?: IRNGService,
  context?: AgentContext
): RivalStableData {
  const rngService = rng || new SeededRNGService(seed ?? (currentWeek * 7919 + 101));
  let updatedRival = { ...rival };
  const activeRoster = updatedRival.roster.filter(w => w.status === "Active");
  const intent = updatedRival.strategy?.intent ?? "CONSOLIDATION";

  // 1. Training (Low Risk)
  // ⚡ TSA: Prioritize Champion or high-fame units for training
  const trainingLimit = updatedRival.treasury > 500 ? 3 : 1;
  const trainees = activeRoster
    .sort((a, b) => (a.fame || 0) - (b.fame || 0))
    .slice(0, trainingLimit);
  
  for (const trainee of trainees) {
    const trainingCost = 35;
    const budgetReport = checkBudget(updatedRival, trainingCost, "ROSTER");
    
    if (budgetReport.isAffordable) {
      updatedRival.treasury -= trainingCost;
      updatedRival.roster = updatedRival.roster.map(w => w.id === trainee.id ? performAITraining(w, season) : w);
    }
  }

  // 2. Equipment (High Risk)
  if (intent === "EXPANSION" || (intent === "VENDETTA" && updatedRival.treasury > 1000)) {
    const gearCost = 150;
    const budgetReport = checkBudget(updatedRival, gearCost, "ROSTER");
    
    if (budgetReport.isAffordable) {
      // ⚡ TSA: Role-Based Gearing (Prioritize Champion or the 'Muddy' Basher for rain insurance)
      const gearCandidate = activeRoster.find(w => w.champion) || 
                          activeRoster.find(w => w.style === "BASHING ATTACK") ||
                          rngService.pick(activeRoster);

      if (gearCandidate) {
        updatedRival.treasury -= gearCost;
        updatedRival.roster = updatedRival.roster.map(w => w.id === gearCandidate.id ? applyGearUpgrade(w, rngService) : w);
        updatedRival = logAgentAction(updatedRival, "ROSTER", `Invested 150g in gear for ${gearCandidate.name}.`, budgetReport.riskTier, currentWeek);
      }
    }
  }

  return updatedRival;
}

function applyGearUpgrade(w: Warrior, rng: IRNGService): Warrior {
  const keys = (Object.keys(w.attributes) as (keyof typeof w.attributes)[]).filter(k => k !== "SZ");
  const newAttrs = { ...w.attributes };
  for (let i = 0; i < 2; i++) {
    const key = rng.pick(keys);
    if (newAttrs[key] < 25) newAttrs[key]++;
  }
  const { baseSkills, derivedStats } = computeWarriorStats(newAttrs, w.style);
  return { ...w, attributes: newAttrs, baseSkills, derivedStats };
}

function performAITraining(w: Warrior, season?: Season): Warrior {
  const keys = (Object.keys(w.attributes) as (keyof typeof w.attributes)[]).filter(k => k !== "SZ");
  
  // ⚡ TSA: Seasonal Priority Training
  let chosen: keyof typeof w.attributes | undefined;
  if (season === "Spring") chosen = "CN"; // Prep for Summer heat
  else if (season === "Summer") chosen = "ST"; // Maintain endurance
  
  // Fallback to lowest stat if no seasonal priority or stat capped
  if (!chosen || w.attributes[chosen] >= 25) {
    const sorted = keys.sort((a, b) => w.attributes[a] - w.attributes[b]);
    chosen = sorted[0];
  }

  if (w.attributes[chosen] < 25) {
    const newAttrs = { ...w.attributes, [chosen]: w.attributes[chosen] + 1 };
    const { baseSkills, derivedStats } = computeWarriorStats(newAttrs, w.style);
    return { ...w, attributes: newAttrs, baseSkills, derivedStats };
  }
  return w;
}
