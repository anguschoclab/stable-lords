/**
 * Engine barrel export.
 */
export { simulateFight, defaultPlanForWarrior } from "./simulate";
export { simulateFightAndSignal } from "./simWrapper";
export { fameFromTags, type FamePop } from "./fame";
export { autoTuneFromBias, reconcileGearTwoHanded, type Bias } from "./planBias";
export { getOffensivePenalty, getDefensivePenalty } from "./antiSynergy";
export { onSignal, sendSignal, type DMEvent } from "./signals";
export { ArenaHistory } from "./history/arenaHistory";
export { NewsletterFeed } from "./newsletter/feed";
export { StyleRollups } from "./stats/styleRollups";
export { computeBaseSkills, computeDerivedStats, computeWarriorStats, DAMAGE_LABELS } from "./skillCalc";
export { computeCrowdMood, getMoodModifiers, MOOD_DESCRIPTIONS, MOOD_ICONS, type CrowdMood } from "./crowdMood";
export { computeMetaDrift, getMetaLabel, getMetaColor, type StyleMeta } from "./metaDrift";
export { aiPlanForWarrior, processOwnerGrudges, processAIRosterManagement, generateOwnerNarratives, evolvePhilosophies } from "./ownerAI";
export { getTempoBonus, getEnduranceMult, getStylePassive, getKillMechanic, getStyleAntiSynergy, getMastery, type MasteryTier, type MasteryInfo } from "./stylePassives";
