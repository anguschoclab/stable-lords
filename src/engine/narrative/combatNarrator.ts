import { FightingStyle, STYLE_DISPLAY_NAMES } from "@/types/shared.types";
import { getItemById } from "@/data/equipment";
import { audioManager } from "@/lib/AudioManager";
import narrativeContent from "@/data/narrativeContent.json";
import type { NarrativeContent } from "@/types/narrative.types";
import { NarrativeTemplateEngine } from "./narrativeTemplateEngine";
import { szToHeight, getWeaponDisplayName, getWeaponType } from "./narrativeUtils";
import type { IRNGService } from "@/engine/core/rng/IRNGService";

export interface WarriorIntroData {
  name: string;
  style: FightingStyle;
  weaponId?: string;
  armorId?: string;
  helmId?: string;
  height?: number;
}

/**
 * CombatNarrator - Attack, parry, hit, and defense narration.
 * Handles all combat-related narrative generation.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class CombatNarrator {
  /**
   * Generates warrior introduction lines.
   */
  static generateWarriorIntro(rng: IRNGService, data: WarriorIntroData, sz?: number): string[] {
    const lines: string[] = [];
    const n = data.name;

    if (sz) lines.push(`${n} is ${szToHeight(sz)}.`);

    const hand = rng.next() < 0.85 ? "right handed" : rng.next() < 0.5 ? "left handed" : "ambidextrous";
    lines.push(`${n} is ${hand}.`);

    // Armor & Helm
    const armorItem = data.armorId ? getItemById(data.armorId) : null;
    if (armorItem && armorItem.id !== "none_armor") {
      const verb = NarrativeTemplateEngine.getFromArchive(rng, ["fanfare", "armor_intro_verbs"]) || "is wearing";
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
      const verb = NarrativeTemplateEngine.getFromArchive(rng, ["fanfare", "weapon_intro_verbs"]) || "is armed with {{weapon}}";
      lines.push(NarrativeTemplateEngine.interpolateTemplate(verb, { attacker: n, weapon: weaponName }));
    }

    lines.push(`${n} uses the ${STYLE_DISPLAY_NAMES[data.style]} style.`);
    lines.push(`${n} is well suited to the weapons selected.`);

    return lines;
  }

  /**
   * Generates battle opener text.
   */
  static battleOpener(rng: IRNGService): string {
    const template = NarrativeTemplateEngine.getFromArchive(rng, ["pbp", "openers"]);
    return NarrativeTemplateEngine.interpolateTemplate(template, {});
  }

  /**
   * Narrates an attack (whiff).
   */
  static narrateAttack(rng: IRNGService, attackerName: string, weaponId?: string, _isMastery?: boolean): string {
    const wName = getWeaponDisplayName(weaponId);
    const template = NarrativeTemplateEngine.getFromArchive(rng, ["pbp", "whiffs"]);
    return NarrativeTemplateEngine.interpolateTemplate(template, {
      attacker: attackerName,
      weapon: wName
    });
  }

  /**
   * Narrates a passive style activation.
   */
  static narratePassive(rng: IRNGService, style: FightingStyle, actorName: string): string {
    const template = NarrativeTemplateEngine.getFromArchive(rng, ["passives", style]);
    return NarrativeTemplateEngine.interpolateTemplate(template, { attacker: actorName });
  }

  /**
   * Narrates a successful parry.
   */
  static narrateParry(rng: IRNGService, defenderName: string, weaponId?: string): string {
    const wName = getWeaponDisplayName(weaponId);
    const isShield = weaponId && ["small_shield", "medium_shield", "large_shield"].includes(weaponId);
    const type = isShield ? "shield" : "parry";

    const template = NarrativeTemplateEngine.getFromArchive(rng, ["pbp", "defenses", type, "success"]);
    return NarrativeTemplateEngine.interpolateTemplate(template, { defender: defenderName, weapon: wName });
  }

  /**
   * Narrates a successful dodge.
   */
  static narrateDodge(rng: IRNGService, defenderName: string): string {
    const template = NarrativeTemplateEngine.getFromArchive(rng, ["pbp", "defenses", "dodge", "success"]);
    return NarrativeTemplateEngine.interpolateTemplate(template, { defender: defenderName });
  }

  /**
   * Narrates a counterstrike.
   */
  static narrateCounterstrike(rng: IRNGService, name: string): string {
    const template = NarrativeTemplateEngine.getFromArchive(rng, ["pbp", "defenses", "counterstrike"]) || "{{attacker}} counters!";
    return NarrativeTemplateEngine.interpolateTemplate(template, { attacker: name });
  }

  /**
   * Narrates a hit with severity tiers.
   */
  static narrateHit(
    rng: IRNGService,
    defenderName: string,
    location: string,
    _isMastery?: boolean,
    isSuperFlashy?: boolean,
    attackerName?: string,
    weaponId?: string,
    damage?: number,
    maxHp?: number,
    isFatal?: boolean,
    attackerFame?: number,
    isFavorite?: boolean
  ): string {
    const richLoc = this.richHitLocation(rng, location);
    const wName = getWeaponDisplayName(weaponId);
    const wType = getWeaponType(weaponId);

    const severity = this.getStrikeSeverity(
      damage || 0, 
      maxHp || 100, 
      isFatal || false, 
      isSuperFlashy || false, 
      isFavorite || false,
      attackerFame || 0
    );

    if (severity === "critical_human" || severity === "critical_supernatural") {
      audioManager.play("crit");
    }

    const template = NarrativeTemplateEngine.getFromArchive(rng, ["strikes", wType, severity]) || NarrativeTemplateEngine.getFromArchive(rng, ["strikes", "generic"]);

    return NarrativeTemplateEngine.interpolateTemplate(template, {
      attacker: attackerName,
      defender: defenderName,
      weapon: wName,
      bodyPart: richLoc
    });
  }

  /**
   * Narrates a parry break.
   */
  static narrateParryBreak(rng: IRNGService, attackerName: string, weaponId?: string): string {
    const wName = getWeaponDisplayName(weaponId);
    const template = NarrativeTemplateEngine.getFromArchive(rng, ["pbp", "defenses", "parry_break"]) || "{{attacker}} breaks the guard!";
    return NarrativeTemplateEngine.interpolateTemplate(template, { attacker: attackerName, weapon: wName });
  }

  /**
   * Narrates initiative winner.
   */
  static narrateInitiative(rng: IRNGService, winnerName: string, isFeint: boolean, defenderName?: string): string {
    const path = isFeint ? ["pbp", "feints"] : ["pbp", "initiative"];
    const template = NarrativeTemplateEngine.getFromArchive(rng, path);
    return NarrativeTemplateEngine.interpolateTemplate(template, { attacker: winnerName, defender: defenderName });
  }

  /**
   * Narrates bout conclusion.
   */
  static narrateBoutEnd(rng: IRNGService, by: string, winnerName: string, loserName: string, weaponId?: string): string[] {
    const wName = getWeaponDisplayName(weaponId);
    const wType = getWeaponType(weaponId);

    const categoryMap: Record<string, string> = {
      "Kill": "Kill",
      "KO": "KO",
      "Stoppage": "Stoppage",
      "Exhaustion": "Exhaustion"
    };

    const category = categoryMap[by] || "KO";
    const conclusionPath = ["conclusions", category];
    const conclusion = NarrativeTemplateEngine.getFromArchive(rng, conclusionPath) || "{{winner}} defeats {{loser}}.";
    const conclusionText = NarrativeTemplateEngine.interpolateTemplate(conclusion, { winner: winnerName, loser: loserName });

    if (by === "Kill") {
      const fatalBlowTemplate = NarrativeTemplateEngine.getFromArchive(rng, ["strikes", wType, "fatal"]) || NarrativeTemplateEngine.getFromArchive(rng, ["strikes", "generic"]);
      const fatalBlow = NarrativeTemplateEngine.interpolateTemplate(fatalBlowTemplate, { attacker: winnerName, defender: loserName, weapon: wName });
      return [fatalBlow, conclusionText];
    }

    return [conclusionText];
  }

  // Helper methods

  private static richHitLocation(rng: IRNGService, location: string): string {
    const hitLocations = (narrativeContent as NarrativeContent).pbp.hit_locations;
    const key = location.toLowerCase() as keyof typeof hitLocations;
    const variants = hitLocations[key];
    if (!variants) return location.toUpperCase();
    return rng.pick(variants);
  }

  private static getStrikeSeverity(
    damage: number, 
    maxHp: number, 
    isFatal: boolean, 
    isCrit: boolean, 
    isFavorite: boolean,
    fame: number
  ): "glancing" | "solid" | "mastery" | "critical_human" | "critical_supernatural" | "fatal" {
    if (isFatal) return "fatal";
    
    const ratio = damage / maxHp;
    if (isCrit || ratio >= 0.25) {
      return fame >= 100 ? "critical_supernatural" : "critical_human";
    }

    if (isFavorite) return "mastery";

    if (ratio >= 0.10) return "solid";
    return "glancing";
  }
}

// Export static methods as standalone functions for backward compatibility
export const generateWarriorIntro = CombatNarrator.generateWarriorIntro.bind(CombatNarrator);
export const battleOpener = CombatNarrator.battleOpener.bind(CombatNarrator);
export const narrateAttack = CombatNarrator.narrateAttack.bind(CombatNarrator);
export const narratePassive = CombatNarrator.narratePassive.bind(CombatNarrator);
export const narrateParry = CombatNarrator.narrateParry.bind(CombatNarrator);
export const narrateDodge = CombatNarrator.narrateDodge.bind(CombatNarrator);
export const narrateCounterstrike = CombatNarrator.narrateCounterstrike.bind(CombatNarrator);
export const narrateHit = CombatNarrator.narrateHit.bind(CombatNarrator);
export const narrateParryBreak = CombatNarrator.narrateParryBreak.bind(CombatNarrator);
export const narrateInitiative = CombatNarrator.narrateInitiative.bind(CombatNarrator);
export const narrateBoutEnd = CombatNarrator.narrateBoutEnd.bind(CombatNarrator);
