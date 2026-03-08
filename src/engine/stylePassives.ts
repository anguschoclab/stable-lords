/**
 * Style-Specific Combat Passives, Tempo, Kill Mechanics & Anti-Synergy
 *
 * Each fighting style gets unique mechanical behaviors that go beyond
 * numeric skill differences. These are applied during combat resolution.
 */
import { FightingStyle } from "@/types/game";

// ─── 1) Style Tempo — Phase-based bonuses ─────────────────────────────────
// Positive = bonus in that phase, negative = penalty

export interface TempoProfile {
  opening: number;  // INI/ATT bonus in opening phase
  mid: number;
  late: number;
  enduranceMult: number; // multiplier on endurance drain (>1 = burns faster)
}

const STYLE_TEMPO: Record<FightingStyle, TempoProfile> = {
  [FightingStyle.AimedBlow]:       { opening: -1, mid:  1, late:  2, enduranceMult: 0.85 },
  [FightingStyle.BashingAttack]:   { opening:  2, mid:  0, late: -2, enduranceMult: 1.25 },
  [FightingStyle.LungingAttack]:   { opening:  3, mid:  0, late: -3, enduranceMult: 1.30 },
  [FightingStyle.ParryLunge]:      { opening:  0, mid:  1, late:  1, enduranceMult: 1.00 },
  [FightingStyle.ParryRiposte]:    { opening: -1, mid:  1, late:  2, enduranceMult: 0.90 },
  [FightingStyle.ParryStrike]:     { opening:  0, mid:  1, late:  0, enduranceMult: 0.95 },
  [FightingStyle.SlashingAttack]:  { opening:  2, mid:  1, late: -2, enduranceMult: 1.20 },
  [FightingStyle.StrikingAttack]:  { opening:  1, mid:  1, late: -1, enduranceMult: 1.10 },
  [FightingStyle.TotalParry]:      { opening: -2, mid:  0, late:  3, enduranceMult: 0.65 },
  [FightingStyle.WallOfSteel]:     { opening: -1, mid:  1, late:  2, enduranceMult: 0.75 },
};

export type Phase = "OPENING" | "MID" | "LATE";

export function getTempoBonus(style: FightingStyle, phase: Phase): number {
  const t = STYLE_TEMPO[style];
  if (!t) return 0;
  return phase === "OPENING" ? t.opening : phase === "MID" ? t.mid : t.late;
}

export function getEnduranceMult(style: FightingStyle): number {
  return STYLE_TEMPO[style]?.enduranceMult ?? 1.0;
}

// ─── 2) Style Passives — unique per-exchange modifiers ────────────────────

export interface StylePassiveResult {
  attBonus: number;
  parBonus: number;
  defBonus: number;
  ripBonus: number;
  dmgBonus: number;
  critChance: number;   // extra crit multiplier (0 = none)
  iniBonus: number;
  narrative?: string;   // optional flavor text when passive triggers
}

const EMPTY_PASSIVE: StylePassiveResult = {
  attBonus: 0, parBonus: 0, defBonus: 0, ripBonus: 0,
  dmgBonus: 0, critChance: 0, iniBonus: 0,
};

/**
 * Compute style-specific passive bonuses for the current exchange.
 * These layer on top of the base resolution chain.
 */
export function getStylePassive(
  style: FightingStyle,
  context: {
    phase: Phase;
    exchange: number;
    hitsLanded: number;
    hitsTaken: number;
    ripostes: number;
    consecutiveHits: number;
    hpRatio: number;      // current hp / max hp
    endRatio: number;     // current endurance / max endurance
    opponentStyle: FightingStyle;
    targetedLocation?: string;
  }
): StylePassiveResult {
  switch (style) {
    // ── Aimed Blow: Precision Master ──
    // Bonus ATT when targeting specific locations; crit chance scales with patience
    case FightingStyle.AimedBlow: {
      const targeted = context.targetedLocation && context.targetedLocation !== "Any";
      return {
        ...EMPTY_PASSIVE,
        attBonus: targeted ? 2 : 0,
        critChance: targeted ? 0.15 + (context.exchange > 5 ? 0.1 : 0) : 0,
        narrative: targeted && context.exchange > 5
          ? "studies the opponent's rhythm, waiting for the perfect opening"
          : undefined,
      };
    }

    // ── Bashing Attack: Momentum ──
    // Consecutive hits increase damage; overwhelm bonus when opponent is hurt
    case FightingStyle.BashingAttack: {
      const momentumDmg = Math.min(3, context.consecutiveHits);
      const overwhelm = context.hpRatio < 0.5 ? 0 : (1 - context.hpRatio) < 0.5 ? 0 : 0;
      // Overwhelm: bonus when OPPONENT is hurt (checked externally, but we add dmg on consecutive)
      return {
        ...EMPTY_PASSIVE,
        dmgBonus: momentumDmg,
        attBonus: context.consecutiveHits >= 2 ? 1 : 0,
        narrative: context.consecutiveHits >= 3
          ? "builds devastating momentum, each blow harder than the last!"
          : undefined,
      };
    }

    // ── Lunging Attack: First Strike ──
    // Big INI bonus in early exchanges, fades fast
    case FightingStyle.LungingAttack: {
      const earlyBonus = context.exchange <= 3 ? 3 : context.exchange <= 6 ? 1 : 0;
      return {
        ...EMPTY_PASSIVE,
        iniBonus: earlyBonus,
        attBonus: context.exchange === 0 ? 2 : 0, // First-strike bonus
        narrative: context.exchange === 0
          ? "explodes forward with a devastating opening lunge!"
          : undefined,
      };
    }

    // ── Parry-Lunge: Counter-Lunge ──
    // After taking a hit, gets ATT bonus next exchange (counter-attack specialist)
    case FightingStyle.ParryLunge: {
      const counterReady = context.hitsTaken > 0 && context.hitsTaken > context.hitsLanded;
      return {
        ...EMPTY_PASSIVE,
        attBonus: counterReady ? 2 : 0,
        iniBonus: counterReady ? 1 : 0,
        parBonus: 1, // Always slightly better at parrying
        narrative: counterReady
          ? "absorbs the blow, coiling for a devastating counter-lunge"
          : undefined,
      };
    }

    // ── Parry-Riposte: Riposte Specialist ──
    // Escalating RIP bonus after each successful riposte; bonus RIP after parry
    case FightingStyle.ParryRiposte: {
      const ripEscalation = Math.min(4, context.ripostes);
      return {
        ...EMPTY_PASSIVE,
        ripBonus: 3 + ripEscalation, // Significant riposte advantage + scaling
        parBonus: 1,
        narrative: context.ripostes >= 3
          ? "has found the rhythm — each counter deadlier than the last!"
          : undefined,
      };
    }

    // ── Parry-Strike: Efficient Counter ──
    // Reduced endurance cost and consistent PAR/ATT bonuses
    case FightingStyle.ParryStrike: {
      return {
        ...EMPTY_PASSIVE,
        parBonus: 2,
        attBonus: 1,
        // Endurance efficiency is handled via enduranceMult in tempo
      };
    }

    // ── Slashing Attack: Flurry ──
    // Extra damage on high AL settings; bonus in early/mid phases
    case FightingStyle.SlashingAttack: {
      return {
        ...EMPTY_PASSIVE,
        dmgBonus: context.phase === "OPENING" ? 1 : 0,
        attBonus: context.phase !== "LATE" ? 1 : -1,
        narrative: context.phase === "OPENING" && context.hitsLanded >= 2
          ? "unleashes a whirlwind of slashes!"
          : undefined,
      };
    }

    // ── Striking Attack: Reliable Power ──
    // Consistent bonuses, slight DEC advantage for finishing fights
    case FightingStyle.StrikingAttack: {
      return {
        ...EMPTY_PASSIVE,
        attBonus: 1,
        dmgBonus: context.hpRatio > 0.7 ? 0 : 1, // Bonus damage vs hurt opponents
      };
    }

    // ── Total Parry: Endurance Wall ──
    // Massive PAR/DEF bonuses; practically immune to early kills; grows stronger as fight drags
    case FightingStyle.TotalParry: {
      const lateBonus = context.phase === "LATE" ? 3 : context.phase === "MID" ? 1 : 0;
      return {
        ...EMPTY_PASSIVE,
        parBonus: 3 + lateBonus,
        defBonus: 2 + lateBonus,
        ripBonus: context.phase === "LATE" ? 2 : 0, // Late-fight riposte capability
        narrative: context.phase === "LATE" && context.endRatio > 0.5
          ? "stands fresh as the opponent gasps for breath!"
          : undefined,
      };
    }

    // ── Wall of Steel: Blade Barrier ──
    // Passive DEF/PAR scaling, gets harder to hit over time
    case FightingStyle.WallOfSteel: {
      const wallBonus = Math.min(3, Math.floor(context.exchange / 3));
      return {
        ...EMPTY_PASSIVE,
        defBonus: 2 + wallBonus,
        parBonus: 1 + wallBonus,
        ripBonus: 1 + Math.floor(wallBonus / 2),
        narrative: wallBonus >= 2
          ? "the constant blade motion becomes an impenetrable wall!"
          : undefined,
      };
    }

    default:
      return { ...EMPTY_PASSIVE };
  }
}

// ─── 3) Style-Specific Kill Mechanics ─────────────────────────────────────

export interface KillMechanic {
  /** Modifier to kill threshold (added to base 0.3 + kdMod) */
  killBonus: number;
  /** Extra DEC bonus for the kill check */
  decBonus: number;
  /** Flavor text for the killing blow */
  killNarrative: string;
  /** Whether this style can kill from a higher HP threshold */
  extendedKillWindow: boolean;
  /** HP threshold multiplier for kill window (default 0.3) */
  killWindowHpMult: number;
}

export function getKillMechanic(
  attackerStyle: FightingStyle,
  context: {
    phase: Phase;
    hitsLanded: number;
    consecutiveHits: number;
    targetedLocation?: string;
    hitLocation: string;
  }
): KillMechanic {
  switch (attackerStyle) {
    // Aimed Blow: Precision kill — headshots are devastating
    case FightingStyle.AimedBlow: {
      const isHeadshot = context.hitLocation === "head";
      const targeted = context.targetedLocation && context.targetedLocation !== "Any";
      return {
        killBonus: isHeadshot ? 0.15 : targeted ? 0.05 : 0,
        decBonus: targeted ? 3 : 0,
        killNarrative: isHeadshot
          ? "finds the fatal gap in the helm with surgical precision — a KILLING BLOW to the skull!"
          : "places the blade with lethal accuracy — a precise KILLING STRIKE!",
        extendedKillWindow: isHeadshot,
        killWindowHpMult: isHeadshot ? 0.4 : 0.3,
      };
    }

    // Bashing Attack: Overwhelm kill — momentum finisher
    case FightingStyle.BashingAttack: {
      const momentum = Math.min(3, context.consecutiveHits);
      return {
        killBonus: momentum * 0.04,
        decBonus: momentum,
        killNarrative: "drives a CRUSHING blow that shatters bone and sinew — KILLED by overwhelming force!",
        extendedKillWindow: context.consecutiveHits >= 3,
        killWindowHpMult: context.consecutiveHits >= 3 ? 0.4 : 0.3,
      };
    }

    // Lunging Attack: Impale kill — early burst
    case FightingStyle.LungingAttack:
      return {
        killBonus: context.phase === "OPENING" ? 0.08 : 0,
        decBonus: context.phase === "OPENING" ? 2 : 0,
        killNarrative: "drives a full-extension lunge clean through — IMPALED!",
        extendedKillWindow: false,
        killWindowHpMult: 0.3,
      };

    // Parry-Riposte: Counter-kill — punishes overcommitment
    case FightingStyle.ParryRiposte:
      return {
        killBonus: 0.03,
        decBonus: 2,
        killNarrative: "turns the parry into a lethal counter — the riposte finds the heart! KILLED!",
        extendedKillWindow: false,
        killWindowHpMult: 0.3,
      };

    // Slashing Attack: Bleed-out kill
    case FightingStyle.SlashingAttack:
      return {
        killBonus: context.hitsLanded >= 4 ? 0.06 : 0,
        decBonus: 0,
        killNarrative: "opens a grievous wound with a vicious slash — BLED OUT on the arena sand!",
        extendedKillWindow: context.hitsLanded >= 5,
        killWindowHpMult: context.hitsLanded >= 5 ? 0.35 : 0.3,
      };

    // Striking Attack: Clean finish
    case FightingStyle.StrikingAttack:
      return {
        killBonus: 0.03,
        decBonus: 1,
        killNarrative: "delivers a single, devastating downward STRIKE — KILLING BLOW!",
        extendedKillWindow: false,
        killWindowHpMult: 0.3,
      };

    // Defensive styles — very unlikely to kill but can
    case FightingStyle.TotalParry:
      return {
        killBonus: -0.1,
        decBonus: -2,
        killNarrative: "finds a rare opening and delivers a measured KILLING thrust!",
        extendedKillWindow: false,
        killWindowHpMult: 0.2, // Harder to trigger kill window
      };

    case FightingStyle.WallOfSteel:
      return {
        killBonus: -0.05,
        decBonus: 0,
        killNarrative: "the constant blade arc catches a vital point — KILLING BLOW from the steel wall!",
        extendedKillWindow: false,
        killWindowHpMult: 0.25,
      };

    default:
      return {
        killBonus: 0,
        decBonus: 0,
        killNarrative: "delivers a KILLING BLOW!",
        extendedKillWindow: false,
        killWindowHpMult: 0.3,
      };
  }
}

// ─── 4) Style-Flavored Anti-Synergy ──────────────────────────────────────

/** Returns a multiplier (0.0-1.0) for how poorly a style uses a specific tactic */
export function getStyleAntiSynergy(
  style: FightingStyle,
  offTactic?: string,
  defTactic?: string,
): { offMult: number; defMult: number; warning?: string } {
  let offMult = 1.0;
  let defMult = 1.0;
  let warning: string | undefined;

  // Offensive anti-synergies
  if (offTactic && offTactic !== "none") {
    switch (style) {
      case FightingStyle.BashingAttack:
        if (offTactic === "Lunge") { offMult = 0.5; warning = "Bashers are terrible lungers — too heavy and slow"; }
        if (offTactic === "Decisiveness") { offMult = 0.85; } // Acceptable but not great
        break;
      case FightingStyle.LungingAttack:
        if (offTactic === "Bash") { offMult = 0.5; warning = "Lungers lack the weight for effective bashing"; }
        break;
      case FightingStyle.AimedBlow:
        if (offTactic === "Bash") { offMult = 0.4; warning = "Aimed Blows sacrifice all precision when bashing"; }
        if (offTactic === "Slash") { offMult = 0.6; warning = "Slashing undermines the Aimed Blow's precision"; }
        break;
      case FightingStyle.TotalParry:
        if (offTactic === "Lunge") { offMult = 0.4; warning = "Total Parry fighters are not built for lunging"; }
        if (offTactic === "Bash") { offMult = 0.4; }
        if (offTactic === "Slash") { offMult = 0.5; }
        break;
      case FightingStyle.ParryRiposte:
        if (offTactic === "Bash") { offMult = 0.5; warning = "Riposte specialists lack bashing power"; }
        if (offTactic === "Decisiveness") { offMult = 0.7; }
        break;
      case FightingStyle.WallOfSteel:
        // WoS is acceptably suited to most offensive tactics
        break;
      case FightingStyle.ParryStrike:
        if (offTactic === "Bash") { offMult = 0.6; }
        break;
      case FightingStyle.SlashingAttack:
        if (offTactic === "Bash") { offMult = 0.5; warning = "Slashers rely on blade edge, not blunt force"; }
        break;
    }
  }

  // Defensive anti-synergies
  if (defTactic && defTactic !== "none") {
    switch (style) {
      case FightingStyle.BashingAttack:
        if (defTactic === "Dodge") { defMult = 0.5; warning = (warning ? warning + "; " : "") + "Bashers are too heavy to dodge effectively"; }
        if (defTactic === "Riposte") { defMult = 0.5; }
        break;
      case FightingStyle.LungingAttack:
        if (defTactic === "Parry") { defMult = 0.6; warning = (warning ? warning + "; " : "") + "Lungers are overextended for strong parries"; }
        break;
      case FightingStyle.StrikingAttack:
        if (defTactic === "Riposte") { defMult = 0.6; }
        break;
      case FightingStyle.SlashingAttack:
        if (defTactic === "Parry") { defMult = 0.6; warning = (warning ? warning + "; " : "") + "Slashers struggle with disciplined parries"; }
        break;
      case FightingStyle.AimedBlow:
        // AB is reasonably flexible defensively
        break;
      case FightingStyle.TotalParry:
        // TP is great at parry/dodge, weak at riposte (already in suitability)
        break;
    }
  }

  return { offMult, defMult, warning };
}
