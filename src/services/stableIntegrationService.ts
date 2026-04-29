/**
 * Stable Integration Service - Demonstrates feature integration & wiring
 * Shows how the refactored modular systems work together
 */

import type { StableTemplate, StableTier } from '@/data/templates';
import type { EquipmentItem, EquipmentLoadout } from '@/data/equipment';
import type { Attributes } from '@/types/shared.types';
import { ALL_TEMPLATES, getTemplatesByTier, getRandomTemplateByTier } from '@/data/templates';
import {
  ALL_EQUIPMENT,
  getItemById,
  getAvailableItems,
  isPreferredWeapon,
  getStyleDefaultLoadout,
  validateLoadout,
  checkWeaponRequirements,
} from '@/data/equipment';
import { randomWarriorName, randomOwnerName, randomStableName } from '@/data/names';
import { clamp } from '@/utils/math';

/**
 * Integration service that combines template, equipment, and name systems
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class StableIntegrationService {
  /**
   * Generates a complete stable configuration with warriors, equipment, and names
   */
  static generateCompleteStable(
    tier: StableTier,
    philosophy: StableTemplate['philosophy'],
    warriorCount: number = 6
  ): {
    template: StableTemplate;
    warriors: Array<{
      name: string;
      style: string;
      equipment: EquipmentLoadout;
      requirementsMet: boolean;
    }>;
    ownerName: string;
    stableName: string;
  } {
    // Get appropriate template
    const templates = getTemplatesByTier(tier);
    const philosophyTemplates = templates.filter((t) => t.philosophy === philosophy);
    const template =
      philosophyTemplates.length > 0
        ? philosophyTemplates[Math.floor(Math.random() * philosophyTemplates.length)]
        : getRandomTemplateByTier(tier);

    if (!template) {
      throw new Error(`No template found for tier ${tier} and philosophy ${philosophy}`);
    }

    // Generate owner and stable names
    const ownerName = randomOwnerName();
    const stableName = randomStableName();

    // Generate warriors with equipment
    const warriors = [];
    for (let i = 0; i < warriorCount; i++) {
      const warriorName = randomWarriorName();
      const style =
        template.preferredStyles[Math.floor(Math.random() * template.preferredStyles.length)];

      if (!style) continue;

      // Get style-appropriate equipment
      const equipment = getStyleDefaultLoadout(style as any);

      // Simulate warrior attributes for requirement checking
      const mockAttrs = this.generateMockAttributes(style, tier);
      const requirementsMet = this.checkEquipmentRequirements(equipment, mockAttrs);

      warriors.push({
        name: warriorName,
        style,
        equipment,
        requirementsMet,
      });
    }

    return {
      template,
      warriors,
      ownerName,
      stableName,
    };
  }

  /**
   * Analyzes template-equipment compatibility
   */
  static analyzeTemplateEquipmentCompatibility(template: StableTemplate): {
    compatibleEquipment: EquipmentItem[];
    preferredEquipment: EquipmentItem[];
    restrictedEquipment: EquipmentItem[];
    coverage: {
      weapon: number;
      armor: number;
      shield: number;
      helm: number;
    };
  } {
    const compatibleEquipment: EquipmentItem[] = [];
    const preferredEquipment: EquipmentItem[] = [];
    const restrictedEquipment: EquipmentItem[] = [];

    const coverage = { weapon: 0, armor: 0, shield: 0, helm: 0 };

    for (const item of ALL_EQUIPMENT) {
      let isCompatible = true;
      let isPreferred = false;
      let isRestricted = false;

      // Check each style in the template
      for (const style of template.preferredStyles) {
        if (item.restrictedStyles?.includes(style as any)) {
          isCompatible = false;
          isRestricted = true;
          break;
        }
        if (item.preferredStyles?.includes(style as any)) {
          isPreferred = true;
        }
      }

      if (isCompatible) {
        compatibleEquipment.push(item);
        coverage[item.slot]++;
      }

      if (isPreferred) {
        preferredEquipment.push(item);
      }

      if (isRestricted) {
        restrictedEquipment.push(item);
      }
    }

    return {
      compatibleEquipment,
      preferredEquipment,
      restrictedEquipment,
      coverage,
    };
  }

  /**
   * Recommends optimal equipment for a template and style
   */
  static recommendOptimalLoadout(
    template: StableTemplate,
    style: string,
    warriorAttributes: Attributes
  ): {
    loadout: EquipmentLoadout;
    score: number;
    issues: string[];
  } {
    const availableWeapons = getAvailableItems('weapon', style as any);
    const availableArmor = getAvailableItems('armor', style as any);
    const availableShields = getAvailableItems('shield', style as any);
    const availableHelms = getAvailableItems('helm', style as any);

    let bestWeapon = availableWeapons[0];
    let bestScore = -Infinity;
    const issues: string[] = [];

    // Score weapons based on multiple factors
    for (const weapon of availableWeapons) {
      let score = 0;

      // Preferred style bonus
      if (isPreferredWeapon(weapon, style as any)) {
        score += 10;
      }

      // Weight consideration based on template philosophy
      if (template.philosophy === 'Speed Kills' && weapon.weight <= 2) {
        score += 5;
      } else if (template.philosophy === 'Brute Force' && weapon.weight >= 4) {
        score += 5;
      }

      // Attribute requirements
      const reqCheck = checkWeaponRequirements(weapon.id, warriorAttributes);
      if (!reqCheck.met) {
        score -= 20;
        issues.push(`${weapon.name} requirements not met (ATT: ${reqCheck.attPenalty})`);
      }

      if (score > bestScore) {
        bestScore = score;
        bestWeapon = weapon;
      }
    }

    // Select optimal armor (balance of protection and weight)
    const bestArmor = availableArmor.reduce((best, current) => {
      if (!best) return current;
      const currentScore = current.weight <= 6 ? 10 - current.weight : 0;
      const bestScore = best.weight <= 6 ? 10 - best.weight : 0;
      return currentScore > bestScore ? current : best;
    }, availableArmor[0] || null);

    // Select shield if not two-handed
    const bestShield = bestWeapon?.twoHanded
      ? ({ id: 'none_shield' } as EquipmentItem)
      : availableShields[0] || ({ id: 'none_shield' } as EquipmentItem);

    // Select helm (balance of protection and style compatibility)
    const bestHelm = availableHelms.reduce((best, current) => {
      if (!best) return current;
      const currentScore = current.weight <= 2 ? 5 : 0;
      const bestScore = best.weight <= 2 ? 5 : 0;
      return currentScore > bestScore ? current : best;
    }, availableHelms[0] || null);

    const loadout: EquipmentLoadout = {
      weapon: bestWeapon?.id || 'none_weapon',
      armor: bestArmor?.id || 'none_armor',
      shield: bestShield?.id || 'none_shield',
      helm: bestHelm?.id || 'none_helm',
    };

    // Validate final loadout
    const validationIssues = validateLoadout(loadout);
    issues.push(...validationIssues.map((issue) => issue.message));

    return {
      loadout,
      score: bestScore,
      issues,
    };
  }

  /**
   * Generates mock attributes for testing
   */
  private static generateMockAttributes(style: string, tier: StableTier): Attributes {
    const baseStats = {
      Legendary: { ST: 15, CN: 15, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 },
      Major: { ST: 12, CN: 12, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      Established: { ST: 10, CN: 10, SZ: 8, WT: 8, WL: 8, SP: 8, DF: 8 },
      Minor: { ST: 8, CN: 8, SZ: 6, WT: 6, WL: 6, SP: 6, DF: 6 },
    };

    const stats = { ...baseStats[tier] };

    // Adjust based on style
    switch (style) {
      case 'Striking Attack':
        stats.ST += 2;
        stats.CN += 1;
        break;
      case 'AimedBlow':
        stats.WT += 2;
        stats.DF += 1;
        break;
      case 'TotalParry':
        stats.DF += 2;
        stats.CN += 1;
        break;
      // Add more style adjustments as needed
    }

    // Clamp all values to valid ranges
    Object.keys(stats).forEach((key) => {
      stats[key as keyof Attributes] = clamp(stats[key as keyof Attributes], 1, 21);
    });

    return stats;
  }

  /**
   * Checks if equipment requirements are met
   */
  private static checkEquipmentRequirements(
    loadout: EquipmentLoadout,
    attributes: Attributes
  ): boolean {
    const weapon = getItemById(loadout.weapon);
    if (!weapon || weapon.slot !== 'weapon') return true;

    const reqCheck = checkWeaponRequirements(weapon.id, attributes);
    return reqCheck.met;
  }

  /**
   * Searches for templates matching complex criteria
   */
  static searchAdvancedTemplates(criteria: {
    tier?: StableTier;
    philosophy?: StableTemplate['philosophy'];
    style?: string;
    minFame?: number;
    maxFame?: number;
    equipmentWeight?: {
      min?: number;
      max?: number;
    };
  }): StableTemplate[] {
    let templates = ALL_TEMPLATES;

    // Apply basic filters
    if (criteria.tier) {
      templates = getTemplatesByTier(criteria.tier);
    }

    if (criteria.philosophy) {
      templates = templates.filter((t) => t.philosophy === criteria.philosophy);
    }

    if (criteria.style) {
      templates = templates.filter((t) => t.preferredStyles.includes(criteria.style as any));
    }

    if (criteria.minFame !== undefined || criteria.maxFame !== undefined) {
      templates = templates.filter((t) => {
        const [min, max] = t.fameRange;
        if (criteria.minFame !== undefined && min < criteria.minFame) return false;
        if (criteria.maxFame !== undefined && max > criteria.maxFame) return false;
        return true;
      });
    }

    // Apply equipment weight filter
    if (criteria.equipmentWeight) {
      templates = templates.filter((t) => {
        const compatible = this.analyzeTemplateEquipmentCompatibility(t);
        const hasWeightInRange = compatible.compatibleEquipment.some((item) => {
          if (
            criteria.equipmentWeight?.min !== undefined &&
            item.weight < criteria.equipmentWeight.min
          )
            return false;
          if (
            criteria.equipmentWeight?.max !== undefined &&
            item.weight > criteria.equipmentWeight.max
          )
            return false;
          return true;
        });
        return hasWeightInRange;
      });
    }

    return templates;
  }

  /**
   * Gets integration statistics for monitoring
   */
  static getIntegrationStats(): {
    totalTemplates: number;
    totalEquipment: number;
    totalNames: {
      warrior: number;
      owner: number;
      stable: number;
    };
    cacheStats: any;
  } {
    return {
      totalTemplates: ALL_TEMPLATES.length,
      totalEquipment: ALL_EQUIPMENT.length,
      totalNames: {
        warrior: 0, // Would need to import from name modules
        owner: 0,
        stable: 0,
      },
      cacheStats: null, // Would need to import from cache module
    };
  }
}
