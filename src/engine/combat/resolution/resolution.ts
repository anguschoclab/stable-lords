import {
  performAttackCheck,
  performRiposteCheck,
  performDefenseCheck,
  executeRiposte,
  executeHit,
  applyEnduranceCosts
} from "./exchangeHelpers";
import { FightingStyle } from "@/types/shared.types";
import type { Warrior, WarriorFavorites } from "@/types/warrior.types";
import type { FightPlan, FightSummary, CombatEvent } from "@/types/combat.types";
import type {
  BaseSkills,
  Attributes,
  DerivedStats,
  WeatherType,
  PsychState,
  OffensiveTactic,
  DefensiveTactic,
  DistanceRange,
  ArenaZone,
  ArenaConfig,
  SurfaceMod
} from "@/types/shared.types";
import type { WeatherEffect } from "../mechanics/weatherEffects";
import { getWeatherEffect } from "../mechanics/weatherEffects";
import { evaluateConditions, PSYCH_STATE_MODS } from "../mechanics/conditionEngine";
import { getSpecialtyMods } from "../../trainerSpecialties";
import { skillCheck, contestCheck } from "../mechanics/combatMath";
import { computeHitDamage, rollHitLocation, applyProtectMod, calculateKillWindow } from "../mechanics/combatDamage";
import { enduranceCost, fatiguePenalty } from "../mechanics/combatFatigue";
import { 
  getTempoBonus, 
  getEnduranceMult, 
  getStylePassive, 
  getKillMechanic, 
  getStyleAntiSynergy, 
  type Phase as StylePhase,
  type MasteryTier
} from "../../stylePassives";
import { getFavoriteRhythmBonus } from "../../favorites";
import { 
  GLOBAL_ATT_BONUS, 
  GLOBAL_PAR_PENALTY, 
  INITIATIVE_PRESS_BONUS, 
  DEFENDER_ENDURANCE_DISCOUNT, 
  CRIT_DAMAGE_MULT,
  TACTIC_OVERUSE_CAP,
  getMatchupBonus as rawMatchupBonus
} from "../mechanics/combatConstants";
import {
  oeAttMod,
  oeDefMod,
  getOffensiveTacticMods,
  getDefensiveTacticMods,
  calculateFinalOEAL,
  alIniMod
} from "../mechanics/tacticResolution";

export const DECISION_HIT_MARGIN = 3;

export function getMatchupBonus(styleA: FightingStyle, styleD: FightingStyle): number {
  return rawMatchupBonus(styleA, styleD);
}

import {
  makeExchangeState,
  runApproach,
  runFeint,
  runCommit,
  runRecovery,
  type ExchangeState,
} from "./exchangeSubPhases";
import { getZonePenalty, getWeaponRangeMod } from "../mechanics/distanceResolution";

// ─── Fighter State & Context ───────────────────────────────────────────────

export interface FighterState {
  label: "A" | "D";
  style: FightingStyle;
  attributes: Attributes;
  skills: BaseSkills;
  derived: DerivedStats;
  plan: FightPlan;
  /** Current effective plan — may diverge from plan when a PlanCondition fires */
  activePlan: FightPlan;
  /** Psychological state derived each exchange from fight metrics */
  psychState: PsychState;
  hp: number;
  maxHp: number;
  endurance: number;
  maxEndurance: number;
  hitsLanded: number;
  hitsTaken: number;
  ripostes: number;
  consecutiveHits: number;
  armHits: number;
  legHits: number;
  favorites?: WarriorFavorites;
  totalFights: number;
  encumbrancePenalty?: { iniPenalty: number; enduranceMult: number };
  weaponId?: string;
  armorId?: string;
  desperate?: boolean;
  /** Momentum counter: −3 to +3. Builds on hits/parries, swings on ripostes. Gates kill window. */
  momentum: number;
  /** True when fighter has committed (HP < 35%, high killDesire): +20% ATT/DMG, fully open. */
  committed: boolean;
  /** True when fighter survived a commit attack — grants a free riposte on next exchange. */
  survivalStrike: boolean;
  /**
   * Recovery debt from CommitLevel. 0–3.
   * Penalises the Approach sub-phase roll by 2 per point. Decays by 1 each exchange.
   * Set via: recoveryDebt = Math.min(3, Math.max(existing, toWrite))
   */
  recoveryDebt: number;
}

export interface ResolutionContext {
  rng: () => number;
  phase: "OPENING" | "MID" | "LATE";
  exchange: number;
  weather: WeatherType;
  weatherEffect: WeatherEffect;
  matchupA: number;
  matchupD: number;
  trainerModsA: { [key: string]: number };
  trainerModsD: { [key: string]: number };
  /** Raw trainer list — used for per-exchange specialty recalculation */
  trainers?: import("@/types/state.types").Trainer[];
  /** Snapshot of base trainer mods (without specialties) — preserved so per-exchange specialty deltas stay additive */
  baseTrainerModsA?: { [key: string]: number };
  baseTrainerModsD?: { [key: string]: number };
  weaponReqA: { endurancePenalty: number; attPenalty: number };
  weaponReqD: { endurancePenalty: number; attPenalty: number };
  tacticStreakA: number;
  tacticStreakD: number;
  lastOffTacticA?: string;
  lastOffTacticD?: string;
  /** Current distance range between fighters */
  range: DistanceRange;
  /** Current zone of the pushed-back fighter */
  zone: ArenaZone;
  /** Arena configuration (zone penalties, surface mods) */
  arenaConfig: ArenaConfig;
  /** Which fighter is currently in the disadvantaged zone position */
  pushedFighter?: "A" | "D";
  /** Surface modifiers from arenaConfig, unpacked for convenience */
  surfaceMod: SurfaceMod;
}

export function resolveEffectiveTactics(plan: FightPlan, phaseKey: "opening" | "mid" | "late") {
  const phase = plan.phases?.[phaseKey];
  return {
    offTactic: (phase?.offensiveTactic ?? plan.offensiveTactic ?? "none") as OffensiveTactic,
    defTactic: (phase?.defensiveTactic ?? plan.defensiveTactic ?? "none") as DefensiveTactic,
    target: phase?.target ?? plan.target ?? "Any",
  };
}

export function applyAggressionBias(aggressionBias: number): [number, number] {
  return aggressionBias > 5 
    ? [(aggressionBias - 5) * 0.5, -(aggressionBias - 5) * 0.5]
    : [(aggressionBias - 5) * 0.5, (5 - aggressionBias) * 0.5];
}

// ─── Phase Handlers ─────────────────────────────────────────────────────────

export function resolveExchange(ctx: ResolutionContext, fA: FighterState, fD: FighterState): CombatEvent[] {
  const events: CombatEvent[] = [];
  const { rng, phase, exchange } = ctx;
  const stylePhase = phase as StylePhase;
  const phaseKey = phase === "OPENING" ? "opening" : phase === "MID" ? "mid" : "late";

  // ── Evaluate conditional fight plans (WT-gated) ──
  const wtA = fA.attributes.WT;
  const wtD = fD.attributes.WT;
  const condResultA = evaluateConditions(fA, fD, ctx, wtA);
  const condResultD = evaluateConditions(fD, fA, ctx, wtD);
  fA.activePlan = condResultA.newPlan;
  fD.activePlan = condResultD.newPlan;
  if (condResultA.psychState !== fA.psychState) {
    fA.psychState = condResultA.psychState;
    if (condResultA.psychState !== "Neutral") {
      events.push({ type: "STATE_CHANGE", actor: "A", result: `PSYCH_${condResultA.psychState.toUpperCase()}` });
    }
  }
  if (condResultD.psychState !== fD.psychState) {
    fD.psychState = condResultD.psychState;
    if (condResultD.psychState !== "Neutral") {
      events.push({ type: "STATE_CHANGE", actor: "D", result: `PSYCH_${condResultD.psychState.toUpperCase()}` });
    }
  }

  // ── Per-exchange specialty mods (conditional on current fight state) ──
  // Specialties like KillerInstinct/Finisher/IronGuard depend on live HP/momentum/endurance.
  // We snapshot the static base mods on exchange 0 and always diff from that snapshot,
  // so each exchange gets a fresh specialty computation without compounding.
  if (ctx.trainers?.length) {
    if (!ctx.baseTrainerModsA) ctx.baseTrainerModsA = { ...ctx.trainerModsA };
    if (!ctx.baseTrainerModsD) ctx.baseTrainerModsD = { ...ctx.trainerModsD };
    const specA = getSpecialtyMods(ctx.trainers, fA, fD, ctx);
    const specD = getSpecialtyMods(ctx.trainers, fD, fA, ctx);
    const baseA = ctx.baseTrainerModsA;
    const baseD = ctx.baseTrainerModsD;
    ctx.trainerModsA = {
      attMod: (baseA.attMod ?? 0) + specA.attMod,
      parMod: (baseA.parMod ?? 0) + specA.parMod,
      defMod: (baseA.defMod ?? 0) + specA.defMod,
      iniMod: (baseA.iniMod ?? 0) + specA.iniMod,
      decMod: (baseA.decMod ?? 0) + specA.decMod,
      endMod: (baseA.endMod ?? 0) + specA.endMod,
      healMod: baseA.healMod ?? 0,
      killWindowBonus: specA.killWindowBonus,
      damageReceivedMult: specA.damageReceivedMult,
      riposteDamageMult: specA.riposteDamageMult,
      fatiguePenaltyReduction: specA.fatiguePenaltyReduction,
    };
    ctx.trainerModsD = {
      attMod: (baseD.attMod ?? 0) + specD.attMod,
      parMod: (baseD.parMod ?? 0) + specD.parMod,
      defMod: (baseD.defMod ?? 0) + specD.defMod,
      iniMod: (baseD.iniMod ?? 0) + specD.iniMod,
      decMod: (baseD.decMod ?? 0) + specD.decMod,
      endMod: (baseD.endMod ?? 0) + specD.endMod,
      healMod: baseD.healMod ?? 0,
      killWindowBonus: specD.killWindowBonus,
      damageReceivedMult: specD.damageReceivedMult,
      riposteDamageMult: specD.riposteDamageMult,
      fatiguePenaltyReduction: specD.fatiguePenaltyReduction,
    };
  }

  // ── Psych state modifier lookup ──
  const psychA = PSYCH_STATE_MODS[fA.psychState];
  const psychD = PSYCH_STATE_MODS[fD.psychState];

  // Canonical desperate state: override plan when HP < 30% OR endurance < 20%
  for (const f of [fA, fD] as FighterState[]) {
    if (!f.desperate && f.plan.desperatePlan && (f.hp < f.maxHp * 0.3 || f.endurance < f.maxEndurance * 0.2)) {
      const dp = f.plan.desperatePlan;
      f.activePlan = { ...f.plan, OE: dp.OE, AL: dp.AL, ...(dp.killDesire !== undefined && { killDesire: dp.killDesire }), offensiveTactic: dp.offensiveTactic ?? f.plan.offensiveTactic, defensiveTactic: dp.defensiveTactic ?? f.plan.defensiveTactic, target: dp.target ?? f.plan.target, protect: dp.protect ?? f.plan.protect, phases: undefined };
      f.desperate = true;
      events.push({ type: "STATE_CHANGE", actor: f.label, result: "DESPERATE" });
    }
  }

  // Use activePlan for all tactic/OE/AL lookups
  const tactA = resolveEffectiveTactics(fA.activePlan, phaseKey);
  const tactD = resolveEffectiveTactics(fD.activePlan, phaseKey);
  const offModsA = getOffensiveTacticMods(tactA.offTactic, fA.style);
  const defModsA = getDefensiveTacticMods(tactA.defTactic, fA.style);
  const offModsD = getOffensiveTacticMods(tactD.offTactic, fD.style);
  const defModsD = getDefensiveTacticMods(tactD.defTactic, fD.style);

  const [biasAttA, biasDefA] = applyAggressionBias(fA.activePlan.phases?.[phaseKey]?.aggressionBias ?? fA.activePlan.aggressionBias ?? 5);
  const [biasAttD, biasDefD] = applyAggressionBias(fD.activePlan.phases?.[phaseKey]?.aggressionBias ?? fD.activePlan.aggressionBias ?? 5);

  const [OE_A, AL_A] = calculateFinalOEAL(fA.activePlan.phases?.[phaseKey]?.OE ?? fA.activePlan.OE, fA.activePlan.phases?.[phaseKey]?.AL ?? fA.activePlan.AL, fA.activePlan, fA.hp, fA.maxHp, fA.endurance, fA.maxEndurance, exchange);
  const [OE_D, AL_D] = calculateFinalOEAL(fD.activePlan.phases?.[phaseKey]?.OE ?? fD.activePlan.OE, fD.activePlan.phases?.[phaseKey]?.AL ?? fD.activePlan.AL, fD.activePlan, fD.hp, fD.maxHp, fD.endurance, fD.maxEndurance, exchange);

  // Apply psych state mods and RopeADope fatigue penalty reduction
  const fatA = fatiguePenalty(fA.endurance, fA.maxEndurance, ctx.trainerModsA.fatiguePenaltyReduction ?? 0) + psychA.defMod + psychA.parMod;
  const fatD = fatiguePenalty(fD.endurance, fD.maxEndurance, ctx.trainerModsD.fatiguePenaltyReduction ?? 0) + psychD.defMod + psychD.parMod;
  const passA = getStylePassive(fA.style, { phase: stylePhase, exchange, hitsLanded: fA.hitsLanded, hitsTaken: fA.hitsTaken, ripostes: fA.ripostes, consecutiveHits: fA.consecutiveHits, hpRatio: fA.hp / fA.maxHp, endRatio: fA.endurance / fA.maxEndurance, opponentStyle: fD.style, targetedLocation: tactA.target, totalFights: fA.totalFights });
  const passD = getStylePassive(fD.style, { phase: stylePhase, exchange, hitsLanded: fD.hitsLanded, hitsTaken: fD.hitsTaken, ripostes: fD.ripostes, consecutiveHits: fD.consecutiveHits, hpRatio: fD.hp / fD.maxHp, endRatio: fD.endurance / fD.maxEndurance, opponentStyle: fA.style, targetedLocation: tactD.target, totalFights: fD.totalFights });

  if (passA.narrative && rng() < 0.4) events.push({ type: "PASSIVE", actor: "A", result: passA.narrative });
  if (passD.narrative && rng() < 0.4) events.push({ type: "PASSIVE", actor: "D", result: passD.narrative });

  // ── Spatial Sub-Phases ──
  const es = makeExchangeState();

  // Sub-phase 1: Approach — contest distance, update ctx.range
  runApproach(rng, fA, fD, OE_A, OE_D, ctx, es);
  events.push(...es.events.splice(0));

  // 2. Initiative Phase
  const masteryIniA = fA.favorites ? getFavoriteRhythmBonus(fA as unknown as Warrior, OE_A, AL_A) : 0;
  const masteryIniD = fD.favorites ? getFavoriteRhythmBonus(fD as unknown as Warrior, OE_D, AL_D) : 0;

  const iniA = fA.skills.INI + alIniMod(AL_A) + ctx.matchupA + fatA + defModsA.iniBonus + getTempoBonus(fA.style, stylePhase) + passA.iniBonus + masteryIniA - fA.legHits + psychA.iniMod + (fA.momentum * 2) + (ctx.trainerModsA.iniMod ?? 0) + ctx.weatherEffect.initiativeMod + ctx.surfaceMod.initiativeMod;
  const iniD = fD.skills.INI + alIniMod(AL_D) + ctx.matchupD + fatD + defModsD.iniBonus + getTempoBonus(fD.style, stylePhase) + passD.iniBonus + masteryIniD - fD.legHits + psychD.iniMod + (fD.momentum * 2) + (ctx.trainerModsD.iniMod ?? 0) + ctx.weatherEffect.initiativeMod + ctx.surfaceMod.initiativeMod;
  
  const aGoesFirst = contestCheck(rng, iniA, iniD);
  const attLabel = aGoesFirst ? "A" : "D";
  const defLabel = aGoesFirst ? "D" : "A";
  const attMasteryIni = aGoesFirst ? masteryIniA : masteryIniD;

  events.push({ type: "INITIATIVE", actor: attLabel, value: aGoesFirst ? iniA : iniD, result: true, metadata: { isMastery: attMasteryIni > 0 } });

  const att = aGoesFirst ? fA : fD;
  const def = aGoesFirst ? fD : fA;

  // Sub-phase 2: Feint (attacker only)
  const feintResult = runFeint(rng, att, def);
  events.push(...feintResult.events);
  const feintAttBonus = feintResult.feintBonus;
  const feintDefBonus = feintResult.feintFailed ? 2 : 0;

  // Sub-phase 3: Commit — determine CommitLevel for attacker and defender
  const attCommit = runCommit(att, aGoesFirst ? OE_A : OE_D);
  const defCommit = runCommit(def, aGoesFirst ? OE_D : OE_A);
  es.recoveryDebtToWriteA = aGoesFirst ? attCommit.debtToWrite : defCommit.debtToWrite;
  es.recoveryDebtToWriteD = aGoesFirst ? defCommit.debtToWrite : attCommit.debtToWrite;

  const curAttOE = aGoesFirst ? OE_A : OE_D;
  const curAttAL = aGoesFirst ? AL_A : AL_D;
  const curOffMods = aGoesFirst ? offModsA : offModsD;
  const curPassA = aGoesFirst ? passA : passD;
  const curBiasAtt = aGoesFirst ? biasAttA : biasAttD;
  const curAntiSyn = getStyleAntiSynergy(att.style, (aGoesFirst ? tactA : tactD).offTactic, (aGoesFirst ? tactA : tactD).defTactic);
  const overAtt = aGoesFirst ? Math.min(TACTIC_OVERUSE_CAP, ctx.tacticStreakA) : Math.min(TACTIC_OVERUSE_CAP, ctx.tacticStreakD);
  const curAttWepReq = aGoesFirst ? ctx.weaponReqA : ctx.weaponReqD;

  const attMomentumBonus = att.momentum * 2;
  const attPsychMod = aGoesFirst ? psychA.attMod : psychD.attMod;
  // Weapon range modifier: how well this weapon performs at the current range.
  // A dagger user at Grapple gets +3-4; a pike user at Grapple gets -10.
  const attWeaponRangeMod = getWeaponRangeMod(att.weaponId, ctx.range);
  const defWeaponRangeMod = getWeaponRangeMod(def.weaponId, ctx.range);
  const attSucc = performAttackCheck(rng, att, curAttOE, aGoesFirst ? ctx.matchupA : ctx.matchupD, aGoesFirst ? fatA : fatD, curOffMods, curPassA, curAntiSyn, curBiasAtt, overAtt, curAttWepReq, attMomentumBonus + attPsychMod + (aGoesFirst ? es.rangeModA : es.rangeModD) + attCommit.attBonus + feintAttBonus + attWeaponRangeMod);

  if (!attSucc) {
    events.push({ type: "ATTACK", actor: attLabel, result: "WHIFF" });
    att.consecutiveHits = 0;
    att.endurance -= Math.max(1, Math.floor(enduranceCost(curAttOE, curAttAL, ctx.weather) * 0.5)) + curOffMods.endCost;

    const curAntiSynDef = getStyleAntiSynergy(def.style, (aGoesFirst ? tactD : tactA).offTactic, (aGoesFirst ? tactD : tactA).defTactic);
    // Whiff riposte is harder than post-parry riposte — attacker missed but also retreated
    const ripCheck = performRiposteCheck(rng, def, aGoesFirst ? ctx.matchupD : ctx.matchupA, aGoesFirst ? fatD : fatA, curOffMods.defPenalty - 4, aGoesFirst ? passD : passA, curAntiSynDef);
    if (ripCheck) executeRiposte(events, rng, att, def, aGoesFirst ? tactD : tactA, aGoesFirst ? passD : passA, attLabel, defLabel);
  } else {
    const curDefOE = aGoesFirst ? OE_D : OE_A;
    const curDefMods = aGoesFirst ? defModsD : defModsA;
    const curPassD = aGoesFirst ? passD : passA;
    const curBiasDef = aGoesFirst ? biasDefD : biasDefA;
    // Canonical: low AL (≤3) forces parry instinct; high AL (≥7) with no explicit tactic defaults to dodge
    const curDefAL = aGoesFirst ? AL_D : AL_A;
    const defTacticType = (aGoesFirst ? tactD : tactA).defTactic;
    const isDodge = curDefAL <= 3 ? false
      : (curDefAL >= 7 && defTacticType === "none") ? true
      : defTacticType === "Dodge";
    const overDef = aGoesFirst ? Math.min(TACTIC_OVERUSE_CAP, ctx.tacticStreakD) : Math.min(TACTIC_OVERUSE_CAP, ctx.tacticStreakA);
    const curAntiSynDef = getStyleAntiSynergy(def.style, (aGoesFirst ? tactD : tactA).offTactic, (aGoesFirst ? tactD : tactA).defTactic);

    const zonePenalty = ctx.pushedFighter === def.label
      ? Math.abs(getZonePenalty(ctx.zone, ctx.arenaConfig))
      : 0;
    // Negative defWeaponRangeMod means defender is disadvantaged at this range
    // (e.g. pike user can't parry effectively at Grapple). Convert to a positive penalty.
    const defRangePenalty = Math.max(0, -defWeaponRangeMod);
    const extraDefPenalty = zonePenalty - defCommit.defPenalty + feintDefBonus + defRangePenalty;

    const defCheck = performDefenseCheck(rng, def, curDefOE, aGoesFirst ? ctx.matchupD : ctx.matchupA, aGoesFirst ? fatD : fatA, curDefMods, curPassD, curBiasDef, overDef, isDodge, curAntiSynDef, curOffMods, ctx, att, extraDefPenalty);

    if (defCheck.success) {
      events.push({ type: "DEFENSE", actor: defLabel, result: defCheck.type });
      if (!isDodge) {
        // Successful parry shifts momentum: defender gains +1, attacker loses -1
        const prevDefMomParry = def.momentum;
        const prevAttMomParry = att.momentum;
        def.momentum = Math.min(3, def.momentum + 1);
        att.momentum = Math.max(-3, att.momentum - 1);
        if (def.momentum !== prevDefMomParry || att.momentum !== prevAttMomParry) {
          events.push({ type: "MOMENTUM_SHIFT", actor: defLabel, value: def.momentum, metadata: { prev: prevDefMomParry, reason: "PARRY", attPrev: prevAttMomParry, attNew: att.momentum } });
        }
        const ripPostParry = performRiposteCheck(rng, def, aGoesFirst ? ctx.matchupD : ctx.matchupA, aGoesFirst ? fatD : fatA, (aGoesFirst ? defModsD : defModsA).ripBonus + ctx.weatherEffect.riposteMod, curPassD, undefined);
        const specRiposteMult = aGoesFirst ? (ctx.trainerModsD.riposteDamageMult ?? 1.0) : (ctx.trainerModsA.riposteDamageMult ?? 1.0);
        if (ripPostParry) executeRiposte(events, rng, att, def, aGoesFirst ? tactD : tactA, aGoesFirst ? passD : passA, attLabel, defLabel, specRiposteMult);
      }
      att.consecutiveHits = 0;
    } else {
      const killDesire = aGoesFirst
        ? (fA.activePlan.phases?.[phaseKey]?.killDesire ?? fA.activePlan.killDesire ?? 5)
        : (fD.activePlan.phases?.[phaseKey]?.killDesire ?? fD.activePlan.killDesire ?? 5);
      executeHit(events, rng, att, def, aGoesFirst ? tactA : tactD, curOffMods, curPassA, attLabel, defLabel, stylePhase, phase, killDesire, curAttOE, curAttAL, aGoesFirst ? ctx.matchupA : ctx.matchupD, ctx);
    }
  }

  applyEnduranceCosts(events, ctx, fA, fD, aGoesFirst, curAttOE, curAttAL, curAttWepReq, aGoesFirst ? ctx.weaponReqD : ctx.weaponReqA, OE_D, AL_D, OE_A, AL_A);

  // Sub-phase 5: Recovery — write debt, handle zone transitions
  runRecovery(fA, fD, es.recoveryDebtToWriteA, es.recoveryDebtToWriteD, events, ctx);

  // Track tactic streaks for overuse penalty
  const currTacticA = tactA.offTactic;
  const currTacticD = tactD.offTactic;
  ctx.tacticStreakA = (currTacticA !== "none" && ctx.lastOffTacticA === currTacticA) ? ctx.tacticStreakA + 1 : (currTacticA !== "none" ? 1 : 0);
  ctx.tacticStreakD = (currTacticD !== "none" && ctx.lastOffTacticD === currTacticD) ? ctx.tacticStreakD + 1 : (currTacticD !== "none" ? 1 : 0);
  ctx.lastOffTacticA = currTacticA;
  ctx.lastOffTacticD = currTacticD;

  return events;
}
