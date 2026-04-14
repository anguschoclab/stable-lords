import type { RivalStableData, GameState, Trainer } from "@/types/state.types";
import type { WeatherType } from "@/types/shared.types";
import { type CrowdMood } from "../../crowdMood";
import { checkBudget } from "./budgetWorker";
import { logAgentAction, type AgentContext } from "../agentCore";

const SALARY: Record<string, number> = { Novice: 10, Seasoned: 25, Master: 75 };
const HIRE_COST: Record<string, number> = { Novice: 50, Seasoned: 100, Master: 200 };

/**
 * StaffWorker: Handles hiring and firing of trainers.
 * Implements "Risk-Tiered Execution" for staffing.
 */
export function processStaff(
  rival: RivalStableData,
  state: GameState,
  hiringPool: Trainer[],
  context?: AgentContext
): { updatedRival: RivalStableData; gazetteItems: string[]; updatedHiringPool: Trainer[] } {
  let updatedRival = { ...rival };
  const currentTrainers = [...(updatedRival.trainers || [])];
  let currentTreasury = updatedRival.treasury;
  let currentPool = [...hiringPool];
  const gazetteItems: string[] = [];
  
  const intent = updatedRival.strategy?.intent ?? "CONSOLIDATION";
  const week = state.week;

  // 1. Hiring logic (Medium/High Risk)
  if (intent !== "RECOVERY" && currentTrainers.length < 2 && currentPool.length > 0) {
    const affordable = currentPool.filter(t => HIRE_COST[t.tier] < (currentTreasury - 300));
    if (affordable.length > 0) {
      // ⚡ Bolt: Reduced O(N log N) sort to O(N) reduction to find the highest cost trainer
      const best = affordable.reduce((max, current) =>
        HIRE_COST[current.tier] > HIRE_COST[max.tier] ? current : max
      , affordable[0]);
      const budgetReport = checkBudget(updatedRival, HIRE_COST[best.tier], "STAFF");

      if (budgetReport.isAffordable) {
        currentTreasury -= HIRE_COST[best.tier];
        currentTrainers.push(best);
        currentPool = currentPool.filter(t => t.id !== best.id);
        
        updatedRival = { ...updatedRival, treasury: currentTreasury, trainers: currentTrainers };
        updatedRival = logAgentAction(updatedRival, "STAFF", `Hired trainer ${best.name} (${best.tier}).`, budgetReport.riskTier, week);
        gazetteItems.push(`👔 STAFF: ${updatedRival.owner.stableName} hired ${best.name} (${best.tier}) to lead their training camp.`);
      }
    }
  }

  // 2. Firing logic (RECOVERY Tier + Regional Risk)
  const isSolemn = state.crowdMood === "Solemn";
  const isRainy = state.weather === "Rainy";
  const underPressure = currentTreasury < 500 && (isSolemn || isRainy);

  if (intent === "RECOVERY" || currentTreasury < 100 || underPressure) {
    if (currentTrainers.length > 0) {
      const fired = currentTrainers.pop()!;
      updatedRival = { ...updatedRival, treasury: currentTreasury, trainers: currentTrainers };
      const riskReason = isSolemn ? "solemn crowd dampening income" : isRainy ? "stormy weather risks" : "budget constraints";
      updatedRival = logAgentAction(updatedRival, "STAFF", `Released trainer ${fired.name} due to ${riskReason}.`, "Low", week);
      gazetteItems.push(`📉 DOWNSIZING: ${updatedRival.owner.stableName} has released trainer ${fired.name} due to ${riskReason}.`);
    }
  }

  return { updatedRival, gazetteItems, updatedHiringPool: currentPool };
}
