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
  type Attributes,
  type DerivedStats,
  type TrainerData,
  type OffensiveTactic,
  type DefensiveTactic,
} from "@/types/game";
import { computeBaseSkills, computeDerivedStats } from "./skillCalc";
import { getItemById, type EquipmentLoadout, DEFAULT_LOADOUT, getLoadoutWeight, getClassicWeaponBonus, checkWeaponRequirements } from "@/data/equipment";
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
  popularityLine, skillLearnLine, narrateInsightHint,
} from "./narrativePBP";

// ─── Seeded PRNG (mulberry32) ─────────────────────────────────────────────
/**
 * Creates a seeded pseudo-random number generator (PRNG) using the mulberry32 algorithm.
 * Provides deterministic randomness for fight simulations.
 *
 * @param seed - The initial seed value.
 * @returns A function that generates a pseudo-random float between 0 (inclusive) and 1 (exclusive).
 */
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
// BALANCE v8: Tuned after seed compression.
// - TP vs LU: 0 → -1 (lungers should pressure TP with speed)
// - WS vs BA: -1 → 0 (WS zone control shouldn't auto-lose to BA)
// - SL vs WS: +1 → 0 (reduced SL dominance over WS)
const MATCHUP_MATRIX: number[][] = [
  //AB  BA  LU  PL  PR  PS  SL  ST  TP  WS
  [ 0,  0,  0,  0, +1,  0,  0,  0, +1,  0], // AB: precision reads counters — edge vs PR/TP
  [ 0,  0,  0, +1, +1,  0, +1, +1,  0,  0], // BA: power overwhelms — edge vs SL/ST/PL/PR
  [ 0,  0,  0, +1, +1, -1,  0,  0, +1, -1], // LU: speed beats PL/TP/PR, weak vs PS/WS
  [ 0, -1, -1,  0,  0,  0,  0, -1,  0,  0], // PL: weak vs BA/LU/ST
  [-1, -1,  0,  0,  0,  0,  0, -1,  0, -1], // PR: weak vs AB/BA/ST/WS — counter style needs the right matchup
  [ 0,  0, +1,  0,  0,  0,  0, -1,  0, -1], // PS: beats LU, loses to ST/WS
  [ 0, -1,  0,  0,  0,  0,  0,  0, +1,  0], // SL: beats TP, weak vs BA
  [ 0, -1, +1, +1, +1, +1,  0,  0, +1,  0], // ST: power beats LU/PL/PR/PS/TP, weak vs BA
  [-1,  0, -1,  0,  0,  0, -1, -1,  0,  0], // TP: weak vs AB/LU/SL/ST
  [ 0,  0, +1,  0, +1, +1,  0,  0,  0,  0], // WS: zone control, beats LU/PS/PR
];

/**
 * Retrieves the stylistic matchup bonus or penalty between an attacking and defending style.
 * Uses the pre-defined `MATCHUP_MATRIX`.
 *
 * @param attStyle - The fighting style of the attacker.
 * @param defStyle - The fighting style of the defender.
 * @returns The bonus (+1), neutral (0), or penalty (-1) for the attacker.
 */
function getMatchupBonus(attStyle: FightingStyle, defStyle: FightingStyle): number {
  const ai = STYLE_ORDER.indexOf(attStyle);
  const di = STYLE_ORDER.indexOf(defStyle);
  if (ai < 0 || di < 0) return 0;
  return MATCHUP_MATRIX[ai][di];
}

// ─── Phase detection ──────────────────────────────────────────────────────
type Phase = "OPENING" | "MID" | "LATE";
/**
 * Determines the current phase of the fight based on the exchange ratio.
 * Used to trigger phase-specific passive abilities and narrative events.
 *
 * @param exchange - The current exchange number.
 * @param maxExchanges - The maximum expected exchanges for the bout.
 * @returns The string literal representing the current phase ("OPENING", "MID", or "LATE").
 */
function getPhase(exchange: number, maxExchanges: number): Phase {
  const ratio = exchange / maxExchanges;
  if (ratio < PHASE_OPENING_THRESHOLD) return "OPENING";
  if (ratio < PHASE_MID_THRESHOLD) return "MID";
  return "LATE";
}

// ─── Legacy narrative helpers (replaced by narrativePBP.ts) ───────────────
// Kept as fallback only
function pickText(rng: () => number, texts: string[]): string {
  return texts[Math.floor(rng() * texts.length)];
}


type HitLocation = typeof HIT_LOCATIONS[number];

/** Maps a grouped protect target to the granular hit locations it covers */
/**
 * Expands a general protection target (e.g., "head", "body", "arms", "legs", "vital")
 * into a list of specific `HitLocation` strings it covers.
 *
 * @param protect - The generalized body part targeted for protection by the defender's tactic.
 * @returns An array of specific hit locations covered by the protection, or an empty array if none.
 */
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
      const hitChance = covered.includes(t) ? TARGET_MISS_CHANCE : TARGET_HIT_CHANCE;
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
    return Math.max(1, Math.round(damage * PROTECT_DAMAGE_REDUCTION));
  } else {
    return Math.round(damage * PROTECT_DAMAGE_PENALTY);
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
  attributes: Attributes;
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
  armHits: number;
  legHits: number;
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

// ─── Combat Constants ─────────────────────────────────────────────────────

/** Global attack bonus — offense lands frequently (fights should be violent) */
// BALANCE v8: Reduced from 8 → 4 because seed compression already favors offense via attribute scaling.
const GLOBAL_ATT_BONUS = 4;
/** Global parry penalty — parrying is hard (defense identity is endurance, not blocking) */
// BALANCE v8: Reduced from -6 → -2 because PAR attribute scaling is already halved.
const GLOBAL_PAR_PENALTY = -2;
/** Initiative winner gets a pressing advantage to reward aggressive styles */
const INITIATIVE_PRESS_BONUS = 1;

// Phase detection thresholds

// Target & Protect mechanics

// OE/AL Modifiers
const OE_ATT_SCALING = 0.7;            // Attack bonus per OE point above 5
const OE_DEF_SCALING = 0.5;            // Defense penalty per OE point above 6
const AL_INI_SCALING = 0.6;            // Initiative bonus per AL point above 5

// Fatigue thresholds and penalties
const FATIGUE_COLLAPSE_THRESHOLD = 0.1; // Endurance ratio for near-collapse
const FATIGUE_MODERATE_PENALTY = -2;    // Skill penalty at moderate fatigue
const FATIGUE_HEAVY_PENALTY = -4;       // Skill penalty at heavy fatigue
const FATIGUE_COLLAPSE_PENALTY = -7;    // Skill penalty at collapse

// Damage calculations
const DAMAGE_BASE_MIN = 1;             // Minimum damage class offset
const DAMAGE_HEAD_MULT = 1.5;          // Head hit damage multiplier
const DAMAGE_CHEST_MULT = 1.2;         // Chest hit damage multiplier
const DAMAGE_ABDOMEN_MULT = 1.1;       // Abdomen hit damage multiplier
const DAMAGE_LIMB_MULT = 0.8;          // Limb hit damage multiplier
const DAMAGE_VARIANCE_MIN = 0.7;       // Minimum damage variance
const DAMAGE_VARIANCE_MAX = 1.3;       // Maximum damage variance (MIN + 0.6)

// Equipment weight thresholds
const HEAVY_WEAPON_THRESHOLD_1 = 5;    // First heavy weapon damage bonus (≥5 weight)
const HEAVY_WEAPON_THRESHOLD_2 = 8;    // Second heavy weapon damage bonus (≥8 weight)
const LIGHT_WEAPON_THRESHOLD = 2;      // Light weapon initiative bonus (≤2 weight)
const HEAVY_ARMOR_THRESHOLD_1 = 6;     // First armor endurance penalty (≥6 weight)
const HEAVY_ARMOR_THRESHOLD_2 = 10;    // Second armor endurance penalty (≥10 weight)
const HEAVY_ARMOR_THRESHOLD_3 = 14;    // Third armor endurance penalty (≥14 weight)

// Riposte penalties (harder to riposte than normal attack)
// BALANCE v8: Kept harsh — ripostes should be rare events, not routine.
const RIPOSTE_WHIFF_PENALTY = -5;      // Penalty to riposte on whiffed attack
const RIPOSTE_PARRY_PENALTY = -4;      // Penalty to riposte after successful parry

// Endurance mechanics
const DEFENDER_ENDURANCE_DISCOUNT = 0.92; // Defending costs 8% less endurance
const DAMAGE_TAX_SCALING = 0.7;           // Endurance tax per hit taken

// Kill window mechanics
const KILL_WINDOW_HP_DEFAULT = 0.3;       // Default HP% threshold for kill window
const KILL_WINDOW_ENDURANCE = 0.4;        // Endurance% threshold for kill window
const KILL_DESIRE_SCALING = 0.04;         // Kill threshold increase per KD point
const KILL_PHASE_LATE_BONUS = 0.15;       // Kill threshold bonus in late phase
const KILL_THRESHOLD_MIN = 0.05;          // Minimum kill threshold
const KILL_THRESHOLD_BASE = 0.3;          // Base kill threshold before modifiers
const TRAINER_HEALING_REDUCTION = 0.03;   // Kill threshold reduction per healing trainer point

// Tactic overuse
const TACTIC_OVERUSE_CAP = 3;             // Maximum penalty for tactic overuse

// Bout structure
const MAX_EXCHANGES = 15;                 // Maximum exchanges before decision
const EXCHANGES_PER_MINUTE = 3;           // Exchanges per minute

// Critical hit
const CRIT_DAMAGE_MULT = 1.5;             // Critical hit damage multiplier

// Decision thresholds
const DECISION_HIT_MARGIN = 2;            // Hits advantage needed for clear decision

// ─── OE/AL Effects ────────────────────────────────────────────────────────
// BALANCE v6: Key changes:
// - GLOBAL_ATT_BONUS 6 → 8 (offense needs to land even more vs defensive seeds)
// - GLOBAL_PAR_PENALTY -4 → -6 (parrying is hard — defense is about endurance/position)
// - AB/PR OE paradox REMOVED — they now get a modest penalty at low OE like everyone
// - BA/SL/ST get ATT bonus from high OE (rewarding aggressive commitment)
// - Endurance cost formula adjusted: lower base, higher OE scaling (high OE = aggressive = tiring)

function oeAttMod(oe: number, style?: FightingStyle): number {
  // BALANCE v6: Removed AB/PR OE paradox. All styles use the same formula.
  // High OE = more aggressive = bonus to ATT. Low OE = passive = slight penalty.
  // Offensive styles (BA/SL/ST) get enhanced scaling from high OE.
  const isAggressive = style === FightingStyle.BashingAttack || style === FightingStyle.SlashingAttack || style === FightingStyle.StrikingAttack;
  const base = Math.floor((oe - 5) * OE_ATT_SCALING);
  return isAggressive ? base + 1 : base;  // Aggressive styles always get +1 ATT
}
function oeDefMod(oe: number): number { return -Math.floor(Math.max(0, oe - 6) * OE_DEF_SCALING); }
function alIniMod(al: number): number { return Math.floor((al - 5) * AL_INI_SCALING); }
function enduranceCost(oe: number, al: number): number {
  // BALANCE v6: Lower base cost (so low-OE styles are more efficient) but higher OE scaling
  // OE 3 → cost ~2, OE 7 → cost ~4, OE 10 → cost ~6
  return Math.max(1, Math.round((oe * ENDURANCE_OE_SCALING + al * ENDURANCE_AL_SCALING)));
}

// ─── Fatigue Penalties ────────────────────────────────────────────────────
function fatiguePenalty(endurance: number, maxEndurance: number): number {
  const ratio = endurance / maxEndurance;
  if (ratio > FATIGUE_MODERATE_THRESHOLD) return 0;
  if (ratio > FATIGUE_HEAVY_THRESHOLD) return FATIGUE_MODERATE_PENALTY;
  if (ratio > FATIGUE_COLLAPSE_THRESHOLD) return FATIGUE_HEAVY_PENALTY;
  return FATIGUE_COLLAPSE_PENALTY;
}

// ─── Damage Calculation ──────────────────────────────────────────────────


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
  if (weapon && weapon.weight >= HEAVY_WEAPON_THRESHOLD_1) { dmgMod += 1; }
  if (weapon && weapon.weight >= HEAVY_WEAPON_THRESHOLD_2) { dmgMod += 1; }

  // Light weapons boost initiative
  if (weapon && weapon.weight <= LIGHT_WEAPON_THRESHOLD) { iniMod += 1; }

  // Armor endurance cost (canonical weight thresholds)
  if (armor && armor.weight >= HEAVY_ARMOR_THRESHOLD_1) { endMod -= 1; }
  if (armor && armor.weight >= HEAVY_ARMOR_THRESHOLD_2) { endMod -= 2; }
  if (armor && armor.weight >= HEAVY_ARMOR_THRESHOLD_3) { endMod -= 3; }

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
  const bonus = getTrainingBonus(trainers as TrainerData[], style);
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
/**
 * Generates a sensible default fight plan for a given warrior based on their style and capabilities.
 * Used when a manager fails to provide a specific plan or as a fallback for AI logic.
 *
 * @param w - The warrior to generate the plan for.
 * @returns A complete `FightPlan` object configured for the warrior's default strategy.
 */
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
/**
 * Core function to simulate a complete fight between two warriors.
 * Processes initialization, pre-fight setups, minute-by-minute exchanges,
 * stat tracking, and final outcome determination.
 *
 * @param w1 - The first warrior participating in the fight.
 * @param w2 - The second warrior participating in the fight.
 * @param plan1 - The tactical plan provided by the first warrior's manager.
 * @param plan2 - The tactical plan provided by the second warrior's manager.
 * @param seed - The random seed ensuring the fight result is deterministic.
 * @param logPrefix - Optional string used for debugging output prefixes.
 * @returns A comprehensive `FightOutcome` object containing the winner, detailed logs, statistics, and narrative events.
 */
function createFighterState(
  label: "A" | "D",
  plan: FightPlan,
  warrior: Warrior | undefined,
  opponentPlan: FightPlan,
  trainers: TrainerData[] | undefined
): FighterState {
  const attrs = warrior?.attributes ?? { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };
  const skills = warrior?.baseSkills ?? computeBaseSkills(attrs, plan.style);
  const derived = warrior?.derivedStats ?? computeDerivedStats(attrs);

  const equip = getEquipmentMods(warrior?.equipment ?? DEFAULT_LOADOUT, derived.encumbrance);
  const trainerMods = trainers ? getTrainerMods(trainers, plan.style) : null;
  const classicBonus = getClassicWeaponBonus(plan.style, (warrior?.equipment ?? DEFAULT_LOADOUT).weapon);
  const favWeapon = warrior ? getFavoriteWeaponBonus(warrior) : 0;

  const weaponReq = checkWeaponRequirements(
    (warrior?.equipment ?? DEFAULT_LOADOUT).weapon,
    { ST: attrs.ST, DF: attrs.DF, SP: attrs.SP }
  );

  const effSkills: BaseSkills = {
    ATT: skills.ATT + equip.attMod + (trainerMods?.attMod ?? 0) + classicBonus + favWeapon + weaponReq.attPenalty,
    PAR: skills.PAR + equip.parMod + (trainerMods?.parMod ?? 0),
    DEF: skills.DEF + equip.defMod + (trainerMods?.defMod ?? 0),
    INI: skills.INI + equip.iniMod + (trainerMods?.iniMod ?? 0),
    RIP: skills.RIP,
    DEC: skills.DEC + (trainerMods?.decMod ?? 0),
  };

  return {
    label,
    attributes: attrs,
    style: plan.style,
    skills: effSkills,
    derived: { ...derived, damage: derived.damage + equip.dmgMod },
    plan,
    hp: derived.hp,
    maxHp: derived.hp,
    endurance: derived.endurance + (trainerMods?.endMod ?? 0) + equip.endMod,
    maxEndurance: derived.endurance + (trainerMods?.endMod ?? 0) + equip.endMod,
    hitsLanded: 0,
    hitsTaken: 0,
    ripostes: 0,
    consecutiveHits: 0,
    armHits: 0,
    legHits: 0,
  };
}

function initializeMatchData(
  planA: FightPlan,
  planD: FightPlan,
  warriorA?: Warrior,
  warriorD?: Warrior,
  trainers?: TrainerData[]
) {
  // Matchup bonus
  const matchupA = getMatchupBonus(planA.style, planD.style);
  const matchupD = getMatchupBonus(planD.style, planA.style);

  // Trainer mods for later healing reduction calculation
  const trainerModsA = trainers ? getTrainerMods(trainers, planA.style) : null;
  const trainerModsD = trainers ? getTrainerMods(trainers, planD.style) : null;

  // Weapon requirement cache for endurance calculations
  const attrsA = warriorA?.attributes ?? { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };
  const attrsD = warriorD?.attributes ?? { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };
  const weaponReqA = checkWeaponRequirements(
    (warriorA?.equipment ?? DEFAULT_LOADOUT).weapon,
    { ST: attrsA.ST, DF: attrsA.DF, SP: attrsA.SP }
  );
  const weaponReqD = checkWeaponRequirements(
    (warriorD?.equipment ?? DEFAULT_LOADOUT).weapon,
    { ST: attrsD.ST, DF: attrsD.DF, SP: attrsD.SP }
  );
  const nameA = warriorA?.name ?? "Attacker";
  const nameD = warriorD?.name ?? "Defender";
  const styleNameA = STYLE_DISPLAY_NAMES[planA.style] ?? planA.style;
  const styleNameD = STYLE_DISPLAY_NAMES[planD.style] ?? planD.style;

  const fA = createFighterState("A", planA, warriorA, planD, trainers);
  const fD = createFighterState("D", planD, warriorD, planA, trainers);

  return { matchupA, matchupD, trainerModsA, trainerModsD, weaponReqA, weaponReqD, nameA, nameD, styleNameA, styleNameD, fA, fD };
}

function resolvePhaseStrategy(f: FighterState, phase: Phase) {
  const phaseKey = phase === "OPENING" ? "opening" : phase === "MID" ? "mid" : "late";
  const effOE = f.plan.phases?.[phaseKey]?.OE ?? f.plan.OE;
  const effAL = f.plan.phases?.[phaseKey]?.AL ?? f.plan.AL;
  const effKD = f.plan.phases?.[phaseKey]?.killDesire ?? f.plan.killDesire ?? 5;
  const tactics = resolveEffectiveTactics(f.plan, phaseKey);
  const offMods = getOffensiveTacticMods(tactics.offTactic, f.style);
  const defMods = getDefensiveTacticMods(tactics.defTactic, f.style);

  return { effOE, effAL, effKD, tactics, offMods, defMods };
}

function appendIntroLines(
  rng: () => number,
  log: MinuteEvent[],
  planA: FightPlan,
  planD: FightPlan,
  warriorA: Warrior | undefined,
  warriorD: Warrior | undefined,
  nameA: string,
  nameD: string
) {
  appendIntroLines(rng, log, planA, planD, warriorA, warriorD, nameA, nameD);
}

function resolveInitiative(
  rng: () => number, fA: FighterState, fD: FighterState, effAL_A: number, effAL_D: number,
  matchupA: number, matchupD: number, fatA: number, fatD: number, defModsA: ReturnType<typeof getDefensiveTacticMods>, defModsD: ReturnType<typeof getDefensiveTacticMods>,
  tempoA: number, tempoD: number, passiveA: ReturnType<typeof getStylePassive>, passiveD: ReturnType<typeof getStylePassive>, antiSynA: ReturnType<typeof getStyleAntiSynergy>, antiSynD: ReturnType<typeof getStyleAntiSynergy>,
  tacticsA: ReturnType<typeof resolveEffectiveTactics>, tacticsD: ReturnType<typeof resolveEffectiveTactics>, offModsA: ReturnType<typeof getOffensiveTacticMods>, offModsD: ReturnType<typeof getOffensiveTacticMods>, effOE_A: number, effOE_D: number,
  effKD_A: number, effKD_D: number, ex: number, min: number, log: MinuteEvent[], name: (f: FighterState) => string
) {
  const iniA = fA.skills.INI + alIniMod(effAL_A) + matchupA + fatA + defModsA.iniBonus + tempoA + passiveA.iniBonus - fA.legHits;
  const iniD = fD.skills.INI + alIniMod(effAL_D) + matchupD + fatD + defModsD.iniBonus + tempoD + passiveD.iniBonus - fD.legHits;
  const aGoesFirst = contestCheck(rng, iniA, iniD);
  const iniPressBonus = INITIATIVE_PRESS_BONUS;

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

  return {
    attacker, defender, attMatchup, defMatchup, attFat, defFat, attOE, defOE, attAL, defAL,
    attKD, attPassive, defPassive, attAntiSyn, defAntiSyn, attTactics, defTactics,
    attOffMods, defOffMods, attDefMods, defDefMods, aGoesFirst, iniPressBonus
  };
}

function handleWhiffedAttack(
  rng: () => number,
  attacker: FighterState,
  defender: FighterState,
  defMatchup: number,
  defFat: number,
  defDefMods: ReturnType<typeof getDefensiveTacticMods>,
  defPassive: ReturnType<typeof getStylePassive>,
  defAntiSyn: ReturnType<typeof getStyleAntiSynergy>,
  defTactics: ReturnType<typeof resolveEffectiveTactics>,
  attOE: number,
  attAL: number,
  attOffMods: ReturnType<typeof getOffensiveTacticMods>,
  min: number,
  log: MinuteEvent[],
  name: (f: FighterState) => string,
  weaponOf: (f: FighterState) => string,
  tags: string[]
) {
  // Attack whiffs — reset consecutive hits
  attacker.consecutiveHits = 0;

  if (rng() < 0.25) {
    log.push({ minute: min, text: narrateAttack(rng, name(attacker), weaponOf(attacker)) });
    log.push({ minute: min, text: narrateDodge(rng, name(defender)) });
  }
  // ── Endurance cost for attempt ──
  attacker.endurance -= Math.max(1, Math.floor(enduranceCost(attOE, attAL) * 0.5)) + attOffMods.endCost;

  // Defender may riposte on whiff — HARD check (off-tempo, attacker recovering)
  const defAntiSynRip = Math.round((defAntiSyn.defMult - 1) * 3);
  const ripCheck = skillCheck(rng, defender.skills.RIP, defMatchup + defFat + RIPOSTE_WHIFF_PENALTY + defDefMods.ripBonus + defPassive.ripBonus + defAntiSynRip);
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
}

function resolveDefenseAttempt(
  rng: () => number,
  attacker: FighterState,
  defender: FighterState,
  defMatchup: number,
  defFat: number,
  defDefMods: ReturnType<typeof getDefensiveTacticMods>,
  defPassive: ReturnType<typeof getStylePassive>,
  defAntiSyn: ReturnType<typeof getStyleAntiSynergy>,
  defTactics: ReturnType<typeof resolveEffectiveTactics>,
  attOffMods: ReturnType<typeof getOffensiveTacticMods>,
  defOE: number,
  tacticOveruseDef: number,
  min: number,
  log: MinuteEvent[],
  name: (f: FighterState) => string,
  weaponOf: (f: FighterState) => string,
  tags: string[]
): boolean {
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
    const defSuccess = skillCheck(rng, defender.skills.DEF, defOEmod + defMatchup + defFat + defDefMods.defBonus + defPassive.defBonus - tacticOveruseDef - defender.legHits);
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
    const parrySuccess = skillCheck(rng, defender.skills.PAR, defOEmod + defMatchup + defFat + defDefMods.parBonus + defPassive.parBonus + defAntiSynPar - attOffMods.defPenalty + GLOBAL_PAR_PENALTY - bashBypass - tacticOveruseDef - defender.armHits);

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
    const ripAfterParry = skillCheck(rng, defender.skills.RIP, defMatchup + defFat + RIPOSTE_PARRY_PENALTY + defDefMods.ripBonus + defPassive.ripBonus);
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

  return defended;
}

function applyDamageAndCheckKill(
  rng: () => number,
  attacker: FighterState,
  defender: FighterState,
  attTactics: ReturnType<typeof resolveEffectiveTactics>,
  attOffMods: ReturnType<typeof getOffensiveTacticMods>,
  attPassive: ReturnType<typeof getStylePassive>,
  min: number,
  log: MinuteEvent[],
  name: (f: FighterState) => string,
  weaponOf: (f: FighterState) => string,
  tags: string[],
  prevHpRatioA: number,
  prevHpRatioD: number,
  phase: string,
  attKD: number,
  attMatchup: number,
  attFat: number,
  trainerModsA: ReturnType<typeof getTrainerMods> | null,
  trainerModsD: ReturnType<typeof getTrainerMods> | null,
  ex: number
) {
  // ── 5. DAMAGE APPLICATION — with passive DMG + crit ──
  const hitLoc = rollHitLocation(rng, attTactics.target, defender.plan.protect);
  let rawDamage = computeHitDamage(rng, attacker.derived.damage + attOffMods.dmgBonus + attPassive.dmgBonus, hitLoc);

  // Style-specific crit (e.g. Aimed Blow precision)
  if (attPassive.critChance > 0 && rng() < attPassive.critChance) {
    rawDamage = Math.round(rawDamage * CRIT_DAMAGE_MULT);
    log.push({ minute: min, text: `💥 CRITICAL HIT! ${name(attacker)} finds a vital weakness!` });
    if (!tags.includes("CriticalHit")) tags.push("CriticalHit");
  }

  const damage = applyProtectMod(rawDamage, hitLoc, defender.plan.protect);
  defender.hp -= damage;
  defender.hitsTaken++;
  attacker.hitsLanded++;
  attacker.consecutiveHits++;
  defender.consecutiveHits = 0;
  if (hitLoc === "right arm" || hitLoc === "left arm") defender.armHits++;
  if (hitLoc === "right leg" || hitLoc === "left leg") defender.legHits++;

  // Canonical PBP narration: attack + hit + damage severity + state changes
  log.push({ minute: min, text: narrateAttack(rng, name(attacker), weaponOf(attacker)) });
  log.push({ minute: min, text: narrateHit(rng, name(defender), hitLoc) });

  // Insight hint generation based on stat differences
  if (damage > 0 && rng() < 0.2) {
    let attribute = null;
    if (attacker.attributes.ST - defender.attributes.ST > 5) attribute = "ST";
    else if (defender.attributes.SP - attacker.attributes.SP > 5) attribute = "SP";
    else if (defender.attributes.DF - attacker.attributes.DF > 5) attribute = "DF";
    else if (defender.hp / defender.maxHp < 0.3) attribute = "WL";

    if (attribute) {
      const hint = narrateInsightHint(rng, attribute);
      if (hint) {
        log.push({ minute: min, text: `🔍 ${hint}` });
        if (!tags.includes(`Insight_${attribute}`)) tags.push(`Insight_${attribute}`);
      }
    }
  }

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

  let ended = false;
  let winner = null;
  let by = null;
  let causeBucket: any = undefined;
  let fatalHitLocation = undefined;
  let fatalExchangeIndex = undefined;

  // ── 6. DECISIVENESS CHECK — Style-specific kill mechanics ──
  const killMech = getKillMechanic(attacker.style, {
    phase: phase as StylePhase,
    hitsLanded: attacker.hitsLanded,
    consecutiveHits: attacker.consecutiveHits,
    targetedLocation: attTactics.target,
    hitLocation: hitLoc,
  });

  const killWindowHp = defender.maxHp * killMech.killWindowHpMult;
  const killWindowEnd = defender.maxEndurance * KILL_WINDOW_ENDURANCE;

  if (defender.hp <= killWindowHp && defender.endurance <= killWindowEnd) {
    const kdMod = Math.floor((attKD) - 5) * 0.5;
    const phaseMod = phase === "LATE" ? 3 : phase === "MID" ? 1 : 0;
    const decSuccess = skillCheck(rng, attacker.skills.DEC, kdMod + phaseMod + attMatchup + attFat + attOffMods.decBonus + killMech.decBonus);

    if (decSuccess) {
      const killRoll = rng();
      const healingReduction = defender.label === "A" ? (trainerModsA?.healMod ?? 0) * TRAINER_HEALING_REDUCTION : (trainerModsD?.healMod ?? 0) * TRAINER_HEALING_REDUCTION;
      const killThreshold = Math.max(KILL_THRESHOLD_MIN, KILL_THRESHOLD_BASE + attKD * KILL_DESIRE_SCALING + (phase === "LATE" ? KILL_PHASE_LATE_BONUS : 0) + killMech.killBonus - healingReduction);

      if (killRoll < killThreshold) {
        // KILL — style-specific narrative
        defender.hp = 0;
        winner = attacker.label;
        by = "Kill";
        causeBucket = "EXECUTION";
        fatalHitLocation = hitLoc;
        fatalExchangeIndex = ex;
        tags.push("Kill");

        // KILL — canonical PBP narration
        const endLines = narrateBoutEnd(rng, "Kill", name(attacker), name(defender));
        for (const l of endLines) log.push({ minute: min, text: l });
        ended = true;
      } else {
        log.push({
          minute: min,
          text: `${name(attacker)} senses the kill window but ${name(defender)} desperately clings on!`,
        });
      }
    }
  }

  // KO check
  if (!ended && defender.hp <= 0) {
    winner = attacker.label;
    by = "KO";
    causeBucket = "FATAL_DAMAGE";
    fatalHitLocation = hitLoc;
    fatalExchangeIndex = ex;
    tags.push("KO");
    const koLines = narrateBoutEnd(rng, "KO", name(attacker), name(defender));
    for (const l of koLines) log.push({ minute: min, text: l });
    ended = true;
  }

  return { ended, winner, by, causeBucket, fatalHitLocation, fatalExchangeIndex, prevHpRatioA, prevHpRatioD };
}

function applyEnduranceCostAndCheckExhaustion(
  rng: () => number,
  attacker: FighterState,
  defender: FighterState,
  fA: FighterState,
  fD: FighterState,
  attOE: number,
  attAL: number,
  defOE: number,
  defAL: number,
  weaponReqA: ReturnType<typeof checkWeaponRequirements>,
  weaponReqD: ReturnType<typeof checkWeaponRequirements>,
  winnerIn: string | null,
  min: number,
  log: MinuteEvent[],
  name: (f: FighterState) => string,
  nameA: string,
  nameD: string,
  ex: number
) {
  // ── 7. ENDURANCE & FATIGUE — with style-specific drain rates ──
  const attEndMult = getEnduranceMult(attacker.style);
  const defEndMult = getEnduranceMult(defender.style);
  const defDamageTax = defender.hitsTaken > 0 ? Math.min(3, Math.floor(defender.hitsTaken * DAMAGE_TAX_SCALING)) : 0;

  const attWepEndMult = attacker.label === "A" ? weaponReqA.endurancePenalty : weaponReqD.endurancePenalty;
  const defWepEndMult = defender.label === "A" ? weaponReqA.endurancePenalty : weaponReqD.endurancePenalty;

  attacker.endurance -= Math.round(enduranceCost(attOE, attAL) * attEndMult * attWepEndMult);
  defender.endurance -= Math.max(1, Math.round(enduranceCost(defOE, defAL) * DEFENDER_ENDURANCE_DISCOUNT * defEndMult * defWepEndMult) + defDamageTax);

  // Clamp endurance
  fA.endurance = Math.max(0, fA.endurance);
  fD.endurance = Math.max(0, fD.endurance);

  let ended = false;
  let winner = winnerIn;
  let by = null;

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
    ended = true;
    return { ended, winner, by };
  }

  if (attacker.endurance <= 0 && !winner) {
    winner = defender.label;
    by = "Stoppage";
    const stLines = narrateBoutEnd(rng, "Stoppage", name(defender), name(attacker));
    for (const l of stLines) log.push({ minute: min, text: l });
    ended = true;
    return { ended, winner, by };
  }

  if (defender.endurance <= 0 && !winner) {
    winner = attacker.label;
    by = "Stoppage";
    const stLines = narrateBoutEnd(rng, "Stoppage", name(attacker), name(defender));
    for (const l of stLines) log.push({ minute: min, text: l });
    ended = true;
    return { ended, winner, by };
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

  return { ended, winner, by };
}

function determineFightResult(
  winner: string | null,
  by: string | null,
  fA: FighterState,
  fD: FighterState,
  nameA: string,
  nameD: string,
  min: number,
  log: MinuteEvent[],
  tags: string[]
) {
  // If no winner after all exchanges — decision or draw
  if (!winner) {
    if (fA.hitsLanded > fD.hitsLanded + DECISION_HIT_MARGIN) {
      winner = "A";
      by = "Stoppage";
      log.push({ minute: min, text: `Time! ${nameA} is awarded the decision on points.` });
    } else if (fD.hitsLanded > fA.hitsLanded + DECISION_HIT_MARGIN) {
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

  return { winner, by, uniqueTags };
}

export function simulateFight(
  planA: FightPlan,
  planD: FightPlan,
  warriorA?: Warrior,
  warriorD?: Warrior,
  seed?: number,
  trainers?: TrainerData[]
): FightOutcome {
  const rng = mulberry32(seed ?? (Date.now() ^ getSecureSeed()));

  const matchData = initializeMatchData(planA, planD, warriorA, warriorD, trainers);
  const matchupA = matchData.matchupA;
  const matchupD = matchData.matchupD;
  const trainerModsA = matchData.trainerModsA;
  const trainerModsD = matchData.trainerModsD;
  const weaponReqA = matchData.weaponReqA;
  const weaponReqD = matchData.weaponReqD;
  const nameA = matchData.nameA;
  const nameD = matchData.nameD;
  const styleNameA = matchData.styleNameA;
  const styleNameD = matchData.styleNameD;
  const fA = matchData.fA;
  const fD = matchData.fD;

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
  let causeBucket: FightOutcome["post"]["causeBucket"] | undefined = undefined;
  let fatalHitLocation: string | undefined = undefined;
  let fatalExchangeIndex: number | undefined = undefined;

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

    // Phase and Tactic resolution
    const phaseStrategyA = resolvePhaseStrategy(fA, phase);
    const phaseStrategyD = resolvePhaseStrategy(fD, phase);

    const effOE_A = phaseStrategyA.effOE;
    const effAL_A = phaseStrategyA.effAL;
    const effKD_A = phaseStrategyA.effKD;
    const tacticsA = phaseStrategyA.tactics;
    const offModsA = phaseStrategyA.offMods;
    const defModsA = phaseStrategyA.defMods;

    const effOE_D = phaseStrategyD.effOE;
    const effAL_D = phaseStrategyD.effAL;
    const effKD_D = phaseStrategyD.effKD;
    const tacticsD = phaseStrategyD.tactics;
    const offModsD = phaseStrategyD.offMods;
    const defModsD = phaseStrategyD.defMods;

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
    const initData = resolveInitiative(
      rng, fA, fD, effAL_A, effAL_D, matchupA, matchupD, fatA, fatD, defModsA, defModsD,
      tempoA, tempoD, passiveA, passiveD, antiSynA, antiSynD, tacticsA, tacticsD,
      offModsA, offModsD, effOE_A, effOE_D, effKD_A, effKD_D, ex, min, log, name
    );

    const {
      attacker, defender, attMatchup, defMatchup, attFat, defFat, attOE, defOE, attAL, defAL,
      attKD, attPassive, defPassive, attAntiSyn, defAntiSyn, attTactics, defTactics,
      attOffMods, defOffMods, attDefMods, defDefMods, aGoesFirst, iniPressBonus
    } = initData;

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
    // Penalty: -1 per consecutive exchange using same tactic (cap at TACTIC_OVERUSE_CAP)
    const tacticOveruseAtt = aGoesFirst ? Math.min(TACTIC_OVERUSE_CAP, tacticStreakA) : Math.min(TACTIC_OVERUSE_CAP, tacticStreakD);
    const tacticOveruseDef = aGoesFirst ? Math.min(TACTIC_OVERUSE_CAP, tacticStreakD) : Math.min(TACTIC_OVERUSE_CAP, tacticStreakA);

    // ── 2. ATTACK ATTEMPT — with passive ATT + anti-synergy + PR OE paradox ──
    const attOEmod = oeAttMod(attOE, attacker.style);
    const attAntiSynMod = Math.round((attAntiSyn.offMult - 1) * 5);
    const attackSuccess = skillCheck(rng, attacker.skills.ATT, attOEmod + attMatchup + attFat + attOffMods.attBonus + attPassive.attBonus + attAntiSynMod + iniPressBonus + GLOBAL_ATT_BONUS - tacticOveruseAtt - attacker.armHits);

    let hitLanded = false;

    if (!attackSuccess) {
      handleWhiffedAttack(rng, attacker, defender, defMatchup, defFat, defDefMods, defPassive, defAntiSyn, defTactics, attOE, attAL, attOffMods, min, log, name, weaponOf, tags);
    } else {
      hitLanded = !resolveDefenseAttempt(rng, attacker, defender, defMatchup, defFat, defDefMods, defPassive, defAntiSyn, defTactics, attOffMods, defOE, tacticOveruseDef, min, log, name, weaponOf, tags);
    }

    if (hitLanded) {
      const killResult = applyDamageAndCheckKill(
        rng, attacker, defender, attTactics, attOffMods, attPassive, min, log, name, weaponOf, tags,
        prevHpRatioA, prevHpRatioD, phase, attKD, attMatchup, attFat, trainerModsA, trainerModsD, ex
      );

      prevHpRatioA = killResult.prevHpRatioA;
      prevHpRatioD = killResult.prevHpRatioD;

      if (killResult.ended) {
        winner = killResult.winner as "A" | "D";
        by = killResult.by as FightOutcome["by"];
        causeBucket = killResult.causeBucket;
        fatalHitLocation = killResult.fatalHitLocation;
        fatalExchangeIndex = killResult.fatalExchangeIndex;
        break;
      }
    }

    const endResult = applyEnduranceCostAndCheckExhaustion(
      rng, attacker, defender, fA, fD, attOE, attAL, defOE, defAL, weaponReqA, weaponReqD,
      winner, min, log, name, nameA, nameD, ex
    );

    if (endResult.ended) {
      winner = endResult.winner as "A" | "D" | null;
      by = endResult.by as FightOutcome["by"];
      break;
    }
  }

  const result = determineFightResult(winner, by, fA, fD, nameA, nameD, minute(MAX_EXCHANGES), log, tags);

  const finalMinute = log.length > 0 ? log[log.length - 1].minute : 1;

  return {
    winner: result.winner as "A" | "D" | null,
    by: result.by as FightOutcome["by"],
    minutes: finalMinute,
    log,
    post: {
      xpA: result.winner === "A" ? 2 : result.winner === null ? 1 : 1,
      xpD: result.winner === "D" ? 2 : result.winner === null ? 1 : 1,
      hitsA: fA.hitsLanded,
      hitsD: fD.hitsLanded,
      gotKillA: result.winner === "A" && result.by === "Kill",
      gotKillD: result.winner === "D" && result.by === "Kill",
      tags: result.uniqueTags,
      causeBucket,
      fatalHitLocation,
      fatalExchangeIndex,
    },
  };
}
