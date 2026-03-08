/**
 * Stable Lords — Full Combat Engine
 * Exchange-based dueling simulation following canonical Duelmasters resolution:
 * INI → ATT → PAR → DEF → RIP → Damage → DEC → Endurance
 *
 * Deterministic given a seed. Uses seeded PRNG for reproducibility.
 */
import {
  FightingStyle,
  STYLE_ABBREV,
  STYLE_DISPLAY_NAMES,
  type Warrior,
  type FightPlan,
  type FightOutcome,
  type MinuteEvent,
  type BaseSkills,
  type DerivedStats,
  type TrainerData,
  type OffensiveTactic,
  type DefensiveTactic,
} from "@/types/game";
import { computeBaseSkills, computeDerivedStats } from "./skillCalc";
import { getItemById, type EquipmentLoadout, DEFAULT_LOADOUT, getLoadoutWeight } from "@/data/equipment";
import { getTrainingBonus, TRAINER_FOCUSES, type TrainerFocus } from "@/modules/trainers";
import { getOffensiveSuitability, getDefensiveSuitability, suitabilityMultiplier } from "./tacticSuitability";

// ─── Seeded PRNG (mulberry32) ─────────────────────────────────────────────
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Style Matchup Matrix (from spec) ─────────────────────────────────────
const STYLE_ORDER = [
  FightingStyle.AimedBlow, FightingStyle.BashingAttack, FightingStyle.LungingAttack,
  FightingStyle.ParryLunge, FightingStyle.ParryRiposte, FightingStyle.ParryStrike,
  FightingStyle.SlashingAttack, FightingStyle.StrikingAttack, FightingStyle.TotalParry,
  FightingStyle.WallOfSteel,
];

// Row = attacker style, Col = defender style
const MATCHUP_MATRIX: number[][] = [
  //AB  BA  LU  PL  PR  PS  SL  ST  TP  WS
  [ 0, +1,  0, -1, -2, -2, +1,  0, -2, -2], // AB
  [-1,  0, +1,  0, -1, -1, +2, +1, -2, -2], // BA
  [ 0, -1,  0, +1,  0, -1, +1, +1, -1, -2], // LU
  [+1,  0, -1,  0, +1,  0,  0, -1, -1, -2], // PL
  [+2, +1,  0, -1,  0, +1, -1, -2, -1, -2], // PR
  [+2, +1, +1,  0, -1,  0, -1, -2, -1, -2], // PS
  [-1, -2, -1,  0, +1, +1,  0, +1, -1, -2], // SL
  [ 0, -1, -1, +1, +2, +2, -1,  0, -1, -2], // ST
  [+2, +2, +1, +1, +1, +1, +1, +1,  0, -1], // TP
  [+2, +2, +2, +2, +2, +2, +2, +2, +1,  0], // WS
];

function getMatchupBonus(attStyle: FightingStyle, defStyle: FightingStyle): number {
  const ai = STYLE_ORDER.indexOf(attStyle);
  const di = STYLE_ORDER.indexOf(defStyle);
  if (ai < 0 || di < 0) return 0;
  return MATCHUP_MATRIX[ai][di];
}

// ─── Phase detection ──────────────────────────────────────────────────────
type Phase = "OPENING" | "MID" | "LATE";
function getPhase(exchange: number, maxExchanges: number): Phase {
  const ratio = exchange / maxExchanges;
  if (ratio < 0.25) return "OPENING";
  if (ratio < 0.65) return "MID";
  return "LATE";
}

// ─── Narrative Templates ──────────────────────────────────────────────────
const STYLE_VERBS: Record<string, { attack: string[]; parry: string[]; riposte: string[] }> = {
  [FightingStyle.AimedBlow]: {
    attack: ["takes careful aim and strikes", "finds the opening and jabs precisely", "targets a weak point with surgical precision"],
    parry: ["deflects with measured control", "brushes the strike aside"],
    riposte: ["capitalizes on the misstep with a precise counter"],
  },
  [FightingStyle.BashingAttack]: {
    attack: ["smashes forward with brutal force", "drives a crushing blow", "hammers down relentlessly"],
    parry: ["catches the blow on a heavy guard", "absorbs the impact and stands firm"],
    riposte: ["turns the block into a savage counterstrike"],
  },
  [FightingStyle.LungingAttack]: {
    attack: ["lunges with blinding speed", "thrusts from an unexpected angle", "darts forward with a rapid jab"],
    parry: ["dances back to deflect", "redirects the thrust with quick footwork"],
    riposte: ["springs forward with a lightning counter-thrust"],
  },
  [FightingStyle.ParryLunge]: {
    attack: ["waits for the opening, then explodes into a lunge", "converts defense into a sudden thrust"],
    parry: ["sets the parry with practiced patience", "reads the attack and deflects cleanly"],
    riposte: ["flows from parry to a devastating lunge"],
  },
  [FightingStyle.ParryRiposte]: {
    attack: ["probes for a counterstrike opportunity", "feints and waits for the error"],
    parry: ["catches the blade with elegant precision", "turns the attack aside effortlessly"],
    riposte: ["punishes the overcommitment with a flashing riposte", "counter-attacks with lethal timing"],
  },
  [FightingStyle.ParryStrike]: {
    attack: ["strikes with economical efficiency", "delivers a swift blow through the shortest arc"],
    parry: ["deflects with minimal motion", "guards the line with disciplined economy"],
    riposte: ["converts the parry into a swift counterstrike"],
  },
  [FightingStyle.SlashingAttack]: {
    attack: ["slashes in a wide cutting arc", "whirls the blade in a vicious sweep", "carves a brutal slash"],
    parry: ["barely catches the incoming blow", "struggles to parry through the arc"],
    riposte: ["turns the miss into a sweeping counter-slash"],
  },
  [FightingStyle.StrikingAttack]: {
    attack: ["strikes downward with decisive force", "delivers a clean, efficient blow", "hammers home a direct strike"],
    parry: ["blocks with practiced efficiency", "catches the strike and holds ground"],
    riposte: ["redirects into a punishing counterstrike"],
  },
  [FightingStyle.TotalParry]: {
    attack: ["probes cautiously", "offers a tentative thrust"],
    parry: ["locks into an impenetrable defensive wall", "denies the attack with total commitment to defense"],
    riposte: ["punishes the frustrated attacker with a measured counter"],
  },
  [FightingStyle.WallOfSteel]: {
    attack: ["attacks through the constant blade motion", "finds an opening in the rhythmic arc"],
    parry: ["maintains the whirling guard, catching the blow", "the constant blade motion deflects the strike"],
    riposte: ["the blade arc reverses into a punishing counter"],
  },
};

function pickText(rng: () => number, texts: string[]): string {
  return texts[Math.floor(rng() * texts.length)];
}

const HIT_LOCATIONS = ["head", "chest", "abdomen", "arms", "legs"] as const;
type HitLocation = typeof HIT_LOCATIONS[number];

function rollHitLocation(rng: () => number, target?: string, protect?: string): HitLocation {
  if (target && target !== "Any") {
    const t = target.toLowerCase() as HitLocation;
    if (HIT_LOCATIONS.includes(t)) {
      // 60% chance to hit intended target, but if defender is protecting that area, reduce to 40%
      const hitChance = (protect && protect !== "Any" && protect.toLowerCase() === t) ? 0.4 : 0.6;
      if (rng() < hitChance) return t;
    }
  }
  return HIT_LOCATIONS[Math.floor(rng() * HIT_LOCATIONS.length)];
}

/** Protect reduces crit damage on the protected area but increases damage taken elsewhere */
function applyProtectMod(damage: number, location: HitLocation, protect?: string): number {
  if (!protect || protect === "Any") return damage;
  const protectedLoc = protect.toLowerCase();
  if (location === protectedLoc) {
    // Protected area: reduce damage by 25%
    return Math.max(1, Math.round(damage * 0.75));
  } else {
    // Unprotected areas: increase damage by 10%
    return Math.round(damage * 1.1);
  }
}

// ─── Tactic Modifiers ─────────────────────────────────────────────────────
function getOffensiveTacticMods(tactic: OffensiveTactic | undefined, style: FightingStyle) {
  if (!tactic || tactic === "none") return { attBonus: 0, dmgBonus: 0, defPenalty: 0, endCost: 0, decBonus: 0 };
  const mult = suitabilityMultiplier(getOffensiveSuitability(style, tactic));
  switch (tactic) {
    case "Lunge":        return { attBonus: Math.round(2 * mult), dmgBonus: 0, defPenalty: Math.round(1 * mult), endCost: 2, decBonus: 0 };
    case "Slash":        return { attBonus: 0, dmgBonus: Math.round(2 * mult), defPenalty: 0, endCost: 1, decBonus: 0 };
    case "Bash":         return { attBonus: Math.round(1 * mult), dmgBonus: Math.round(1 * mult), defPenalty: Math.round(2 * mult), endCost: 2, decBonus: 0 };
    case "Decisiveness": return { attBonus: 0, dmgBonus: 0, defPenalty: 0, endCost: 1, decBonus: Math.round(3 * mult) };
    default:             return { attBonus: 0, dmgBonus: 0, defPenalty: 0, endCost: 0, decBonus: 0 };
  }
}

function getDefensiveTacticMods(tactic: DefensiveTactic | undefined, style: FightingStyle) {
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

/** Resolve effective tactics for a fighter in the current phase */
function resolveEffectiveTactics(plan: FightPlan, phaseKey: "opening" | "mid" | "late") {
  const phase = plan.phases?.[phaseKey];
  return {
    offTactic: (phase?.offensiveTactic ?? plan.offensiveTactic ?? "none") as OffensiveTactic,
    defTactic: (phase?.defensiveTactic ?? plan.defensiveTactic ?? "none") as DefensiveTactic,
    target: phase?.target ?? plan.target ?? "Any",
  };
}

// ─── Fighter State ────────────────────────────────────────────────────────
interface FighterState {
  label: string; // "A" or "D"
  style: FightingStyle;
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
}

// ─── Skill Checks ─────────────────────────────────────────────────────────
function skillCheck(rng: () => number, skill: number, modifier: number = 0): boolean {
  // Roll under: skill + modifier > d20
  const roll = Math.floor(rng() * 20) + 1;
  return roll <= skill + modifier;
}

function contestCheck(rng: () => number, a: number, d: number, modA: number = 0, modD: number = 0): boolean {
  // True if A wins. Higher effective skill + roll wins.
  const rollA = Math.floor(rng() * 20) + 1 + a + modA;
  const rollD = Math.floor(rng() * 20) + 1 + d + modD;
  return rollA > rollD;
}

// ─── OE/AL Effects ────────────────────────────────────────────────────────
function oeAttMod(oe: number): number { return Math.floor((oe - 5) * 0.8); }
function oeDefMod(oe: number): number { return -Math.floor(Math.max(0, oe - 6) * 0.5); }
function alIniMod(al: number): number { return Math.floor((al - 5) * 0.6); }
function enduranceCost(oe: number, al: number): number {
  return Math.max(1, Math.round((oe * 0.6 + al * 0.4)));
}

// ─── Fatigue Penalties ────────────────────────────────────────────────────
function fatiguePenalty(endurance: number, maxEndurance: number): number {
  const ratio = endurance / maxEndurance;
  if (ratio > 0.5) return 0;
  if (ratio > 0.25) return -2;
  if (ratio > 0.1) return -4;
  return -7; // collapse territory
}

// ─── Damage Calculation ──────────────────────────────────────────────────
function computeHitDamage(rng: () => number, damageClass: number, location: HitLocation): number {
  const base = damageClass + 1; // 2-6 range
  const locMult = location === "head" ? 1.5 : location === "chest" ? 1.2 : location === "abdomen" ? 1.1 : 0.8;
  const variance = 0.7 + rng() * 0.6; // 0.7-1.3
  return Math.max(1, Math.round(base * locMult * variance));
}

// ─── Equipment Bonuses ────────────────────────────────────────────────────
function getEquipmentMods(loadout: EquipmentLoadout, carryCap: number) {
  const weapon = getItemById(loadout.weapon);
  const armor = getItemById(loadout.armor);
  const shield = getItemById(loadout.shield);
  const helm = getItemById(loadout.helm);
  const totalWeight = getLoadoutWeight(loadout);
  const overEncumbered = totalWeight > carryCap;

  let attMod = 0, parMod = 0, defMod = 0, iniMod = 0, dmgMod = 0, endMod = 0;

  // Shield bonuses
  if (shield?.id === "buckler") { parMod += 1; }
  if (shield?.id === "small_shield") { parMod += 1; defMod += 1; }
  if (shield?.id === "medium_shield") { defMod += 2; }
  if (shield?.id === "large_shield") { defMod += 3; attMod -= 1; }

  // Heavy weapons boost damage
  if (weapon && weapon.weight >= 5) { dmgMod += 1; }
  if (weapon && weapon.weight >= 7) { dmgMod += 1; }

  // Light weapons boost initiative
  if (weapon && weapon.weight <= 2) { iniMod += 1; }

  // Armor reduces incoming damage (applied elsewhere) but costs endurance
  if (armor && armor.weight >= 4) { endMod -= 1; }
  if (armor && armor.weight >= 6) { endMod -= 2; }

  // Full helm reduces INI
  if (helm?.id === "full_helm") { iniMod -= 1; }

  // Over-encumbered penalty
  if (overEncumbered) {
    const excess = totalWeight - carryCap;
    iniMod -= Math.min(4, excess);
    defMod -= Math.min(2, Math.floor(excess / 2));
    endMod -= Math.min(3, excess);
  }

  return { attMod, parMod, defMod, iniMod, dmgMod, endMod };
}

// ─── Trainer Bonuses ──────────────────────────────────────────────────────
function getTrainerMods(trainers: TrainerData[], style: FightingStyle) {
  const bonus = getTrainingBonus(trainers as any, style);
  return {
    attMod: bonus.Aggression,                  // Aggression → ATT
    parMod: Math.floor(bonus.Defense * 0.6),   // Defense → PAR
    defMod: Math.floor(bonus.Defense * 0.4),   // Defense → DEF
    iniMod: Math.floor(bonus.Mind * 0.6),      // Mind → INI
    decMod: Math.floor(bonus.Mind * 0.4),      // Mind → DEC
    endMod: bonus.Endurance * 2,               // Endurance → flat endurance
    healMod: bonus.Healing,                    // Healing → reduces kill chance
  };
}

// ─── Default Plan ─────────────────────────────────────────────────────────
export function defaultPlanForWarrior(w: Warrior): FightPlan {
  // Style-aware defaults from spec
  const styleDefaults: Partial<Record<FightingStyle, Partial<FightPlan>>> = {
    [FightingStyle.TotalParry]: { OE: 3, AL: 3, killDesire: 2 },
    [FightingStyle.WallOfSteel]: { OE: 4, AL: 5, killDesire: 4 },
    [FightingStyle.ParryRiposte]: { OE: 3, AL: 4, killDesire: 4 },
    [FightingStyle.ParryStrike]: { OE: 5, AL: 5, killDesire: 5 },
    [FightingStyle.ParryLunge]: { OE: 5, AL: 5, killDesire: 5 },
    [FightingStyle.BashingAttack]: { OE: 8, AL: 4, killDesire: 6 },
    [FightingStyle.LungingAttack]: { OE: 6, AL: 7, killDesire: 5 },
    [FightingStyle.SlashingAttack]: { OE: 7, AL: 6, killDesire: 5 },
    [FightingStyle.StrikingAttack]: { OE: 7, AL: 5, killDesire: 6 },
    [FightingStyle.AimedBlow]: { OE: 4, AL: 5, killDesire: 5 },
  };
  const defaults = styleDefaults[w.style] ?? {};
  return {
    style: w.style,
    OE: defaults.OE ?? 7,
    AL: defaults.AL ?? 6,
    killDesire: defaults.killDesire ?? 5,
    target: "Any",
  };
}

// ─── Main Simulation ──────────────────────────────────────────────────────
export function simulateFight(
  planA: FightPlan,
  planD: FightPlan,
  warriorA?: Warrior,
  warriorD?: Warrior,
  seed?: number,
  trainers?: TrainerData[]
): FightOutcome {
  const rng = mulberry32(seed ?? (Date.now() ^ Math.floor(Math.random() * 1e9)));

  // Compute skills from warriors or generate defaults
  const attrsA = warriorA?.attributes ?? { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };
  const attrsD = warriorD?.attributes ?? { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };

  const skillsA = warriorA?.baseSkills ?? computeBaseSkills(attrsA, planA.style);
  const skillsD = warriorD?.baseSkills ?? computeBaseSkills(attrsD, planD.style);

  const derivedA = warriorA?.derivedStats ?? computeDerivedStats(attrsA);
  const derivedD = warriorD?.derivedStats ?? computeDerivedStats(attrsD);

  const nameA = warriorA?.name ?? "Attacker";
  const nameD = warriorD?.name ?? "Defender";
  const styleNameA = STYLE_DISPLAY_NAMES[planA.style] ?? planA.style;
  const styleNameD = STYLE_DISPLAY_NAMES[planD.style] ?? planD.style;

  // Matchup bonus
  const matchupA = getMatchupBonus(planA.style, planD.style);
  const matchupD = getMatchupBonus(planD.style, planA.style);

  // Equipment bonuses
  const equipA = getEquipmentMods(warriorA?.equipment ?? DEFAULT_LOADOUT, derivedA.encumbrance);
  const equipD = getEquipmentMods(warriorD?.equipment ?? DEFAULT_LOADOUT, derivedD.encumbrance);

  // Trainer bonuses (shared stable trainers apply to both player warriors)
  const trainerModsA = trainers ? getTrainerMods(trainers, planA.style) : null;
  const trainerModsD = trainers ? getTrainerMods(trainers, planD.style) : null;

  // Apply bonuses to effective skills
  const effSkillsA: BaseSkills = {
    ATT: skillsA.ATT + equipA.attMod + (trainerModsA?.attMod ?? 0),
    PAR: skillsA.PAR + equipA.parMod + (trainerModsA?.parMod ?? 0),
    DEF: skillsA.DEF + equipA.defMod + (trainerModsA?.defMod ?? 0),
    INI: skillsA.INI + equipA.iniMod + (trainerModsA?.iniMod ?? 0),
    RIP: skillsA.RIP,
    DEC: skillsA.DEC + (trainerModsA?.decMod ?? 0),
  };
  const effSkillsD: BaseSkills = {
    ATT: skillsD.ATT + equipD.attMod + (trainerModsD?.attMod ?? 0),
    PAR: skillsD.PAR + equipD.parMod + (trainerModsD?.parMod ?? 0),
    DEF: skillsD.DEF + equipD.defMod + (trainerModsD?.defMod ?? 0),
    INI: skillsD.INI + equipD.iniMod + (trainerModsD?.iniMod ?? 0),
    RIP: skillsD.RIP,
    DEC: skillsD.DEC + (trainerModsD?.decMod ?? 0),
  };

  // Fighter state
  const fA: FighterState = {
    label: "A", style: planA.style, skills: effSkillsA, derived: { ...derivedA, damage: derivedA.damage + equipA.dmgMod }, plan: planA,
    hp: derivedA.hp, maxHp: derivedA.hp,
    endurance: derivedA.endurance + (trainerModsA?.endMod ?? 0) + equipA.endMod,
    maxEndurance: derivedA.endurance + (trainerModsA?.endMod ?? 0) + equipA.endMod,
    hitsLanded: 0, hitsTaken: 0, ripostes: 0,
  };
  const fD: FighterState = {
    label: "D", style: planD.style, skills: effSkillsD, derived: { ...derivedD, damage: derivedD.damage + equipD.dmgMod }, plan: planD,
    hp: derivedD.hp, maxHp: derivedD.hp,
    endurance: derivedD.endurance + (trainerModsD?.endMod ?? 0) + equipD.endMod,
    maxEndurance: derivedD.endurance + (trainerModsD?.endMod ?? 0) + equipD.endMod,
    hitsLanded: 0, hitsTaken: 0, ripostes: 0,
  };

  const log: MinuteEvent[] = [];
  const tags: string[] = [];
  const MAX_EXCHANGES = 15;
  const EXCHANGES_PER_MINUTE = 3;
  let winner: "A" | "D" | null = null;
  let by: FightOutcome["by"] = null;

  // Narration helpers
  const name = (f: FighterState) => f.label === "A" ? nameA : nameD;
  const styleName = (f: FighterState) => f.label === "A" ? styleNameA : styleNameD;
  const verbs = (f: FighterState) => STYLE_VERBS[f.style] ?? STYLE_VERBS[FightingStyle.StrikingAttack];
  const minute = (ex: number) => Math.floor(ex / EXCHANGES_PER_MINUTE) + 1;

  // Opening narration
  log.push({ minute: 1, text: `The crowd falls silent as ${nameA} (${styleNameA}) faces ${nameD} (${styleNameD}).` });

  for (let ex = 0; ex < MAX_EXCHANGES; ex++) {
    const phase = getPhase(ex, MAX_EXCHANGES);
    const min = minute(ex);

    // Phase-based OE/AL/KD resolution
    const phaseKeyA = phase === "OPENING" ? "opening" : phase === "MID" ? "mid" : "late";
    const phaseKeyD = phase === "OPENING" ? "opening" : phase === "MID" ? "mid" : "late";
    const effOE_A = fA.plan.phases?.[phaseKeyA]?.OE ?? fA.plan.OE;
    const effAL_A = fA.plan.phases?.[phaseKeyA]?.AL ?? fA.plan.AL;
    const effKD_A = fA.plan.phases?.[phaseKeyA]?.killDesire ?? fA.plan.killDesire ?? 5;
    const effOE_D = fD.plan.phases?.[phaseKeyD]?.OE ?? fD.plan.OE;
    const effAL_D = fD.plan.phases?.[phaseKeyD]?.AL ?? fD.plan.AL;
    const effKD_D = fD.plan.phases?.[phaseKeyD]?.killDesire ?? fD.plan.killDesire ?? 5;

    // Per-phase tactic & target resolution
    const tacticsA = resolveEffectiveTactics(fA.plan, phaseKeyA);
    const tacticsD = resolveEffectiveTactics(fD.plan, phaseKeyD);
    const offModsA = getOffensiveTacticMods(tacticsA.offTactic, fA.style);
    const defModsA = getDefensiveTacticMods(tacticsA.defTactic, fA.style);
    const offModsD = getOffensiveTacticMods(tacticsD.offTactic, fD.style);
    const defModsD = getDefensiveTacticMods(tacticsD.defTactic, fD.style);

    // Fatigue penalties
    const fatA = fatiguePenalty(fA.endurance, fA.maxEndurance);
    const fatD = fatiguePenalty(fD.endurance, fD.maxEndurance);

    // ── 1. INITIATIVE CONTEST ──
    const iniA = fA.skills.INI + alIniMod(effAL_A) + matchupA + fatA + defModsA.iniBonus;
    const iniD = fD.skills.INI + alIniMod(effAL_D) + matchupD + fatD + defModsD.iniBonus;
    const aGoesFirst = contestCheck(rng, iniA, iniD);

    const attacker = aGoesFirst ? fA : fD;
    const defender = aGoesFirst ? fD : fA;
    const attMatchup = aGoesFirst ? matchupA : matchupD;
    const defMatchup = aGoesFirst ? matchupD : matchupA;
    const attFat = aGoesFirst ? fatA : fatD;
    const defFat = aGoesFirst ? fatD : fatA;
    const attOE = aGoesFirst ? effOE_A : effOE_D;
    const defOE = aGoesFirst ? effOE_D : effOE_A;
    const attAL = aGoesFirst ? effAL_A : effAL_D;
    const defAL = aGoesFirst ? effAL_D : effAL_A;
    const attKD = aGoesFirst ? effKD_A : effKD_D;

    // Resolve per-phase tactic mods for attacker/defender
    const attTactics = aGoesFirst ? tacticsA : tacticsD;
    const defTactics = aGoesFirst ? tacticsD : tacticsA;
    const attOffMods = aGoesFirst ? offModsA : offModsD;
    const defOffMods = aGoesFirst ? offModsD : offModsA;
    const attDefMods = aGoesFirst ? defModsA : defModsD;
    const defDefMods = aGoesFirst ? defModsD : defModsA;

    // Narrate initiative swings
    if (ex === 0 || (ex > 0 && rng() < 0.3)) {
      if (aGoesFirst && ex <= 1) {
        log.push({ minute: min, text: `${name(attacker)} seizes the initiative!` });
      }
    }

    // ── 2. ATTACK ATTEMPT (ATT) ──
    const attOEmod = oeAttMod(attOE);
    const attackSuccess = skillCheck(rng, attacker.skills.ATT, attOEmod + attMatchup + attFat);

    if (!attackSuccess) {
      // Attack whiffs
      if (rng() < 0.25) {
        log.push({ minute: min, text: `${name(attacker)} probes but finds no opening.` });
      }
      // ── Endurance cost for attempt ──
      attacker.endurance -= Math.max(1, Math.floor(enduranceCost(attOE, attAL) * 0.5));

      // Defender may riposte on whiff
      // ── 4. RIPOSTE CHECK (RIP) ──
      const ripCheck = skillCheck(rng, defender.skills.RIP, defMatchup + defFat);
      if (ripCheck) {
        const ripLoc = rollHitLocation(rng, defender.plan.target);
        const ripDmg = computeHitDamage(rng, defender.derived.damage, ripLoc);
        attacker.hp -= ripDmg;
        attacker.hitsTaken++;
        defender.hitsLanded++;
        defender.ripostes++;

        log.push({
          minute: min,
          text: `${pickText(rng, verbs(defender).riposte)} — striking the ${ripLoc} for ${ripDmg} damage!`,
        });

        if (defender.ripostes >= 3 && !tags.includes("RiposteChain")) tags.push("RiposteChain");
      }
    } else {
      // Attack lands — defender tries to stop it

      // ── 3a. PARRY CHECK (PAR) ──
      const defOEmod = oeDefMod(defOE);
      const parrySuccess = skillCheck(rng, defender.skills.PAR, defOEmod + defMatchup + defFat);

      if (parrySuccess) {
        if (rng() < 0.3) {
          log.push({ minute: min, text: `${name(defender)} ${pickText(rng, verbs(defender).parry)}.` });
        }

        // Parry succeeds — defender may riposte
        const ripAfterParry = skillCheck(rng, defender.skills.RIP, defMatchup + defFat - 2);
        if (ripAfterParry) {
          const ripLoc = rollHitLocation(rng, defender.plan.target);
          const ripDmg = computeHitDamage(rng, defender.derived.damage, ripLoc);
          attacker.hp -= ripDmg;
          attacker.hitsTaken++;
          defender.hitsLanded++;
          defender.ripostes++;
          log.push({
            minute: min,
            text: `${name(defender)} ${pickText(rng, verbs(defender).riposte)} to the ${ripLoc} for ${ripDmg}!`,
          });
        }
      } else {
        // ── 3b. DEFENSE CHECK (DEF) ──
        const defSuccess = skillCheck(rng, defender.skills.DEF, oeDefMod(defOE) + defMatchup + defFat);

        if (defSuccess) {
          if (rng() < 0.2) {
            log.push({ minute: min, text: `${name(defender)} dodges the attack with quick footwork.` });
          }
        } else {
          // ── 5. DAMAGE APPLICATION ──
          const hitLoc = rollHitLocation(rng, attacker.plan.target);
          const damage = computeHitDamage(rng, attacker.derived.damage, hitLoc);
          defender.hp -= damage;
          defender.hitsTaken++;
          attacker.hitsLanded++;

          log.push({
            minute: min,
            text: `${name(attacker)} ${pickText(rng, verbs(attacker).attack)} to the ${hitLoc} for ${damage} damage!`,
          });

          // Check for significant hit
          if (damage >= 5) {
            if (rng() < 0.5) tags.push("Flashy");
          }
          if (hitLoc === "head" && damage >= 4) {
            log.push({ minute: min, text: `A devastating blow to the head staggers ${name(defender)}!` });
          }

          // ── 6. DECISIVENESS CHECK (DEC) — Kill Window ──
          if (defender.hp <= defender.maxHp * 0.3 && defender.endurance <= defender.maxEndurance * 0.4) {
            const kdMod = Math.floor((attKD) - 5) * 0.5;
            const phaseMod = phase === "LATE" ? 3 : phase === "MID" ? 1 : 0;
            const decSuccess = skillCheck(rng, attacker.skills.DEC, kdMod + phaseMod + attMatchup + attFat);

            if (decSuccess) {
              // Kill window — attempt execution
              const killRoll = rng();
              const healingReduction = defender.label === "A" ? (trainerModsA?.healMod ?? 0) * 0.03 : (trainerModsD?.healMod ?? 0) * 0.03;
              const killThreshold = Math.max(0.05, 0.3 + attKD * 0.04 + (phase === "LATE" ? 0.15 : 0) - healingReduction);

              if (killRoll < killThreshold) {
                // KILL
                defender.hp = 0;
                winner = attacker.label as "A" | "D";
                by = "Kill";
                tags.push("Kill");

                log.push({
                  minute: min,
                  text: `${name(attacker)} sees the opening and delivers a KILLING BLOW to the ${hitLoc}! ${name(defender)} falls!`,
                });
                break;
              } else {
                // Near-kill
                log.push({
                  minute: min,
                  text: `${name(attacker)} senses the kill window but ${name(defender)} desperately clings on!`,
                });
              }
            }
          }

          // KO check
          if (defender.hp <= 0) {
            winner = attacker.label as "A" | "D";
            by = "KO";
            tags.push("KO");
            log.push({
              minute: min,
              text: `${name(defender)} collapses from accumulated damage! ${name(attacker)} wins by knockout!`,
            });
            break;
          }
        }
      }
    }

    // ── 7. ENDURANCE & FATIGUE UPDATE ──
    attacker.endurance -= enduranceCost(attOE, attAL);
    defender.endurance -= Math.max(1, Math.floor(enduranceCost(defOE, defAL) * 0.6));

    // Clamp endurance
    fA.endurance = Math.max(0, fA.endurance);
    fD.endurance = Math.max(0, fD.endurance);

    // Exhaustion narration
    if (fA.endurance <= 0 && fD.endurance <= 0 && !winner) {
      winner = fA.hp >= fD.hp ? "A" : fD.hp > fA.hp ? "D" : null;
      by = "Exhaustion";
      log.push({
        minute: min,
        text: winner
          ? `Both warriors are spent! ${winner === "A" ? nameA : nameD} is awarded the bout on points.`
          : `Both warriors collapse from exhaustion! The bout is declared a draw.`,
      });
      break;
    }

    if (attacker.endurance <= 0 && !winner) {
      // Stoppage
      winner = defender.label as "A" | "D";
      by = "Stoppage";
      log.push({
        minute: min,
        text: `${name(attacker)} can no longer continue! ${name(defender)} wins by stoppage!`,
      });
      break;
    }

    if (defender.endurance <= 0 && !winner) {
      winner = attacker.label as "A" | "D";
      by = "Stoppage";
      log.push({
        minute: min,
        text: `${name(defender)} staggers and cannot continue! ${name(attacker)} wins by stoppage!`,
      });
      break;
    }

    // Fatigue narration
    if (ex > 0 && ex % 4 === 0) {
      const fatigued = [fA, fD].filter(f => f.endurance < f.maxEndurance * 0.3);
      for (const f of fatigued) {
        if (rng() < 0.5) {
          log.push({
            minute: min,
            text: `${name(f)} is visibly tiring, movements growing sluggish.`,
          });
        }
      }
    }
  }

  // If no winner after all exchanges — decision or draw
  if (!winner) {
    const min = minute(MAX_EXCHANGES);
    if (fA.hitsLanded > fD.hitsLanded + 2) {
      winner = "A";
      by = "Stoppage";
      log.push({ minute: min, text: `Time! ${nameA} is awarded the decision on points.` });
    } else if (fD.hitsLanded > fA.hitsLanded + 2) {
      winner = "D";
      by = "Stoppage";
      log.push({ minute: min, text: `Time! ${nameD} is awarded the decision on points.` });
    } else if (fA.hp > fD.hp) {
      winner = "A";
      by = "Stoppage";
      log.push({ minute: min, text: `Time! ${nameA} wins a close decision.` });
    } else if (fD.hp > fA.hp) {
      winner = "D";
      by = "Stoppage";
      log.push({ minute: min, text: `Time! ${nameD} wins a close decision.` });
    } else {
      by = "Draw";
      log.push({ minute: min, text: `Time! The Arenamaster declares a draw.` });
    }
  }

  // Comeback detection
  if (winner) {
    const w = winner === "A" ? fA : fD;
    const l = winner === "A" ? fD : fA;
    if (w.hp < w.maxHp * 0.3 && w.hitsLanded > l.hitsLanded) {
      tags.push("Comeback");
    }
    if (w.hitsLanded >= 5) {
      tags.push("Dominance");
    }
  }

  // Deduplicate tags
  const uniqueTags = [...new Set(tags)];

  const finalMinute = log.length > 0 ? log[log.length - 1].minute : 1;

  return {
    winner,
    by,
    minutes: finalMinute,
    log,
    post: {
      xpA: winner === "A" ? 2 : winner === null ? 1 : 1,
      xpD: winner === "D" ? 2 : winner === null ? 1 : 1,
      hitsA: fA.hitsLanded,
      hitsD: fD.hitsLanded,
      gotKillA: winner === "A" && by === "Kill",
      gotKillD: winner === "D" && by === "Kill",
      tags: uniqueTags,
    },
  };
}
