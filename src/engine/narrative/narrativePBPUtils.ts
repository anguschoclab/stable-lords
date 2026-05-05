/**
 * Narrative PBP Utils - Core utility functions for narrative generation
 * Extracted from narrativePBP.ts to follow SRP
 */
import narrativeContent from '@/data/narrativeContent.json';
import type { NarrativeContent } from '@/types/narrative.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { pick } from './narrativeUtils';

type RNG = () => number;

export interface CombatContext {
  attacker?: string;
  defender?: string;
  name?: string;
  weapon?: string;
  bodyPart?: string;
  hits?: string | number;
}

/**
 * Replaces canonical tokens (%A, %D, %W, %BP, %H) with contextual values.
 */
export function interpolateTemplate(template: string, ctx: CombatContext): string {
  if (!template) return 'No description available.';
  let result = template
    .replace(/%A/g, ctx.attacker || ctx.name || 'The warrior')
    .replace(/%D/g, ctx.defender || 'the opponent')
    .replace(/%W/g, ctx.weapon || 'weapon')
    .replace(/%BP/g, ctx.bodyPart || 'body')
    .replace(/%H/g, String(ctx.hits || ''));

  if (!result.includes('{{')) return result;

  // Also support Handlebars-style placeholders with optimized regex replacement
  result = result.replace(/\{\{\s*([^{}\s]+)\s*\}\}/g, (match, key) => {
    // Fallbacks for specific templates that use {{name}} but only pass attacker/defender
    if (key === 'name' && !ctx.name && ctx.attacker) {
      return String(ctx.attacker);
    }
    if (key === 'attacker' && !ctx.attacker && ctx.name) {
      return String(ctx.name);
    }

    const val = ctx[key as keyof CombatContext];
    return val !== undefined ? String(val) : match;
  });

  return result;
}

/**
 * Maps damage/health ratio to mechanical severity categories.
 * Supports the expanded 6-tier Strike system.
 */
export function getStrikeSeverity(
  damage: number,
  maxHp: number,
  isFatal: boolean,
  isCrit: boolean,
  isFavorite: boolean,
  fame: number
): 'glancing' | 'solid' | 'mastery' | 'critical_human' | 'critical_supernatural' | 'fatal' {
  if (isFatal) return 'fatal';

  const ratio = damage / maxHp;
  if (isCrit || ratio >= 0.25) {
    return fame >= 100 ? 'critical_supernatural' : 'critical_human';
  }

  if (isFavorite) return 'mastery';

  if (ratio >= 0.1) return 'solid';
  return 'glancing';
}

/**
 * Quietly walk the archive to see if the given path resolves to a non-empty
 * string array. Returns the array (or null) without logging — intended for
 * tiered lookups where misses at lower specificity are expected.
 */
export function peekArchive(path: string[]): string[] | null {
  let current: unknown = narrativeContent;
  for (const key of path) {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return null;
    }
  }
  if (Array.isArray(current) && current.length > 0) return current as string[];
  return null;
}

/**
 * Safely picks a template from the JSON archive or returns a generic fallback.
 * Supports both RNG function and IRNGService objects.
 */
export function getFromArchive(rng: RNG | IRNGService, path: string[]): string {
  try {
    let current: unknown = narrativeContent;
    for (const key of path) {
      if (current && typeof current === 'object' && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        throw new Error(`Invalid path: ${key}`);
      }
    }
    if (Array.isArray(current) && current.length > 0) {
      const rngFn = typeof rng === 'function' ? rng : () => rng.next();
      return pick(rngFn, current);
    }
  } catch (e) {
    console.error(`Narrative Archive Error: Missing path ${path.join('.')}`);
  }
  return 'A fierce exchange occurs.';
}

/**
 * Gets rich hit location description.
 */
export function richHitLocation(rng: RNG, location: string): string {
  const hitLocations = (narrativeContent as NarrativeContent).pbp.hit_locations;
  const key = location.toLowerCase() as keyof typeof hitLocations;
  const variants = hitLocations[key];
  if (!variants) return location.toUpperCase();
  return pick(rng, variants);
}
