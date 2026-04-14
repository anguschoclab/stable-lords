import { FightingStyle, type WeatherType } from "@/types/shared.types";
import type { Warrior } from "@/types/warrior.types";
import type { FightPlan, FightOutcome, DeathCauseBucket } from "@/types/combat.types";
import type { Trainer } from "@/types/state.types";
import { DEFAULT_LOADOUT, checkWeaponRequirements } from "@/data/equipment";
import { getMatchupBonus, type ResolutionContext, type FighterState } from "@/engine/combat/resolution";
import type { IRNGService } from "@/engine/core/rng/IRNGService";
import { SeededRNGService } from "@/engine/core/rng/SeededRNGService";
import { createFighterState } from "@/engine/bout/fighterState";
import { getTrainingBonus } from "@/engine/trainers";
import { getWeatherEffect } from "@/engine/combat/weatherEffects";
import { getSpecialtyMods, defaultSpecialtyMods } from "@/engine/trainerSpecialties";

export function createRNGForContext(seed: number, rng?: IRNGService): IRNGService {
  return rng || new SeededRNGService(seed);
}

export function setupRng(providedRng?: (() => number) | number): () => number {
  if (typeof providedRng === "function") {
    return providedRng;
  }
  const seed = typeof providedRng === "number"
    ? providedRng
    : crypto.getRandomValues(new Uint32Array(1))[0];
  const sRng = new SeededRNGService(seed);
  return () => sRng.next();
}

export function getTrainerMods(
  trainers: Trainer[] | undefined,
  style: FightingStyle,
  fighter?: FighterState,
  opponent?: FighterState,
  ctx?: ResolutionContext
) {
  if (!trainers) {
    return { attMod: 0, defMod: 0, iniMod: 0, parMod: 0, decMod: 0, endMod: 0, healMod: 0, killWindowBonus: 0, damageReceivedMult: 1.0, riposteDamageMult: 1.0, fatiguePenaltyReduction: 0 };
  }
  const bonus = getTrainingBonus(trainers, style);
  const base = {
    attMod: bonus.Aggression,
    parMod: Math.floor(bonus.Defense * 0.6),
    defMod: Math.floor(bonus.Defense * 0.4),
    iniMod: Math.floor(bonus.Mind * 0.6),
    decMod: Math.floor(bonus.Mind * 0.4),
    endMod: bonus.Endurance * 2,
    healMod: bonus.Healing,
  };

  if (fighter && opponent && ctx) {
    const spec = getSpecialtyMods(trainers, fighter, opponent, ctx);
    return {
      attMod: base.attMod + spec.attMod,
      parMod: base.parMod + spec.parMod,
      defMod: base.defMod + spec.defMod,
      iniMod: base.iniMod + spec.iniMod,
      decMod: base.decMod + spec.decMod,
      endMod: base.endMod + spec.endMod,
      healMod: base.healMod,
      killWindowBonus: spec.killWindowBonus,
      damageReceivedMult: spec.damageReceivedMult,
      riposteDamageMult: spec.riposteDamageMult,
      fatiguePenaltyReduction: spec.fatiguePenaltyReduction,
    };
  }

  return { ...base, killWindowBonus: 0, damageReceivedMult: 1.0, riposteDamageMult: 1.0, fatiguePenaltyReduction: 0 };
}

export function setupFightersAndContext(
  planA: FightPlan,
  planD: FightPlan,
  warriorA: Warrior | undefined,
  warriorD: Warrior | undefined,
  trainers: Trainer[] | undefined,
  weather: WeatherType,
  rng: () => number
) {
  const nameA = warriorA?.name ?? "Attacker";
  const nameD = warriorD?.name ?? "Defender";
  const weaponA = (warriorA?.equipment ?? DEFAULT_LOADOUT).weapon;
  const weaponD = (warriorD?.equipment ?? DEFAULT_LOADOUT).weapon;

  const fA = createFighterState("A", planA, warriorA, trainers);
  const fD = createFighterState("D", planD, warriorD, trainers);

  const modsA = getTrainerMods(trainers, planA.style);
  const modsD = getTrainerMods(trainers, planD.style);

  const weaponReqA = checkWeaponRequirements(weaponA, warriorA?.attributes ?? { ST: 10, SZ: 10, WT: 10, DF: 10 });
  const weaponReqD = checkWeaponRequirements(weaponD, warriorD?.attributes ?? { ST: 10, SZ: 10, WT: 10, DF: 10 });

  const resCtx: ResolutionContext = {
    rng,
    phase: "OPENING",
    exchange: 0,
    weather,
    weatherEffect: getWeatherEffect(weather),
    matchupA: getMatchupBonus(planA.style, planD.style),
    matchupD: getMatchupBonus(planD.style, planA.style),
    trainerModsA: modsA,
    trainerModsD: modsD,
    weaponReqA: { endurancePenalty: weaponReqA.endurancePenalty, attPenalty: weaponReqA.attPenalty },
    weaponReqD: { endurancePenalty: weaponReqD.endurancePenalty, attPenalty: weaponReqD.attPenalty },
    tacticStreakA: 0,
    tacticStreakD: 0,
  };

  return { nameA, nameD, weaponA, weaponD, fA, fD, resCtx };
}

export function processOutcomeTags(
  winner: "A" | "D",
  by: FightOutcome["by"],
  fA: FighterState,
  fD: FighterState
): string[] {
  const tags = new Set<string>();
  const w = winner === "A" ? fA : fD;
  const l = winner === "A" ? fD : fA;

  if (w.hp < w.maxHp * 0.3 && w.hitsLanded > l.hitsLanded) tags.add("Comeback");
  if (w.hitsLanded >= 5) tags.add("Dominance");
  if (by === "KO") tags.add("KO");
  if (by === "Kill") tags.add("Kill");

  return Array.from(tags);
}
