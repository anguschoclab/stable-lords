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
};

let activeFlags: FeatureFlags = { ...DEFAULTS };

export function getFeatureFlags(): FeatureFlags {
  return activeFlags;
}

export function setFeatureFlags(patch: Partial<FeatureFlags>): void {
  activeFlags = { ...activeFlags, ...patch };
}

export function resetFeatureFlags(): void {
  activeFlags = { ...DEFAULTS };
}

/**
 * Parse a URL fragment like `?feature=narrativeGen2,highlightLog` and flip matching flags on.
 * Safe to call in non-browser contexts — returns false and no-ops if window is unavailable.
 */
export function hydrateFeatureFlagsFromLocation(): boolean {
  if (typeof window === "undefined" || !window.location) return false;
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("feature");
  if (!raw) return false;
  const patch: Partial<FeatureFlags> = {};
  for (const key of raw.split(",").map(s => s.trim()).filter(Boolean)) {
    if (key in DEFAULTS) {
      (patch as Record<string, boolean>)[key] = true;
    }
  }
  if (Object.keys(patch).length > 0) {
    setFeatureFlags(patch);
    return true;
  }
  return false;
}
