/**
 * Centralized Economy Constants for Stable Lords.
 * Ensures parity between Player and AI economic calculations.
 */
export const FIGHT_PURSE = 240;    // Quadrupled for low-frequency bouts
export const WIN_BONUS = 100;     // Quadrupled for low-frequency bouts
export const FAME_DIVIDEND = 0.5;   // Stable 0.5x fame dividend

export const WARRIOR_UPKEEP_BASE = 60; // 1.0 Gold Unified Baseline
export const TRAINING_COST = 20;     // Reduced to encourage progression
export const SCOUT_COST = 25;
export const REFRESH_COST = 50;

// Trainer Economics
export const TRAINER_WEEKLY_SALARY: Record<string, number> = {
  Novice: 10,
  Seasoned: 25,
  Master: 75,
};
