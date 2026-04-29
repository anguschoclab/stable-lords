/**
 * Backstory data utilities for stable templates.
 * Provides functions to work with backstory-related template data.
 */

import type { StableTemplate } from './stableTemplate.types';
import { ALL_TEMPLATES } from './templateBuilders';

/**
 * Gets all unique backstory IDs used in templates.
 */
export function getAllBackstoryIds(): StableTemplate['backstoryId'][] {
  const backstoryIds = new Set<StableTemplate['backstoryId']>();
  ALL_TEMPLATES.forEach((template) => {
    backstoryIds.add(template.backstoryId);
  });
  return Array.from(backstoryIds);
}

/**
 * Gets templates grouped by backstory ID.
 */
export function getTemplatesByBackstoryGroup(): Record<
  StableTemplate['backstoryId'],
  StableTemplate[]
> {
  const grouped: Record<StableTemplate['backstoryId'], StableTemplate[]> = {} as any;

  ALL_TEMPLATES.forEach((template) => {
    if (!grouped[template.backstoryId]) {
      grouped[template.backstoryId] = [];
    }
    grouped[template.backstoryId].push(template);
  });

  return grouped;
}

/**
 * Gets the count of templates for each backstory ID.
 */
export function getBackstoryCounts(): Record<StableTemplate['backstoryId'], number> {
  const grouped = getTemplatesByBackstoryGroup();
  const counts: Record<StableTemplate['backstoryId'], number> = {} as any;

  Object.keys(grouped).forEach((backstoryId) => {
    counts[backstoryId as StableTemplate['backstoryId']] =
      grouped[backstoryId as StableTemplate['backstoryId']].length;
  });

  return counts;
}

/**
 * Gets templates that have warrior names matching a specific theme.
 */
export function getTemplatesByWarriorNameTheme(theme: string): StableTemplate[] {
  const lowerTheme = theme.toLowerCase();
  return ALL_TEMPLATES.filter((template) =>
    template.warriorNames.some((name) => name.toLowerCase().includes(lowerTheme))
  );
}

/**
 * Gets templates with specific attribute bias patterns.
 */
export function getTemplatesByAttributeBias(
  attribute: keyof StableTemplate['attrBias'],
  minValue: number
): StableTemplate[] {
  return ALL_TEMPLATES.filter(
    (template) =>
      template.attrBias[attribute] !== undefined && template.attrBias[attribute]! >= minValue
  );
}

/**
 * Gets templates that are aggressive (high ST/SP bias).
 */
export function getAggressiveTemplates(): StableTemplate[] {
  return ALL_TEMPLATES.filter(
    (template) => (template.attrBias.ST || 0) + (template.attrBias.SP || 0) >= 4
  );
}

/**
 * Gets templates that are defensive (high CN/DF bias).
 */
export function getDefensiveTemplates(): StableTemplate[] {
  return ALL_TEMPLATES.filter(
    (template) => (template.attrBias.CN || 0) + (template.attrBias.DF || 0) >= 4
  );
}

/**
 * Gets templates that are technical (high WT/SP bias).
 */
export function getTechnicalTemplates(): StableTemplate[] {
  return ALL_TEMPLATES.filter(
    (template) => (template.attrBias.WT || 0) + (template.attrBias.SP || 0) >= 4
  );
}

/**
 * Gets templates that are balanced (no single attribute bias > 2).
 */
export function getBalancedTemplates(): StableTemplate[] {
  return ALL_TEMPLATES.filter((template) =>
    Object.values(template.attrBias).every((bias) => bias !== undefined && bias <= 2)
  );
}
