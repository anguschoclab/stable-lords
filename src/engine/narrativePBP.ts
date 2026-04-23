/**
 * Narrative PBP Module - Re-exports from split narrative modules
 * This file maintains backward compatibility while following SRP
 */

// Re-export from split modules
export {
  interpolateTemplate,
  getStrikeSeverity,
  getFromArchive,
  richHitLocation,
  type CombatContext,
} from './narrative/narrativePBPUtils';
export {
  generateWarriorIntro,
  battleOpener,
  type WarriorIntroData,
} from './narrative/narrativeIntro';
export {
  narrateAttack,
  narratePassive,
  narrateParry,
  narrateDodge,
  narrateCounterstrike,
  narrateHit,
  narrateParryBreak,
  narrateInitiative,
} from './narrative/narrativeCombat';
export {
  damageSeverityLine,
  stateChangeLine,
  fatigueLine,
  crowdReaction,
  minuteStatusLine,
} from './narrative/narrativeStatus';
export {
  narrateBoutEnd,
  popularityLine,
  skillLearnLine,
  tradingBlowsLine,
  stalemateLine,
  tauntLine,
  conservingLine,
} from './narrative/narrativePostBout';
export {
  RANGE_NAMES,
  narrateRangeShift,
  narrateFeint,
  narrateZoneShift,
  arenaIntroLine,
  tacticStreakLine,
  pressingLine,
  narrateInsightHint,
} from './narrative/narrativePositioning';
