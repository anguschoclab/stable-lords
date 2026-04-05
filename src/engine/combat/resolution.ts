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

function executeRiposte(
  events: CombatEvent[],
  rng: () => number,
  attacker: FighterState,
  defender: FighterState,
  defTactics: ReturnType<typeof resolveEffectiveTactics>,
  defPassive: ReturnType<typeof getStylePassive>,
  attLabel: "A" | "D",
  defLabel: "A" | "D"
) {
  const ripLoc = rollHitLocation(rng, defTactics.target, attacker.plan.protect);
  const ripDmgRaw = computeHitDamage(rng, defender.derived.damage + defPassive.dmgBonus, ripLoc);
  const ripDmg = applyProtectMod(ripDmgRaw, ripLoc, attacker.plan.protect);

  events.push({ type: "DEFENSE", actor: defLabel, result: "RIPOSTE" });
  events.push({ type: "HIT", actor: defLabel, target: attLabel, location: ripLoc, value: ripDmg });

  attacker.hp -= ripDmg;
  attacker.hitsTaken++;
  defender.hitsLanded++;
  defender.ripostes++;
  defender.consecutiveHits++;
  attacker.consecutiveHits = 0;
}

function executeHit(
  events: CombatEvent[],
  rng: () => number,
  attacker: FighterState,
  defender: FighterState,
  attTactics: ReturnType<typeof resolveEffectiveTactics>,
  attOffMods: ReturnType<typeof getOffensiveTacticMods>,
  attPassive: ReturnType<typeof getStylePassive>,
  attLabel: "A" | "D",
  defLabel: "A" | "D",
  stylePhase: StylePhase,
  phase: string,
  attKD: number,
  attOE: number,
  attAL: number,
  attMatchup: number
) {
  const hitLoc = rollHitLocation(rng, attTactics.target, defender.plan.protect);
  let rawDamage = computeHitDamage(rng, attacker.derived.damage + attOffMods.dmgBonus + attPassive.dmgBonus, hitLoc);

  if (attPassive.critChance > 0 && rng() < attPassive.critChance) {
    rawDamage = Math.round(rawDamage * CRIT_DAMAGE_MULT);
    events.push({ type: "HIT", actor: attLabel, target: defLabel, location: hitLoc, value: rawDamage, metadata: { crit: true } });
  } else {
    events.push({ type: "HIT", actor: attLabel, target: defLabel, location: hitLoc, value: rawDamage });
  }

  const damage = applyProtectMod(rawDamage, hitLoc, defender.plan.protect);
  defender.hp -= damage;
  defender.hitsTaken++;
  attacker.hitsLanded++;
  attacker.consecutiveHits++;
  defender.consecutiveHits = 0;
  if (hitLoc.includes("arm")) defender.armHits++;
  if (hitLoc.includes("leg")) defender.legHits++;

  if (damage > 0 && rng() < 0.2) {
    const attrs = ["ST", "SP", "DF", "WL"];
    events.push({ type: "INSIGHT", actor: attLabel, metadata: { attribute: attrs[Math.floor(rng() * attrs.length)] } });
  }

  const killMech = getKillMechanic(attacker.style, {
    phase: stylePhase, hitsLanded: attacker.hitsLanded,
    consecutiveHits: attacker.consecutiveHits, targetedLocation: attTactics.target,
    hitLocation: hitLoc,
  });

  let didKill = false;
  let causeBucket = "KO";

  if (defender.hp <= defender.maxHp * killMech.killWindowHpMult) {
    const killPos = phase === "LATE" ? 2 : phase === "MID" ? 1 : 0;
    const killThreshold = calculateKillWindow(defender.hp / defender.maxHp, defender.endurance / defender.maxEndurance, hitLoc, attKD + killMech.killBonus, killPos, attOE, attAL, attMatchup);
    if (rng() < killThreshold) {
      defender.hp = 0;
      didKill = true;
      causeBucket = "EXECUTION";
    }
  }

  if (defender.hp <= 0) {
    if (didKill) {
      events.push({ type: "BOUT_END", actor: attLabel, result: "Kill", metadata: { location: hitLoc, cause: causeBucket } });
    } else {
      events.push({ type: "BOUT_END", actor: attLabel, result: "KO", metadata: { location: hitLoc, cause: "FATAL_DAMAGE" } });
    }
  }
}

// ─── Main Pipeline ─────────────────────────────────────────────────────────

export function resolveExchange(ctx: ResolutionContext, fA: FighterState, fD: FighterState): CombatEvent[] {
  const events: CombatEvent[] = [];
  const { rng, phase, exchange } = ctx;
  const stylePhase = phase as StylePhase;
  const phaseKey = phase === "OPENING" ? "opening" : phase === "MID" ? "mid" : "late";

  // 1. Gather Context & Modifiers
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
  const masteryIniA = fA.favorites ? getFavoriteRhythmBonus(fA as unknown as import("@/types/game").Warrior, OE_A, AL_A) : 0;
  const masteryIniD = fD.favorites ? getFavoriteRhythmBonus(fD as unknown as import("@/types/game").Warrior, OE_D, AL_D) : 0;

  const iniA = fA.skills.INI + alIniMod(AL_A) + ctx.matchupA + fatA + defModsA.iniBonus + getTempoBonus(fA.style, stylePhase) + passA.iniBonus + masteryIniA - fA.legHits;
  const iniD = fD.skills.INI + alIniMod(AL_D) + ctx.matchupD + fatD + defModsD.iniBonus + getTempoBonus(fD.style, stylePhase) + passD.iniBonus + masteryIniD - fD.legHits;
  
  const aGoesFirst = contestCheck(rng, iniA, iniD);
  const attLabel = aGoesFirst ? "A" : "D";
  const defLabel = aGoesFirst ? "D" : "A";
  const attMasteryIni = aGoesFirst ? masteryIniA : masteryIniD;

  events.push({ 
    type: "INITIATIVE", 
    actor: attLabel, 
    value: aGoesFirst ? iniA : iniD, 
    result: true,
    metadata: { isMastery: attMasteryIni > 0 }
  });

  // 3. Resolve Attack
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

  const attSucc = skillCheck(rng, att.skills.ATT, oeAttMod(curAttOE, att.style) + (aGoesFirst ? ctx.matchupA : ctx.matchupD) + (aGoesFirst ? fatA : fatD) + curOffMods.attBonus + curPassA.attBonus + Math.round((curAntiSyn.offMult - 1) * 5) + INITIATIVE_PRESS_BONUS + GLOBAL_ATT_BONUS + curBiasAtt - overAtt - att.armHits + curAttWepReq.attPenalty);

  if (!attSucc) {
    events.push({ type: "ATTACK", actor: attLabel, result: "WHIFF" });
    att.consecutiveHits = 0;
    att.endurance -= Math.max(1, Math.floor(enduranceCost(curAttOE, curAttAL, ctx.weather) * 0.5)) + curOffMods.endCost;

    const curAntiSynDef = getStyleAntiSynergy(def.style, (aGoesFirst ? tactD : tactA).offTactic, (aGoesFirst ? tactD : tactA).defTactic);
    const ripCheck = skillCheck(rng, def.skills.RIP, (aGoesFirst ? ctx.matchupD : ctx.matchupA) + (aGoesFirst ? fatD : fatA) + curOffMods.defPenalty + (aGoesFirst ? passD : passA).ripBonus + Math.round((curAntiSynDef.defMult - 1) * 3));
    if (ripCheck) executeRiposte(events, rng, att, def, aGoesFirst ? tactD : tactA, aGoesFirst ? passD : passA, attLabel, defLabel);
  } else {
    // 4. Resolve Defense
    const curDefOE = aGoesFirst ? OE_D : OE_A;
    const curDefMods = aGoesFirst ? defModsD : defModsA;
    const curPassD = aGoesFirst ? passD : passA;
    const curBiasDef = aGoesFirst ? biasDefD : biasDefA;
    const isDodge = (aGoesFirst ? tactD : tactA).defTactic === "Dodge";
    const overDef = aGoesFirst ? Math.min(TACTIC_OVERUSE_CAP, ctx.tacticStreakD) : Math.min(TACTIC_OVERUSE_CAP, ctx.tacticStreakA);

    let defDefended = false;
    if (isDodge) {
      defDefended = skillCheck(rng, def.skills.DEF, oeDefMod(curDefOE) + (aGoesFirst ? ctx.matchupD : ctx.matchupA) + (aGoesFirst ? fatD : fatA) + curDefMods.defBonus + curPassD.defBonus + curBiasDef - overDef - def.legHits);
      if (defDefended) events.push({ type: "DEFENSE", actor: defLabel, result: "DODGE" });
    } else {
      const curAntiSynDef = getStyleAntiSynergy(def.style, (aGoesFirst ? tactD : tactA).offTactic, (aGoesFirst ? tactD : tactA).defTactic);
      defDefended = skillCheck(rng, def.skills.PAR, oeDefMod(curDefOE) + (aGoesFirst ? ctx.matchupD : ctx.matchupA) + (aGoesFirst ? fatD : fatA) + curDefMods.parBonus + curPassD.parBonus + Math.round((curAntiSynDef.defMult - 1) * 3) - curOffMods.defPenalty - curOffMods.parryBypass + GLOBAL_PAR_PENALTY + curBiasDef - overDef - def.armHits);
      if (defDefended) events.push({ type: "DEFENSE", actor: defLabel, result: "PARRY" });
    }

    if (!defDefended) {
      executeHit(events, rng, att, def, aGoesFirst ? tactA : tactD, curOffMods, curPassA, attLabel, defLabel, stylePhase, phase, aGoesFirst ? (fA.plan.phases?.[phaseKey]?.killDesire ?? 5) : (fD.plan.phases?.[phaseKey]?.killDesire ?? 5), curAttOE, curAttAL, aGoesFirst ? ctx.matchupA : ctx.matchupD);
    } else if (!isDodge) {
      const ripPostParry = skillCheck(rng, def.skills.RIP, (aGoesFirst ? ctx.matchupD : ctx.matchupA) + (aGoesFirst ? fatD : fatA) + (aGoesFirst ? defModsD : defModsA).ripBonus + curPassD.ripBonus);
      if (ripPostParry) executeRiposte(events, rng, att, def, aGoesFirst ? tactD : tactA, aGoesFirst ? passD : passA, attLabel, defLabel);
    }
    
    att.consecutiveHits = defDefended ? 0 : att.consecutiveHits;
  }

  // 5. Apply Endurance Costs
  att.endurance -= Math.round(enduranceCost(curAttOE, curAttAL, ctx.weather) * getEnduranceMult(att.style) * curAttWepReq.endurancePenalty);
  
  const curDefWepReq = aGoesFirst ? ctx.weaponReqD : ctx.weaponReqA;
  def.endurance -= Math.max(1, Math.round(enduranceCost(aGoesFirst ? OE_D : OE_A, aGoesFirst ? AL_D : AL_A, ctx.weather) * DEFENDER_ENDURANCE_DISCOUNT * getEnduranceMult(def.style) * curDefWepReq.endurancePenalty));
  
  if ((fA.endurance <= 0 || fD.endurance <= 0) && !events.some(e => e.result === "Kill" || e.result === "KO")) {
    if (fA.endurance <= 0 && fD.endurance <= 0) events.push({ type: "BOUT_END", actor: "A", result: "Exhaustion" });
    else events.push({ type: "BOUT_END", actor: fA.endurance <= 0 ? "A" : "D", result: "Stoppage" });
  }

  return events;
}
