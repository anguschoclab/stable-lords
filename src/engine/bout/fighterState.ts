import {
  FightingStyle,
  type Warrior,
  type FightPlan,
  type BaseSkills,
  type TrainerData,
} from "@/types/game";
import { DEFAULT_LOADOUT, getClassicWeaponBonus, checkWeaponRequirements } from "@/data/equipment";
import { getTrainingBonus } from "@/engine/trainers";
import { getFavoriteWeaponBonus } from "@/engine/favorites";
import { type FighterState } from "../combat/resolution";

function getTrainerMods(trainers: TrainerData[], style: FightingStyle) {
  const bonus = getTrainingBonus(trainers as any[], style);
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

/**
 * Prepares the combat state for a single fighter.
 */
export function createFighterState(
  label: "A" | "D",
  plan: FightPlan,
  warrior?: Warrior,
  trainers?: TrainerData[]
): FighterState {
  const attrs = warrior?.attributes ?? { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };
  const skills = warrior?.baseSkills ?? { ATT: 5, PAR: 5, DEF: 5, INI: 5, RIP: 5, DEC: 5 };
  const derived = warrior?.derivedStats ?? { hp: 100, endurance: 100, damage: 5, encumbrance: 0 };
  
  const equip = warrior?.equipment ?? DEFAULT_LOADOUT;
  const classicBonus = getClassicWeaponBonus(plan.style, equip.weapon);
  const trainerMods = trainers ? getTrainerMods(trainers, plan.style) : null;
  const favWeapon = warrior ? getFavoriteWeaponBonus(warrior) : 0;

  const getShieldBonus = (id: string) => {
    if (id === "small_shield") return { def: 1, att: 0 };
    if (id === "medium_shield") return { def: 2, att: 0 };
    if (id === "large_shield") return { def: 3, att: -1 };
    return { def: 0, att: 0 };
  };
  const wShield = getShieldBonus(equip.weapon);
  const oShield = getShieldBonus(equip.shield);
  const totalShieldDef = wShield.def + oShield.def;
  const totalShieldAtt = wShield.att + oShield.att;

  const weaponReq = checkWeaponRequirements(
    equip.weapon,
    { ST: attrs.ST, DF: attrs.DF, SP: attrs.SP }
  );

  const effSkills: BaseSkills = {
    ATT: skills.ATT + (trainerMods?.attMod ?? 0) + classicBonus + favWeapon + weaponReq.attPenalty + totalShieldAtt,
    PAR: skills.PAR + (trainerMods?.parMod ?? 0) + totalShieldDef,
    DEF: skills.DEF + (trainerMods?.defMod ?? 0) + totalShieldDef,
    INI: skills.INI + (trainerMods?.iniMod ?? 0),
    RIP: skills.RIP,
    DEC: skills.DEC + (trainerMods?.decMod ?? 0),
  };

  return {
    label,
    style: plan.style,
    attributes: attrs,
    skills: effSkills,
    derived: { ...derived, damage: derived.damage },
    plan,
    hp: derived.hp,
    maxHp: derived.hp,
    endurance: derived.endurance + (trainerMods?.endMod ?? 0),
    maxEndurance: derived.endurance + (trainerMods?.endMod ?? 0),
    hitsLanded: 0,
    hitsTaken: 0,
    ripostes: 0,
    consecutiveHits: 0,
    armHits: 0,
    legHits: 0,
  };
}
