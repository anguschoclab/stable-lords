import { type RivalStableData, type PoolWarrior, type Warrior } from "@/types/state.types";
import { PERSONALITY_STYLE_PREFS } from "@/data/ownerData";
import { SeededRNG } from "@/utils/random";
import { generateId } from "@/utils/idUtils";
import { logAgentAction } from "../agentCore";
import { checkBudget } from "./budgetWorker";
import { computeMetaDrift } from "../../metaDrift";

/**
 * RecruitmentWorker: Handles drafting warriors from the pool.
 * Implements "Context Isolation" and "Risk-Tiered Execution".
 */
export function processRecruitment(
  rival: RivalStableData,
  pool: PoolWarrior[],
  week: number,
  rng: SeededRNG,
  isMajorDraftWeek: boolean,
  meta: Record<string, number> = {}
): { updatedRival: RivalStableData; updatedPool: PoolWarrior[]; gazetteItems: string[] } {
  let updatedRival = { ...rival };
  const gazetteItems: string[] = [];
  const remainingPool = [...pool];
  
  const intent = updatedRival.strategy?.intent ?? "CONSOLIDATION";
  const activeCount = updatedRival.roster.filter(w => w.status === "Active").length;
  
  // 1. Check Recruitment Chance
  const maxRoster = updatedRival.owner.personality === "Aggressive" ? 10 : 8;
  if (activeCount >= maxRoster || remainingPool.length === 0) {
    return { updatedRival, updatedPool: remainingPool, gazetteItems };
  }

  const intentBonus = intent === "EXPANSION" ? 0.6 : 0;
  const willRecruit = isMajorDraftWeek || (activeCount < 4 && rng.chance(0.3 + intentBonus)) || (rng.chance(0.05 + intentBonus));
  
  if (!willRecruit) {
    return { updatedRival, updatedPool: remainingPool, gazetteItems };
  }

  // 2. Score Candidates (Personality Alignment)
  const personality = updatedRival.owner.personality ?? "Pragmatic";
  const prefs = PERSONALITY_STYLE_PREFS[personality] || [];
  const prefsSet = new Set(prefs);

  let bestIdx = -1;
  let bestScore = -Infinity;
  
  for (let i = 0; i < remainingPool.length; i++) {
    const w = remainingPool[i];
    let score = 0;
    if (w.tier === "Prodigy") score += 100;
    if (w.tier === "Exceptional") score += 50;
    if (w.tier === "Promising") score += 20;
    if (prefsSet.has(w.style)) score += 30;
    
    // ⚡ TSA: Meta-Fit Scoring
    const drift = meta[w.style] || 0;
    score += drift * 5; // Reward styles that are trending up

    // ⚡ TSA: Style Diversity Guard
    const styleCount = updatedRival.roster.filter(r => r.status === "Active" && r.style === w.style).length;
    if (styleCount > 0) {
      score -= styleCount * 15; // Penalize duplicates to avoid "Weather Fragility"
    }

    const weeksAvailable = week - w.addedWeek;
    score += weeksAvailable * 10; 

    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  // 3. Risk-Tiered Budget Check & Finalizing Recruit
  if (bestIdx >= 0 && (bestScore > 30 || isMajorDraftWeek)) {
    const recruit = remainingPool[bestIdx];
    const cost = recruit.tier === "Prodigy" ? 400 : recruit.tier === "Exceptional" ? 250 : 100;
    
    // ⚡ Lead Agent Verification: Check budget before signing
    const budgetReport = checkBudget(updatedRival, cost, "ROSTER");
    
    if (budgetReport.isAffordable) {
      updatedRival.treasury -= cost;
      remainingPool.splice(bestIdx, 1);

      const newWarrior: Warrior = {
        id: generateId(rng, "warrior"),
        name: recruit.name,
        style: recruit.style,
        attributes: { ...recruit.attributes },
        potential: { ...recruit.potential },
        baseSkills: { ...recruit.baseSkills },
        derivedStats: { ...recruit.derivedStats },
        fame: 10,
        popularity: 5,
        titles: [],
        injuries: [],
        flair: [],
        career: { wins: 0, losses: 0, kills: 0 },
        champion: false,
        status: "Active",
        age: recruit.age,
        stableId: updatedRival.owner.id,
      };

      updatedRival.roster = [...updatedRival.roster, newWarrior];
      updatedRival = logAgentAction(updatedRival, "ROSTER", `Signed ${recruit.tier} warrior ${recruit.name} for ${cost}g.`, budgetReport.riskTier, week);
      gazetteItems.push(`📣 MARKET: ${updatedRival.owner.stableName} signed ${recruit.tier} ${recruit.name} for ${cost}g.`);
    }
  }

  return { updatedRival, updatedPool: remainingPool, gazetteItems };
}
