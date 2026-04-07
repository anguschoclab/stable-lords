import { type RivalStableData, type PoolWarrior, type GameState } from "@/types/state.types";
import { SeededRNG } from "@/utils/random";
import { processRecruitment } from "./ai/workers/recruitmentWorker";
import { computeMetaDrift } from "./metaDrift";

/**
 * AI Draft Service
 * Refactored to delegate to isolated RecruitmentWorkers.
 * Implements "Context Isolation" and "Risk-Tiered Execution".
 */
export function aiDraftFromPool(
  pool: PoolWarrior[],
  rivals: RivalStableData[],
  week: number,
  state: GameState,
  seed?: number
): { updatedPool: PoolWarrior[]; updatedRivals: RivalStableData[]; gazetteItems: string[] } {
  const rng = new SeededRNG(seed ?? (week * 7919 + 101));
  const isMajorDraftWeek = week % 4 === 0;
  
  let currentPool = [...pool];
  const updatedRivals: RivalStableData[] = [];
  const globalGazetteItems: string[] = [];

  const meta = computeMetaDrift(state.arenaHistory || []);
  
  // 🐍 Snake Draft Priority: Sort rivals by "Need"
  // Priority 1: Fewest active warriors
  // Priority 2: Lowest treasury
  const sortedRivals = [...rivals].sort((a, b) => {
    const aActive = a.roster.filter(w => w.status === "Active").length;
    const bActive = b.roster.filter(w => w.status === "Active").length;
    if (aActive !== bActive) return aActive - bActive;
    return a.treasury - b.treasury;
  });

  const draftResults: Record<string, RivalStableData> = {};

  for (const rival of sortedRivals) {
    const { updatedRival, updatedPool, gazetteItems } = processRecruitment(
      rival,
      currentPool,
      week,
      rng,
      isMajorDraftWeek,
      meta
    );
    
    draftResults[updatedRival.owner.id] = updatedRival;
    currentPool = updatedPool;
    globalGazetteItems.push(...gazetteItems);
  }

  // Restore original rival order to maintain pipeline stability
  const finalizedRivals = rivals.map(r => draftResults[r.owner.id] || r);

  return { 
    updatedPool: currentPool, 
    updatedRivals: finalizedRivals, 
    gazetteItems: globalGazetteItems 
  };
}
