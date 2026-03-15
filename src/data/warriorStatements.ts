/**
 * Stable Lords — Canonical Warrior Statements
 * Wit (good & bad), Quickness, Coordination, and Endurance statements
 * from Terrablood's Duel II archives.
 *
 * Sources:
 *   https://terrablood.com/duel-ii-formerly-known-as-duelmasters/good-wit-statements/
 *   https://terrablood.com/duel-ii-formerly-known-as-duelmasters/bad-wit-statements/
 *   https://terrablood.com/duel-ii-formerly-known-as-duelmasters/endurance-wit-statements/
 *   https://terrablood.com/duel-ii-formerly-known-as-duelmasters/warrior-quickness-statements/
 *   https://terrablood.com/duel-ii-formerly-known-as-duelmasters/coordination-statements/
 */

import type { BaseSkills } from "@/types/game";
import { computeCoordination, computeActivityRating, type CoordinationRating, type ActivityRating } from "./terrabloodCharts";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface WarriorOverviewStatements {
  initiative: string;
  riposte: string;
  attack: string;
  parry: string;
  defense: string;
  endurance: string;
  coordination: string;
  quickness: string;
  activity: string;
}

// ─── Good Wit Statements (WT > 7) ──────────────────────────────────────────
// Each category has high-order and low-order variants based on base skill value.
// Threshold determines which statement text to use.

type StatementEntry = { minBase: number; text: string };

function pickStatement(entries: StatementEntry[], baseValue: number): string {
  for (const e of entries) {
    if (baseValue >= e.minBase) return e.text;
  }
  return entries[entries.length - 1].text;
}

// GOOD WIT: INITIATIVE (1st statement)
const GOOD_INI_HIGH: StatementEntry[] = [ // base >= 13
  { minBase: 21, text: "Brilliant at keeping his foes off balance" },
  { minBase: 17, text: "Nothing short of a genius at keeping his foes at swords point" },
  { minBase: 15, text: "Nothing short of a genius at keeping his foes off balance and in trouble" },
  { minBase: 13, text: "Has learned very well how to keep his foe in trouble" },
  { minBase: 0,  text: "Has learned how to keep his foe in trouble" },
];
const GOOD_INI_LOW: StatementEntry[] = [ // base 8-12
  { minBase: 21, text: "Never wastes a moment or is indecisive" },
  { minBase: 17, text: "Seldom hesitates, moves instantly if given an opportunity" },
  { minBase: 15, text: "With a very aggressive and clever fighting style" },
  { minBase: 13, text: "Has learned to be a decisive and quick fighter" },
  { minBase: 0,  text: "Has learned how to be decisive and quick" },
];

// GOOD WIT: RIPOSTE (2nd statement)
const GOOD_RIP_HIGH: StatementEntry[] = [ // base >= 13
  { minBase: 21, text: "Is always alert for any clue to a foe's weakness" },
  { minBase: 17, text: "Is a very crafty fighter" },
  { minBase: 15, text: "Makes the most of his enemy's mistakes" },
  { minBase: 13, text: "Makes good dueling decisions" },
  { minBase: 0,  text: "Makes good dueling decisions" },
];
const GOOD_RIP_LOW: StatementEntry[] = [ // base 10-12
  { minBase: 21, text: "Is an extremely crafty fighter" },
  { minBase: 17, text: "Does a lot of little things well" },
  { minBase: 15, text: "Does a lot of little things well" },
  { minBase: 13, text: "Cleverly controls his foes' actions" },
  { minBase: 0,  text: "Cleverly controls his foe's actions" },
];

// GOOD WIT: ATTACK (3rd statement)
const GOOD_ATT_HIGH: StatementEntry[] = [ // base >= 10
  { minBase: 21, text: "Knows every weak and sensitive location to be struck on the human body" },
  { minBase: 17, text: "Uses an unusual fighting style, deadly to slower, less active foes" },
  { minBase: 15, text: "Makes very clever attacks" },
  { minBase: 13, text: "Landing blows on vital areas" },
  { minBase: 0,  text: "He lands blows on less protected areas" },
];
const GOOD_ATT_LOW: StatementEntry[] = [ // base 7-9
  { minBase: 21, text: "Is always thinking of feints and ploys to be used in attacks" },
  { minBase: 17, text: "Has a very clever fighting style" },
  { minBase: 15, text: "Has an unusual fighting style that confuses many opponents" },
  { minBase: 13, text: "Makes clever attacks" },
  { minBase: 0,  text: "Makes clever attacks" },
];

// GOOD WIT: PARRY (4th statement)
const GOOD_PAR_HIGH: StatementEntry[] = [ // base >= 10
  { minBase: 21, text: "Has made parrying an art form" },
  { minBase: 17, text: "Seldom makes mistakes" },
  { minBase: 15, text: "Parrys very intelligently" },
  { minBase: 13, text: "Is gifted at parrying" },
  { minBase: 0,  text: "Is gifted at parrying" },
];
const GOOD_PAR_LOW: StatementEntry[] = [ // base 6-9
  { minBase: 21, text: "Seldom makes a mistake" },
  { minBase: 17, text: "Has learned the finer points of parrying" },
  { minBase: 15, text: "Rarely makes mistakes" },
  { minBase: 13, text: "Parrys intelligently" },
  { minBase: 0,  text: "Parrys intelligently" },
];

// GOOD WIT: DEFENSE (5th statement)
const GOOD_DEF_HIGH: StatementEntry[] = [ // base >= 7
  { minBase: 21, text: "He's always thinking a few steps ahead of his foes" },
  { minBase: 17, text: "Has turned avoiding blows into an art form" },
  { minBase: 15, text: "Is always thinking ahead" },
  { minBase: 13, text: "Is gifted at avoiding blows" },
  { minBase: 0,  text: "Is gifted at avoiding a blow" },
];
const GOOD_DEF_LOW: StatementEntry[] = [ // base 3-6
  { minBase: 21, text: "Is always where he should be" },
  { minBase: 17, text: "Avoids blows well" },
  { minBase: 15, text: "Avoids blows well" },
  { minBase: 13, text: "Makes few mistakes" },
  { minBase: 0,  text: "Makes few mistakes" },
];

// GOOD WIT: ENDURANCE (6th statement)
const GOOD_END_HIGH: StatementEntry[] = [
  { minBase: 21, text: "Will not over-extend himself" },
  { minBase: 17, text: "Has the wisdom to wait out his foes" },
  { minBase: 15, text: "Rarely wastes his endurance needlessly" },
  { minBase: 13, text: "Conserves his endurance past what one might normally expect" },
  { minBase: 0,  text: "Can conserve his endurance past what might normally be expected" },
];
const GOOD_END_LOW: StatementEntry[] = [
  { minBase: 21, text: "Never wastes his endurance needlessly" },
  { minBase: 17, text: "Conserves his endurance well" },
  { minBase: 15, text: "He plans out every move he makes, seldom wasting any effort" },
  { minBase: 13, text: "Seldom wastes his endurance needlessly" },
  { minBase: 0,  text: "Seldom wastes his endurance needlessly" },
];

// ─── Bad Wit Statements (WT <= 7) ──────────────────────────────────────────

const BAD_INI_HIGH: StatementEntry[] = [
  { minBase: 7, text: "He is unconcerned with controlling the fight" },
  { minBase: 5, text: "Responding to the actions of his foes rather than controlling the fight" },
  { minBase: 0, text: "He needs time to think things through before he can act" },
];
const BAD_INI_LOW: StatementEntry[] = [
  { minBase: 7, text: "Rarely considers how to gain the initiative" },
  { minBase: 5, text: "He often needs time to think things through, losing the chance to act" },
  { minBase: 0, text: "He stands around slack-jawed" },
];

const BAD_RIP_HIGH: StatementEntry[] = [
  { minBase: 7, text: "The more subtle points of the riposte simply escape him" },
  { minBase: 5, text: "He often fails to make use of his foes mistakes" },
  { minBase: 0, text: "He makes a lot of mistakes" },
];
const BAD_RIP_LOW: StatementEntry[] = [
  { minBase: 7, text: "He makes bad dueling decisions" },
  { minBase: 5, text: "He makes mistakes" },
  { minBase: 0, text: "He is too dense to respond to his opponent's mistakes" },
];

const BAD_ATT_HIGH: StatementEntry[] = [
  { minBase: 7, text: "He makes bad dueling decisions" },
  { minBase: 5, text: "Makes feints that fool no one" },
  { minBase: 0, text: "He makes a lot of mistakes" },
];
const BAD_ATT_LOW: StatementEntry[] = [
  { minBase: 7, text: "He makes costly mistakes" },
  { minBase: 5, text: "He makes incredibly stupid attacks" },
  { minBase: 0, text: "He makes stupid feints that fool no one" },
];

const BAD_PAR_HIGH: StatementEntry[] = [
  { minBase: 7, text: "Fails to parry in situations where he could do so" },
  { minBase: 5, text: "Is nearly always fooled by a feint" },
  { minBase: 0, text: "Isn't bright enough to parry in most circumstances" },
];
const BAD_PAR_LOW: StatementEntry[] = [
  { minBase: 7, text: "Carelessly taking blows that he could avoid" },
  { minBase: 5, text: "Is often fooled by a feint" },
  { minBase: 0, text: "He is usually fooled by a feint" },
];

const BAD_DEF_HIGH: StatementEntry[] = [
  { minBase: 7, text: "Carelessly takes blows that he could avoid" },
  { minBase: 5, text: "Is often fooled by a feint" },
  { minBase: 0, text: "He is constantly making mistakes" },
];
const BAD_DEF_LOW: StatementEntry[] = [
  { minBase: 7, text: "Stands around making himself a target" },
  { minBase: 5, text: "He makes mistakes" },
  { minBase: 0, text: "He just doesn't care if he gets hurt or not" },
];

const BAD_END_HIGH: StatementEntry[] = [
  { minBase: 7, text: "And he doesn't conserve his endurance" },
  { minBase: 5, text: "He doesn't think about resting as much as he should" },
  { minBase: 0, text: "Often wastes his endurance thoughtlessly" },
];
const BAD_END_LOW: StatementEntry[] = [
  { minBase: 7, text: "He fails to husband strength when tired" },
  { minBase: 5, text: "Often wastes his endurance thoughtlessly" },
  { minBase: 0, text: "And he doesn't have the smarts to understand when he should rest" },
];

// ─── Quickness Statements ──────────────────────────────────────────────────
// Based on DEF base and PAR base (WT > 7 only)

function getQuicknessStatement(defBase: number, parBase: number, wt: number): string {
  if (wt <= 7) {
    // Bad wit warriors get simplified quickness
    if (defBase >= 15) return "Is quick on his feet";
    if (defBase >= 5) return "";
    if (defBase >= -10) return "Is slow on his feet";
    return "Is very slow on his feet";
  }

  let speed;
  let qualifier;

  if (defBase >= 35) {
    speed = "is incredibly quick and elusive on his feet";
    qualifier = parBase >= 30
      ? "making even dangerous opponents look harmless"
      : parBase <= 0 ? "relying on speed to stay out of danger" : "";
  } else if (defBase >= 25) {
    speed = "is very quick on his feet";
    qualifier = parBase >= 30
      ? "often avoiding seemingly hopeless situations"
      : parBase <= 0 ? "avoiding rather than trading blows" : "";
  } else if (defBase >= 15) {
    speed = "is quick on his feet";
    qualifier = parBase >= 30
      ? "and is well able to protect himself"
      : parBase <= 0 ? "avoiding blows rather than parrying" : "";
  } else if (defBase >= 5) {
    return ""; // No quickness statement
  } else if (defBase >= -10) {
    speed = "is slow on his feet";
    qualifier = parBase >= 30
      ? "finding it hard to avoid a blow he doesn't parry"
      : parBase <= 0 ? "with a marked inability to avoid or parry a blow" : "";
  } else {
    speed = "is very slow on his feet";
    qualifier = parBase >= 30
      ? "attempts to parry rather than dodge attacks"
      : parBase <= 0 ? "absolutely unable to avoid getting hurt" : "";
  }

  return qualifier ? `${speed}, ${qualifier}` : speed;
}

// ─── Statement Generator ───────────────────────────────────────────────────

/**
 * Generate all canonical overview statements for a warrior.
 * Uses Good Wit statements if WT > 7, Bad Wit if WT <= 7.
 */
export function generateWarriorStatements(
  wt: number,
  sp: number,
  df: number,
  skills: BaseSkills,
): WarriorOverviewStatements {
  const isGoodWit = wt > 7;

  // Determine high/low order for each skill
  // Good wit: high-order thresholds vary per skill
  // Bad wit: high-order if base >= threshold, low-order otherwise

  function getWitStatement(
    baseValue: number,
    goodHigh: StatementEntry[], goodLow: StatementEntry[],
    badHigh: StatementEntry[], badLow: StatementEntry[],
    highThreshold: number,
  ): string {
    if (isGoodWit) {
      return pickStatement(baseValue >= highThreshold ? goodHigh : goodLow, wt);
    } else {
      return pickStatement(baseValue >= highThreshold ? badHigh : badLow, wt);
    }
  }

  const initiative = getWitStatement(skills.INI, GOOD_INI_HIGH, GOOD_INI_LOW, BAD_INI_HIGH, BAD_INI_LOW, 13);
  const riposte = getWitStatement(skills.RIP, GOOD_RIP_HIGH, GOOD_RIP_LOW, BAD_RIP_HIGH, BAD_RIP_LOW, 13);
  const attack = getWitStatement(skills.ATT, GOOD_ATT_HIGH, GOOD_ATT_LOW, BAD_ATT_HIGH, BAD_ATT_LOW, 10);
  const parry = getWitStatement(skills.PAR, GOOD_PAR_HIGH, GOOD_PAR_LOW, BAD_PAR_HIGH, BAD_PAR_LOW, 10);
  const defense = getWitStatement(skills.DEF, GOOD_DEF_HIGH, GOOD_DEF_LOW, BAD_DEF_HIGH, BAD_DEF_LOW, 7);

  // Endurance statement uses WT threshold directly (high-order if endurance statement is "good" tier)
  const endurance = getWitStatement(skills.DEC, GOOD_END_HIGH, GOOD_END_LOW, BAD_END_HIGH, BAD_END_LOW, 10);

  const coordination = describeCoordination(computeCoordination(sp, df));
  const quickness = getQuicknessStatement(skills.DEF, skills.PAR, wt);
  const activity = describeActivity(computeActivityRating(skills.INI, skills.RIP));

  return { initiative, riposte, attack, parry, defense, endurance, coordination, quickness, activity };
}

function describeCoordination(rating: CoordinationRating): string {
  switch (rating) {
    case "Marvel of Fighting Coordination": return "Is a marvel of fighting coordination";
    case "Very Highly Coordinated": return "Is very highly coordinated";
    case "Highly Coordinated": return "Is highly coordinated";
    case "Normal": return "";
    case "Slightly Uncoordinated": return "Is slightly uncoordinated";
    case "Clumsy": return "Is clumsy";
  }
}

function describeActivity(rating: ActivityRating): string {
  if (rating === "Normal") return "";
  return `Is ${rating.toLowerCase()}`;
}
