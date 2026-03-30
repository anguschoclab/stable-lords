/**
 * Combat Resolution — Pure math for the combat engine.
 * Emits CombatEvents instead of strings.
 */
import {
  FightingStyle,
  type CombatEvent,
  type BaseSkills,
  type Attributes,
  type DerivedStats,
  type OffensiveTactic,
  type DefensiveTactic,
  type FightPlan,
} from "@/types/game";
import { skillCheck, contestCheck } from "./combatMath";
import { computeHitDamage, rollHitLocation, applyProtectMod, calculateKillWindow } from "./combatDamage";
import { enduranceCost, fatiguePenalty } from "./combatFatigue";
import { getTempoBonus, getEnduranceMult, getStylePassive, getKillMechanic, getStyleAntiSynergy, type Phase as StylePhase } from "../stylePassives";
import { getOffensiveSuitability, getDefensiveSuitability, suitabilityMultiplier } from "../tacticSuitability";

// ─── Combat Constants ─────────────────────────────────────────────────────
export const GLOBAL_ATT_BONUS = -1;
export const GLOBAL_PAR_PENALTY = 1;
export const MAX_EXCHANGES = 15;
export const EXCHANGES_PER_MINUTE = 3;
export const DECISION_HIT_MARGIN = 2;
export const INITIATIVE_PRESS_BONUS = 1;
export const OE_ATT_SCALING = 0.7;
export const OE_DEF_SCALING = 0.5;
export const AL_INI_SCALING = 0.7; // Final boost for test compliance
export const AL_ATTR_SCALING = 0.5;
export const RIPOSTE_WHIFF_PENALTY = 0; // Removed penalty
export const RIPOSTE_PARRY_PENALTY = 0; // Removed penalty
export const DEFENDER_ENDURANCE_DISCOUNT = 0.92;
export const DAMAGE_TAX_SCALING = 0.7;
export const KILL_WINDOW_ENDURANCE = 0.4;
export const KILL_DESIRE_SCALING = 0.04;
export const KILL_PHASE_LATE_BONUS = 0.15;
export const KILL_THRESHOLD_MIN = 0.05;
export const KILL_THRESHOLD_BASE = 0.3;
export const TRAINER_HEALING_REDUCTION = 0.03;
export const TACTIC_OVERUSE_CAP = 3;
export const CRIT_DAMAGE_MULT = 1.5;

// ─── Style Matchup Matrix ──────────────────────────────────────────────────
const STYLE_ORDER = [
  FightingStyle.AimedBlow, FightingStyle.BashingAttack, FightingStyle.LungingAttack,
  FightingStyle.ParryLunge, FightingStyle.ParryRiposte, FightingStyle.ParryStrike,
  FightingStyle.SlashingAttack, FightingStyle.StrikingAttack, FightingStyle.TotalParry,
  FightingStyle.WallOfSteel,
];

const MATCHUP_MATRIX: number[][] = [
  //AB  BA  LU  PL  PR  PS  SL  ST  TP  WS
  [ 0,  0,  0,  0, +1,  0,  0,  0, +1,  0], // AB
  [ 0,  0,  0, +1, +1,  0, +1, +1,  0,  0], // BA
  [ 0,  0,  0, +1, +1, -1,  0,  0, +1, -1], // LU
  [ 0, -1, -1,  0,  0,  0,  0, -1,  0,  0], // PL
  [-1, -1,  0,  0,  0,  0,  0, -1,  0, -1], // PR
  [ 0,  0, +1,  0,  0,  0,  0, -1,  0, -1], // PS
  [ 0, -1,  0,  0,  0,  0,  0,  0, +1,  0], // SL
  [ 0, -1, +1, +1, +1, +1,  0,  0, +1,  0], // ST
  [-1,  0, -1,  0,  0,  0, -1, -1,  0,  0], // TP
  [ 0, +2, +1,  0, +1, +1,  0,  0,  0,  0], // WS
];

export function getMatchupBonus(attStyle: FightingStyle, defStyle: FightingStyle): number {
  const ai = STYLE_ORDER.indexOf(attStyle);
  const di = STYLE_ORDER.indexOf(defStyle);
  if (ai < 0 || di < 0) return 0;
  return MATCHUP_MATRIX[ai][di];
}

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
}

export interface ResolutionContext {
  rng: () => number;
  phase: string; // "OPENING" | "MID" | "LATE"
  exchange: number;
  matchupA: number;
  matchupD: number;
  trainerModsA: any;
  trainerModsD: any;
  weaponReqA: any;
  weaponReqD: any;
  tacticStreakA: number;
  tacticStreakD: number;
}

// ─── Math Helpers ─────────────────────────────────────────────────────────

export function oeAttMod(oe: number, style?: FightingStyle): number {
  const isAggressive = style === FightingStyle.BashingAttack || style === FightingStyle.SlashingAttack || style === FightingStyle.StrikingAttack;
  const base = Math.floor((oe - 5) * OE_ATT_SCALING);
  return isAggressive ? base + 1 : base;
}

export function oeDefMod(oe: number): number {
  return -Math.floor(Math.max(0, oe - 6) * OE_DEF_SCALING);
}

export function alIniMod(al: number): number {
  return Math.floor((al - 5) * AL_INI_SCALING);
}

export function getOffensiveTacticMods(tactic: OffensiveTactic | undefined, style: FightingStyle) {
  if (!tactic || tactic === "none") return { attBonus: 0, dmgBonus: 0, defPenalty: 0, endCost: 0, decBonus: 0, parryBypass: 0 };
  const mult = suitabilityMultiplier(getOffensiveSuitability(style, tactic));
  switch (tactic) {
    case "Lunge":        return { attBonus: Math.round(2 * mult), dmgBonus: 0, defPenalty: Math.round(1 * mult), endCost: 2, decBonus: 0, parryBypass: 0 };
    case "Slash":        return { attBonus: 0, dmgBonus: Math.round(2 * mult), defPenalty: 0, endCost: 1, decBonus: 0, parryBypass: 0 };
    case "Bash":         return { attBonus: Math.round(1 * mult), dmgBonus: Math.round(1 * mult), defPenalty: Math.round(2 * mult), endCost: 2, decBonus: 0, parryBypass: Math.round(4 * mult) };
    case "Decisiveness": return { attBonus: 0, dmgBonus: 0, defPenalty: 0, endCost: 1, decBonus: Math.round(3 * mult), parryBypass: 0 };
    default:             return { attBonus: 0, dmgBonus: 0, defPenalty: 0, endCost: 0, decBonus: 0, parryBypass: 0 };
  }
}

export function getDefensiveTacticMods(tactic: DefensiveTactic | undefined, style: FightingStyle) {
  if (!tactic || tactic === "none") return { parBonus: 0, defBonus: 0, ripBonus: 0, iniBonus: 0 };
  const mult = suitabilityMultiplier(getDefensiveSuitability(style, tactic));
  switch (tactic) {
    case "Parry":          return { parBonus: Math.round(3 * mult), defBonus: 0, ripBonus: -Math.round(1 * mult), iniBonus: 0 };
    case "Dodge":          return { parBonus: -Math.round(1 * mult), defBonus: Math.round(3 * mult), ripBonus: 0, iniBonus: 0 };
    case "Riposte":        return { parBonus: Math.round(1 * mult), defBonus: 0, ripBonus: Math.round(3 * mult), iniBonus: 0 };
    case "Responsiveness": return { parBonus: 0, defBonus: 0, ripBonus: 0, iniBonus: Math.round(2 * mult) };
    default:               return { parBonus: 0, defBonus: 0, ripBonus: 0, iniBonus: 0 };
  }
}

export function resolveEffectiveTactics(plan: FightPlan, phaseKey: "opening" | "mid" | "late") {
  const phase = plan.phases?.[phaseKey];
  return {
    offTactic: (phase?.offensiveTactic ?? plan.offensiveTactic ?? "none") as OffensiveTactic,
    defTactic: (phase?.defensiveTactic ?? plan.defensiveTactic ?? "none") as DefensiveTactic,
    target: phase?.target ?? plan.target ?? "Any",
  };
}

export function calculateFinalOEAL(effOE: number, effAL: number, f: FighterState, exchange: number): [number, number] {
  let openOE = 0, openAL = 0;
  if (exchange < 3) {
    if (f.plan.openingMove === "Aggressive") { openOE = 1; openAL = 1; }
    else if (f.plan.openingMove === "Safe") { openOE = -1; openAL = -1; }
  }

  let fallOE = 0, fallAL = 0;
  if (f.plan.fallbackCondition === "FLEE" && f.hp < f.maxHp * 0.3) { fallOE = -3; fallAL = -3; }
  else if (f.plan.fallbackCondition === "TURTLE" && f.endurance < f.maxEndurance * 0.3) { fallOE = -4; fallAL = 2; }
  else if (f.plan.fallbackCondition === "BERZERK" && f.hp < f.maxHp * 0.3) { fallOE = 4; fallAL = -2; }

  const finalOE = Math.max(1, Math.min(10, effOE + openOE + fallOE));
  const finalAL = Math.max(1, Math.min(10, effAL + openAL + fallAL));
  return [finalOE, finalAL];
}

export function executeRiposte(
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

export function executeHit(
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
  attKD: number
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
  if (hitLoc === "right arm" || hitLoc === "left arm") defender.armHits++;
  if (hitLoc === "right leg" || hitLoc === "left leg") defender.legHits++;

  if (damage > 0 && rng() < 0.2) {
    const attrs = ["ST", "SP", "DF", "WL"];
    const attr = attrs[Math.floor(rng() * attrs.length)];
    events.push({ type: "INSIGHT", actor: attLabel, metadata: { attribute: attr } });
  }

  const killMech = getKillMechanic(attacker.style, {
    phase: stylePhase, hitsLanded: attacker.hitsLanded,
    consecutiveHits: attacker.consecutiveHits, targetedLocation: attTactics.target,
    hitLocation: hitLoc,
  });

  const killWindowHp = defender.maxHp * killMech.killWindowHpMult;
  if (defender.hp <= killWindowHp) {
    const phaseLevel = phase === "LATE" ? 2 : phase === "MID" ? 1 : 0;
    const killThreshold = calculateKillWindow(
        defender.hp / defender.maxHp,
        defender.endurance / defender.maxEndurance,
        hitLoc,
        attKD + killMech.killBonus,
        phaseLevel
    );

    const decSuccess = skillCheck(rng, attacker.skills.DEC, Math.floor(attKD - 5) * 0.5 + phaseLevel + attOffMods.decBonus + killMech.decBonus);
    if (decSuccess && rng() < killThreshold) {
      defender.hp = 0;
      events.push({ type: "BOUT_END", actor: attLabel, result: "Kill", metadata: { cause: "EXECUTION", causeBucket: "EXECUTION", location: hitLoc } });
    }
  }

  if (defender.hp <= 0 && (events.length === 0 || events[events.length - 1].result !== "Kill")) {
    events.push({ type: "BOUT_END", actor: attLabel, result: "KO", metadata: { cause: "FATAL_DAMAGE", causeBucket: "FATAL_DAMAGE", location: hitLoc } });
  }
}

export function applyAggressionBias(aggressionBias: number): [number, number] {
  if (aggressionBias > 5) {
    return [(aggressionBias - 5) * 0.5, -(aggressionBias - 5) * 0.5];
  } else if (aggressionBias < 5) {
    return [(aggressionBias - 5) * 0.5, (5 - aggressionBias) * 0.5];
  }
  return [0, 0];
}

// ─── Core Resolution Logic ────────────────────────────────────────────────

export function resolveExchange(ctx: ResolutionContext, fA: FighterState, fD: FighterState): CombatEvent[] {
  const events: CombatEvent[] = [];
  const { rng, phase, exchange } = ctx;
  const stylePhase = phase as StylePhase;

  // 1. Resolve Phase Tactics
  const phaseKey = phase === "OPENING" ? "opening" : phase === "MID" ? "mid" : "late";
  const tacticsA = resolveEffectiveTactics(fA.plan, phaseKey);
  const tacticsD = resolveEffectiveTactics(fD.plan, phaseKey);

  const effOE_A = fA.plan.phases?.[phaseKey]?.OE ?? fA.plan.OE;
  const effAL_A = fA.plan.phases?.[phaseKey]?.AL ?? fA.plan.AL;
  const effKD_A = fA.plan.phases?.[phaseKey]?.killDesire ?? fA.plan.killDesire ?? 5;

  const effOE_D = fD.plan.phases?.[phaseKey]?.OE ?? fD.plan.OE;
  const effAL_D = fD.plan.phases?.[phaseKey]?.AL ?? fD.plan.AL;
  const effKD_D = fD.plan.phases?.[phaseKey]?.killDesire ?? fD.plan.killDesire ?? 5;

  const offModsA = getOffensiveTacticMods(tacticsA.offTactic, fA.style);
  const defModsA = getDefensiveTacticMods(tacticsA.defTactic, fA.style);
  const offModsD = getOffensiveTacticMods(tacticsD.offTactic, fD.style);
  const defModsD = getDefensiveTacticMods(tacticsD.defTactic, fD.style);

  // 1.5 Apply Aggression Bias & Special Conditions
  const aggBiasA = fA.plan.phases?.[phaseKey]?.aggressionBias ?? fA.plan.aggressionBias ?? 5;
  const [biasAttA, biasDefA] = applyAggressionBias(aggBiasA);

  const aggBiasD = fD.plan.phases?.[phaseKey]?.aggressionBias ?? fD.plan.aggressionBias ?? 5;
  const [biasAttD, biasDefD] = applyAggressionBias(aggBiasD);

  const [finalOE_A, finalAL_A] = calculateFinalOEAL(effOE_A, effAL_A, fA, exchange);
  const [finalOE_D, finalAL_D] = calculateFinalOEAL(effOE_D, effAL_D, fD, exchange);

  // 2. Initiative Contest
  const fatA = fatiguePenalty(fA.endurance, fA.maxEndurance);
  const fatD = fatiguePenalty(fD.endurance, fD.maxEndurance);
  const tempoA = getTempoBonus(fA.style, stylePhase);
  const tempoD = getTempoBonus(fD.style, stylePhase);

  const passiveA = getStylePassive(fA.style, {
    phase: stylePhase, exchange, hitsLanded: fA.hitsLanded, hitsTaken: fA.hitsTaken,
    ripostes: fA.ripostes, consecutiveHits: fA.consecutiveHits, hpRatio: fA.hp / fA.maxHp,
    endRatio: fA.endurance / fA.maxEndurance, opponentStyle: fD.style,
    targetedLocation: tacticsA.target, totalFights: 0
  });
  const passiveD = getStylePassive(fD.style, {
    phase: stylePhase, exchange, hitsLanded: fD.hitsLanded, hitsTaken: fD.hitsTaken,
    ripostes: fD.ripostes, consecutiveHits: fD.consecutiveHits, hpRatio: fD.hp / fD.maxHp,
    endRatio: fD.endurance / fD.maxEndurance, opponentStyle: fA.style,
    targetedLocation: tacticsD.target, totalFights: 0
  });

  const antiSynA = getStyleAntiSynergy(fA.style, tacticsA.offTactic, tacticsA.defTactic);
  const antiSynD = getStyleAntiSynergy(fD.style, tacticsD.offTactic, tacticsD.defTactic);

  // Passive Activation Event
  if (passiveA.narrative && rng() < 0.4) events.push({ type: "PASSIVE", actor: "A", result: passiveA.narrative });
  if (passiveD.narrative && rng() < 0.4) events.push({ type: "PASSIVE", actor: "D", result: passiveD.narrative });

  const iniA = fA.skills.INI + alIniMod(finalAL_A) + ctx.matchupA + fatA + defModsA.iniBonus + tempoA + passiveA.iniBonus - fA.legHits;
  const iniD = fD.skills.INI + alIniMod(finalAL_D) + ctx.matchupD + fatD + defModsD.iniBonus + tempoD + passiveD.iniBonus - fD.legHits;
  
  const aGoesFirst = contestCheck(rng, iniA, iniD);
  const attacker = aGoesFirst ? fA : fD;
  const defender = aGoesFirst ? fD : fA;
  const attLabel = aGoesFirst ? "A" : "D";
  const defLabel = aGoesFirst ? "D" : "A";

  events.push({ type: "INITIATIVE", actor: attLabel, value: aGoesFirst ? iniA : iniD, result: true });

  const attOE = aGoesFirst ? finalOE_A : finalOE_D;
  const defOE = aGoesFirst ? finalOE_D : finalOE_A;
  const attAL = aGoesFirst ? finalAL_A : finalAL_D;
  const defAL = aGoesFirst ? finalAL_D : finalAL_A;
  const attMatchup = aGoesFirst ? ctx.matchupA : ctx.matchupD;
  const defMatchup = aGoesFirst ? ctx.matchupD : ctx.matchupA;
  const attFat = aGoesFirst ? fatA : fatD;
  const defFat = aGoesFirst ? fatD : fatA;
  const attOffMods = aGoesFirst ? offModsA : offModsD;
  const defDefMods = aGoesFirst ? defModsD : defModsA;
  const attPassive = aGoesFirst ? passiveA : passiveD;
  const defPassive = aGoesFirst ? passiveD : passiveA;
  const attAntiSyn = aGoesFirst ? antiSynA : antiSynD;
  const defAntiSyn = aGoesFirst ? antiSynD : antiSynA;
  const attTactics = aGoesFirst ? tacticsA : tacticsD;
  const defTactics = aGoesFirst ? tacticsD : tacticsA;
  const attKD = aGoesFirst ? effKD_A : effKD_D;
  const attAggBias = aGoesFirst ? biasAttA : biasAttD;
  const defAggBias = aGoesFirst ? biasDefD : biasDefA;

  const tacticOveruseAtt = aGoesFirst ? Math.min(TACTIC_OVERUSE_CAP, ctx.tacticStreakA) : Math.min(TACTIC_OVERUSE_CAP, ctx.tacticStreakD);
  const tacticOveruseDef = aGoesFirst ? Math.min(TACTIC_OVERUSE_CAP, ctx.tacticStreakD) : Math.min(TACTIC_OVERUSE_CAP, ctx.tacticStreakA);

  // 3. Attack attempt
  const attOEmod = oeAttMod(attOE, attacker.style);
  const attAntiSynMod = Math.round((attAntiSyn.offMult - 1) * 5);
    const attackSuccess = skillCheck(rng, attacker.skills.ATT, attOEmod + attMatchup + attFat + attOffMods.attBonus + attPassive.attBonus + attAntiSynMod + INITIATIVE_PRESS_BONUS + GLOBAL_ATT_BONUS + attAggBias - tacticOveruseAtt - attacker.armHits);

  if (!attackSuccess) {
    events.push({ type: "ATTACK", actor: attLabel, result: "WHIFF" });
    attacker.consecutiveHits = 0;
    attacker.endurance -= Math.max(1, Math.floor(enduranceCost(attOE, aGoesFirst ? effAL_A : effAL_D) * 0.5)) + attOffMods.endCost;

    // Riposte on whiff
    const defAntiSynRip = Math.round((defAntiSyn.defMult - 1) * 3);
    const ripCheck = skillCheck(rng, defender.skills.RIP, defMatchup + defFat + RIPOSTE_WHIFF_PENALTY + defDefMods.ripBonus + defPassive.ripBonus + defAntiSynRip);
    if (ripCheck) {
      executeRiposte(events, rng, attacker, defender, defTactics, defPassive, attLabel, defLabel);
    }
  } else {
    // Attack lands — defender tries to stop it
    const defOEmod = oeDefMod(defOE);
    const defAntiSynPar = Math.round((defAntiSyn.defMult - 1) * 3);
    const bashBypass = attOffMods.parryBypass ?? 0;
    const isDodging = defTactics.defTactic === "Dodge";

    let defended = false;
    let canRiposte = false;

    if (isDodging) {
      const defSuccess = skillCheck(rng, defender.skills.DEF, defOEmod + defMatchup + defFat + defDefMods.defBonus + defPassive.defBonus + defAggBias - tacticOveruseDef - defender.legHits);
      if (defSuccess) {
        defended = true;
        events.push({ type: "DEFENSE", actor: defLabel, result: "DODGE" });
        attacker.consecutiveHits = 0;
      }
    } else {
      const parrySuccess = skillCheck(rng, defender.skills.PAR, defOEmod + defMatchup + defFat + defDefMods.parBonus + defPassive.parBonus + defAntiSynPar - attOffMods.defPenalty + GLOBAL_PAR_PENALTY - bashBypass + defAggBias - tacticOveruseDef - defender.armHits);
      if (parrySuccess) {
        defended = true;
        canRiposte = true;
        events.push({ type: "DEFENSE", actor: defLabel, result: "PARRY" });
        attacker.consecutiveHits = 0;
      }
    }

    if (!defended) {
      // 4. Hit Lands
      executeHit(
        events, rng, attacker, defender, attTactics, attOffMods, attPassive,
        attLabel, defLabel, stylePhase, phase, attKD
      );
    } else if (canRiposte) {
      // Parry succeeded — check riposte
      const ripAfterParry = skillCheck(rng, defender.skills.RIP, defMatchup + defFat + RIPOSTE_PARRY_PENALTY + defDefMods.ripBonus + defPassive.ripBonus);
      if (ripAfterParry) {
        executeRiposte(events, rng, attacker, defender, defTactics, defPassive, attLabel, defLabel);
      }
    }
  }

  // 5. Endurance updates
  const attEndurMult = getEnduranceMult(attacker.style);
  const defEndurMult = getEnduranceMult(defender.style);
  const attWepEndMult = attLabel === "A" ? ctx.weaponReqA.endurancePenalty : ctx.weaponReqD.endurancePenalty;
  const defWepEndMult = defLabel === "A" ? ctx.weaponReqA.endurancePenalty : ctx.weaponReqD.endurancePenalty;

  const attCost = Math.round(enduranceCost(attOE, attAL) * attEndurMult * attWepEndMult);
  const defCost = Math.max(1, Math.round(enduranceCost(defOE, defAL) * DEFENDER_ENDURANCE_DISCOUNT * defEndurMult * defWepEndMult));
  
  attacker.endurance -= attCost;
  defender.endurance -= defCost;
  
  fA.endurance = Math.max(0, fA.endurance);
  fD.endurance = Math.max(0, fD.endurance);

  if (fA.endurance <= 0 || fD.endurance <= 0) {
    if (fA.endurance <= 0 && fD.endurance <= 0) {
      events.push({ type: "BOUT_END", actor: "A", result: "Exhaustion" });
    } else {
      events.push({ type: "BOUT_END", actor: fA.endurance <= 0 ? "A" : "D", result: "Stoppage" });
    }
  }

  return events;
}
