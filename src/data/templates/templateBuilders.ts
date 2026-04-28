/**
 * Template builder utilities for Stable Lords.
 * Provides functions to create and manipulate stable templates.
 */

import type { StableTemplate, StableTier } from './stableTemplate.types';
import { randomPick } from '@/utils/random';
import {
  ALL_TEMPLATES,
  getTemplatesByTier,
  getTemplatesByPhilosophy,
  getTemplatesByPersonality,
  getTemplatesByMetaAdaptation,
  getTemplatesByBackstory,
  getTemplatesByStyle,
  getTemplatesByFameRange,
  getTemplatesByRosterRange,
  searchTemplates,
} from './templateCache';

// Re-export cached functions for backward compatibility
export {
  ALL_TEMPLATES,
  getTemplatesByTier,
  getTemplatesByPhilosophy,
  getTemplatesByPersonality,
  getTemplatesByMetaAdaptation,
  getTemplatesByBackstory,
  getTemplatesByStyle,
  getTemplatesByFameRange,
  getTemplatesByRosterRange,
  searchTemplates,
};

/**
 * Gets a random template from all available templates.
 */
export function getRandomTemplate(rng?: () => number): StableTemplate {
  return randomPick(rng || Math.random, ALL_TEMPLATES);
}

/**
 * Gets a random template from a specific tier.
 */
export function getRandomTemplateByTier(tier: StableTier, rng?: () => number): StableTemplate {
  const templates = getTemplatesByTier(tier);
  return randomPick(rng || Math.random, templates);
}

/**
 * Creates a new template based on an existing one with modifications.
 */
export function createTemplateVariant(
  baseTemplate: StableTemplate,
  modifications: Partial<StableTemplate>
): StableTemplate {
  return {
    ...baseTemplate,
    ...modifications,
  };
}

/**
 * Validates if a template meets minimum requirements.
 */
export function validateTemplate(template: StableTemplate): boolean {
  return (
    template.stableName.length > 0 &&
    template.motto.length > 0 &&
    template.origin.length > 0 &&
    template.ownerName.length > 0 &&
    template.preferredStyles.length > 0 &&
    template.warriorNames.length > 0 &&
    template.fameRange[0] >= 0 &&
    template.fameRange[1] >= template.fameRange[0] &&
    template.rosterRange[0] > 0 &&
    template.rosterRange[1] >= template.rosterRange[0] &&
    template.trainerRange[0] >= 0 &&
    template.trainerRange[1] >= template.trainerRange[0]
  );
}
