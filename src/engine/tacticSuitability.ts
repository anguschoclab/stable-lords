/**
 * Tactic Suitability Matrix — defines how well each style uses each tactic.
 * WS = Well Suited (1.0), S = Suited (0.6), U = Unsuited (0.3)
 * From Fighting Styles Compendium v0.3 & Strategy Editor Spec v1.0
 */
import { FightingStyle } from "@/types/shared.types";
import type { OffensiveTactic, DefensiveTactic } from "@/types/combat.types";

export type SuitabilityRating = "WS" | "S" | "U";

const OFFENSIVE_MATRIX: Record<FightingStyle, Record<string, SuitabilityRating>> = {
  [FightingStyle.AimedBlow]:      { Lunge: "S",  Slash: "U",  Bash: "U",  Decisiveness: "WS" },
  [FightingStyle.BashingAttack]:  { Lunge: "U",  Slash: "S",  Bash: "WS", Decisiveness: "S"  },
  [FightingStyle.LungingAttack]:  { Lunge: "WS", Slash: "S",  Bash: "U",  Decisiveness: "S"  },
  [FightingStyle.ParryLunge]:     { Lunge: "WS", Slash: "U",  Bash: "U",  Decisiveness: "S"  },
  [FightingStyle.ParryRiposte]:   { Lunge: "S",  Slash: "U",  Bash: "U",  Decisiveness: "S"  },
  [FightingStyle.ParryStrike]:    { Lunge: "S",  Slash: "S",  Bash: "U",  Decisiveness: "WS" },
  [FightingStyle.SlashingAttack]: { Lunge: "S",  Slash: "WS", Bash: "U",  Decisiveness: "S"  },
  [FightingStyle.StrikingAttack]: { Lunge: "S",  Slash: "S",  Bash: "S",  Decisiveness: "WS" },
  [FightingStyle.TotalParry]:     { Lunge: "U",  Slash: "U",  Bash: "U",  Decisiveness: "U"  },
  [FightingStyle.WallOfSteel]:    { Lunge: "S",  Slash: "S",  Bash: "S",  Decisiveness: "S"  },
};

const DEFENSIVE_MATRIX: Record<FightingStyle, Record<string, SuitabilityRating>> = {
  [FightingStyle.AimedBlow]:      { Dodge: "WS", Parry: "S",  Riposte: "S",  Responsiveness: "S"  },
  [FightingStyle.BashingAttack]:  { Dodge: "U",  Parry: "S",  Riposte: "U",  Responsiveness: "S"  },
  [FightingStyle.LungingAttack]:  { Dodge: "WS", Parry: "U",  Riposte: "S",  Responsiveness: "S"  },
  [FightingStyle.ParryLunge]:     { Dodge: "S",  Parry: "WS", Riposte: "S",  Responsiveness: "S"  },
  [FightingStyle.ParryRiposte]:   { Dodge: "S",  Parry: "WS", Riposte: "WS", Responsiveness: "WS" },
  [FightingStyle.ParryStrike]:    { Dodge: "S",  Parry: "WS", Riposte: "S",  Responsiveness: "S"  },
  [FightingStyle.SlashingAttack]: { Dodge: "S",  Parry: "U",  Riposte: "S",  Responsiveness: "S"  },
  [FightingStyle.StrikingAttack]: { Dodge: "S",  Parry: "S",  Riposte: "U",  Responsiveness: "S"  },
  [FightingStyle.TotalParry]:     { Dodge: "S",  Parry: "WS", Riposte: "S",  Responsiveness: "S"  },
  [FightingStyle.WallOfSteel]:    { Dodge: "S",  Parry: "S",  Riposte: "S",  Responsiveness: "WS" },
};

export function getOffensiveSuitability(style: FightingStyle, tactic: OffensiveTactic): SuitabilityRating {
  if (tactic === "none") return "WS";
  return OFFENSIVE_MATRIX[style]?.[tactic as string] ?? "S";
}

export function getDefensiveSuitability(style: FightingStyle, tactic: DefensiveTactic): SuitabilityRating {
  if (tactic === "none") return "WS";
  return DEFENSIVE_MATRIX[style]?.[tactic as string] ?? "S";
}

export function suitabilityMultiplier(rating: SuitabilityRating): number {
  const multipliers: Record<SuitabilityRating, number> = {
    WS: 1.0,
    S: 0.6,
    U: 0.3
  };
  return multipliers[rating];
}

export const SUITABILITY_COLORS: Record<SuitabilityRating, string> = {
  WS: "text-green-500",
  S: "text-amber-500",
  U: "text-destructive",
};

export const SUITABILITY_LABELS: Record<SuitabilityRating, string> = {
  WS: "Well Suited",
  S: "Suited",
  U: "Unsuited",
};

/**
 * ⚡ Style Matchup Matrix — Rock-Paper-Scissors Logic
 * Defines natural advantages/disadvantages between styles.
 */
export const STYLE_MATCHUP_MATRIX: Partial<Record<FightingStyle, Partial<Record<FightingStyle, number>>>> = {
  [FightingStyle.LungingAttack]: {
    [FightingStyle.AimedBlow]: 1.15, // Lunging beats Focused
    [FightingStyle.ParryRiposte]: 0.85, // Parry-heavy beats Lunging
  },
  [FightingStyle.BashingAttack]: {
    [FightingStyle.WallOfSteel]: 1.10, // Bash breaks Steel
    [FightingStyle.SlashingAttack]: 0.90, // Slash evades Bash
  },
  [FightingStyle.AimedBlow]: {
    [FightingStyle.SlashingAttack]: 1.12, // Focused hits Slashers
    [FightingStyle.LungingAttack]: 0.88, // Lunge interrupts Aim
  },
  [FightingStyle.TotalParry]: {
    [FightingStyle.BashingAttack]: 0.85, // Bash breaks Parry
    [FightingStyle.SlashingAttack]: 1.15, // Parry catches Slashes
  },
};

export function getStyleMatchupAdvantage(styleA: FightingStyle, styleD: FightingStyle): number {
  return STYLE_MATCHUP_MATRIX[styleA]?.[styleD] ?? 1.0;
}
