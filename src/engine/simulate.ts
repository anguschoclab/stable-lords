/**
 * Stable Lords — Full Combat Engine (Decoupled v2)
 *
 * Refactored for:
 * 1. Determinism - Injectable RNG and seeds.
 * 2. Simpler setup - Decomposed stat calculation.
 * 3. Pure Logic - Separated simulation from narrative side-effects.
 */
import {
  FightingStyle,
  type Warrior,
  type FightPlan,
  type FightOutcome,
  type MinuteEvent,
  type BaseSkills,
  type TrainerData,
} from "@/types/game";
import { getItemById, DEFAULT_LOADOUT, getClassicWeaponBonus, checkWeaponRequirements } from "@/data/equipment";
import { getTrainingBonus } from "@/engine/trainers";
import { mulberry32, getPhase as getCombatPhase } from "./combat/combatMath";
import { getFavoriteWeaponBonus } from "./favorites";
import {
  generateWarriorIntro, battleOpener, conservingLine, minuteStatusLine,
  narrateBoutEnd
} from "./narrativePBP";
import { 
  resolveExchange, 
  getMatchupBonus, 
  type FighterState, 
  type ResolutionContext, 
  resolveEffectiveTactics,
  DECISION_HIT_MARGIN,
  MAX_EXCHANGES,
  EXCHANGES_PER_MINUTE,
} from "./combat/resolution";
import { narrateEvents, type NarrationContext } from "./combat/narrator";
import { generateId } from "@/utils/idUtils";

// ─── Types ──────────────────────────────────────────────────────────────
import { type CombatEvent as ExchangeEvent } from "@/types/game";

type Phase = "OPENING" | "MID" | "LATE";

// ─── Helpers ──────────────────────────────────────────────────────────────

function getPhase(exchange: number, maxExchanges: number): Phase {
  const p = getCombatPhase(exchange, maxExchanges);
  return p.toUpperCase() as Phase;
}

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

// ─── Main Entry Point ─────────────────────────────────────────────────────

/**
 * Simulates a fight between two plans/warriors.
 * 
 * @param planA - Strategy for fighter A
 * @param planB - Strategy for fighter D
 * @param warriorA - Warrior data for A (optional)
 * @param warriorD - Warrior data for D (optional)
 * @param providedRng - Seeded RNG function (optional, generates one if missing)
 * @param trainers - Active trainers providing global modifiers
 */
export function simulateFight(
  planA: FightPlan,
  planD: FightPlan,
  warriorA?: Warrior,
  warriorD?: Warrior,
  providedRng?: (() => number) | number,
  trainers?: TrainerData[]
): FightOutcome {
  // 1. Deterministic RNG setup
  let rng: () => number;
  if (typeof providedRng === "function") {
    rng = providedRng;
  } else {
    const seed = typeof providedRng === "number" 
      ? providedRng 
      : (typeof globalThis !== "undefined" && (globalThis as any).crypto 
          ? (globalThis as any).crypto.getRandomValues(new Uint32Array(1))[0] 
          : Math.floor(Math.random() * 0xFFFFFFFF));
    rng = mulberry32(seed);
  }

  const nameA = warriorA?.name ?? "Attacker";
  const nameD = warriorD?.name ?? "Defender";
  const weaponA = (warriorA?.equipment ?? DEFAULT_LOADOUT).weapon;
  const weaponD = (warriorD?.equipment ?? DEFAULT_LOADOUT).weapon;

  const fA = createFighterState("A", planA, warriorA, trainers);
  const fD = createFighterState("D", planD, warriorD, trainers);

  const resCtx: ResolutionContext = {
    rng,
    phase: "OPENING",
    exchange: 0,
    matchupA: getMatchupBonus(planA.style, planD.style),
    matchupD: getMatchupBonus(planD.style, planA.style),
    trainerModsA: trainers ? getTrainerMods(trainers, planA.style) : null,
    trainerModsD: trainers ? getTrainerMods(trainers, planD.style) : null,
    weaponReqA: checkWeaponRequirements(weaponA, { ST: fA.attributes.ST, DF: fA.attributes.DF, SP: fA.attributes.SP }),
    weaponReqD: checkWeaponRequirements(weaponD, { ST: fD.attributes.ST, DF: fD.attributes.DF, SP: fD.attributes.SP }),
    tacticStreakA: 0,
    tacticStreakD: 0,
  };

  const log: MinuteEvent[] = [];
  const tags = new Set<string>();
  let prevHpRatioA = 1.0;
  let prevHpRatioD = 1.0;
  let winner: "A" | "D" | null = null;
  let by: FightOutcome["by"] = null;
  let lastPhase: string | null = null;
  let lastMinuteMarker = 0;
  
  let causeBucket: FightOutcome["post"]["causeBucket"] | undefined;
  let fatalHitLocation: string | undefined;
  let fatalExchangeIndex: number | undefined;

  // ── 1. Introductions ──
  const introA = generateWarriorIntro(rng, { name: nameA, style: planA.style, weaponId: weaponA, armorId: (warriorA?.equipment ?? DEFAULT_LOADOUT).armor, helmId: (warriorA?.equipment ?? DEFAULT_LOADOUT).helm }, warriorA?.attributes?.SZ);
  const introD = generateWarriorIntro(rng, { name: nameD, style: planD.style, weaponId: weaponD, armorId: (warriorD?.equipment ?? DEFAULT_LOADOUT).armor, helmId: (warriorD?.equipment ?? DEFAULT_LOADOUT).helm }, warriorD?.attributes?.SZ);
  
  introA.forEach(line => log.push({ minute: 0, text: line }));
  log.push({ minute: 0, text: "" });
  introD.forEach(line => log.push({ minute: 0, text: line }));
  log.push({ minute: 0, text: "" });

  log.push({ minute: 1, text: battleOpener(rng) });
  if (planA.OE <= 3) log.push({ minute: 1, text: conservingLine(nameA) });
  if (planD.OE <= 3) log.push({ minute: 1, text: conservingLine(nameD) });

  // ── 2. Main Simulation Loop ──
  for (let ex = 0; ex < MAX_EXCHANGES; ex++) {
    const min = Math.floor(ex / EXCHANGES_PER_MINUTE) + 1;
    const phase = getPhase(ex, MAX_EXCHANGES);
    resCtx.phase = phase;
    resCtx.exchange = ex;

    // Phase Change & Tactic Reveal
    if (phase !== lastPhase) {
      lastPhase = phase;
      const tacticsA = resolveEffectiveTactics(fA.plan, phase.toLowerCase() as any);
      const tacticsD = resolveEffectiveTactics(fD.plan, phase.toLowerCase() as any);
      log.push({
        minute: min,
        text: `— ${phase.charAt(0) + phase.slice(1).toLowerCase()} Phase —`,
        phase,
        offTacticA: tacticsA.offTactic !== "none" ? tacticsA.offTactic : undefined,
        defTacticA: tacticsA.defTactic !== "none" ? tacticsA.defTactic : undefined,
        offTacticD: tacticsD.offTactic !== "none" ? tacticsD.offTactic : undefined,
        defTacticD: tacticsD.defTactic !== "none" ? tacticsD.defTactic : undefined,
      });
    }

    if (min > lastMinuteMarker && min > 1) {
      lastMinuteMarker = min;
      log.push({ minute: min, text: `MINUTE ${min}.` });
      log.push({ minute: min, text: minuteStatusLine(rng, min, nameA, nameD, fA.hitsLanded, fD.hitsLanded) });
    }

    // A. Resolve Math (Dice)
    const events = resolveExchange(resCtx, fA, fD);

    // B. Resolve Narration (Drama)
    const narCtx: NarrationContext = {
      rng, nameA, nameD, weaponA, weaponD,
      styleA: fA.style, styleD: fD.style,
      maxHpA: fA.maxHp, maxHpD: fD.maxHp,
      prevHpRatioA, prevHpRatioD
    };
    const { log: newLines, lastHpRatioA, lastHpRatioD } = narrateEvents(events, narCtx, min);
    log.push(...newLines);
    prevHpRatioA = lastHpRatioA;
    prevHpRatioD = lastHpRatioD;

    // C. Check for End Events
    const boutEnd = events.find(e => e.type === "BOUT_END");
    if (boutEnd) {
      winner = boutEnd.actor === "A" ? "A" : "D";
      by = boutEnd.result as any;
      fatalHitLocation = boutEnd.metadata?.location;
      fatalExchangeIndex = ex;
      causeBucket = boutEnd.metadata?.cause;
      
      const boutEndLines = narrateBoutEnd(rng, by as string, boutEnd.actor === "A" ? nameA : nameD, boutEnd.actor === "A" ? nameD : nameA);
      boutEndLines.forEach(line => log.push({ minute: min, text: line }));
      break;
    }
  }

  // ── 3. Decision Logic (if time limit reached) ──
  if (!winner) {
    const finalOutcome = resolveDecision(fA, fD, nameA, nameD);
    winner = finalOutcome.winner;
    by = finalOutcome.by;
    log.push({ minute: Math.floor(MAX_EXCHANGES / EXCHANGES_PER_MINUTE), text: finalOutcome.narrative });
  }

  // Outcome Tags & Postprocessing
  if (winner) {
    const w = winner === "A" ? fA : fD;
    const l = winner === "A" ? fD : fA;
    if (w.hp < w.maxHp * 0.3 && w.hitsLanded > l.hitsLanded) tags.add("Comeback");
    if (w.hitsLanded >= 5) tags.add("Dominance");
    if (by === "KO") tags.add("KO");
    if (by === "Kill") tags.add("Kill");
  }

  return {
    winner,
    by,
    minutes: Math.max(1, log[log.length - 1]?.minute ?? 1),
    log,
    post: {
      xpA: winner === "A" ? 2 : 1,
      xpD: winner === "D" ? 2 : 1,
      hitsA: fA.hitsLanded,
      hitsD: fD.hitsLanded,
      gotKillA: winner === "A" && by === "Kill",
      gotKillD: winner === "D" && by === "Kill",
      tags: Array.from(tags),
      causeBucket,
      fatalHitLocation,
      fatalExchangeIndex,
    },
  };
}

/**
 * Handles decision points at the end of a fight.
 */
function resolveDecision(fA: FighterState, fD: FighterState, nameA: string, nameD: string): { winner: "A"|"D"|null, by: FightOutcome["by"], narrative: string } {
    if (fA.hitsLanded > fD.hitsLanded + DECISION_HIT_MARGIN) {
      return { winner: "A", by: "Stoppage", narrative: `Time! ${nameA} is awarded the decision on points.` };
    } 
    if (fD.hitsLanded > fA.hitsLanded + DECISION_HIT_MARGIN) {
      return { winner: "D", by: "Stoppage", narrative: `Time! ${nameD} is awarded the decision on points.` };
    } 
    if (fA.hp > fD.hp) {
      return { winner: "A", by: "Stoppage", narrative: `Time! ${nameA} wins a close decision.` };
    } 
    if (fD.hp > fA.hp) {
      return { winner: "D", by: "Stoppage", narrative: `Time! ${nameD} wins a close decision.` };
    }
    return { winner: null, by: "Draw", narrative: `Time! The Arenamaster declares a draw.` };
}

/**
 * Returns a sane default plan for a warrior based on their fighting style.
 * Used when a warrior has no custom plan set.
 */
export function defaultPlanForWarrior(warrior: Warrior): FightPlan {
  const style = warrior.style;

  const isAggressive = [
    FightingStyle.BashingAttack,
    FightingStyle.StrikingAttack,
    FightingStyle.LungingAttack,
    FightingStyle.SlashingAttack,
  ].includes(style);

  const isDefensive = [
    FightingStyle.TotalParry,
    FightingStyle.WallOfSteel,
    FightingStyle.ParryRiposte,
  ].includes(style);

  let oe = 5, al = 6, kd = 5;

  if (isAggressive) {
    oe = style === FightingStyle.BashingAttack ? 9 : 8;
    al = style === FightingStyle.BashingAttack ? 3 : (style === FightingStyle.LungingAttack ? 8 : 5);
    kd = 7;
  } else if (isDefensive) {
    oe = style === FightingStyle.TotalParry ? 2 : 4;
    al = style === FightingStyle.TotalParry ? 2 : 5;
    kd = 3;
  } else if (style === FightingStyle.AimedBlow) {
    oe = 6; al = 5; kd = 8;
  }

  return { style, OE: oe, AL: al, killDesire: kd, target: "Any", protect: "Any" };
}
