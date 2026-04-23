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
export { StableCrest, SIZE_MAP } from '@/components/crest/StableCrest';
export type {
  CrestData,
  CrestCharge,
  ShieldShape,
  FieldType,
  MetalColor,
  ChargeType,
} from '@/types/crest.types';
