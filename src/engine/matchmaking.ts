import type { MatchPairing } from "./matchmaking/bracketEngine";
import { generateMatchCard, isEligible } from "./matchmaking/bracketEngine";
import { runAIvsAIBouts, collectEligibleAIWarriors, pairAIWarriors } from "./matchmaking/rivalScheduler";
import { updateRivalriesFromBouts } from "./matchmaking/rivalryLogic";
import { addRestState, clearExpiredRest, addMatchRecord } from "./matchmaking/historyLogic";
import { calculateRivalryScore } from "./matchmakingServices";

// ─── Exports for backward compatibility ───
export { 
    generateMatchCard, 
    isEligible, 
    runAIvsAIBouts, 
    collectEligibleAIWarriors, 
    pairAIWarriors,
    updateRivalriesFromBouts,
    addRestState,
    clearExpiredRest,
    addMatchRecord,
    calculateRivalryScore
};

export type { MatchPairing };
