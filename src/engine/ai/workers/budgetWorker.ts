import type { RivalStableData, AIEvent } from "@/types/state.types";

/**
 * BudgetWorker: Handles risk-tiered spending checks.
 * Implements "Risk-Tiered Execution" and "Blocking Budgets".
 */
export type RiskLevel = "Safe" | "Speculative" | "Reckless";

export interface BudgetReport {
  isAffordable: boolean;
  riskTier: AIEvent["riskTier"];
  adjustedTreasury: number;
}

export function checkBudget(
  rival: RivalStableData,
  cost: number,
  category: "STAFF" | "ROSTER" | "OTHER"
): BudgetReport {
  const personality = rival.owner.personality ?? "Pragmatic";
  const burnRate = rival.agentMemory?.burnRate || 0;
  const reserve = 300; // Minimum reserve for upkeep
  
  // ⚡ Risk-Tiered Classification
  let riskTier: AIEvent["riskTier"] = "Low";
  if (cost > 500) riskTier = "High";
  else if (cost > 200) riskTier = "Medium";

  // ⚡ Personality-Based Risk Tolerance
  let tolerance = 1.0;
  if (personality === "Aggressive") tolerance = 1.5;
  if (personality === "Methodical") tolerance = 0.8;
  if (personality === "Pragmatic") tolerance = 1.0;

  const availableTreasury = (rival.treasury || 0) - (reserve + burnRate);
  const isAffordable = cost <= (availableTreasury * tolerance);

  return {
    isAffordable,
    riskTier,
    adjustedTreasury: isAffordable ? (rival.treasury || 0) - cost : (rival.treasury || 0)
  };
}
