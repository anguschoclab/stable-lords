// Import extracted modules for backward compatibility
export { CombatNarrator } from "./narrative/combatNarrator";
export { StatusNarrator } from "./narrative/statusNarrator";
export { BoutNarrator } from "./narrative/boutNarrator";
export { NarrativeTemplateEngine } from "./narrative/narrativeTemplateEngine";

// Re-export all functions for backward compatibility
export { generateWarriorIntro, battleOpener, narrateAttack, narratePassive, narrateParry, narrateDodge, narrateCounterstrike, narrateHit, narrateParryBreak, narrateInitiative, narrateBoutEnd } from "./narrative/combatNarrator";
export { damageSeverityLine, stateChangeLine, fatigueLine, crowdReaction, minuteStatusLine, popularityLine, skillLearnLine, tradingBlowsLine, stalemateLine, tauntLine, conservingLine, pressingLine, narrateInsightHint } from "./narrative/statusNarrator";

// Re-export types
export type { CombatContext } from "./narrative/narrativeTemplateEngine";
export type { WarriorIntroData } from "./narrative/combatNarrator";
