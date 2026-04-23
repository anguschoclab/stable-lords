/**
 * Combat Utility Functions
 * Provides common operations for combat-related styling and logic
 * Eliminates DRY violations of outcome styling patterns
 */
import type { FightOutcomeBy } from '@/types/combat.types';

export interface OutcomeStyle {
  variant: 'gold' | 'blood' | 'parchment';
  icon?: string;
  label: string;
}

/**
 * Returns style configuration for a fight outcome
 * Eliminates DRY violation of outcome styling switch statements
 */
export function getOutcomeStyles(by: FightOutcomeBy): OutcomeStyle {
  switch (by) {
    case 'Kill':
      return {
        variant: 'blood',
        icon: 'Skull',
        label: 'FATALITY',
      };
    case 'KO':
      return {
        variant: 'gold',
        icon: 'Zap',
        label: 'KNOCKOUT',
      };
    case 'Stoppage':
      return {
        variant: 'gold',
        icon: 'Shield',
        label: 'STOPPAGE',
      };
    case 'Exhaustion':
      return {
        variant: 'parchment',
        icon: 'Activity',
        label: 'EXHAUSTION',
      };
    case 'Draw':
      return {
        variant: 'parchment',
        label: 'DRAW',
      };
    default:
      return {
        variant: 'parchment',
        label: 'UNKNOWN',
      };
  }
}
