import {
  FightingStyle,
  CombatEvent,
  OffensiveTactic,
  DefensiveTactic
} from "@/types/game";
import { skillCheck, contestCheck } from "./combatMath";
import { computeHitDamage, rollHitLocation, applyProtectMod, calculateKillWindow } from "./combatDamage";
import { enduranceCost, fatiguePenalty } from "./combatFatigue";
import { getTempoBonus, getEnduranceMult, getStylePassive, getKillMechanic, getStyleAntiSynergy, Phase as StylePhase } from "../stylePassives";
import { getFavoriteRhythmBonus } from "../../favorites";
import {
  GLOBAL_ATT_BONUS,
  GLOBAL_PAR_PENALTY,
  INITIATIVE_PRESS_BONUS,
  DEFENDER_ENDURANCE_DISCOUNT,
  CRIT_DAMAGE_MULT,
  TACTIC_OVERUSE_CAP
} from "./combatConstants";
import { oeAttMod, oeDefMod, alIniMod, getOffensiveTacticMods, getDefensiveTacticMods, calculateFinalOEAL } from "./tacticResolution";
import { FighterState, ResolutionContext, resolveEffectiveTactics, applyAggressionBias } from "./resolution";

export function evaluateInitiative(
  rng: () => number,
  fA: FighterState,
  fD: FighterState,
  ctx: ResolutionContext,
  stylePhase: StylePhase,
  OE_A: number,
  AL_A: number,
  OE_D: number,
  AL_D: number,
  fatA: number,
  fatD: number,
  defModsA: ReturnType<typeof getDefensiveTacticMods>,
  defModsD: ReturnType<typeof getDefensiveTacticMods>,
  passA: ReturnType<typeof getStylePassive>,
  passD: ReturnType<typeof getStylePassive>
) {
  const masteryIniA = fA.favorites ? getFavoriteRhythmBonus(fA as any, OE_A, AL_A) : 0;
  const masteryIniD = fD.favorites ? getFavoriteRhythmBonus(fD as any, OE_D, AL_D) : 0;

  const iniA = fA.skills.INI + alIniMod(AL_A) + ctx.matchupA + fatA + defModsA.iniBonus + getTempoBonus(fA.style, stylePhase) + passA.iniBonus + masteryIniA - fA.legHits;
  const iniD = fD.skills.INI + alIniMod(AL_D) + ctx.matchupD + fatD + defModsD.iniBonus + getTempoBonus(fD.style, stylePhase) + passD.iniBonus + masteryIniD - fD.legHits;

  const aGoesFirst = contestCheck(rng, iniA, iniD);
  return { aGoesFirst, attMasteryIni: aGoesFirst ? masteryIniA : masteryIniD, iniA, iniD };
}

export function performAttackCheck(
  rng: () => number,
  att: FighterState,
  curAttOE: number,
  matchup: number,
  fat: number,
  curOffMods: ReturnType<typeof getOffensiveTacticMods>,
  curPass: ReturnType<typeof getStylePassive>,
  curAntiSyn: ReturnType<typeof getStyleAntiSynergy>,
  curBiasAtt: number,
  overAtt: number,
  curAttWepReq: { attPenalty: number }
) {
  return skillCheck(
    rng,
    att.skills.ATT,
    oeAttMod(curAttOE, att.style) + matchup + fat + curOffMods.attBonus + curPass.attBonus +
    Math.round((curAntiSyn.offMult - 1) * 5) + INITIATIVE_PRESS_BONUS + GLOBAL_ATT_BONUS +
    curBiasAtt - overAtt - att.armHits + curAttWepReq.attPenalty
  );
}

export function performRiposteCheck(
  rng: () => number,
  def: FighterState,
  matchup: number,
  fat: number,
  penaltyOrBonus: number,
  curPass: ReturnType<typeof getStylePassive>,
  curAntiSynDef?: ReturnType<typeof getStyleAntiSynergy>
) {
  const antiSyn = curAntiSynDef ? Math.round((curAntiSynDef.defMult - 1) * 3) : 0;
  return skillCheck(
    rng,
    def.skills.RIP,
    matchup + fat + penaltyOrBonus + curPass.ripBonus + antiSyn
  );
}

export function performDefenseCheck(
  rng: () => number,
  def: FighterState,
  curDefOE: number,
  matchup: number,
  fat: number,
  curDefMods: ReturnType<typeof getDefensiveTacticMods>,
  curPassD: ReturnType<typeof getStylePassive>,
  curBiasDef: number,
  overDef: number,
  isDodge: boolean,
  curAntiSynDef: ReturnType<typeof getStyleAntiSynergy>,
  curOffMods: ReturnType<typeof getOffensiveTacticMods>
) {
  if (isDodge) {
    const success = skillCheck(rng, def.skills.DEF, oeDefMod(curDefOE) + matchup + fat + curDefMods.defBonus + curPassD.defBonus + curBiasDef - overDef - def.legHits);
    return { success, type: "DODGE" as const };
  } else {
    const success = skillCheck(rng, def.skills.PAR, oeDefMod(curDefOE) + matchup + fat + curDefMods.parBonus + curPassD.parBonus + Math.round((curAntiSynDef.defMult - 1) * 3) - curOffMods.defPenalty - curOffMods.parryBypass + GLOBAL_PAR_PENALTY + curBiasDef - overDef - def.armHits);
    return { success, type: "PARRY" as const };
  }
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

export function applyEnduranceCosts(
  events: CombatEvent[],
  ctx: ResolutionContext,
  fA: FighterState,
  fD: FighterState,
  aGoesFirst: boolean,
  curAttOE: number,
  curAttAL: number,
  curAttWepReq: { endurancePenalty: number },
  curDefWepReq: { endurancePenalty: number },
  OE_D: number,
  AL_D: number,
  OE_A: number,
  AL_A: number
) {
  const att = aGoesFirst ? fA : fD;
  const def = aGoesFirst ? fD : fA;

  att.endurance -= Math.round(enduranceCost(curAttOE, curAttAL, ctx.weather) * getEnduranceMult(att.style) * curAttWepReq.endurancePenalty);
  def.endurance -= Math.max(1, Math.round(enduranceCost(aGoesFirst ? OE_D : OE_A, aGoesFirst ? AL_D : AL_A, ctx.weather) * DEFENDER_ENDURANCE_DISCOUNT * getEnduranceMult(def.style) * curDefWepReq.endurancePenalty));

  if ((fA.endurance <= 0 || fD.endurance <= 0) && !events.some(e => e.result === "Kill" || e.result === "KO")) {
    if (fA.endurance <= 0 && fD.endurance <= 0) events.push({ type: "BOUT_END", actor: "A", result: "Exhaustion" });
    else events.push({ type: "BOUT_END", actor: fA.endurance <= 0 ? "A" : "D", result: "Stoppage" });
  }
}
