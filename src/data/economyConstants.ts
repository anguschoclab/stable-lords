/**
 * Centralized Economy Constants for Stable Lords.
 * Ensures parity between Player and AI economic calculations.
 */
export const FIGHT_PURSE = 40;     // Reduced from 75 to curb hyper-inflation
export const WIN_BONUS = 25;       // Reduced from 40
export const FAME_DIVIDEND = 0.5;   // Reduced from 2x (Critical for long-term balance)

export const WARRIOR_UPKEEP_BASE = 55;
export const TRAINING_COST = 35;
export const SCOUT_COST = 25;
export const REFRESH_COST = 50;

// Trainer Economics
export const TRAINER_WEEKLY_SALARY: Record<string, number> = {
  Novice: 10,
  Seasoned: 25,
  Master: 75,
};
