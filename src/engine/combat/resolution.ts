import {
  evaluateInitiative,
  performAttackCheck,
  performRiposteCheck,
  performDefenseCheck,
  executeRiposte,
  executeHit,
  applyEnduranceCosts
} from "./core/exchangeHelpers";
import {
  FightingStyle,
  type CombatEvent,
  type BaseSkills,
  type Attributes,
  type DerivedStats,
  type OffensiveTactic,
  type DefensiveTactic,
  type FightPlan,
  type WeatherType,
  type WarriorFavorites,
} from "@/types/game";
import { skillCheck, contestCheck } from "./combatMath";
import { computeHitDamage, rollHitLocation, applyProtectMod, calculateKillWindow } from "./combatDamage";
import { enduranceCost, fatiguePenalty } from "./combatFatigue";
import { getTempoBonus, getEnduranceMult, getStylePassive, getKillMechanic, getStyleAntiSynergy, type Phase as StylePhase } from "../stylePassives";
import { getFavoriteRhythmBonus } from "../favorites";
import { 
  GLOBAL_ATT_BONUS, 
  GLOBAL_PAR_PENALTY, 
  INITIATIVE_PRESS_BONUS, 
  DEFENDER_ENDURANCE_DISCOUNT, 
  CRIT_DAMAGE_MULT,
  TACTIC_OVERUSE_CAP,
} from "./combatConstants";
import { 
  getMatchupBonus as rawMatchupBonus 
} from "./combatConstants"; 

export const MAX_EXCHANGES = 250;
export const EXCHANGES_PER_MINUTE = 25;
export const DECISION_HIT_MARGIN = 3;

export function getMatchupBonus(styleA: FightingStyle, styleD: FightingStyle): number {
  return rawMatchupBonus(styleA, styleD);
}
import {
  oeAttMod,
  oeDefMod,
  alIniMod,
  getOffensiveTacticMods,
  getDefensiveTacticMods,
  calculateFinalOEAL,
} from "./tacticResolution";

// ─── Fighter State & Context ───────────────────────────────────────────────

export interface FighterState {
  label: "A" | "D";
  style: FightingStyle;
  attributes: Attributes;
  skills: BaseSkills;
  derived: DerivedStats;
  plan: FightPlan;
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
}

export interface ResolutionContext {
  rng: () => number;
  phase: "OPENING" | "MID" | "LATE";
  exchange: number;
  weather: WeatherType;
  matchupA: number;
  matchupD: number;
  trainerModsA: { [key: string]: number };
  trainerModsD: { [key: string]: number };
  weaponReqA: { endurancePenalty: number; attPenalty: number };
  weaponReqD: { endurancePenalty: number; attPenalty: number };
  tacticStreakA: number;
  tacticStreakD: number;
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

  const tactA = resolveEffectiveTactics(fA.plan, phaseKey);
  const tactD = resolveEffectiveTactics(fD.plan, phaseKey);
  const offModsA = getOffensiveTacticMods(tactA.offTactic, fA.style);
  const defModsA = getDefensiveTacticMods(tactA.defTactic, fA.style);
  const offModsD = getOffensiveTacticMods(tactD.offTactic, fD.style);
  const defModsD = getDefensiveTacticMods(tactD.defTactic, fD.style);

  const [biasAttA, biasDefA] = applyAggressionBias(fA.plan.phases?.[phaseKey]?.aggressionBias ?? fA.plan.aggressionBias ?? 5);
  const [biasAttD, biasDefD] = applyAggressionBias(fD.plan.phases?.[phaseKey]?.aggressionBias ?? fD.plan.aggressionBias ?? 5);

  const [OE_A, AL_A] = calculateFinalOEAL(fA.plan.phases?.[phaseKey]?.OE ?? fA.plan.OE, fA.plan.phases?.[phaseKey]?.AL ?? fA.plan.AL, fA.plan, fA.hp, fA.maxHp, fA.endurance, fA.maxEndurance, exchange);
  const [OE_D, AL_D] = calculateFinalOEAL(fD.plan.phases?.[phaseKey]?.OE ?? fD.plan.OE, fD.plan.phases?.[phaseKey]?.AL ?? fD.plan.AL, fD.plan, fD.hp, fD.maxHp, fD.endurance, fD.maxEndurance, exchange);

  const fatA = fatiguePenalty(fA.endurance, fA.maxEndurance);
  const fatD = fatiguePenalty(fD.endurance, fD.maxEndurance);
  const passA = getStylePassive(fA.style, { phase: stylePhase, exchange, hitsLanded: fA.hitsLanded, hitsTaken: fA.hitsTaken, ripostes: fA.ripostes, consecutiveHits: fA.consecutiveHits, hpRatio: fA.hp / fA.maxHp, endRatio: fA.endurance / fA.maxEndurance, opponentStyle: fD.style, targetedLocation: tactA.target, totalFights: fA.totalFights });
  const passD = getStylePassive(fD.style, { phase: stylePhase, exchange, hitsLanded: fD.hitsLanded, hitsTaken: fD.hitsTaken, ripostes: fD.ripostes, consecutiveHits: fD.consecutiveHits, hpRatio: fD.hp / fD.maxHp, endRatio: fD.endurance / fD.maxEndurance, opponentStyle: fA.style, targetedLocation: tactD.target, totalFights: fD.totalFights });

  if (passA.narrative && rng() < 0.4) events.push({ type: "PASSIVE", actor: "A", result: passA.narrative });
  if (passD.narrative && rng() < 0.4) events.push({ type: "PASSIVE", actor: "D", result: passD.narrative });

  const { aGoesFirst, attMasteryIni } = evaluateInitiative(rng, fA, fD, ctx, stylePhase, OE_A, AL_A, OE_D, AL_D, fatA, fatD, defModsA, defModsD, passA, passD);
  const attLabel = aGoesFirst ? "A" : "D";
  const defLabel = aGoesFirst ? "D" : "A";

  events.push({ type: "INITIATIVE", actor: attLabel, value: aGoesFirst ? iniA : iniD, result: true, metadata: { isMastery: attMasteryIni > 0 } });

  const att = aGoesFirst ? fA : fD;
  const def = aGoesFirst ? fD : fA;
  const curAttOE = aGoesFirst ? OE_A : OE_D;
  const curAttAL = aGoesFirst ? AL_A : AL_D;
  const curOffMods = aGoesFirst ? offModsA : offModsD;
  const curPassA = aGoesFirst ? passA : passD;
  const curBiasAtt = aGoesFirst ? biasAttA : biasAttD;
  const curAntiSyn = getStyleAntiSynergy(att.style, (aGoesFirst ? tactA : tactD).offTactic, (aGoesFirst ? tactA : tactD).defTactic);
  const overAtt = aGoesFirst ? Math.min(TACTIC_OVERUSE_CAP, ctx.tacticStreakA) : Math.min(TACTIC_OVERUSE_CAP, ctx.tacticStreakD);
  const curAttWepReq = aGoesFirst ? ctx.weaponReqA : ctx.weaponReqD;

  const attSucc = performAttackCheck(rng, att, curAttOE, aGoesFirst ? ctx.matchupA : ctx.matchupD, aGoesFirst ? fatA : fatD, curOffMods, curPassA, curAntiSyn, curBiasAtt, overAtt, curAttWepReq);

  if (!attSucc) {
    events.push({ type: "ATTACK", actor: attLabel, result: "WHIFF" });
    att.consecutiveHits = 0;
    att.endurance -= Math.max(1, Math.floor(enduranceCost(curAttOE, curAttAL, ctx.weather) * 0.5)) + curOffMods.endCost;

    const curAntiSynDef = getStyleAntiSynergy(def.style, (aGoesFirst ? tactD : tactA).offTactic, (aGoesFirst ? tactD : tactA).defTactic);
    const ripCheck = performRiposteCheck(rng, def, aGoesFirst ? ctx.matchupD : ctx.matchupA, aGoesFirst ? fatD : fatA, curOffMods.defPenalty, aGoesFirst ? passD : passA, curAntiSynDef);
    if (ripCheck) executeRiposte(events, rng, att, def, aGoesFirst ? tactD : tactA, aGoesFirst ? passD : passA, attLabel, defLabel);
  } else {
    const curDefOE = aGoesFirst ? OE_D : OE_A;
    const curDefMods = aGoesFirst ? defModsD : defModsA;
    const curPassD = aGoesFirst ? passD : passA;
    const curBiasDef = aGoesFirst ? biasDefD : biasDefA;
    const isDodge = (aGoesFirst ? tactD : tactA).defTactic === "Dodge";
    const overDef = aGoesFirst ? Math.min(TACTIC_OVERUSE_CAP, ctx.tacticStreakD) : Math.min(TACTIC_OVERUSE_CAP, ctx.tacticStreakA);
    const curAntiSynDef = getStyleAntiSynergy(def.style, (aGoesFirst ? tactD : tactA).offTactic, (aGoesFirst ? tactD : tactA).defTactic);

    const defCheck = performDefenseCheck(rng, def, curDefOE, aGoesFirst ? ctx.matchupD : ctx.matchupA, aGoesFirst ? fatD : fatA, curDefMods, curPassD, curBiasDef, overDef, isDodge, curAntiSynDef, curOffMods);

    if (defCheck.success) {
      events.push({ type: "DEFENSE", actor: defLabel, result: defCheck.type });
      if (!isDodge) {
        const ripPostParry = performRiposteCheck(rng, def, aGoesFirst ? ctx.matchupD : ctx.matchupA, aGoesFirst ? fatD : fatA, (aGoesFirst ? defModsD : defModsA).ripBonus, curPassD, undefined);
        if (ripPostParry) executeRiposte(events, rng, att, def, aGoesFirst ? tactD : tactA, aGoesFirst ? passD : passA, attLabel, defLabel);
      }
      att.consecutiveHits = 0;
    } else {
      executeHit(events, rng, att, def, aGoesFirst ? tactA : tactD, curOffMods, curPassA, attLabel, defLabel, stylePhase, phase, aGoesFirst ? (fA.plan.phases?.[phaseKey]?.killDesire ?? 5) : (fD.plan.phases?.[phaseKey]?.killDesire ?? 5), curAttOE, curAttAL, aGoesFirst ? ctx.matchupA : ctx.matchupD);
    }
  }

  applyEnduranceCosts(events, ctx, fA, fD, aGoesFirst, curAttOE, curAttAL, curAttWepReq, aGoesFirst ? ctx.weaponReqD : ctx.weaponReqA, OE_D, AL_D, OE_A, AL_A);

  return events;
}
