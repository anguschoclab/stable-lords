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
        attBonus: scale(targeted ? 4 : 3, m),
        parBonus: 2,
        critChance: targeted ? 0.12 + (ctx.exchange > 8 ? 0.05 : 0) : 0.06,
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
    tempo: { opening: 1, mid: 0, late: 0, enduranceMult: 0.98 },
    getPassive: (ctx, m) => {
      const momentumDmg = Math.min(2 + m.bonus, Math.floor(ctx.consecutiveHits / 2));
      const vsTP = ctx.opponentStyle === FightingStyle.TotalParry;
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        dmgBonus: scale(momentumDmg, m) + (vsTP ? 1 : 0),
        attBonus: scale(ctx.consecutiveHits >= 4 ? 2 : 0, m) + (vsTP ? 1 : 0),
        hasPassiveNarrative: (vsTP && ctx.consecutiveHits >= 2) || ctx.consecutiveHits >= 4,
      };
    },
    getKillMechanic: (ctx) => {
      const momentum = Math.min(3, ctx.consecutiveHits);
      return {
        killBonus: momentum * 0.04,
        decBonus: momentum,
        extendedKillWindow: ctx.consecutiveHits >= 3,
        killWindowHpMult: ctx.consecutiveHits >= 3 ? 0.5 : 0.4,
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
    //
    // Pass 4: MID fade removed — only LATE is penalised. Disciplined trait
    // (attModLate +1) now exactly offsets the LATE penalty, enabling a lunger
    // that never fades if trained correctly.
    getPassive: (ctx, m) => {
      const isFirst = ctx.exchange === 0;
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        iniBonus: isFirst ? m.bonus : 0,
        attBonus: isFirst ? 0 : ctx.phase === 'LATE' ? -2 : -1,
        hasPassiveNarrative: isFirst,
      };
    },
    getKillMechanic: (ctx) => ({
      killBonus: ctx.phase === 'OPENING' ? 0.08 : 0,
      decBonus: ctx.phase === 'OPENING' ? 2 : 0,
      extendedKillWindow: false,
      killWindowHpMult: 0.45,
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
        attBonus: scale(counterReady ? 2 : 1, m),
        parBonus: 2 + m.bonus,
        iniBonus: counterReady ? 2 : 0,
        hasPassiveNarrative: counterReady,
      };
    },
    getKillMechanic: () => ({
      killBonus: 0,
      decBonus: 0,
      extendedKillWindow: false,
      killWindowHpMult: 0.45,
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
      parBonus: 4,
      ripBonus: 2 + (ctx.ripostes >= 2 ? 1 : 0),
      hasPassiveNarrative: ctx.ripostes >= 3,
    }),
    getKillMechanic: () => ({
      killBonus: 0.03,
      decBonus: 2,
      extendedKillWindow: false,
      killWindowHpMult: 0.4,
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
      parBonus: 3,
      attBonus: 1 + (ctx.hitsTaken > ctx.hitsLanded ? 2 : 0),
    }),
    getKillMechanic: () => ({
      killBonus: 0,
      decBonus: 0,
      extendedKillWindow: false,
      killWindowHpMult: 0.45,
      killNarrative: 'blocks and strikes in a single fluid motion!',
    }),
    getAntiSynergy: (off) => ({ offMult: off === 'Bash' ? 0.6 : 1, defMult: 1 }),
  },

  [FightingStyle.SlashingAttack]: {
    tempo: { opening: 1, mid: 0, late: 0, enduranceMult: 0.96 },
    // Tuned 2026-04 (passive pass 3): SL still 73% W% after passes 1-2.
    // The cumulative phase-tempo (+1/+1/0) + attBonus(+1) + dmg flurry was a
    // permanent triple-stack. Pass 3 dropped mid tempo +1 → 0 and gated attBonus
    // to OPENING only — but that pushed SL too far down to 28% W%. Pass 4:
    // restore attBonus to OPENING+MID (not LATE), keep flurry threshold at 4+.
    // Pass 5: added parBonus=1 baseline to give SL minimal survivability.
    getPassive: (ctx, m) => {
      const flurryDmg = ctx.hitsLanded >= 4 ? 1 : 0;
      return {
        ...EMPTY_PASSIVE,
        mastery: m.tier,
        attBonus: ctx.phase !== 'LATE' ? 1 + m.bonus : 0,
        parBonus: 1,
        dmgBonus: flurryDmg,
        hasPassiveNarrative: ctx.hitsLanded >= 4,
      };
    },
    getKillMechanic: (ctx) => ({
      killBonus: ctx.hitsLanded >= 4 ? 0.06 : 0,
      decBonus: 0,
      extendedKillWindow: ctx.hitsLanded >= 5,
      killWindowHpMult: ctx.hitsLanded >= 5 ? 0.5 : 0.4,
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
    // attBonus requires the first hit to unlock rhythm — a sparing ST (low OE,
    // few hard hits) still profits from unconditional dmgBonus every connection.
    getPassive: (ctx, m) => ({
      ...EMPTY_PASSIVE,
      mastery: m.tier,
      attBonus: ctx.hitsLanded >= 1 ? 1 + m.bonus : 0,
      dmgBonus: 1,
      hasPassiveNarrative: ctx.hitsLanded >= 1,
    }),
    getKillMechanic: (ctx) => ({
      killBonus: 0.07,
      decBonus: 2,
      extendedKillWindow: ctx.hitsLanded >= 2,
      killWindowHpMult: 0.4,
      killNarrative: 'lands a devastating, direct strike!',
    }),
    getAntiSynergy: (off, def) => ({ offMult: 1, defMult: def === 'Riposte' ? 0.6 : 1 }),
  },

  [FightingStyle.TotalParry]: {
    tempo: { opening: -1, mid: 1, late: 1, enduranceMult: 0.9 },
    // Tuned 2026-04 (3 passes):
    //  - Pass 1: attBonus -2 → -1, parBonus +4 → +3
    //  - Pass 3: parBonus +3 → +1.
    //  - Pass 4: iniBonus 2 → 1, parBonus capped at m.bonus (no base floor).
    //    TP was winning 95-100% vs AB/PL because iniBonus=2 + shield+2 + parBonus+1
    //    created an impenetrable wall. Removing the parBonus floor keeps TP
    //    defensive at higher mastery but lets novice warriors land some hits.
    getPassive: (ctx, m) => ({
      ...EMPTY_PASSIVE,
      mastery: m.tier,
      attBonus: -1,
      parBonus: 1 + (ctx.phase === 'LATE' ? m.bonus : 0),
      iniBonus: 1,
      hasPassiveNarrative: ctx.phase === 'LATE' && ctx.endRatio > 0.5,
    }),
    // Kill penalty graduates through phases — LATE penalty drops to zero so
    // a Merciless or Berserker TP can actually threaten after doing endurance
    // groundwork. OPENING stays harshly negative to prevent early aggression.
    getKillMechanic: (ctx) => ({
      killBonus: ctx.phase === 'LATE' ? 0 : ctx.phase === 'MID' ? -0.02 : -0.05,
      decBonus: ctx.phase === 'LATE' ? 1 : -1,
      extendedKillWindow: false,
      killWindowHpMult: 0.35,
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
      // /10 instead of /8 slows the ramp decisively — WS is a pure late-bout fortress.
      const wallBonus = Math.min(1 + m.bonus, Math.floor(ctx.exchange / 10));
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
      killWindowHpMult: 0.4,
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
