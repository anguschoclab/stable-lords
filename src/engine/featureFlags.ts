/**
 * Feature Flags — central gate for incremental rollout of engine/UI behaviors.
 *
 * Flip these at runtime via a save-file override or via ?feature=foo,bar in the URL.
 * Keep the default shape stable so unit tests don't have to mock it.
 */

export interface FeatureFlags {
  /** Use the Bard Gen 2 tiered/recursive narrative resolver in combat narration. */
  narrativeGen2: boolean;
  /** Apply crowd-mood modulation to fatalPressure. */
  crowdMoodLethality: boolean;
  /** Surface the dev-only telemetry dashboard when a bout transcript is opened. */
  telemetryDashboard: boolean;
  /** Render the Highlight Log curation UI in the bout viewer. */
  highlightLog: boolean;
  /** Wire the WeeklyMatchmaking orchestrator into the week-tick pipeline. */
  weeklyMatchmaker: boolean;
  /** Enable the offseason / year-end recap flow. */
  offseasonFlow: boolean;
  /** Show the potential-grade badge on warrior cards. */
  potentialGradeUI: boolean;
  /** Allow players to assign skill-drilling training types. */
  skillDrilling: boolean;
  /** Skip combat narration and log generation (headless performance). */
  skipCombatNarration: boolean;
}

const DEFAULTS: FeatureFlags = {
  // UI + narrative polish — safe default on.
  narrativeGen2: true,
  highlightLog: true,
  potentialGradeUI: true,
  offseasonFlow: true,
  // Engine lethality modulation — crowdKillBonus is capped; baseline preserved.
  crowdMoodLethality: true,
  // Dev-only surfaces stay off by default.
  telemetryDashboard: false,
  // Scaffolded orchestrator — flag stays off until the scheduler consumes its plan.
  weeklyMatchmaker: false,
  // Skill drilling is data-complete.
  skillDrilling: true,
  skipCombatNarration: false,
};

let activeFlags: FeatureFlags = { ...DEFAULTS };

export function getFeatureFlags(): FeatureFlags {
  return activeFlags;
}

export function setFeatureFlags(patch: Partial<FeatureFlags>): void {
  activeFlags = { ...activeFlags, ...patch };
}
