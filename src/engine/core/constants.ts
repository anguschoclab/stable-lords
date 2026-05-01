/**
 * Stable Lords — Global Engine Constants
 * Central source of truth for mechanical tuning and temporal standards.
 */

// ─── Temporal ───────────────────────────────────────────────────────────
export const ERA_START_YEAR = 2026;
export const WEEKS_PER_SEASON = 13;
export const WEEKS_PER_YEAR = 52;

// ─── Economic ────────────────────────────────────────────────────────────
export const DEFAULT_TREASURY = 2000;
export const BANKRUPTCY_THRESHOLD = -500;
export const WEEKLY_MAINTENANCE_BASE = 100;

// ─── Social & Fame ───────────────────────────────────────────────────────
export const FAME_DECAY_RATE = 0.0133; // ~52 week half-life
export const POPULARITY_DECAY_RATE = 0.0133;
export const FAME_TIER_ELITE = 2000;

// ─── Recruitment ─────────────────────────────────────────────────────────
export const REFRESH_COST = 50;
export const DEFAULT_POOL_SIZE = 12;
export const POOL_HARD_CAP = 36;

// ─── World Simulation ────────────────────────────────────────────────────
export const WORLD_BOUT_MIN_FAME_GAP = 50;
export const VENDETTA_FAME_THRESHOLD = 200;
