import {
  FightingStyle,
  Warrior,
  FightPlan,
  Trainer,
  WeatherType,
  FightOutcome,
  DeathCauseBucket
} from "@/types/game";
import { DEFAULT_LOADOUT, checkWeaponRequirements } from "@/data/equipment";
import { getMatchupBonus, ResolutionContext, FighterState } from "@/engine/combat/resolution";
import { SeededRNG } from "@/utils/random";
import { createFighterState } from "@/engine/bout/fighterState";
import { getTrainingBonus } from "@/engine/trainers";

export function setupRng(providedRng?: (() => number) | number): () => number {
  if (typeof providedRng === "function") {
    return providedRng;
  }
  const seed = typeof providedRng === "number"
    ? providedRng
    : crypto.getRandomValues(new Uint32Array(1))[0];
  const sRng = new SeededRNG(seed);
  return () => sRng.next();
}

export function getTrainerMods(trainers: Trainer[] | undefined, style: FightingStyle) {
  if (!trainers) {
    return { attMod: 0, defMod: 0, iniMod: 0, parMod: 0, decMod: 0, endMod: 0, healMod: 0 };
  }
  const bonus = getTrainingBonus(trainers, style);
  return {
    attMod: bonus.Aggression,
    parMod: Math.floor(bonus.Defense * 0.6),
    defMod: Math.floor(bonus.Defense * 0.4),
    iniMod: Math.floor(bonus.Mind * 0.6),
    decMod: Math.floor(bonus.Mind * 0.4),
    endMod: bonus.Endurance * 2,
    healMod: bonus.Healing,
  };
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

  const weaponReqA = checkWeaponRequirements(weaponA, warriorA?.attributes ?? { ST: 10, DF: 10, SP: 10 });
  const weaponReqD = checkWeaponRequirements(weaponD, warriorD?.attributes ?? { ST: 10, DF: 10, SP: 10 });

  const resCtx: ResolutionContext = {
    rng,
    phase: "OPENING",
    exchange: 0,
    weather,
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
