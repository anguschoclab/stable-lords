/**
 * Trainer types and constants.
 */
export type TrainerTier = "Novice" | "Seasoned" | "Master";
export type TrainerFocus = string;

export interface Trainer {
  id: string;
  name: string;
  tier: TrainerTier;
  focus: TrainerFocus;
  fame: number;
  retiredFrom?: string;
}

export const TRAINER_MAX_PER_STABLE = 5;
