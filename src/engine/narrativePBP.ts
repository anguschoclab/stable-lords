import { type FightingStyle, STYLE_DISPLAY_NAMES } from "@/types/shared.types";
import { getItemById } from "@/data/equipment";
import narrativeContent from "@/data/narrativeContent.json";

import {
  HIT_LOC_VARIANTS,
  STYLE_PBP_DESC,
  HELM_DESCS,
  INI_FEINT_TEMPLATES,
  EVEN_STATUS,
  STOPPAGE_TEMPLATES,
  EXHAUSTION_TEMPLATES,
  POPULARITY_TEMPLATES,
  SKILL_LEARNS,
  TRADING_BLOWS,
  STALEMATE_LINES,
  WINNER_TAUNTS,
  LOSER_TAUNTS,
  PRESSING_TEMPLATES,
  INSIGHT_ST_HINTS,
  INSIGHT_SP_HINTS,
  INSIGHT_DF_HINTS,
  INSIGHT_WL_HINTS,
  MASTERY_TEMPLATES,
  SUPER_FLASHY_TEMPLATES,
} from "./narrative/narrativeData";

import {
  pick,
  szToHeight,
  getWeaponDisplayName,
  getWeaponType,
} from "./narrative/narrativeUtils";

import {
  KO_TEMPLATES,
  ARMOR_INTRO_VERBS,
  WEAPON_INTRO_VERBS,
  BATTLE_OPENERS,
  COUNTERSTRIKE_TEMPLATES,
  PARRY_BREAK_TEMPLATES,
  CROWD_REACTIONS_POSITIVE,
  CROWD_REACTIONS_NEGATIVE,
  CROWD_REACTIONS_ENCOURAGE,
  INI_WIN_TEMPLATES,
} from "./narrativeTemplates";

// ─── Types ──────────────────────────────────────────────────────────────────

type RNG = () => number;

interface CombatContext {
  attacker?: string;
  defender?: string;
  weapon?: string;
  bodyPart?: string;
}

// ─── Core Narrative Engine (Bard of the Blood Sands) ─────────────────────────

/**
 * Replaces canonical tokens (%A, %D, %W, %BP) with contextual values.
 */
function interpolateTemplate(template: string, ctx: CombatContext): string {
  return template
    .replace(/%A/g, ctx.attacker || "The warrior")
    .replace(/%D/g, ctx.defender || "the opponent")
    .replace(/%W/g, ctx.weapon || "weapon")
    .replace(/%BP/g, ctx.bodyPart || "body");
}

/**
 * Maps damage/health ratio to mechanical severity categories.
 */
/**
 * Maps damage/health ratio to mechanical severity categories.
 * Now supports the expanded 6-tier Strike system.
 */
function getStrikeSeverity(
  damage: number, 
  maxHp: number, 
  isFatal: boolean, 
  isCrit: boolean, 
  isFavorite: boolean,
  fame: number
): "glancing" | "solid" | "mastery" | "critical_human" | "critical_supernatural" | "fatal" {
  if (isFatal) return "fatal";
  
  // Crits & Super Flashy (Big Damage > 25% HP)
  const ratio = damage / maxHp;
  if (isCrit || ratio >= 0.25) {
    return fame >= 100 ? "critical_supernatural" : "critical_human";
  }

  // Flashy (Mastery via Favorite Weapon)
  if (isFavorite) return "mastery";

  // Standard
  if (ratio >= 0.10) return "solid";
  return "glancing";
}

/**
 * Safely picks a template from the JSON archive or returns a generic fallback.
 */
function getFromArchive(rng: RNG, path: string[]): string {
  try {
    let current: any = narrativeContent;
    for (const key of path) {
      current = current[key];
    }
    if (Array.isArray(current) && current.length > 0) {
      return pick(rng, current);
    }
  } catch (e) {
    console.error(`Narrative Archive Error: Missing path ${path.join(".")}`);
  }
  return "A fierce exchange occurs."; // Ultimate fallback
}

// ─── Hit Location Display ───────────────────────────────────────────────────

export function richHitLocation(rng: RNG, location: string): string {
  const variants = HIT_LOC_VARIANTS[location.toLowerCase()];
  if (!variants) return location.toUpperCase();
  return pick(rng, variants);
}

// ─── Pre-Bout Intro Block ───────────────────────────────────────────────────

export interface WarriorIntroData {
  name: string;
  style: FightingStyle;
  weaponId?: string;
  armorId?: string;
  helmId?: string;
  height?: number;
}

export function generateWarriorIntro(rng: RNG, data: WarriorIntroData, sz?: number): string[] {
  const lines: string[] = [];
  const n = data.name;

  if (sz) lines.push(`${n} is ${szToHeight(sz)}.`);
  
  const hand = rng() < 0.85 ? "right handed" : rng() < 0.5 ? "left handed" : "ambidextrous";
  lines.push(`${n} is ${hand}.`);

  // Armor & Helm
  const armorItem = data.armorId ? getItemById(data.armorId) : null;
  if (armorItem && armorItem.id !== "none_armor") {
    lines.push(`${n} ${pick(rng, ARMOR_INTRO_VERBS)} ${armorItem.name.toUpperCase()} armor.`);
  } else {
    lines.push(`${n} has chosen to fight without body armor.`);
  }

  const helmItem = data.helmId ? getItemById(data.helmId) : null;
  if (helmItem && helmItem.id !== "none_helm") {
    const helmNames = HELM_DESCS[helmItem.id] ?? [helmItem.name.toUpperCase()];
    lines.push(`And will wear a ${pick(rng, helmNames)}.`);
  }

  // Weapon & Style
  const weaponName = getWeaponDisplayName(data.weaponId);
  if (weaponName === "OPEN HAND") {
    lines.push(`${n} will fight using his OPEN HAND.`);
  } else {
    lines.push(`${n} ${pick(rng, WEAPON_INTRO_VERBS).replace("%W", weaponName)}.`);
  }

  lines.push(`${n} ${STYLE_PBP_DESC[data.style] ?? `uses the ${STYLE_DISPLAY_NAMES[data.style]} style`}.`);
  lines.push(`${n} is well suited to the weapons selected.`);

  return lines;
}

// ─── Battle Openers ─────────────────────────────────────────────────────────

export function battleOpener(rng: RNG): string {
  return pick(rng, BATTLE_OPENERS);
}

// ─── Attack Narration ───────────────────────────────────────────────────────

/**
 * Refactored to use narrativeContent.json and dynamic interpolation.
 */
export function narrateAttack(rng: RNG, attackerName: string, weaponId?: string, isMastery?: boolean): string {
  const wName = getWeaponDisplayName(weaponId);

  // Use the new architecture for generic attacks/swings (Whiffs)
  const template = getFromArchive(rng, ["attacks", "whiff"]);
  return interpolateTemplate(template, {
    attacker: attackerName,
    weapon: wName
  });
}

export function narratePassive(rng: RNG, style: FightingStyle, actorName: string): string {
  const template = getFromArchive(rng, ["passives", style]);
  return interpolateTemplate(template, { attacker: actorName });
}

export function narrateParry(rng: RNG, defenderName: string, weaponId?: string): string {
  const wName = getWeaponDisplayName(weaponId);
  const isShield = weaponId && ["small_shield", "medium_shield", "large_shield"].includes(weaponId);
  const type = isShield ? "shield" : "weapon";

  const template = getFromArchive(rng, ["defenses", type, "success"]);
  return interpolateTemplate(template, { defender: defenderName, weapon: wName });
}

export function narrateDodge(rng: RNG, defenderName: string): string {
  const template = getFromArchive(rng, ["defenses", "dodge", "success"]);
  return interpolateTemplate(template, { defender: defenderName });
}

export function narrateCounterstrike(rng: RNG, name: string): string {
  return pick(rng, COUNTERSTRIKE_TEMPLATES).replace(/%D/g, name);
}

/**
 * The primary mechanical driver for combat flavor.
 * Expanded for Tiered Mastery, Supernatural Evolution, and Flashy logic.
 */
export function narrateHit(
  rng: RNG, 
  defenderName: string, 
  location: string, 
  isMastery?: boolean, 
  isSuperFlashy?: boolean, 
  attackerName?: string, 
  weaponId?: string,
  damage?: number,
  maxHp?: number,
  isFatal?: boolean,
  attackerFame?: number,
  isFavorite?: boolean
): string {
  const richLoc = richHitLocation(rng, location);
  const wName = getWeaponDisplayName(weaponId);
  const wType = getWeaponType(weaponId);

  // 1. Determine severity using full metadata
  const severity = getStrikeSeverity(
    damage || 0, 
    maxHp || 100, 
    isFatal || false, 
    isSuperFlashy || false, 
    isFavorite || false,
    attackerFame || 0
  );

  // 2. Fetch from JSON archive
  const template = getFromArchive(rng, ["strikes", wType, severity]);

  // 3. Interpolate
  return interpolateTemplate(template, {
    attacker: attackerName,
    defender: defenderName,
    weapon: wName,
    bodyPart: richLoc
  });
}

export function narrateParryBreak(rng: RNG, attackerName: string, weaponId?: string): string {
  const wName = getWeaponDisplayName(weaponId);
  return pick(rng, PARRY_BREAK_TEMPLATES).replace(/%A/g, attackerName).replace(/%W/g, wName);
}

// ─── Status & Feedback ──────────────────────────────────────────────────────

export function damageSeverityLine(rng: RNG, damage: number, maxHp: number): string | null {
  const ratio = damage / maxHp;
  if (ratio >= 0.35) return pick(rng, ["It was a deadly attack!", "What a massive blow!", "What a devastating attack!"]);
  if (ratio >= 0.25) return pick(rng, ["It was an incredible blow!", "It is a terrific blow!"]);
  if (ratio >= 0.15) return pick(rng, ["It is a tremendous blow!", "It was a powerful blow!"]);
  if (ratio <= 0.05) return pick(rng, ["The attack is a glancing blow only.", "The stroke lands ineffectively."]);
  return null;
}

export function stateChangeLine(rng: RNG, name: string, hpRatio: number, prevHpRatio: number): string | null {
  if (hpRatio <= 0.2 && prevHpRatio > 0.2) return pick(rng, [`${name} is severely hurt!!`, `${name} is dangerously stunned!`]);
  if (hpRatio <= 0.4 && prevHpRatio > 0.4) return `${name} appears DESPERATE!`;
  if (hpRatio <= 0.6 && prevHpRatio > 0.6) return `${name} has sustained serious wounds!`;
  return null;
}

export function fatigueLine(rng: RNG, name: string, endRatio: number): string | null {
  if (endRatio <= 0.15) return `${name} is tired and barely able to defend himself!`;
  if (endRatio <= 0.3) return `${name} is breathing heavily.`;
  return null;
}

export function crowdReaction(rng: RNG, loserName: string, winnerName: string, hpRatio: number): string | null {
  if (rng() > 0.25) return null;
  if (hpRatio <= 0.3) return pick(rng, CROWD_REACTIONS_ENCOURAGE).replace(/%N/g, loserName);
  return pick(rng, rng() < 0.5 ? CROWD_REACTIONS_NEGATIVE : CROWD_REACTIONS_POSITIVE).replace(/%N/g, loserName);
}

export function narrateInitiative(rng: RNG, winnerName: string, isFeint: boolean): string {
  const templates = isFeint ? INI_FEINT_TEMPLATES : INI_WIN_TEMPLATES;
  return pick(rng, templates).replace(/%N/g, winnerName);
}

export function minuteStatusLine(rng: RNG, minute: number, nameA: string, nameD: string, hitsA: number, hitsD: number): string {
  if (hitsA > hitsD + 3) return `${nameA} is beating his opponent!`;
  if (hitsD > hitsA + 3) return `${nameD} is beating his opponent!`;
  return pick(rng, EVEN_STATUS);
}

// ─── Post-Bout ──────────────────────────────────────────────────────────────

export function narrateBoutEnd(rng: RNG, by: string, winnerName: string, loserName: string, weaponId?: string): string[] {
  const wName = getWeaponDisplayName(weaponId);
  const wType = getWeaponType(weaponId);
  
  // Normalized type mapping
  const categoryMap: Record<string, string> = {
    "Kill": "Kill",
    "KO": "KO",
    "Stoppage": "Stoppage",
    "Exhaustion": "Exhaustion"
  };

  const cat = categoryMap[by] || "KO";
  const conclusionTemplate = getFromArchive(rng, ["conclusions", cat]);
  const conclusion = interpolateTemplate(conclusionTemplate, { attacker: winnerName, defender: loserName, weapon: wName });

  // KILLER REDUNDANCY: Prepend the fatal blow description if it's a kill
  if (cat === "Kill") {
     const fatalBlowTemplate = getFromArchive(rng, ["strikes", wType, "fatal"]);
     const fatalBlow = interpolateTemplate(fatalBlowTemplate, { attacker: winnerName, defender: loserName, weapon: wName });
     return [fatalBlow, conclusion];
  }
  
  return [conclusion];
}

export function popularityLine(name: string, popDelta: number): string | null {
  if (popDelta >= 3) return POPULARITY_TEMPLATES.great.replace(/%N/g, name);
  if (popDelta >= 1) return POPULARITY_TEMPLATES.normal.replace(/%N/g, name);
  return null;
}

export function skillLearnLine(rng: RNG, name: string): string {
  return pick(rng, SKILL_LEARNS).replace(/%N/g, name);
}

export function tradingBlowsLine(rng: RNG): string {
  return pick(rng, TRADING_BLOWS);
}

export function stalemateLine(rng: RNG): string {
  return pick(rng, STALEMATE_LINES);
}

export function tauntLine(rng: RNG, name: string, isWinner: boolean): string | null {
  if (rng() > 0.2) return null;
  return pick(rng, isWinner ? WINNER_TAUNTS : LOSER_TAUNTS).replace(/%N/g, name);
}

export function conservingLine(name: string): string {
  return `${name} is conserving his energy.`;
}

export function pressingLine(rng: RNG, name: string): string {
  return pick(rng, PRESSING_TEMPLATES).replace(/%N/g, name);
}

export function narrateInsightHint(rng: RNG, attribute: string): string | null {
  const template = getFromArchive(rng, ["insights", attribute]);
  if (!template || template === "A fierce exchange occurs.") return null;
  return template;
}
