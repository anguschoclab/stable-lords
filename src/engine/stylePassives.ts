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
  [FightingStyle.AimedBlow]:       { opening: -1, mid:  0, late:  1, enduranceMult: 0.90 },
  [FightingStyle.BashingAttack]:   { opening:  1, mid:  0, late: -1, enduranceMult: 1.15 },
  [FightingStyle.LungingAttack]:   { opening:  2, mid:  0, late: -2, enduranceMult: 1.20 },
  [FightingStyle.ParryLunge]:      { opening:  0, mid:  1, late:  0, enduranceMult: 1.00 },
  [FightingStyle.ParryRiposte]:    { opening: -1, mid:  0, late:  1, enduranceMult: 0.95 },
  [FightingStyle.ParryStrike]:     { opening:  0, mid:  0, late:  0, enduranceMult: 0.95 },
  [FightingStyle.SlashingAttack]:  { opening:  1, mid:  0, late: -1, enduranceMult: 1.10 },
  [FightingStyle.StrikingAttack]:  { opening:  1, mid:  0, late:  0, enduranceMult: 1.05 },
  [FightingStyle.TotalParry]:      { opening: -1, mid:  0, late:  1, enduranceMult: 0.70 },
  [FightingStyle.WallOfSteel]:     { opening:  0, mid:  0, late:  1, enduranceMult: 0.80 },
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

// ─── 2) Style Mastery — fight-count tiers that enhance passives ───────────

export type MasteryTier = "Novice" | "Practiced" | "Veteran" | "Master" | "Grandmaster";

export interface MasteryInfo {
  tier: MasteryTier;
  fights: number;
  /** Flat bonus added to key passive values at this tier */
  bonus: number;
  /** Multiplier applied to all passive bonuses (stacks with bonus) */
  mult: number;
}

const MASTERY_THRESHOLDS: { tier: MasteryTier; minFights: number; bonus: number; mult: number }[] = [
  { tier: "Grandmaster", minFights: 50, bonus: 1, mult: 1.25 },
  { tier: "Master",      minFights: 30, bonus: 1, mult: 1.15 },
  { tier: "Veteran",     minFights: 20, bonus: 1, mult: 1.08 },
  { tier: "Practiced",   minFights: 10, bonus: 0, mult: 1.04 },
  { tier: "Novice",      minFights: 0,  bonus: 0, mult: 1.00 },
];

export function getMastery(totalFights: number): MasteryInfo {
  for (const t of MASTERY_THRESHOLDS) {
    if (totalFights >= t.minFights) return { tier: t.tier, fights: totalFights, bonus: t.bonus, mult: t.mult };
  }
  return { tier: "Novice", fights: totalFights, bonus: 0, mult: 1.0 };
}

// ─── 3) Style Passives — unique per-exchange modifiers ────────────────────
//
// BALANCE NOTE: On a d20 roll-under system, each +1 = +5% success.
// Passives should be +0 to +2 at Novice, scaling to +1 to +3 at Grandmaster.
// The matchup matrix and base skill seeds are the PRIMARY differentiators.
// Passives add FLAVOR, not dominance.

export interface StylePassiveResult {
  attBonus: number;
  parBonus: number;
  defBonus: number;
  ripBonus: number;
  dmgBonus: number;
  critChance: number;
  iniBonus: number;
  mastery: MasteryTier;
  narrative?: string;
}

const EMPTY_PASSIVE: StylePassiveResult = {
  attBonus: 0, parBonus: 0, defBonus: 0, ripBonus: 0,
  dmgBonus: 0, critChance: 0, iniBonus: 0, mastery: "Novice",
};

export function getStylePassive(
  style: FightingStyle,
  context: {
    phase: Phase;
    exchange: number;
    hitsLanded: number;
    hitsTaken: number;
    ripostes: number;
    consecutiveHits: number;
    hpRatio: number;
    endRatio: number;
    opponentStyle: FightingStyle;
    targetedLocation?: string;
    totalFights?: number;
  }
): StylePassiveResult {
  const m = getMastery(context.totalFights ?? 0);

  /** Apply mastery mult (rounds) */
  function scale(val: number): number {
    return Math.round(val * m.mult);
  }

  switch (style) {
    // ── Aimed Blow: Precision Master ──
    // Modest ATT bonus when targeting; crit chance is the real payoff
    case FightingStyle.AimedBlow: {
      const targeted = context.targetedLocation && context.targetedLocation !== "Any";
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        attBonus: scale(targeted ? 1 : 0) + (targeted ? m.bonus : 0),
        critChance: targeted ? 0.10 + (context.exchange > 5 ? 0.05 : 0) + (m.bonus * 0.03) : 0,
        narrative: targeted && context.exchange > 5
          ? `${m.tier !== "Novice" ? `[${m.tier}] ` : ""}studies the opponent's rhythm, waiting for the perfect opening`
          : undefined,
      };
    }

    // ── Bashing Attack: Momentum ──
    // Damage ramps with consecutive hits (cap 2 base, +1 mastery)
    case FightingStyle.BashingAttack: {
      const momentumDmg = Math.min(2 + m.bonus, context.consecutiveHits);
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        dmgBonus: scale(momentumDmg),
        attBonus: context.consecutiveHits >= 3 ? 1 : 0,
        narrative: context.consecutiveHits >= 3
          ? `${m.tier !== "Novice" ? `[${m.tier}] ` : ""}builds devastating momentum, each blow harder than the last!`
          : undefined,
      };
    }

    // ── Lunging Attack: First Strike ──
    // Strong opening INI, fades to nothing
    case FightingStyle.LungingAttack: {
      const earlyBonus = context.exchange <= 2 ? 2 : context.exchange <= 5 ? 1 : 0;
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        iniBonus: scale(earlyBonus) + (context.exchange <= 2 ? m.bonus : 0),
        attBonus: context.exchange === 0 ? 1 : 0,
        narrative: context.exchange === 0
          ? `${m.tier !== "Novice" ? `[${m.tier}] ` : ""}explodes forward with a devastating opening lunge!`
          : undefined,
      };
    }

    // ── Parry-Lunge: Counter-Lunge ──
    // Gets ATT bonus when behind on hits (counter-attacker)
    case FightingStyle.ParryLunge: {
      const counterReady = context.hitsTaken > 0 && context.hitsTaken > context.hitsLanded;
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        attBonus: scale(counterReady ? 1 : 0) + (counterReady ? m.bonus : 0),
        iniBonus: counterReady ? 1 : 0,
        narrative: counterReady
          ? `${m.tier !== "Novice" ? `[${m.tier}] ` : ""}absorbs the blow, coiling for a devastating counter-lunge`
          : undefined,
      };
    }

    // ── Parry-Riposte: Riposte Specialist ──
    // RIP bonus after ripostes (capped conservatively — identity is counter, not wall)
    case FightingStyle.ParryRiposte: {
      const ripEscalation = Math.min(1 + m.bonus, context.ripostes);
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        ripBonus: scale(ripEscalation),
        // PR OE paradox flavor: low OE grants slight parry boost (counter-ready stance)
        parBonus: context.endRatio > 0.6 ? 1 : 0,
        narrative: context.ripostes >= 3
          ? `${m.tier !== "Novice" ? `[${m.tier}] ` : ""}has found the rhythm — each counter deadlier than the last!`
          : undefined,
      };
    }

    // ── Parry-Strike: Efficient Counter ──
    // Small consistent PAR + ATT
    case FightingStyle.ParryStrike:
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        parBonus: 1 + m.bonus,
        attBonus: scale(1),
      };

    // ── Slashing Attack: Flurry ──
    // Bonus ATT in opening/mid, fades in late
    case FightingStyle.SlashingAttack:
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        attBonus: scale(context.phase !== "LATE" ? 1 : 0) + (context.phase === "OPENING" ? m.bonus : 0),
        dmgBonus: context.phase === "OPENING" ? 1 : 0,
        narrative: context.phase === "OPENING" && context.hitsLanded >= 2
          ? `${m.tier !== "Novice" ? `[${m.tier}] ` : ""}unleashes a whirlwind of slashes!`
          : undefined,
      };

    // ── Striking Attack: Reliable Power ──
    // Consistent ATT bonus, dmg vs hurt opponents
    case FightingStyle.StrikingAttack:
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        attBonus: 1 + m.bonus,
        dmgBonus: context.hpRatio > 0.7 ? 0 : 1,
      };

    // ── Total Parry: Endurance Wall ──
    // Small PAR/DEF bonuses (their base skills already dominate); endurance efficiency is the real advantage
    case FightingStyle.TotalParry: {
      const lateBonus = context.phase === "LATE" ? 1 : 0;
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        parBonus: 1 + lateBonus + m.bonus,
        defBonus: lateBonus,
        ripBonus: context.phase === "LATE" ? 1 : 0,
        narrative: context.phase === "LATE" && context.endRatio > 0.5
          ? `${m.tier !== "Novice" ? `[${m.tier}] ` : ""}stands fresh as the opponent gasps for breath!`
          : undefined,
      };
    }

    // ── Wall of Steel: Blade Barrier ──
    // DEF/PAR scale slowly over exchanges (cap 2 base, +1 mastery)
    case FightingStyle.WallOfSteel: {
      const wallBonus = Math.min(2 + m.bonus, Math.floor(context.exchange / 4));
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        defBonus: scale(1 + wallBonus),
        parBonus: wallBonus,
        narrative: wallBonus >= 2
          ? `${m.tier !== "Novice" ? `[${m.tier}] ` : ""}the constant blade motion becomes an impenetrable wall!`
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
