/**
 * Engine barrel export.
 */
export { simulateFight, defaultPlanForWarrior } from "./simulate";
export { fameFromTags, type FamePop } from "./fame";
export { autoTuneFromBias, reconcileGearTwoHanded, type Bias } from "./planBias";
export { getOffensivePenalty, getDefensivePenalty } from "./antiSynergy";
export { onSignal, sendSignal, type DMEvent } from "./signals";
