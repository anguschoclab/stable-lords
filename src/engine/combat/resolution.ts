import {
  evaluateInitiative,
  performAttackCheck,
  performRiposteCheck,
  performDefenseCheck,
  executeRiposte,
  executeHit,
  applyEnduranceCosts
} from "./core/exchangeHelpers";
import { FightingStyle } from "@/types/shared.types";
import type { Warrior, WarriorFavorites } from "@/types/warrior.types";
import type { FightPlan, FightSummary, CombatEvent } from "@/types/combat.types";
import type { 
  BaseSkills, 
  Attributes, 
  DerivedStats, 
  WeatherType,
  OffensiveTactic, 
  DefensiveTactic 
} from "@/types/shared.types";
import { skillCheck, contestCheck } from "./combatMath";
import { computeHitDamage, rollHitLocation, applyProtectMod, calculateKillWindow } from "./combatDamage";
import { enduranceCost, fatiguePenalty } from "./combatFatigue";
import { 
  getTempoBonus, 
  getEnduranceMult, 
  getStylePassive, 
  getKillMechanic, 
  getStyleAntiSynergy, 
  type Phase as StylePhase,
  type MasteryTier
} from "../stylePassives";
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
  encumbrancePenalty?: { iniPenalty: number; enduranceMult: number };
  weaponId?: string;
  armorId?: string;
  desperate?: boolean;
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
  lastOffTacticA?: string;
  lastOffTacticD?: string;
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

  // Canonical desperate state: override plan when HP < 30% OR endurance < 20%
  for (const f of [fA, fD] as FighterState[]) {
    if (!f.desperate && f.plan.desperatePlan && (f.hp < f.maxHp * 0.3 || f.endurance < f.maxEndurance * 0.2)) {
      const dp = f.plan.desperatePlan;
      f.plan = { ...f.plan, OE: dp.OE, AL: dp.AL, ...(dp.killDesire !== undefined && { killDesire: dp.killDesire }), offensiveTactic: dp.offensiveTactic ?? f.plan.offensiveTactic, defensiveTactic: dp.defensiveTactic ?? f.plan.defensiveTactic, target: dp.target ?? f.plan.target, protect: dp.protect ?? f.plan.protect, phases: undefined };
      f.desperate = true;
      events.push({ type: "STATE_CHANGE", actor: f.label, result: "DESPERATE" });
    }
  }

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

  // 2. Initiative Phase
  const masteryIniA = fA.favorites ? getFavoriteRhythmBonus(fA as unknown as Warrior, OE_A, AL_A) : 0;
  const masteryIniD = fD.favorites ? getFavoriteRhythmBonus(fD as unknown as Warrior, OE_D, AL_D) : 0;

  const iniA = fA.skills.INI + alIniMod(AL_A) + ctx.matchupA + fatA + defModsA.iniBonus + getTempoBonus(fA.style, stylePhase) + passA.iniBonus + masteryIniA - fA.legHits;
  const iniD = fD.skills.INI + alIniMod(AL_D) + ctx.matchupD + fatD + defModsD.iniBonus + getTempoBonus(fD.style, stylePhase) + passD.iniBonus + masteryIniD - fD.legHits;
  
  const aGoesFirst = contestCheck(rng, iniA, iniD);
  const attLabel = aGoesFirst ? "A" : "D";
  const defLabel = aGoesFirst ? "D" : "A";
  const attMasteryIni = aGoesFirst ? masteryIniA : masteryIniD;

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
    // Canonical: low AL (≤3) forces parry instinct; high AL (≥7) with no explicit tactic defaults to dodge
    const curDefAL = aGoesFirst ? AL_D : AL_A;
    const defTacticType = (aGoesFirst ? tactD : tactA).defTactic;
    const isDodge = curDefAL <= 3 ? false
      : (curDefAL >= 7 && defTacticType === "none") ? true
      : defTacticType === "Dodge";
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

  // Track tactic streaks for overuse penalty
  const currTacticA = tactA.offTactic;
  const currTacticD = tactD.offTactic;
  ctx.tacticStreakA = (currTacticA !== "none" && ctx.lastOffTacticA === currTacticA) ? ctx.tacticStreakA + 1 : (currTacticA !== "none" ? 1 : 0);
  ctx.tacticStreakD = (currTacticD !== "none" && ctx.lastOffTacticD === currTacticD) ? ctx.tacticStreakD + 1 : (currTacticD !== "none" ? 1 : 0);
  ctx.lastOffTacticA = currTacticA;
  ctx.lastOffTacticD = currTacticD;

  return events;
}
