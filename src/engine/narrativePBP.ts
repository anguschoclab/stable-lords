import { type FightingStyle, STYLE_DISPLAY_NAMES } from "@/types/shared.types";
import { getItemById } from "@/data/equipment";
import narrativeContent from "@/data/narrativeContent.json";
import type { NarrativeContent } from "@/types/narrative.types";
import { audioManager } from "@/lib/AudioManager";
import type { IRNGService } from "@/engine/core/rng/IRNGService";

import {
  pick,
  szToHeight,
  getWeaponDisplayName,
  getWeaponType,
} from "./narrative/narrativeUtils";

// ─── Types ──────────────────────────────────────────────────────────────────

type RNG = () => number;

export interface CombatContext {
  attacker?: string;
  defender?: string;
  name?: string;
  weapon?: string;
  bodyPart?: string;
  hits?: string | number;
}

// ─── Core Narrative Engine (Bard of the Blood Sands) ─────────────────────────

/**
 * Replaces canonical tokens (%A, %D, %W, %BP) with contextual values.
 */
/**
 * Replaces canonical tokens (%A, %D, %W, %BP, %H) with contextual values.
 */
export function interpolateTemplate(template: string, ctx: CombatContext): string {
  if (!template) return "No description available.";
  let result = template
    .replace(/%A/g, ctx.attacker || ctx.name || "The warrior")
    .replace(/%D/g, ctx.defender || "the opponent")
    .replace(/%W/g, ctx.weapon || "weapon")
    .replace(/%BP/g, ctx.bodyPart || "body")
    .replace(/%H/g, String(ctx.hits || ""));

  // Also support Handlebars-style placeholders
  for (const [key, value] of Object.entries(ctx)) {
    if (value !== undefined) {
      result = result.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g"), String(value));
    }
  }

  // Fallbacks for specific templates that use {{name}} but only pass attacker/defender
  if (ctx.attacker && !ctx.name) {
    result = result.replace(/\{\{\s*name\s*\}\}/g, String(ctx.attacker));
  } else if (ctx.name && !ctx.attacker) {
    result = result.replace(/\{\{\s*attacker\s*\}\}/g, String(ctx.name));
  }

  return result;
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
 * Supports both RNG function and IRNGService objects.
 */
export function getFromArchive(rng: RNG | IRNGService, path: string[]): string {
  try {
    let current: unknown = narrativeContent;
    for (const key of path) {
      if (current && typeof current === "object" && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        throw new Error(`Invalid path: ${key}`);
      }
    }
    if (Array.isArray(current) && current.length > 0) {
      // Handle both RNG function and IRNGService objects
      const rngFn = typeof rng === 'function' ? rng : () => rng.next();
      return pick(rngFn, current);
    }
  } catch (e) {
    console.error(`Narrative Archive Error: Missing path ${path.join(".")}`);
  }
  return "A fierce exchange occurs."; // Ultimate fallback
}

// ─── Hit Location Display ───────────────────────────────────────────────────

export function richHitLocation(rng: RNG, location: string): string {
  const hitLocations = (narrativeContent as NarrativeContent).pbp.hit_locations;
  const key = location.toLowerCase() as keyof typeof hitLocations;
  const variants = hitLocations[key];
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
    const verb = getFromArchive(rng, ["fanfare", "armor_intro_verbs"]) || "is wearing";
    lines.push(`${n} ${verb} ${armorItem.name.toUpperCase()} armor.`);
  } else {
    lines.push(`${n} has chosen to fight without body armor.`);
  }

  const helmItem = data.helmId ? getItemById(data.helmId) : null;
  if (helmItem && helmItem.id !== "none_helm") {
    lines.push(`And will wear a ${helmItem.name.toUpperCase()}.`);
  }

  // Weapon & Style
  const weaponName = getWeaponDisplayName(data.weaponId);
  if (weaponName === "OPEN HAND") {
    lines.push(`${n} will fight using his OPEN HAND.`);
  } else {
    const verb = getFromArchive(rng, ["fanfare", "weapon_intro_verbs"]) || "is armed with {{weapon}}";
    lines.push(interpolateTemplate(verb, { attacker: n, weapon: weaponName }));
  }

  lines.push(`${n} uses the ${STYLE_DISPLAY_NAMES[data.style]} style.`);
  lines.push(`${n} is well suited to the weapons selected.`);

  return lines;
}

// ─── Battle Openers ─────────────────────────────────────────────────────────

export function battleOpener(rng: RNG): string {
  return getFromArchive(rng, ["pbp", "openers"]);
}

// ─── Attack Narration ───────────────────────────────────────────────────────

/**
 * Refactored to use narrativeContent.json and dynamic interpolation.
 */
export function narrateAttack(rng: RNG, attackerName: string, weaponId?: string, isMastery?: boolean, defenderName?: string): string {
  const wName = getWeaponDisplayName(weaponId);

  // Use the new architecture for generic attacks/swings (Whiffs)
  const template = getFromArchive(rng, ["pbp", "whiffs"]);
  return interpolateTemplate(template, {
    attacker: attackerName,
    defender: defenderName,
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
  const type = isShield ? "shield" : "parry";

  const template = getFromArchive(rng, ["pbp", "defenses", type, "success"]);
  return interpolateTemplate(template, { defender: defenderName, weapon: wName });
}

export function narrateDodge(rng: RNG, defenderName: string): string {
  const template = getFromArchive(rng, ["pbp", "defenses", "dodge", "success"]);
  return interpolateTemplate(template, { defender: defenderName });
}

export function narrateCounterstrike(rng: RNG, name: string): string {
  const template = getFromArchive(rng, ["pbp", "defenses", "counterstrike"]) || "{{attacker}} counters!";
  return interpolateTemplate(template, { attacker: name });
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

  // Audio Sync
  if (severity === "critical_human" || severity === "critical_supernatural") {
    audioManager.play("crit");
  }

  // 2. Fetch from JSON archive
  const template = getFromArchive(rng, ["strikes", wType, severity]) || getFromArchive(rng, ["strikes", "generic"]);

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
  const template = getFromArchive(rng, ["pbp", "defenses", "parry_break"]) || "{{attacker}} breaks the guard!";
  return interpolateTemplate(template, { attacker: attackerName, weapon: wName });
}

// ─── Status & Feedback ──────────────────────────────────────────────────────

export function damageSeverityLine(rng: RNG, damage: number, maxHp: number): string | null {
  const ratio = damage / maxHp;
  if (ratio >= 0.35) return getFromArchive(rng, ["pbp", "damage_severity", "deadly"]);
  if (ratio >= 0.25) return getFromArchive(rng, ["pbp", "damage_severity", "terrific"]);
  if (ratio >= 0.15) return getFromArchive(rng, ["pbp", "damage_severity", "powerful"]);
  if (ratio <= 0.05) return getFromArchive(rng, ["pbp", "damage_severity", "glancing"]);
  return null;
}

export function stateChangeLine(rng: RNG, name: string, hpRatio: number, prevHpRatio: number): string | null {
  let cat = "";
  if (hpRatio <= 0.2 && prevHpRatio > 0.2) cat = "severe";
  else if (hpRatio <= 0.4 && prevHpRatio > 0.4) cat = "desperate";
  else if (hpRatio <= 0.6 && prevHpRatio > 0.6) cat = "serious";
  
  if (cat) {
    const template = getFromArchive(rng, ["pbp", "status_changes", cat]);
    return interpolateTemplate(template, { name });
  }
  return null;
}

export function fatigueLine(rng: RNG, name: string, endRatio: number): string | null {
  if (endRatio <= 0.15) return `${name} is tired and barely able to defend himself!`;
  if (endRatio <= 0.3) return `${name} is breathing heavily.`;
  return null;
}

export function crowdReaction(rng: RNG, loserName: string, winnerName: string, hpRatio: number): string | null {
  if (rng() > 0.25) return null;
  const isDeadly = hpRatio <= 0.1;
  const mood = isDeadly ? "gasp" : hpRatio <= 0.3 ? "encourage" : rng() < 0.5 ? "boo" : "cheer";
  const template = getFromArchive(rng, ["pbp", "reactions", mood]) || getFromArchive(rng, ["pbp", "reactions", mood === "boo" ? "negative" : mood === "cheer" ? "positive" : "encourage"]);
  return interpolateTemplate(template, { name: loserName });
}

export function narrateInitiative(rng: RNG, winnerName: string, isFeint: boolean, defenderName?: string): string {
  const path = isFeint ? ["pbp", "feints"] : ["pbp", "initiative"];
  const template = getFromArchive(rng, path);
  return interpolateTemplate(template, { attacker: winnerName, defender: defenderName });
}

export function minuteStatusLine(rng: RNG, minute: number, nameA: string, nameD: string, hitsA: number, hitsD: number): string {
  if (hitsA > hitsD + 3) return `${nameA} is beating his opponent!`;
  if (hitsD > hitsA + 3) return `${nameD} is beating his opponent!`;
  return getFromArchive(rng, ["pbp", "pacing", "stalemate"]);
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

  // Audio Sync
  if (cat === "Kill") audioManager.play("death");

  // KILLER REDUNDANCY: Prepend the fatal blow description if it's a kill
  if (cat === "Kill") {
     const fatalBlowTemplate = getFromArchive(rng, ["strikes", wType, "fatal"]) || getFromArchive(rng, ["strikes", "generic"]);
     const fatalBlow = interpolateTemplate(fatalBlowTemplate, { attacker: winnerName, defender: loserName, weapon: wName });
     return [fatalBlow, conclusion];
  }
  
  return [conclusion];
}

export function popularityLine(rng: RNG, name: string, popDelta: number): string | null {
  const cat = popDelta >= 3 ? "great" : popDelta >= 1 ? "normal" : "";
  if (!cat) return null;
  const template = getFromArchive(rng, ["pbp", "meta", "popularity", cat]);
  return interpolateTemplate(template, { name });
}

export function skillLearnLine(rng: RNG, name: string): string {
  const template = getFromArchive(rng, ["pbp", "meta", "skill_learns"]);
  return interpolateTemplate(template, { attacker: name });
}

export function tradingBlowsLine(rng: RNG): string {
  return getFromArchive(rng, ["pbp", "pacing", "trading_blows"]);
}

export function stalemateLine(rng: RNG): string {
  return getFromArchive(rng, ["pbp", "pacing", "stalemate"]);
}

export function tauntLine(rng: RNG, name: string, isWinner: boolean): string | null {
  if (rng() > 0.2) return null;
  const cat = isWinner ? "winner" : "loser";
  const template = getFromArchive(rng, ["pbp", "taunts", cat]);
  return interpolateTemplate(template, { attacker: name });
}

export function conservingLine(name: string): string {
  return `${name} is conserving his energy.`;
}

// ─── Range & Zone Narration ──────────────────────────────────────────────────

export const RANGE_NAMES: Record<string, string> = {
  Grapple: "grappling range",
  Tight: "tight quarters",
  Striking: "striking range",
  Extended: "extended range",
};

export function narrateRangeShift(rng: RNG, moverName: string, newRange: string): string {
  const rangeName = RANGE_NAMES[newRange] ?? newRange.toLowerCase();
  const templates = [
    `%A forces the fight to ${rangeName}.`,
    `%A dictates the distance — shifting into ${rangeName}.`,
    `%A drives the gap, repositioning to ${rangeName}.`,
    `%A seizes the spacing advantage, pulling into ${rangeName}.`,
    `%A controls the range — the fight moves to ${rangeName}.`,
  ];
  return interpolateTemplate(pick(rng, templates), { attacker: moverName });
}

export function narrateFeint(rng: RNG, attackerName: string, succeeded: boolean): string {
  if (succeeded) {
    const template = getFromArchive(rng, ["pbp", "feints"]);
    return interpolateTemplate(template, { attacker: attackerName });
  } else {
    const templates = [
      `%A's feint is read — the deception falls flat.`,
      `%A attempts a feint, but the ruse is transparent.`,
      `%A tries to deceive, but their opponent sees through it instantly.`,
      `%A's misdirection fools no one — the opponent doesn't bite.`,
    ];
    return interpolateTemplate(pick(rng, templates), { attacker: attackerName });
  }
}

export function narrateZoneShift(rng: RNG, pushedName: string, zone: string): string {
  if (zone === "Corner") {
    const templates = [
      `%A is backed into a corner — options shrinking fast.`,
      `%A finds the wall at their back, hemmed in with nowhere to go.`,
      `%A is driven into the corner — pressure becoming desperate.`,
    ];
    return interpolateTemplate(pick(rng, templates), { attacker: pushedName });
  } else if (zone === "Edge") {
    const templates = [
      `%A gives ground, retreating to the edge of the arena.`,
      `%A is pushed to the boundary — the pressure is mounting.`,
      `%A cedes the center, falling back toward the perimeter.`,
    ];
    return interpolateTemplate(pick(rng, templates), { attacker: pushedName });
  } else {
    const templates = [
      `%A recovers ground, reclaiming the center of the arena.`,
      `%A finds space to breathe — pushing away from the wall.`,
      `%A wrestles back to open ground.`,
    ];
    return interpolateTemplate(pick(rng, templates), { attacker: pushedName });
  }
}

export function arenaIntroLine(arenaConfig: { name: string; description: string }): string {
  return `⚔ ${arenaConfig.name.toUpperCase()} — ${arenaConfig.description}`;
}

export function tacticStreakLine(name: string, tactic: string, streak: number): string | null {
  if (streak === 3) return `${name} is leaning heavily on the ${tactic}.`;
  if (streak >= 5) return `${name}'s repeated ${tactic} is now obvious to everyone watching.`;
  return null;
}

export function pressingLine(rng: RNG, name: string): string {
  const template = getFromArchive(rng, ["pbp", "pacing", "pressing"]);
  return interpolateTemplate(template, { attacker: name });
}

export function narrateInsightHint(rng: RNG, attribute: string): string | null {
  const template = getFromArchive(rng, ["pbp", "insights", attribute]);
  if (!template || template === "A fierce exchange occurs.") return null;
  return template;
}
