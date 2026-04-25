/**
 * Style-Specific Combat Passives, Tempo, Kill Mechanics & Anti-Synergy
 *
 * This module uses a Strategy Pattern to define style-specific behaviors,
 * eliminating massive switch statements and improving extensibility.
 */
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightPlan } from '@/types/combat.types';

// ─── Types ────────────────────────────────────────────────────────────────

export type Phase = 'OPENING' | 'MID' | 'LATE';

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
  getAntiSynergy: (
    offTactic?: string,
    defTactic?: string
  ) => { offMult: number; defMult: number; warning?: string };
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

// ─── Style Identity (narrative flags) ─────────────────────────────────────
// Non-mechanical flags consumed by the narrator to pick voice/flavour per style,
// and by crowd-mood + kill-text assembly to bias tone.

export type StyleVoice = 'Surgical' | 'Brutal' | 'Explosive' | 'Fortified' | 'Flowing' | 'Cunning';
export type AttackFreq = 'Sparing' | 'Measured' | 'Relentless';
export type KillBias = 'Opportunistic' | 'Methodical' | 'Savage';
export type FatigueBurn = 'Low' | 'Moderate' | 'High';

export interface StyleIdentity {
  voice: StyleVoice;
  attackFreq: AttackFreq;
  killBias: KillBias;
  fatigueBurn: FatigueBurn;
  /** Short narrative tagline, safe for use in kill-text assembly. */
  tagline: string;
}

export const STYLE_IDENTITY: Record<FightingStyle, StyleIdentity> = {
  [FightingStyle.AimedBlow]: {
    voice: 'Surgical',
    attackFreq: 'Sparing',
    killBias: 'Methodical',
    fatigueBurn: 'Low',
    tagline: 'patient surgeon of the arena',
  },
  [FightingStyle.BashingAttack]: {
    voice: 'Brutal',
    attackFreq: 'Relentless',
    killBias: 'Savage',
    fatigueBurn: 'Moderate',
    tagline: 'wall-breaker with the weight of a storm',
  },
  [FightingStyle.LungingAttack]: {
    voice: 'Explosive',
    attackFreq: 'Measured',
    killBias: 'Opportunistic',
    fatigueBurn: 'High',
    tagline: 'sudden-strike specialist',
  },
  [FightingStyle.ParryLunge]: {
    voice: 'Cunning',
    attackFreq: 'Measured',
    killBias: 'Opportunistic',
    fatigueBurn: 'Moderate',
    tagline: 'counter-strike technician',
  },
  [FightingStyle.ParryRiposte]: {
    voice: 'Fortified',
    attackFreq: 'Sparing',
    killBias: 'Methodical',
    fatigueBurn: 'Low',
    tagline: 'iron bulwark, waiting for the error',
  },
  [FightingStyle.ParryStrike]: {
    voice: 'Cunning',
    attackFreq: 'Measured',
    killBias: 'Methodical',
    fatigueBurn: 'Moderate',
    tagline: 'coiled counter-striker',
  },
  [FightingStyle.StrikingAttack]: {
    voice: 'Flowing',
    attackFreq: 'Measured',
    killBias: 'Methodical',
    fatigueBurn: 'Moderate',
    tagline: 'rhythmic striker, reading the tempo',
  },
  [FightingStyle.SlashingAttack]: {
    voice: 'Flowing',
    attackFreq: 'Relentless',
    killBias: 'Savage',
    fatigueBurn: 'Moderate',
    tagline: 'whirl of razored arcs',
  },
  [FightingStyle.WallOfSteel]: {
    voice: 'Fortified',
    attackFreq: 'Sparing',
    killBias: 'Methodical',
    fatigueBurn: 'High',
    tagline: 'unmoving bastion of blade and brace',
  },
  [FightingStyle.TotalParry]: {
    voice: 'Fortified',
    attackFreq: 'Sparing',
    killBias: 'Opportunistic',
    fatigueBurn: 'Low',
    tagline: 'immovable defender, drawing mistakes from the foe',
  },
};

export function getStyleIdentity(style: FightingStyle): StyleIdentity {
  return STYLE_IDENTITY[style];
}

// ─── Mastery System ───────────────────────────────────────────────────────

export type MasteryTier = 'Novice' | 'Practiced' | 'Veteran' | 'Master' | 'Grandmaster';

export interface MasteryInfo {
  tier: MasteryTier;
  fights: number;
  bonus: number;
  mult: number;
}

const MASTERY_THRESHOLDS: { tier: MasteryTier; minFights: number; bonus: number; mult: number }[] =
  [
    { tier: 'Grandmaster', minFights: 50, bonus: 2, mult: 1.5 },
    { tier: 'Master', minFights: 30, bonus: 1, mult: 1.3 },
    { tier: 'Veteran', minFights: 20, bonus: 1, mult: 1.15 },
    { tier: 'Practiced', minFights: 10, bonus: 0, mult: 1.05 },
    { tier: 'Novice', minFights: 0, bonus: 0, mult: 1.0 },
  ];

export function getMastery(totalFights: number): MasteryInfo {
  for (const t of MASTERY_THRESHOLDS) {
    if (totalFights >= t.minFights)
      return { tier: t.tier, fights: totalFights, bonus: t.bonus, mult: t.mult };
  }
  return { tier: 'Novice', fights: totalFights, bonus: 0, mult: 1.0 };
}

// ─── Strategy Helpers ─────────────────────────────────────────────────────

const EMPTY_PASSIVE: StylePassiveResult = {
  attBonus: 0,
  parBonus: 0,
  defBonus: 0,
  ripBonus: 0,
  dmgBonus: 0,
  critChance: 0,
  iniBonus: 0,
  mastery: 'Novice',
};

function scale(val: number, m: MasteryInfo): number {
  return Math.round(val * m.mult);
}

// ─── Strategies ───────────────────────────────────────────────────────────

const STYLES: Record<FightingStyle, StyleStrategy> = {
  [FightingStyle.AimedBlow]: {
    tempo: { opening: 0, mid: 0, late: 1, enduranceMult: 0.94 },
    // Tuned 2026-04 (passive pass 2): pass 1's modest floor only lifted AB
    // 17.6% → 18.2%. AB's structural weakness was deeper: opening tempo -1
    // meant LU and other openers struck before AB could land anything, and
    // there was no defensive identity at all. Pass 2:
    //  - Tempo opening -1 → 0 (no longer fights uphill from exchange 0)
    //  - attBonus floor 1 → 2 (untargeted), 2 → 3 (targeted)
    //  - parBonus +1 baseline (precision implies controlled distance)
    //  - critChance floor doubled
    getPassive: (ctx, m) => {
      const targeted = ctx.targetedLocation && ctx.targetedLocation !== 'Any';
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        attBonus: scale(targeted ? 3 : 2, m),
        parBonus: 1,
        critChance: targeted ? 0.08 + (ctx.exchange > 8 ? 0.04 : 0) : 0.04,
        hasPassiveNarrative: !!(targeted && ctx.exchange > 5),
      };
    },
    getKillMechanic: (ctx) => ({
      killBonus: ctx.hitLocation === 'head' ? 0.15 : ctx.targetedLocation !== 'Any' ? 0.05 : 0,
      decBonus: ctx.targetedLocation !== 'Any' ? 3 : 0,
      extendedKillWindow: ctx.hitLocation === 'head',
      killWindowHpMult: 0.8,
      killNarrative: 'delivers a precise, clinical strike to a vital point!',
    }),
    // Canonical suitability: AB is WS for Bash, Slash, and Lunge; only Decisiveness is U.
    // Anti-synergy is therefore a no-op for AB — suitability handles tactical fit correctly.
    getAntiSynergy: () => ({ offMult: 1, defMult: 1 }),
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
        hasPassiveNarrative: (vsTP && ctx.consecutiveHits >= 2) || ctx.consecutiveHits >= 3,
      };
    },
    getKillMechanic: (ctx) => {
      const momentum = Math.min(3, ctx.consecutiveHits);
      return {
        killBonus: momentum * 0.04,
        decBonus: momentum,
        extendedKillWindow: ctx.consecutiveHits >= 3,
        killWindowHpMult: ctx.consecutiveHits >= 3 ? 0.4 : 0.3,
        killNarrative: 'unleashes the full weight of their momentum in a crushing final blow!',
      };
    },
    // Canonical suitability: Lunge/Dodge/Riposte are all U for BA (suitability already penalises them).
    // Decisiveness is WS for BA — no additional penalty.
    // Anti-synergy only reinforces physical incompatibilities beyond the U suitability floor.
    getAntiSynergy: (off, def) => {
      let offMult = 1,
        defMult = 1,
        warning;
      if (off === 'Lunge') {
        offMult = 0.7;
        warning = 'Bashers are too heavy for effective lunging';
      }
      if (def === 'Dodge') {
        defMult = 0.7;
        warning = (warning ? warning + '; ' : '') + 'Bashers cannot dodge effectively';
      }
      if (def === 'Riposte') {
        defMult = 0.7;
      }
      return { offMult, defMult, warning };
    },
  },

  [FightingStyle.LungingAttack]: {
    tempo: { opening: 1, mid: 0, late: -1, enduranceMult: 1.02 },
    // Tuned 2026-04 (passive pass 3): rich-mode LU still at 71% W%. The
    // exchange-0 first-strike kept dominating once the warrior had decent
    // attributes + mastery + favorites. Drop the +1 attBonus on first strike
    // (initiative is enough; doubling with damage was the runaway combo) and
    // extend the late-phase malus to MID as well, so LU has to win in the
    // first ~5 exchanges or fade.
    getPassive: (ctx, m) => {
      const isFirst = ctx.exchange === 0;
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        iniBonus: isFirst ? 1 + m.bonus : 0,
        attBonus: isFirst ? 0 : ctx.phase === 'LATE' ? -1 : ctx.phase === 'MID' ? -1 : 0,
        hasPassiveNarrative: isFirst,
      };
    },
    getKillMechanic: (ctx) => ({
      killBonus: ctx.phase === 'OPENING' ? 0.08 : 0,
      decBonus: ctx.phase === 'OPENING' ? 2 : 0,
      extendedKillWindow: false,
      killWindowHpMult: 0.3,
      killNarrative: 'springs forward with a sudden, lethal thrust!',
    }),
    getAntiSynergy: (off, def) => {
      let offMult = 1,
        defMult = 1,
        warning;
      if (off === 'Bash') {
        offMult = 0.5;
        warning = 'Lungers lack the weight for effective bashing';
      }
      if (def === 'Parry') {
        defMult = 0.6;
        warning = (warning ? warning + '; ' : '') + 'Lungers are overextended for strong parries';
      }
      return { offMult, defMult, warning };
    },
  },

  [FightingStyle.ParryLunge]: {
    tempo: { opening: 0, mid: 2, late: 0, enduranceMult: 1.0 },
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
      killBonus: 0,
      decBonus: 0,
      extendedKillWindow: false,
      killWindowHpMult: 0.3,
      killNarrative: 'exploits a gap in the defense to strike home!',
    }),
    getAntiSynergy: () => ({ offMult: 1, defMult: 1 }),
  },

  [FightingStyle.ParryRiposte]: {
    tempo: { opening: 0, mid: 1, late: 0, enduranceMult: 1.04 },
    // Tuned 2026-04 (passive pass): PR at 31.3% aggregate. The flat -1 attBonus
    // every exchange + only-when-2+-ripostes bonus meant PR was a permanent
    // offensive minus that rarely got compensated. Drop the flat -1 to phase-
    // gated (only OPENING) and give a baseline +1 ripBonus at all times so PR's
    // riposte identity rewards the style continuously, not just after stacking.
    getPassive: (ctx, m) => ({
      ...EMPTY_PASSIVE,
      mastery: m.tier,
      attBonus: ctx.phase === 'OPENING' ? -1 : 0,
      parBonus: 1,
      ripBonus: 1 + (ctx.ripostes >= 2 ? 1 : 0),
      hasPassiveNarrative: ctx.ripostes >= 3,
    }),
    getKillMechanic: () => ({
      killBonus: 0.03,
      decBonus: 2,
      extendedKillWindow: false,
      killWindowHpMult: 0.25,
      killNarrative: 'pivots around the attack and delivers a stinging riposte!',
    }),
    getAntiSynergy: (off) => {
      let offMult = 1,
        warning;
      const defMult = 1;
      if (off === 'Bash') {
        offMult = 0.5;
        warning = 'Riposte specialists lack bashing power';
      }
      if (off === 'Decisiveness') {
        offMult = 0.7;
      }
      return { offMult, defMult, warning };
    },
  },

  [FightingStyle.ParryStrike]: {
    tempo: { opening: 0, mid: 0, late: 0, enduranceMult: 0.96 },
    // Tuned 2026-04 (passive pass): PS at 32.4% aggregate. attBonus only
    // activated when on the back foot — meaning if PS was winning, no offense
    // bonus, but it also wasn't accruing kills to close out. Make the +1
    // attBonus baseline so PS scales reasonably regardless of pace.
    getPassive: (ctx, m) => ({
      ...EMPTY_PASSIVE,
      mastery: m.tier,
      parBonus: 2,
      attBonus: 1 + (ctx.hitsTaken > ctx.hitsLanded ? 1 : 0),
    }),
    getKillMechanic: () => ({
      killBonus: 0,
      decBonus: 0,
      extendedKillWindow: false,
      killWindowHpMult: 0.3,
      killNarrative: 'blocks and strikes in a single fluid motion!',
    }),
    getAntiSynergy: (off) => ({ offMult: off === 'Bash' ? 0.6 : 1, defMult: 1 }),
  },

  [FightingStyle.SlashingAttack]: {
    tempo: { opening: 1, mid: 0, late: 0, enduranceMult: 0.96 },
    // Tuned 2026-04 (passive pass 3): SL still 73% W% after passes 1-2.
    // The cumulative phase-tempo (+1/+1/0) + attBonus(+1) + dmg flurry was a
    // permanent triple-stack. Pass 3 drops mid tempo +1 → 0, gates attBonus to
    // OPENING only, and stretches the flurry threshold so you need 4+ landed
    // hits before the +1 dmg kicks in.
    getPassive: (ctx, m) => {
      const flurryDmg = ctx.hitsLanded >= 4 ? 1 : 0;
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        attBonus: ctx.phase === 'OPENING' ? 1 + m.bonus : 0,
        dmgBonus: flurryDmg,
        hasPassiveNarrative: ctx.hitsLanded >= 4,
      };
    },
    getKillMechanic: (ctx) => ({
      killBonus: ctx.hitsLanded >= 4 ? 0.06 : 0,
      decBonus: 0,
      extendedKillWindow: ctx.hitsLanded >= 5,
      killWindowHpMult: ctx.hitsLanded >= 5 ? 0.35 : 0.3,
      killNarrative: 'overwhelms their foe with a flurry of precise cuts!',
    }),
    getAntiSynergy: (off, def) => {
      let offMult = 1,
        defMult = 1,
        warning;
      if (off === 'Bash') {
        offMult = 0.5;
        warning = 'Slashers rely on blade edge, not blunt force';
      }
      if (def === 'Parry') {
        defMult = 0.6;
        warning = (warning ? warning + '; ' : '') + 'Slashers struggle with disciplined parries';
      }
      return { offMult, defMult, warning };
    },
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
      killNarrative: 'lands a devastating, direct strike!',
    }),
    getAntiSynergy: (off, def) => ({ offMult: 1, defMult: def === 'Riposte' ? 0.6 : 1 }),
  },

  [FightingStyle.TotalParry]: {
    tempo: { opening: -1, mid: 1, late: 1, enduranceMult: 0.9 },
    // Tuned 2026-04 (passive pass): TP at 36% aggregate. attBonus -2 was so
    // punishing it couldn't finish fights. Soften to -1 (still defensive
    // identity) and trim parBonus +4 → +3 so it doesn't hard-counter aggressive
    // styles into 0% win rates.
    getPassive: (ctx, m) => ({
      ...EMPTY_PASSIVE,
      mastery: m.tier,
      attBonus: -1,
      parBonus: 3 + m.bonus,
      iniBonus: 2,
      hasPassiveNarrative: ctx.phase === 'LATE' && ctx.endRatio > 0.5,
    }),
    getKillMechanic: () => ({
      killBonus: -0.05,
      decBonus: -1,
      extendedKillWindow: false,
      killWindowHpMult: 0.25,
      killNarrative: 'finds a momentary opening in their own defensive shell!',
    }),
    getAntiSynergy: (off) => {
      let offMult = 1,
        warning;
      if (['Lunge', 'Bash', 'Slash'].includes(off || '')) {
        offMult = off === 'Slash' ? 0.5 : 0.4;
        warning = `Total Parry fighters are not built for ${off?.toLowerCase()}`;
      }
      return { offMult, defMult: 1, warning };
    },
  },

  [FightingStyle.WallOfSteel]: {
    // Tuned 2026-04 (passive pass 3): WS still ~72% W% after passes 1-2.
    // The defBonus floor + par + tempo bundle was still strictly dominant.
    // Pass 3: tempo opening +1 → 0 (was strong-everywhere), drop parBonus
    // floor 1 → 0 — defense ramps with `wallBonus` only. WS is now a true
    // late-game style, not a flat-strong all-phases bulldozer.
    tempo: { opening: 0, mid: 0, late: 1, enduranceMult: 0.92 },
    getPassive: (ctx, m) => {
      const wallBonus = Math.min(1 + m.bonus, Math.floor(ctx.exchange / 5));
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        defBonus: scale(wallBonus, m),
        parBonus: wallBonus > 0 ? 1 : 0,
        iniBonus: scale(wallBonus, m),
        hasPassiveNarrative: wallBonus >= 1,
      };
    },
    getKillMechanic: () => ({
      killBonus: -0.03,
      decBonus: 0,
      extendedKillWindow: false,
      killWindowHpMult: 0.28,
      killNarrative: 'shifts their weight and drives through the defense!',
    }),
    getAntiSynergy: () => ({ offMult: 1, defMult: 1 }),
  },
};

// ─── Public API ───────────────────────────────────────────────────────────

export function getTempoBonus(style: FightingStyle, phase: Phase): number {
  const t = STYLES[style]?.tempo;
  if (!t) return 0;
  return phase === 'OPENING' ? t.opening : phase === 'MID' ? t.mid : t.late;
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

export function getKillMechanic(attackerStyle: FightingStyle, context: KillContext): KillMechanic {
  const strategy = STYLES[attackerStyle];
  if (!strategy)
    return {
      killBonus: 0,
      decBonus: 0,
      extendedKillWindow: false,
      killWindowHpMult: 0.3,
      killNarrative: 'strikes home!',
    };
  return strategy.getKillMechanic(context);
}

export function getStyleAntiSynergy(
  style: FightingStyle,
  offTactic?: string,
  defTactic?: string
): { offMult: number; defMult: number; warning?: string } {
  const strategy = STYLES[style];
  if (!strategy) return { offMult: 1.0, defMult: 1.0 };
  return strategy.getAntiSynergy(offTactic, defTactic);
}
