/**
 * Gazette Template Helpers - Template substitution and helper functions
 * Extracted from gazetteNarrative.ts to follow SRP
 */
import narrativeContent from '@/data/narrativeContent.json';
import type { NarrativeContent } from '@/types/narrative.types';
import type { CrowdMoodType } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { STYLE_DISPLAY_NAMES } from '@/types/shared.types';

const MOOD_TONE: Record<
  CrowdMoodType,
  { adjectives: string[]; opener: string[]; closer: string[] }
> = (narrativeContent as NarrativeContent).ux_metadata.mood_tone;

export { MOOD_TONE };

/**
 * Gets display name for a fighting style.
 */
export function styleName(style: string): string {
  return STYLE_DISPLAY_NAMES[style as keyof typeof STYLE_DISPLAY_NAMES] ?? style;
}

/**
 * Template substitution function.
 * Replaces {{key}} placeholders in templates with data values.
 */
export function t(
  template: string | string[],
  data: Record<string, any>,
  rng?: IRNGService
): string {
  let result = Array.isArray(template)
    ? rng
      ? rng.pick(template)
      : template[Math.floor(new SeededRNGService(Date.now()).next() * template.length)] || ''
    : template;
  if (!result) return '';
  return result.replace(/\{\{\s*([^{}\s]+)\s*\}\}/g, (match, key) => {
    const value = data[key];
    return value !== undefined ? String(value) : match;
  });
}
