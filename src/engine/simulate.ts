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
import { getItemById, type EquipmentLoadout, DEFAULT_LOADOUT, getLoadoutWeight, getClassicWeaponBonus } from "@/data/equipment";
import { getTrainingBonus, TRAINER_FOCUSES, type TrainerFocus } from "@/engine/trainers";
import { getOffensiveSuitability, getDefensiveSuitability, suitabilityMultiplier } from "./tacticSuitability";
import { getTempoBonus, getEnduranceMult, getStylePassive, getKillMechanic, getStyleAntiSynergy, type Phase as StylePhase } from "./stylePassives";
import { getFavoriteWeaponBonus, getFavoriteRhythmBonus } from "./favorites";
import {
  narrateAttack, narrateParry, narrateDodge, narrateCounterstrike,
  narrateHit, narrateParryBreak, damageSeverityLine, stateChangeLine,
  fatigueLine, crowdReaction, narrateInitiative, minuteStatusLine,
  narrateBoutEnd, tradingBlowsLine, tauntLine, conservingLine,
  pressingLine, generateWarriorIntro, battleOpener, getWeaponDisplayName,
  popularityLine, skillLearnLine,
} from "./narrativePBP";

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
// BALANCE v6: Rebalanced for 35-65% target range.
// Key changes:
// - BA gets +2 vs TP (hard counter via bash-through), +1 vs SL/WS/PL
// - SL gets +1 vs TP/WS/BA (flurry overwhelms)
// - ST gets +1 vs TP/PR/PS/PL (reliable power vs counter styles)
// - TP loses advantage vs most styles (only beats WS/PL via endurance)
// - AB loses universal advantage (only counters TP)
// - PR loses advantage vs BA/ST (can't counter raw power or efficient strikes)
const MATCHUP_MATRIX: number[][] = [
  //AB  BA  LU  PL  PR  PS  SL  ST  TP  WS
  [ 0,  0,  0,  0, -1,  0,  0,  0, +1,  0], // AB: only edge vs TP, weak vs PR
  [ 0,  0,  0, +1,  0,  0, +1, +1, +2, +1], // BA: hard-counters TP, edge vs SL/ST/PL/WS
  [ 0,  0,  0, +1,  0, -1,  0,  0,  0, -1], // LU: speed beats PL, weak vs PS/WS
  [ 0, -1, -1,  0,  0,  0,  0, -1,  0,  0], // PL: weak vs BA/LU/ST
  [+1,  0,  0,  0,  0,  0,  0, -1,  0,  0], // PR: counter beats AB, weak vs ST
  [ 0,  0, +1,  0,  0,  0,  0, -1,  0, -1], // PS: beats LU, loses to ST/WS
  [ 0, -1,  0,  0,  0,  0,  0,  0, +1, +1], // SL: beats TP/WS, weak vs BA
  [ 0, -1,  0, +1, +1, +1,  0,  0, +1,  0], // ST: efficient power beats PL/PR/PS/TP, weak vs BA
  [-1, -2,  0,  0,  0,  0, -1, -1,  0,  0], // TP: crushed by BA, weak vs AB/SL/ST
  [ 0, -1, +1,  0,  0, +1, -1,  0,  0,  0], // WS: zone control, beats LU/PS, loses to BA/SL
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

// ─── Legacy narrative helpers (replaced by narrativePBP.ts) ───────────────
// Kept as fallback only
function pickText(rng: () => number, texts: string[]): string {
  return texts[Math.floor(rng() * texts.length)];
}

const HIT_LOCATIONS = ["head", "chest", "abdomen", "right arm", "left arm", "right leg", "left leg"] as const;
type HitLocation = typeof HIT_LOCATIONS[number];

/** Maps a grouped protect target to the granular hit locations it covers */
function protectCovers(protect?: string): string[] {
  if (!protect || protect === "Any") return [];
  const p = protect.toLowerCase();
  if (p === "head") return ["head"];
  if (p === "body") return ["chest", "abdomen"];
  if (p === "arms") return ["right arm", "left arm"];
  if (p === "legs") return ["right leg", "left leg"];
  return [];
}

function rollHitLocation(rng: () => number, target?: string, protect?: string): HitLocation {
  if (target && target !== "Any") {
    const t = target.toLowerCase() as HitLocation;
    if (HIT_LOCATIONS.includes(t)) {
      const covered = protectCovers(protect);
      const hitChance = covered.includes(t) ? 0.4 : 0.6;
      if (rng() < hitChance) return t;
    }
  }
  return HIT_LOCATIONS[Math.floor(rng() * HIT_LOCATIONS.length)];
}

/** Protect reduces damage on covered locations but increases damage taken elsewhere */
function applyProtectMod(damage: number, location: HitLocation, protect?: string): number {
  if (!protect || protect === "Any") return damage;
  const covered = protectCovers(protect);
  if (covered.includes(location)) {
    return Math.max(1, Math.round(damage * 0.75));
  } else {
    return Math.round(damage * 1.1);
  }
}

// ─── Tactic Modifiers ─────────────────────────────────────────────────────
function getOffensiveTacticMods(tactic: OffensiveTactic | undefined, style: FightingStyle) {
  if (!tactic || tactic === "none") return { attBonus: 0, dmgBonus: 0, defPenalty: 0, endCost: 0, decBonus: 0, parryBypass: 0 };
  const mult = suitabilityMultiplier(getOffensiveSuitability(style, tactic));
  switch (tactic) {
    case "Lunge":        return { attBonus: Math.round(2 * mult), dmgBonus: 0, defPenalty: Math.round(1 * mult), endCost: 2, decBonus: 0, parryBypass: 0 };
    case "Slash":        return { attBonus: 0, dmgBonus: Math.round(2 * mult), defPenalty: 0, endCost: 1, decBonus: 0, parryBypass: 0 };
    // Bash: "attacks through a parry" — parryBypass reduces defender PAR check (per compendium §BA)
    case "Bash":         return { attBonus: Math.round(1 * mult), dmgBonus: Math.round(1 * mult), defPenalty: Math.round(2 * mult), endCost: 2, decBonus: 0, parryBypass: Math.round(4 * mult) };
    case "Decisiveness": return { attBonus: 0, dmgBonus: 0, defPenalty: 0, endCost: 1, decBonus: Math.round(3 * mult), parryBypass: 0 };
    default:             return { attBonus: 0, dmgBonus: 0, defPenalty: 0, endCost: 0, decBonus: 0, parryBypass: 0 };
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
  consecutiveHits: number; // for Basher momentum, etc.
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
// BALANCE v5: Increased ATT bonus, steeper PAR penalty.
// Offense needs to land consistently; defense should rely on endurance/counters.
const GLOBAL_ATT_BONUS = 6;    // All attacks get +6 to ensure hits land frequently
const GLOBAL_PAR_PENALTY = -4; // Parry harder — defense identity is endurance, not blocking

function oeAttMod(oe: number, style?: FightingStyle): number {
  // PR OE Paradox: PR is NOT penalized at low OE but doesn't get a bonus either
  if (style === FightingStyle.ParryRiposte) {
    if (oe <= 5) return 0;   // Low-mid OE: no penalty (counter stance)
    return -1;               // High OE: loses counter identity
  }
  // AB: patience is a feature — no penalty at low OE
  if (style === FightingStyle.AimedBlow) {
    if (oe <= 5) return 0;
    return -1;
  }
  return Math.floor((oe - 5) * 0.8);
}
function oeDefMod(oe: number): number { return -Math.floor(Math.max(0, oe - 6) * 0.5); }
function alIniMod(al: number): number { return Math.floor((al - 5) * 0.6); }
function enduranceCost(oe: number, al: number): number {
  // BALANCE v5: Slightly increased base cost so low-OE fighters can't stall forever
  return Math.max(2, Math.round((oe * 0.35 + al * 0.25) + 1));
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
  const helm = getItemById(loadout.helm);
  const totalWeight = getLoadoutWeight(loadout);
  const overEncumbered = totalWeight > carryCap;

  let attMod = 0, parMod = 0, defMod = 0, iniMod = 0, dmgMod = 0, endMod = 0;

  // Shield bonuses — shields are in the weapon list in canonical DM
  // Check both the weapon slot (if it IS a shield) and the legacy shield slot
  const shieldId = loadout.weapon;
  const legacyShield = getItemById(loadout.shield);
  const isShieldWeapon = ["small_shield", "medium_shield", "large_shield"].includes(shieldId);
  
  if (isShieldWeapon || legacyShield?.id === "buckler") {
    if (shieldId === "small_shield" || legacyShield?.id === "buckler") { parMod += 1; }
    if (shieldId === "small_shield") { defMod += 1; }
    if (shieldId === "medium_shield") { defMod += 2; }
    if (shieldId === "large_shield") { defMod += 3; attMod -= 1; }
  }

  // Heavy weapons boost damage (canonical weight thresholds)
  if (weapon && weapon.weight >= 5) { dmgMod += 1; }
  if (weapon && weapon.weight >= 8) { dmgMod += 1; }

  // Light weapons boost initiative
  if (weapon && weapon.weight <= 2) { iniMod += 1; }

  // Armor endurance cost (canonical weight thresholds)
  if (armor && armor.weight >= 6) { endMod -= 1; }
  if (armor && armor.weight >= 10) { endMod -= 2; }
  if (armor && armor.weight >= 14) { endMod -= 3; }

  // Helm penalties
  if (helm?.id === "full_helm") { iniMod -= 1; attMod -= 1; }
  if (helm?.id === "helm") { iniMod -= 1; }

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
  // Classic weapon bonus (compendium: each style has a canonical weapon)
  const classicBonusA = getClassicWeaponBonus(planA.style, (warriorA?.equipment ?? DEFAULT_LOADOUT).weapon);
  const classicBonusD = getClassicWeaponBonus(planD.style, (warriorD?.equipment ?? DEFAULT_LOADOUT).weapon);

  // Favorite weapon/rhythm bonuses (only if warrior has discovered them)
  const favWeaponA = warriorA ? getFavoriteWeaponBonus(warriorA) : 0;
  const favWeaponD = warriorD ? getFavoriteWeaponBonus(warriorD) : 0;

  const effSkillsA: BaseSkills = {
    ATT: skillsA.ATT + equipA.attMod + (trainerModsA?.attMod ?? 0) + classicBonusA + favWeaponA,
    PAR: skillsA.PAR + equipA.parMod + (trainerModsA?.parMod ?? 0),
    DEF: skillsA.DEF + equipA.defMod + (trainerModsA?.defMod ?? 0),
    INI: skillsA.INI + equipA.iniMod + (trainerModsA?.iniMod ?? 0),
    RIP: skillsA.RIP,
    DEC: skillsA.DEC + (trainerModsA?.decMod ?? 0),
  };
  const effSkillsD: BaseSkills = {
    ATT: skillsD.ATT + equipD.attMod + (trainerModsD?.attMod ?? 0) + classicBonusD + favWeaponD,
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
    hitsLanded: 0, hitsTaken: 0, ripostes: 0, consecutiveHits: 0,
  };
  const fD: FighterState = {
    label: "D", style: planD.style, skills: effSkillsD, derived: { ...derivedD, damage: derivedD.damage + equipD.dmgMod }, plan: planD,
    hp: derivedD.hp, maxHp: derivedD.hp,
    endurance: derivedD.endurance + (trainerModsD?.endMod ?? 0) + equipD.endMod,
    maxEndurance: derivedD.endurance + (trainerModsD?.endMod ?? 0) + equipD.endMod,
    hitsLanded: 0, hitsTaken: 0, ripostes: 0, consecutiveHits: 0,
  };

  const log: MinuteEvent[] = [];
  const tags: string[] = [];
  const MAX_EXCHANGES = 15;
  const EXCHANGES_PER_MINUTE = 3;
  let winner: "A" | "D" | null = null;

  // Tactic overuse tracking: consecutive exchanges using the same tactic (compendium: "tactics sparingly")
  let lastTacticA: string = "none";
  let lastTacticD: string = "none";
  let tacticStreakA = 0;
  let tacticStreakD = 0;
  let by: FightOutcome["by"] = null;

  // Narration helpers
  const name = (f: FighterState) => f.label === "A" ? nameA : nameD;
  const styleName = (f: FighterState) => f.label === "A" ? styleNameA : styleNameD;
  const weaponOf = (f: FighterState) => f.label === "A" ? (warriorA?.equipment ?? DEFAULT_LOADOUT).weapon : (warriorD?.equipment ?? DEFAULT_LOADOUT).weapon;
  const minute = (ex: number) => Math.floor(ex / EXCHANGES_PER_MINUTE) + 1;

  // Track HP ratios for state-change narration
  let prevHpRatioA = 1.0;
  let prevHpRatioD = 1.0;

  // ── Pre-bout warrior introductions (canonical DM PBP) ──
  const introA = generateWarriorIntro(rng, {
    name: nameA,
    style: planA.style,
    weaponId: (warriorA?.equipment ?? DEFAULT_LOADOUT).weapon,
    armorId: (warriorA?.equipment ?? DEFAULT_LOADOUT).armor,
    helmId: (warriorA?.equipment ?? DEFAULT_LOADOUT).helm,
  }, warriorA?.attributes?.SZ);
  const introD = generateWarriorIntro(rng, {
    name: nameD,
    style: planD.style,
    weaponId: (warriorD?.equipment ?? DEFAULT_LOADOUT).weapon,
    armorId: (warriorD?.equipment ?? DEFAULT_LOADOUT).armor,
    helmId: (warriorD?.equipment ?? DEFAULT_LOADOUT).helm,
  }, warriorD?.attributes?.SZ);

  // Add intro lines
  for (const line of introA) log.push({ minute: 0, text: line });
  log.push({ minute: 0, text: "" });
  for (const line of introD) log.push({ minute: 0, text: line });
  log.push({ minute: 0, text: "" });

  // Battle opener
  log.push({ minute: 1, text: battleOpener(rng) });

  // Low-OE conserving line
  if (planA.OE <= 3) log.push({ minute: 1, text: conservingLine(nameA) });
  if (planD.OE <= 3) log.push({ minute: 1, text: conservingLine(nameD) });

  // Opening narration
  let lastPhase: Phase | null = null;
  let lastMinuteMarker = 0;

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

    // Emit phase-change indicator event
    if (phase !== lastPhase) {
      lastPhase = phase;
      const phaseLabel = phase === "OPENING" ? "Opening" : phase === "MID" ? "Mid-Bout" : "Late Bout";
      log.push({
        minute: min,
        text: `— ${phaseLabel} Phase —`,
        phase,
        offTacticA: tacticsA.offTactic !== "none" ? tacticsA.offTactic : undefined,
        defTacticA: tacticsA.defTactic !== "none" ? tacticsA.defTactic : undefined,
        offTacticD: tacticsD.offTactic !== "none" ? tacticsD.offTactic : undefined,
        defTacticD: tacticsD.defTactic !== "none" ? tacticsD.defTactic : undefined,
        protectA: fA.plan.protect && fA.plan.protect !== "Any" ? fA.plan.protect : undefined,
        protectD: fD.plan.protect && fD.plan.protect !== "Any" ? fD.plan.protect : undefined,
      });
    }

    // Fatigue penalties
    const fatA = fatiguePenalty(fA.endurance, fA.maxEndurance);
    const fatD = fatiguePenalty(fD.endurance, fD.maxEndurance);

    // ── STYLE PASSIVES & TEMPO ──
    const tempoA = getTempoBonus(fA.style, phase as StylePhase);
    const tempoD = getTempoBonus(fD.style, phase as StylePhase);

    const passiveA = getStylePassive(fA.style, {
      phase: phase as StylePhase, exchange: ex, hitsLanded: fA.hitsLanded,
      hitsTaken: fA.hitsTaken, ripostes: fA.ripostes, consecutiveHits: fA.consecutiveHits,
      hpRatio: fA.hp / fA.maxHp, endRatio: fA.endurance / fA.maxEndurance,
      opponentStyle: fD.style, targetedLocation: tacticsA.target,
      totalFights: warriorA ? (warriorA.career.wins + warriorA.career.losses) : 0,
    });
    const passiveD = getStylePassive(fD.style, {
      phase: phase as StylePhase, exchange: ex, hitsLanded: fD.hitsLanded,
      hitsTaken: fD.hitsTaken, ripostes: fD.ripostes, consecutiveHits: fD.consecutiveHits,
      hpRatio: fD.hp / fD.maxHp, endRatio: fD.endurance / fD.maxEndurance,
      opponentStyle: fA.style, targetedLocation: tacticsD.target,
      totalFights: warriorD ? (warriorD.career.wins + warriorD.career.losses) : 0,
    });

    // Anti-synergy for tactic choices
    const antiSynA = getStyleAntiSynergy(fA.style, tacticsA.offTactic, tacticsA.defTactic);
    const antiSynD = getStyleAntiSynergy(fD.style, tacticsD.offTactic, tacticsD.defTactic);

    // Emit passive narrative (occasionally)
    if (passiveA.narrative && rng() < 0.4) {
      log.push({ minute: min, text: `${nameA} ${passiveA.narrative}` });
    }
    if (passiveD.narrative && rng() < 0.4) {
      log.push({ minute: min, text: `${nameD} ${passiveD.narrative}` });
    }

    // ── 1. INITIATIVE CONTEST — with tempo & passive ──
    // Initiative winner gets a pressing advantage (+1 ATT) to reward aggressive styles
    const iniA = fA.skills.INI + alIniMod(effAL_A) + matchupA + fatA + defModsA.iniBonus + tempoA + passiveA.iniBonus;
    const iniD = fD.skills.INI + alIniMod(effAL_D) + matchupD + fatD + defModsD.iniBonus + tempoD + passiveD.iniBonus;
    const aGoesFirst = contestCheck(rng, iniA, iniD);
    const iniPressBonus = 1; // Initiative winner presses the attack

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
    const attPassive = aGoesFirst ? passiveA : passiveD;
    const defPassive = aGoesFirst ? passiveD : passiveA;
    const attAntiSyn = aGoesFirst ? antiSynA : antiSynD;
    const defAntiSyn = aGoesFirst ? antiSynD : antiSynA;

    // Resolve per-phase tactic mods for attacker/defender
    const attTactics = aGoesFirst ? tacticsA : tacticsD;
    const defTactics = aGoesFirst ? tacticsD : tacticsA;
    const attOffMods = aGoesFirst ? offModsA : offModsD;
    const defOffMods = aGoesFirst ? offModsD : offModsA;
    const attDefMods = aGoesFirst ? defModsA : defModsD;
    const defDefMods = aGoesFirst ? defModsD : defModsA;

    // Narrate initiative swings (canonical PBP style)
    if (ex === 0 || (ex > 0 && rng() < 0.3)) {
      if (aGoesFirst) {
        log.push({ minute: min, text: narrateInitiative(rng, name(attacker), rng() < 0.3) });
      }
    }

    // Minute markers with status assessment (canonical: "MINUTE 2. The warriors appear equal in skill.")
    if (min > lastMinuteMarker && min > 1) {
      lastMinuteMarker = min;
      log.push({ minute: min, text: `MINUTE ${min}.` });
      log.push({ minute: min, text: minuteStatusLine(rng, min, nameA, nameD, fA.hitsLanded, fD.hitsLanded) });
    }

    // ── TACTIC OVERUSE PENALTY (compendium: "tactics sparingly") ──
    // Using the same tactic for 2+ consecutive exchanges degrades its effectiveness
    const curTacticKeyA = (aGoesFirst ? tacticsA.offTactic : tacticsD.offTactic) + "|" + (aGoesFirst ? tacticsA.defTactic : tacticsD.defTactic);
    const curTacticKeyD = (!aGoesFirst ? tacticsA.offTactic : tacticsD.offTactic) + "|" + (!aGoesFirst ? tacticsA.defTactic : tacticsD.defTactic);
    if (curTacticKeyA === lastTacticA && curTacticKeyA !== "none|none") {
      tacticStreakA++;
    } else {
      tacticStreakA = 0;
      lastTacticA = curTacticKeyA;
    }
    if (curTacticKeyD === lastTacticD && curTacticKeyD !== "none|none") {
      tacticStreakD++;
    } else {
      tacticStreakD = 0;
      lastTacticD = curTacticKeyD;
    }
    // Penalty: -1 per consecutive exchange using same tactic (cap -3)
    const tacticOveruseAtt = aGoesFirst ? Math.min(3, tacticStreakA) : Math.min(3, tacticStreakD);
    const tacticOveruseDef = aGoesFirst ? Math.min(3, tacticStreakD) : Math.min(3, tacticStreakA);

    // ── 2. ATTACK ATTEMPT — with passive ATT + anti-synergy + PR OE paradox ──
    const attOEmod = oeAttMod(attOE, attacker.style);
    const attAntiSynMod = Math.round((attAntiSyn.offMult - 1) * 5);
    const attackSuccess = skillCheck(rng, attacker.skills.ATT, attOEmod + attMatchup + attFat + attOffMods.attBonus + attPassive.attBonus + attAntiSynMod + iniPressBonus + GLOBAL_ATT_BONUS - tacticOveruseAtt);

    if (!attackSuccess) {
      // Attack whiffs — reset consecutive hits
      attacker.consecutiveHits = 0;

       if (rng() < 0.25) {
        log.push({ minute: min, text: narrateAttack(rng, name(attacker), weaponOf(attacker)) });
        log.push({ minute: min, text: narrateDodge(rng, name(defender)) });
      }
      // ── Endurance cost for attempt ──
      attacker.endurance -= Math.max(1, Math.floor(enduranceCost(attOE, attAL) * 0.5)) + attOffMods.endCost;

      // Defender may riposte on whiff — HARD check (off-tempo, attacker recovering)
      // BALANCE v5: Increased penalty from -3 to -6 to reduce free counter-damage
      const defAntiSynRip = Math.round((defAntiSyn.defMult - 1) * 3);
      const ripCheck = skillCheck(rng, defender.skills.RIP, defMatchup + defFat - 6 + defDefMods.ripBonus + defPassive.ripBonus + defAntiSynRip);
      if (ripCheck) {
        const ripLoc = rollHitLocation(rng, defTactics.target, attacker.plan.protect);
        const ripDmgRaw = computeHitDamage(rng, defender.derived.damage + defPassive.dmgBonus, ripLoc);
        const ripDmg = applyProtectMod(ripDmgRaw, ripLoc, attacker.plan.protect);
        attacker.hp -= ripDmg;
        attacker.hitsTaken++;
        defender.hitsLanded++;
        defender.ripostes++;
        defender.consecutiveHits++;
        attacker.consecutiveHits = 0;

        // Canonical PBP: counterstrike + attack + hit
        log.push({ minute: min, text: narrateCounterstrike(rng, name(defender)) });
        log.push({ minute: min, text: narrateAttack(rng, name(defender), weaponOf(defender)) });
        log.push({ minute: min, text: narrateHit(rng, name(attacker), ripLoc) });
        const sevLine = damageSeverityLine(rng, ripDmg, attacker.maxHp);
        if (sevLine) log.push({ minute: min, text: sevLine });

        if (defender.ripostes >= 3 && !tags.includes("RiposteChain")) tags.push("RiposteChain");
      }
    } else {
      // Attack lands — defender tries to stop it
      // BALANCE v2: PAR and DEF are MUTUALLY EXCLUSIVE.
      // - Dodge tactic → skip PAR, use DEF at full skill
      // - Otherwise → PAR only; if PAR fails, the hit lands (no second chance)
      // This eliminates the multiplicative double-defense that crushed offensive styles.

      const defOEmod = oeDefMod(defOE);
      const defAntiSynPar = Math.round((defAntiSyn.defMult - 1) * 3);
      const bashBypass = attOffMods.parryBypass ?? 0;

      const isDodging = defTactics.defTactic === "Dodge";

      let defended = false;
      let canRiposte = false;

      if (isDodging) {
        // ── 3b. DODGE PATH — full DEF skill, no parry attempt ──
        const defSuccess = skillCheck(rng, defender.skills.DEF, defOEmod + defMatchup + defFat + defDefMods.defBonus + defPassive.defBonus - tacticOveruseDef);
        if (defSuccess) {
          defended = true;
          attacker.consecutiveHits = 0;
          if (rng() < 0.5) {
            log.push({ minute: min, text: narrateDodge(rng, name(defender)) });
          }
          // Dodge doesn't enable riposte (you're out of position)
        }
      } else {
        // ── 3a. PARRY PATH — PAR check; if it fails, the hit lands ──
        const parrySuccess = skillCheck(rng, defender.skills.PAR, defOEmod + defMatchup + defFat + defDefMods.parBonus + defPassive.parBonus + defAntiSynPar - attOffMods.defPenalty + GLOBAL_PAR_PENALTY - bashBypass - tacticOveruseDef);

        if (parrySuccess) {
          defended = true;
          canRiposte = true;
          attacker.consecutiveHits = 0;

          if (rng() < 0.5) {
            log.push({ minute: min, text: narrateAttack(rng, name(attacker), weaponOf(attacker)) });
            log.push({ minute: min, text: narrateParry(rng, name(defender), weaponOf(defender)) });
          }
        }
      }

      if (defended && canRiposte) {
        // Parry succeeds — defender may riposte (harder check than before)
        // BALANCE v5: Penalty from -4 to -5 to reduce counter-damage frequency
        const ripAfterParry = skillCheck(rng, defender.skills.RIP, defMatchup + defFat - 5 + defDefMods.ripBonus + defPassive.ripBonus);
        if (ripAfterParry) {
          const ripLoc = rollHitLocation(rng, defTactics.target, attacker.plan.protect);
          const ripDmgRaw = computeHitDamage(rng, defender.derived.damage + defPassive.dmgBonus, ripLoc);
          const ripDmg = applyProtectMod(ripDmgRaw, ripLoc, attacker.plan.protect);
          attacker.hp -= ripDmg;
          attacker.hitsTaken++;
          defender.hitsLanded++;
          defender.ripostes++;
          defender.consecutiveHits++;
          // Canonical PBP: counterstrike after parry
          log.push({ minute: min, text: narrateCounterstrike(rng, name(defender)) });
          log.push({ minute: min, text: narrateAttack(rng, name(defender), weaponOf(defender)) });
          log.push({ minute: min, text: narrateHit(rng, name(attacker), ripLoc) });
          const sevLine2 = damageSeverityLine(rng, ripDmg, attacker.maxHp);
          if (sevLine2) log.push({ minute: min, text: sevLine2 });
        }
      }

      if (!defended) {
          // ── 5. DAMAGE APPLICATION — with passive DMG + crit ──
          const hitLoc = rollHitLocation(rng, attTactics.target, defender.plan.protect);
          let rawDamage = computeHitDamage(rng, attacker.derived.damage + attOffMods.dmgBonus + attPassive.dmgBonus, hitLoc);

          // Style-specific crit (e.g. Aimed Blow precision)
          if (attPassive.critChance > 0 && rng() < attPassive.critChance) {
            rawDamage = Math.round(rawDamage * 1.5);
            log.push({ minute: min, text: `💥 CRITICAL HIT! ${name(attacker)} finds a vital weakness!` });
            if (!tags.includes("CriticalHit")) tags.push("CriticalHit");
          }

          const damage = applyProtectMod(rawDamage, hitLoc, defender.plan.protect);
          defender.hp -= damage;
          defender.hitsTaken++;
          attacker.hitsLanded++;
          attacker.consecutiveHits++;
          defender.consecutiveHits = 0;

          // Canonical PBP narration: attack + hit + damage severity + state changes
          log.push({ minute: min, text: narrateAttack(rng, name(attacker), weaponOf(attacker)) });
          log.push({ minute: min, text: narrateHit(rng, name(defender), hitLoc) });

          const sevLine3 = damageSeverityLine(rng, damage, defender.maxHp);
          if (sevLine3) log.push({ minute: min, text: sevLine3 });

          // State change narration (desperation, bleeding, etc.)
          const defHpRatio = defender.hp / defender.maxHp;
          const prevDefHpRatio = defender.label === "A" ? prevHpRatioA : prevHpRatioD;
          const stateLine = stateChangeLine(rng, name(defender), defHpRatio, prevDefHpRatio);
          if (stateLine) log.push({ minute: min, text: stateLine });
          if (defender.label === "A") prevHpRatioA = defHpRatio;
          else prevHpRatioD = defHpRatio;

          // Crowd reactions
          const crowd = crowdReaction(rng, name(defender), name(attacker), defHpRatio);
          if (crowd) log.push({ minute: min, text: crowd });

          // Taunts (rare)
          const taunt = tauntLine(rng, name(attacker), true);
          if (taunt) log.push({ minute: min, text: taunt });

          // Consecutive hits pressing line
          if (attacker.consecutiveHits >= 3 && rng() < 0.4) {
            log.push({ minute: min, text: pressingLine(rng, name(attacker)) });
          }

          // Check for significant hit
          if (damage >= 5) {
            if (rng() < 0.5) tags.push("Flashy");
          }

          // ── 6. DECISIVENESS CHECK — Style-specific kill mechanics ──
          const killMech = getKillMechanic(attacker.style, {
            phase: phase as StylePhase,
            hitsLanded: attacker.hitsLanded,
            consecutiveHits: attacker.consecutiveHits,
            targetedLocation: attTactics.target,
            hitLocation: hitLoc,
          });

          const killWindowHp = defender.maxHp * killMech.killWindowHpMult;
          const killWindowEnd = defender.maxEndurance * 0.4;

          if (defender.hp <= killWindowHp && defender.endurance <= killWindowEnd) {
            const kdMod = Math.floor((attKD) - 5) * 0.5;
            const phaseMod = phase === "LATE" ? 3 : phase === "MID" ? 1 : 0;
            const decSuccess = skillCheck(rng, attacker.skills.DEC, kdMod + phaseMod + attMatchup + attFat + attOffMods.decBonus + killMech.decBonus);

            if (decSuccess) {
              const killRoll = rng();
              const healingReduction = defender.label === "A" ? (trainerModsA?.healMod ?? 0) * 0.03 : (trainerModsD?.healMod ?? 0) * 0.03;
              const killThreshold = Math.max(0.05, 0.3 + attKD * 0.04 + (phase === "LATE" ? 0.15 : 0) + killMech.killBonus - healingReduction);

              if (killRoll < killThreshold) {
                // KILL — style-specific narrative
                defender.hp = 0;
                winner = attacker.label as "A" | "D";
                by = "Kill";
                tags.push("Kill");

                // KILL — canonical PBP narration
                const endLines = narrateBoutEnd(rng, "Kill", name(attacker), name(defender));
                for (const l of endLines) log.push({ minute: min, text: l });
                break;
              } else {
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
            const koLines = narrateBoutEnd(rng, "KO", name(attacker), name(defender));
            for (const l of koLines) log.push({ minute: min, text: l });
            break;
        }
      }
    }

    // ── 7. ENDURANCE & FATIGUE — with style-specific drain rates ──
    // BALANCE v5: Defender discount reduced from 0.85 to 0.92 (defense is still cheaper but not free).
    // Damage tax increased: taking hits is exhausting regardless of style.
    const attEndMult = getEnduranceMult(attacker.style);
    const defEndMult = getEnduranceMult(defender.style);
    const defDamageTax = defender.hitsTaken > 0 ? Math.min(3, Math.floor(defender.hitsTaken * 0.7)) : 0;
    attacker.endurance -= Math.round(enduranceCost(attOE, attAL) * attEndMult);
    defender.endurance -= Math.max(1, Math.round(enduranceCost(defOE, defAL) * 0.92 * defEndMult) + defDamageTax);

    // Clamp endurance
    fA.endurance = Math.max(0, fA.endurance);
    fD.endurance = Math.max(0, fD.endurance);

    // Exhaustion narration
    if (fA.endurance <= 0 && fD.endurance <= 0 && !winner) {
      winner = fA.hp >= fD.hp ? "A" : fD.hp > fA.hp ? "D" : null;
      by = "Exhaustion";
      if (winner) {
        const exLines = narrateBoutEnd(rng, "Exhaustion", winner === "A" ? nameA : nameD, winner === "A" ? nameD : nameA);
        for (const l of exLines) log.push({ minute: min, text: l });
      } else {
        log.push({ minute: min, text: `Both warriors collapse from exhaustion! The bout is declared a draw.` });
      }
      break;
    }

    if (attacker.endurance <= 0 && !winner) {
      winner = defender.label as "A" | "D";
      by = "Stoppage";
      const stLines = narrateBoutEnd(rng, "Stoppage", name(defender), name(attacker));
      for (const l of stLines) log.push({ minute: min, text: l });
      break;
    }

    if (defender.endurance <= 0 && !winner) {
      winner = attacker.label as "A" | "D";
      by = "Stoppage";
      const stLines = narrateBoutEnd(rng, "Stoppage", name(attacker), name(defender));
      for (const l of stLines) log.push({ minute: min, text: l });
      break;
    }

    // Fatigue narration (canonical PBP style)
    if (ex > 0 && ex % 4 === 0) {
      for (const f of [fA, fD]) {
        const endRatio = f.endurance / f.maxEndurance;
        const fLine = fatigueLine(rng, name(f), endRatio);
        if (fLine) log.push({ minute: min, text: fLine });
      }
    }

    // Trading blows filler (canonical: "The two warriors fiercely trade attacks and parrys.")
    if (ex > 2 && rng() < 0.15) {
      log.push({ minute: min, text: tradingBlowsLine(rng) });
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
