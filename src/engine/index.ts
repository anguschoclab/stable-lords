/**
 * Engine barrel export.
 */
export { simulateFight, defaultPlanForWarrior } from './simulate';
export { fameFromTags } from './fame';
export { autoTuneFromBias, reconcileGearTwoHanded, type Bias } from './planBias';
export { ArenaHistory } from './history/arenaHistory';
export { NewsletterFeed } from './newsletter/feed';
export { StyleRollups } from './stats/styleRollups';
export { computeWarriorStats, DAMAGE_LABELS } from './skillCalc';
export {
  computeCrowdMood,
  getMoodModifiers,
  MOOD_DESCRIPTIONS,
  MOOD_ICONS,
  type CrowdMood,
} from './crowdMood';
export { computeMetaDrift, getMetaLabel, getMetaColor, type StyleMeta } from './metaDrift';
export { aiPlanForWarrior } from './ownerAI';
export { processOwnerGrudges, calculateRivalryScore } from './ownerGrudges';
export { processAIRosterManagement } from './ownerRoster';
export { generateOwnerNarratives } from './ownerNarrative';
export { evolvePhilosophies } from './ownerPhilosophy';
export { generateRivalStables } from './rivals';
export { processWeekBouts, generatePairings, resolveBout } from './boutProcessor';
export {
  getTempoBonus,
  getEnduranceMult,
  getStylePassive,
  getKillMechanic,
  getStyleAntiSynergy,
  getMastery,
} from './stylePassives';

// 🛡️ Crest System
export {
  generateCrest,
  inheritCrest,
  getCrestColor,
  getChargeDescription,
  getCrestDescription,
} from './crest/crestGenerator';

export type {
  CrestData,
  CrestCharge,
  ShieldShape,
  FieldType,
  MetalColor,
  ChargeType,
} from '@/types/crest.types';

// ⏱️ Time Advance System (Phase 1 & 2)
export { TickOrchestrator } from './tick/TickOrchestrator';
export {
  TimeAdvanceService,
  type AdvanceOptions,
  type WeekSummary,
  type QuarterSummary,
  type QuarterAdvanceResult,
  type YearAdvanceResult,
  type SoftStopCondition,
  DEFAULT_AUTOSIM_STOPS,
  evaluateStopConditions,
} from './tick/TimeAdvanceService';
export { type WeekAdvanceOptions } from './pipeline/services/weekPipelineService';

// 🎲 Autosim System (Phase 3)
export {
  runAutosim,
  type AutosimOptions,
  type AutosimWeekSummary,
  type AutosimResult,
  DEFAULT_AUTOSIM_STOP_CONDITIONS,
} from './autosim';

// 📊 Telemetry (Phase 6)
export {
  setTelemetryProvider,
  getTelemetryProvider,
  telemetry,
  TelemetryEvents,
  TelemetryTags,
  type TelemetryProvider,
} from './telemetry';
