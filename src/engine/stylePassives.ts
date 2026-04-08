/**
 * Style-Specific Combat Passives, Tempo, Kill Mechanics & Anti-Synergy
 *
 * This module uses a Strategy Pattern to define style-specific behaviors,
 * eliminating massive switch statements and improving extensibility.
 */
import { FightingStyle } from "@/types/shared.types";
import type { Warrior } from "@/types/warrior.types";
import type { FightPlan } from "@/types/combat.types";

// ─── Types ────────────────────────────────────────────────────────────────

export type Phase = "OPENING" | "MID" | "LATE";

export interface StylePassiveResult {
  attBonus: number;
  parBonus: number;
  defBonus: number;
  ripBonus: number;
  dmgBonus: number;
  critChance: number;
  iniBonus: number;
  mastery: MasteryTier;
  hasPassiveNarrative?: boolean;
  narrative?: string;
}

export interface KillMechanic {
  killBonus: number;
  decBonus: number;
  extendedKillWindow: boolean;
  killWindowHpMult: number;
  killNarrative: string;
}

export interface StyleStrategy {
  tempo: {
    opening: number;
    mid: number;
    late: number;
    enduranceMult: number;
  };
  getPassive: (context: StylePassiveContext, mastery: MasteryInfo) => StylePassiveResult;
  getKillMechanic: (context: KillContext) => KillMechanic;
  getAntiSynergy: (offTactic?: string, defTactic?: string) => { offMult: number; defMult: number; warning?: string };
}

export interface StylePassiveContext {
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
}

export interface KillContext {
  phase: Phase;
  hitsLanded: number;
  consecutiveHits: number;
  targetedLocation?: string;
  hitLocation: string;
}

// ─── Mastery System ───────────────────────────────────────────────────────

export type MasteryTier = "Novice" | "Practiced" | "Veteran" | "Master" | "Grandmaster";

export interface MasteryInfo {
  tier: MasteryTier;
  fights: number;
  bonus: number;
  mult: number;
}

const MASTERY_THRESHOLDS: { tier: MasteryTier; minFights: number; bonus: number; mult: number }[] = [
  { tier: "Grandmaster", minFights: 50, bonus: 2, mult: 1.50 },
  { tier: "Master",      minFights: 30, bonus: 1, mult: 1.30 },
  { tier: "Veteran",     minFights: 20, bonus: 1, mult: 1.15 },
  { tier: "Practiced",   minFights: 10, bonus: 0, mult: 1.05 },
  { tier: "Novice",      minFights: 0,  bonus: 0, mult: 1.00 },
];

export function getMastery(totalFights: number): MasteryInfo {
  for (const t of MASTERY_THRESHOLDS) {
    if (totalFights >= t.minFights) return { tier: t.tier, fights: totalFights, bonus: t.bonus, mult: t.mult };
  }
  return { tier: "Novice", fights: totalFights, bonus: 0, mult: 1.0 };
}

// ─── Strategy Helpers ─────────────────────────────────────────────────────

const EMPTY_PASSIVE: StylePassiveResult = {
  attBonus: 0, parBonus: 0, defBonus: 0, ripBonus: 0,
  dmgBonus: 0, critChance: 0, iniBonus: 0, mastery: "Novice",
};

function scale(val: number, m: MasteryInfo): number {
  return Math.round(val * m.mult);
}

// ─── Strategies ───────────────────────────────────────────────────────────

const STYLES: Record<FightingStyle, StyleStrategy> = {
  [FightingStyle.AimedBlow]: {
    tempo: { opening: -1, mid: 0, late: 1, enduranceMult: 0.94 },
    getPassive: (ctx, m) => {
      const targeted = ctx.targetedLocation && ctx.targetedLocation !== "Any";
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        attBonus: scale(targeted ? 1 : 0, m),
        critChance: targeted ? 0.05 + (ctx.exchange > 8 ? 0.03 : 0) : 0,
        hasPassiveNarrative: !!(targeted && ctx.exchange > 5),
      };
    },
    getKillMechanic: (ctx) => ({
      killBonus: ctx.hitLocation === "head" ? 0.15 : (ctx.targetedLocation !== "Any" ? 0.05 : 0),
      decBonus: ctx.targetedLocation !== "Any" ? 3 : 0,
      extendedKillWindow: ctx.hitLocation === "head",
      killWindowHpMult: 0.80,
      killNarrative: "delivers a precise, clinical strike to a vital point!",
    }),
    getAntiSynergy: (off, def) => {
      let offMult = 1, warning;
      const defMult = 1;
      if (off === "Bash") { offMult = 0.4; warning = "Aimed Blows sacrifice all precision when bashing"; }
      if (off === "Slash") { offMult = 0.6; warning = "Slashing undermines the Aimed Blow's precision"; }
      return { offMult, defMult, warning };
    }
  },

  [FightingStyle.BashingAttack]: {
    tempo: { opening: 1, mid: 1, late: 0, enduranceMult: 0.98 },
    getPassive: (ctx, m) => {
      const momentumDmg = Math.min(3 + m.bonus, 1 + ctx.consecutiveHits);
      const vsTP = ctx.opponentStyle === FightingStyle.TotalParry;
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        dmgBonus: scale(momentumDmg, m) + (vsTP ? 1 : 0),
        attBonus: scale(ctx.consecutiveHits >= 2 ? 2 : 1, m) + (vsTP ? 2 : 0),
        hasPassiveNarrative: (vsTP && ctx.consecutiveHits >= 2) || (ctx.consecutiveHits >= 3),
      };
    },
    getKillMechanic: (ctx) => {
      const momentum = Math.min(3, ctx.consecutiveHits);
      return {
        killBonus: momentum * 0.04,
        decBonus: momentum,
        extendedKillWindow: ctx.consecutiveHits >= 3,
        killWindowHpMult: ctx.consecutiveHits >= 3 ? 0.4 : 0.3,
        killNarrative: "unleashes the full weight of their momentum in a crushing final blow!",
      };
    },
    getAntiSynergy: (off, def) => {
      let offMult = 1, defMult = 1, warning;
      if (off === "Lunge") { offMult = 0.5; warning = "Bashers are terrible lungers — too heavy and slow"; }
      if (off === "Decisiveness") { offMult = 0.85; }
      if (def === "Dodge") { defMult = 0.5; warning = (warning ? warning + "; " : "") + "Bashers are too heavy to dodge effectively"; }
      if (def === "Riposte") { defMult = 0.5; }
      return { offMult, defMult, warning };
    }
  },

  [FightingStyle.LungingAttack]: {
    tempo: { opening: 1, mid: 0, late: -1, enduranceMult: 1.02 },
    getPassive: (ctx, m) => {
      const earlyBonus = ctx.exchange === 0 ? 2 : 0;
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        iniBonus: scale(earlyBonus, m) + (ctx.exchange === 0 ? m.bonus : 0),
        attBonus: ctx.exchange === 0 ? 1 : 0,
        hasPassiveNarrative: ctx.exchange === 0,
      };
    },
    getKillMechanic: (ctx) => ({
      killBonus: ctx.phase === "OPENING" ? 0.08 : 0,
      decBonus: ctx.phase === "OPENING" ? 2 : 0,
      extendedKillWindow: false,
      killWindowHpMult: 0.3,
      killNarrative: "springs forward with a sudden, lethal thrust!",
    }),
    getAntiSynergy: (off, def) => {
      let offMult = 1, defMult = 1, warning;
      if (off === "Bash") { offMult = 0.5; warning = "Lungers lack the weight for effective bashing"; }
      if (def === "Parry") { defMult = 0.6; warning = (warning ? warning + "; " : "") + "Lungers are overextended for strong parries"; }
      return { offMult, defMult, warning };
    }
  },

  [FightingStyle.ParryLunge]: {
    tempo: { opening: 0, mid: 2, late: 0, enduranceMult: 1.00 },
    getPassive: (ctx, m) => {
      const counterReady = ctx.hitsTaken > ctx.hitsLanded;
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        attBonus: scale(counterReady ? 1 : 0, m) + (counterReady ? m.bonus : 0),
        iniBonus: counterReady ? 1 : 0,
        hasPassiveNarrative: counterReady,
      };
    },
    getKillMechanic: () => ({
      killBonus: 0, decBonus: 0, extendedKillWindow: false, killWindowHpMult: 0.3,
      killNarrative: "exploits a gap in the defense to strike home!",
    }),
    getAntiSynergy: () => ({ offMult: 1, defMult: 1 })
  },

  [FightingStyle.ParryRiposte]: {
    tempo: { opening: 0, mid: 1, late: 0, enduranceMult: 1.04 },
    getPassive: (ctx, m) => ({
      ...EMPTY_PASSIVE,
      mastery: m.tier,
      attBonus: -1,
      ripBonus: ctx.ripostes >= 2 ? 1 : 0,
      hasPassiveNarrative: ctx.ripostes >= 3,
    }),
    getKillMechanic: () => ({
      killBonus: 0.03,
      decBonus: 2,
      extendedKillWindow: false,
      killWindowHpMult: 0.25,
      killNarrative: "pivots around the attack and delivers a stinging riposte!",
    }),
    getAntiSynergy: (off) => {
      let offMult = 1, warning;
      const defMult = 1;
      if (off === "Bash") { offMult = 0.5; warning = "Riposte specialists lack bashing power"; }
      if (off === "Decisiveness") { offMult = 0.7; }
      return { offMult, defMult, warning };
    }
  },

  [FightingStyle.ParryStrike]: {
    tempo: { opening: 0, mid: 0, late: 0, enduranceMult: 0.96 },
    getPassive: (ctx, m) => ({
      ...EMPTY_PASSIVE,
      mastery: m.tier,
      parBonus: 2,
      attBonus: ctx.hitsTaken > ctx.hitsLanded ? 1 : 0,
    }),
    getKillMechanic: () => ({
      killBonus: 0, decBonus: 0, extendedKillWindow: false, killWindowHpMult: 0.3,
      killNarrative: "blocks and strikes in a single fluid motion!",
    }),
    getAntiSynergy: (off) => ({ offMult: off === "Bash" ? 0.6 : 1, defMult: 1 })
  },

  [FightingStyle.SlashingAttack]: {
    tempo: { opening: 1, mid: 1, late: 0, enduranceMult: 0.96 },
    getPassive: (ctx, m) => {
      const flurryDmg = Math.min(3, Math.floor(ctx.hitsLanded / 2));
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        attBonus: scale(ctx.phase === "LATE" ? 0 : 1, m) + (ctx.phase === "OPENING" ? m.bonus : 0),
        dmgBonus: 1 + flurryDmg,
        hasPassiveNarrative: ctx.hitsLanded >= 3,
      };
    },
    getKillMechanic: (ctx) => ({
      killBonus: ctx.hitsLanded >= 4 ? 0.06 : 0,
      decBonus: 0,
      extendedKillWindow: ctx.hitsLanded >= 5,
      killWindowHpMult: ctx.hitsLanded >= 5 ? 0.35 : 0.3,
      killNarrative: "overwhelms their foe with a flurry of precise cuts!",
    }),
    getAntiSynergy: (off, def) => {
      let offMult = 1, defMult = 1, warning;
      if (off === "Bash") { offMult = 0.5; warning = "Slashers rely on blade edge, not blunt force"; }
      if (def === "Parry") { defMult = 0.6; warning = (warning ? warning + "; " : "") + "Slashers struggle with disciplined parries"; }
      return { offMult, defMult, warning };
    }
  },

  [FightingStyle.StrikingAttack]: {
    tempo: { opening: 1, mid: 0, late: 0, enduranceMult: 0.96 },
    getPassive: (ctx, m) => ({
      ...EMPTY_PASSIVE,
      mastery: m.tier,
      attBonus: 1 + m.bonus,
      dmgBonus: 1,
    }),
    getKillMechanic: () => ({
      killBonus: 0.1,
      decBonus: 2,
      extendedKillWindow: true,
      killWindowHpMult: 0.25,
      killNarrative: "lands a devastating, direct strike!",
    }),
    getAntiSynergy: (off, def) => ({ offMult: 1, defMult: def === "Riposte" ? 0.6 : 1 })
  },

  [FightingStyle.TotalParry]: {
    tempo: { opening: -1, mid: 1, late: 1, enduranceMult: 0.90 },
    getPassive: (ctx, m) => ({
      ...EMPTY_PASSIVE,
      mastery: m.tier,
      attBonus: -2,
      parBonus: 4 + m.bonus,
      iniBonus: 2,
      hasPassiveNarrative: ctx.phase === "LATE" && ctx.endRatio > 0.5,
    }),
    getKillMechanic: () => ({
      killBonus: -0.05,
      decBonus: -1,
      extendedKillWindow: false,
      killWindowHpMult: 0.25,
      killNarrative: "finds a momentary opening in their own defensive shell!",
    }),
    getAntiSynergy: (off) => {
      let offMult = 1, warning;
      if (["Lunge", "Bash", "Slash"].includes(off || "")) {
        offMult = off === "Slash" ? 0.5 : 0.4;
        warning = `Total Parry fighters are not built for ${off?.toLowerCase()}`;
      }
      return { offMult, defMult: 1, warning };
    }
  },

  [FightingStyle.WallOfSteel]: {
    tempo: { opening: 1, mid: 1, late: 1, enduranceMult: 0.92 },
    getPassive: (ctx, m) => {
      const wallBonus = Math.min(1 + m.bonus, Math.floor(ctx.exchange / 5));
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        defBonus: scale(wallBonus, m) + 2,
        parBonus: 1,
        iniBonus: scale(wallBonus + 1, m) + 1,
        hasPassiveNarrative: wallBonus >= 1,
      };
    },
    getKillMechanic: () => ({
      killBonus: -0.03,
      decBonus: 0,
      extendedKillWindow: false,
      killWindowHpMult: 0.28,
      killNarrative: "shifts their weight and drives through the defense!",
    }),
    getAntiSynergy: () => ({ offMult: 1, defMult: 1 })
  },
};

// ─── Public API ───────────────────────────────────────────────────────────

export function getTempoBonus(style: FightingStyle, phase: Phase): number {
  const t = STYLES[style]?.tempo;
  if (!t) return 0;
  return phase === "OPENING" ? t.opening : phase === "MID" ? t.mid : t.late;
}

export function getEnduranceMult(style: FightingStyle): number {
  return STYLES[style]?.tempo.enduranceMult ?? 1.0;
}

export function getStylePassive(
  style: FightingStyle,
  context: StylePassiveContext & { totalFights?: number }
): StylePassiveResult {
  const m = getMastery(context.totalFights ?? 0);
  const strategy = STYLES[style];
  if (!strategy) return { ...EMPTY_PASSIVE, mastery: m.tier };
  return strategy.getPassive(context, m);
}

export function getKillMechanic(
  attackerStyle: FightingStyle,
  context: KillContext
): KillMechanic {
  const strategy = STYLES[attackerStyle];
  if (!strategy) return {
    killBonus: 0, decBonus: 0, extendedKillWindow: false, killWindowHpMult: 0.3,
    killNarrative: "strikes home!",
  };
  return strategy.getKillMechanic(context);
}

export function getStyleAntiSynergy(
  style: FightingStyle,
  offTactic?: string,
  defTactic?: string,
): { offMult: number; defMult: number; warning?: string } {
  const strategy = STYLES[style];
  if (!strategy) return { offMult: 1.0, defMult: 1.0 };
  return strategy.getAntiSynergy(offTactic, defTactic);
}
