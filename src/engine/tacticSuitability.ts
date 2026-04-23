/**
 * Tactic Suitability Matrix — defines how well each style uses each tactic.
 * WS = Well Suited (1.0), S = Suited (0.6), U = Unsuited (0.3)
 * From Fighting Styles Compendium v0.3 & Strategy Editor Spec v1.0
 */
import { FightingStyle } from '@/types/shared.types';
import type { OffensiveTactic, DefensiveTactic } from '@/types/combat.types';

export type SuitabilityRating = 'WS' | 'S' | 'U';

const OFFENSIVE_MATRIX: Record<FightingStyle, Record<string, SuitabilityRating>> = {
  [FightingStyle.AimedBlow]: { Lunge: 'WS', Slash: 'WS', Bash: 'WS', Decisiveness: 'U' },
  [FightingStyle.BashingAttack]: { Lunge: 'U', Slash: 'U', Bash: 'WS', Decisiveness: 'WS' },
  [FightingStyle.LungingAttack]: { Lunge: 'WS', Slash: 'U', Bash: 'U', Decisiveness: 'S' },
  [FightingStyle.ParryLunge]: { Lunge: 'WS', Slash: 'U', Bash: 'U', Decisiveness: 'U' },
  [FightingStyle.ParryRiposte]: { Lunge: 'WS', Slash: 'U', Bash: 'U', Decisiveness: 'U' },
  [FightingStyle.ParryStrike]: { Lunge: 'U', Slash: 'U', Bash: 'U', Decisiveness: 'WS' },
  [FightingStyle.SlashingAttack]: { Lunge: 'U', Slash: 'WS', Bash: 'U', Decisiveness: 'S' },
  [FightingStyle.StrikingAttack]: { Lunge: 'WS', Slash: 'WS', Bash: 'WS', Decisiveness: 'WS' },
  [FightingStyle.TotalParry]: { Lunge: 'U', Slash: 'U', Bash: 'U', Decisiveness: 'U' },
  [FightingStyle.WallOfSteel]: { Lunge: 'U', Slash: 'WS', Bash: 'WS', Decisiveness: 'U' },
};

const DEFENSIVE_MATRIX: Record<FightingStyle, Record<string, SuitabilityRating>> = {
  [FightingStyle.AimedBlow]: { Dodge: 'WS', Parry: 'S', Riposte: 'U', Responsiveness: 'U' },
  [FightingStyle.BashingAttack]: { Dodge: 'U', Parry: 'U', Riposte: 'U', Responsiveness: 'U' },
  [FightingStyle.LungingAttack]: { Dodge: 'WS', Parry: 'U', Riposte: 'WS', Responsiveness: 'U' },
  [FightingStyle.ParryLunge]: { Dodge: 'WS', Parry: 'WS', Riposte: 'S', Responsiveness: 'U' },
  [FightingStyle.ParryRiposte]: { Dodge: 'S', Parry: 'WS', Riposte: 'WS', Responsiveness: 'U' },
  [FightingStyle.ParryStrike]: { Dodge: 'U', Parry: 'WS', Riposte: 'S', Responsiveness: 'WS' },
  [FightingStyle.SlashingAttack]: { Dodge: 'U', Parry: 'U', Riposte: 'U', Responsiveness: 'U' },
  [FightingStyle.StrikingAttack]: { Dodge: 'U', Parry: 'U', Riposte: 'S', Responsiveness: 'WS' },
  [FightingStyle.TotalParry]: { Dodge: 'WS', Parry: 'WS', Riposte: 'WS', Responsiveness: 'WS' },
  [FightingStyle.WallOfSteel]: { Dodge: 'U', Parry: 'WS', Riposte: 'WS', Responsiveness: 'U' },
};

export function getOffensiveSuitability(
  style: FightingStyle,
  tactic: OffensiveTactic
): SuitabilityRating {
  if (tactic === 'none') return 'WS';
  return OFFENSIVE_MATRIX[style]?.[tactic as string] ?? 'S';
}

export function getDefensiveSuitability(
  style: FightingStyle,
  tactic: DefensiveTactic
): SuitabilityRating {
  if (tactic === 'none') return 'WS';
  return DEFENSIVE_MATRIX[style]?.[tactic as string] ?? 'S';
}

export function suitabilityMultiplier(rating: SuitabilityRating): number {
  const multipliers: Record<SuitabilityRating, number> = {
    WS: 1.0,
    S: 0.6,
    U: 0.3,
  };
  return multipliers[rating];
}

export const SUITABILITY_COLORS: Record<SuitabilityRating, string> = {
  WS: 'text-green-500',
  S: 'text-amber-500',
  U: 'text-destructive',
};

export const SUITABILITY_LABELS: Record<SuitabilityRating, string> = {
  WS: 'Well Suited',
  S: 'Suited',
  U: 'Unsuited',
};
