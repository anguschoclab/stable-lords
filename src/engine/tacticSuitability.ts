/**
 * Tactic Suitability Matrix — defines how well each style uses each tactic.
 * WS = Well Suited (1.0), S = Suited (0.6), U = Unsuited (0.3)
 * From Fighting Styles Compendium v0.3 & Strategy Editor Spec v1.0
 */
import { FightingStyle, type OffensiveTactic, type DefensiveTactic } from "@/types/game";

export type SuitabilityRating = "WS" | "S" | "U";

const OFFENSIVE_SUITABILITY: Record<string, Record<string, SuitabilityRating>> = {
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

const DEFENSIVE_SUITABILITY: Record<string, Record<string, SuitabilityRating>> = {
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
  return OFFENSIVE_SUITABILITY[style]?.[tactic] ?? "S";
}

export function getDefensiveSuitability(style: FightingStyle, tactic: DefensiveTactic): SuitabilityRating {
  if (tactic === "none") return "WS";
  return DEFENSIVE_SUITABILITY[style]?.[tactic] ?? "S";
}

export function suitabilityMultiplier(rating: SuitabilityRating): number {
  return rating === "WS" ? 1.0 : rating === "S" ? 0.6 : 0.3;
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
