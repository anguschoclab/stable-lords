/**
 * Template Cache System - Performance optimization for template queries
 * Implements memoization and caching for frequently accessed template data
 */

import type { StableTemplate, StableTier } from './stableTemplate.types';
import { LEGENDARY_TEMPLATES } from './legendaryTemplates';
import { MAJOR_TEMPLATES } from './majorTemplates';
import { ESTABLISHED_TEMPLATES } from './establishedTemplates';
import { MINOR_TEMPLATES } from './minorTemplates';

// Cache storage for filtered results
const templateCache = new Map<string, StableTemplate[]>();

// Combined all templates for convenience
export const ALL_TEMPLATES: StableTemplate[] = [
  ...LEGENDARY_TEMPLATES,
  ...MAJOR_TEMPLATES,
  ...ESTABLISHED_TEMPLATES,
  ...MINOR_TEMPLATES,
];

// Pre-computed tier caches for instant access
export const TIER_CACHES: Record<StableTier, StableTemplate[]> = {
  Legendary: LEGENDARY_TEMPLATES,
  Major: MAJOR_TEMPLATES,
  Established: ESTABLISHED_TEMPLATES,
  Minor: MINOR_TEMPLATES,
};

// Pre-computed philosophy caches
const PHILOSOPHY_CACHE = new Map<string, StableTemplate[]>();
// Pre-computed personality caches
const PERSONALITY_CACHE = new Map<string, StableTemplate[]>();
// Pre-computed meta adaptation caches
const META_ADAPTATION_CACHE = new Map<string, StableTemplate[]>();
// Pre-computed backstory caches
const BACKSTORY_CACHE = new Map<string, StableTemplate[]>();

/**
 * Initialize all caches on module load
 */
function initializeCaches(): void {
  // Philosophy caches
  for (const template of ALL_TEMPLATES) {
    const philosophy = template.philosophy;
    let cache = PHILOSOPHY_CACHE.get(philosophy);
    if (!cache) {
      cache = [];
      PHILOSOPHY_CACHE.set(philosophy, cache);
    }
    cache.push(template);
  }

  // Personality caches
  for (const template of ALL_TEMPLATES) {
    const personality = template.personality;
    let cache = PERSONALITY_CACHE.get(personality);
    if (!cache) {
      cache = [];
      PERSONALITY_CACHE.set(personality, cache);
    }
    cache.push(template);
  }

  // Meta adaptation caches
  for (const template of ALL_TEMPLATES) {
    const metaAdaptation = template.metaAdaptation;
    let cache = META_ADAPTATION_CACHE.get(metaAdaptation);
    if (!cache) {
      cache = [];
      META_ADAPTATION_CACHE.set(metaAdaptation, cache);
    }
    cache.push(template);
  }

  // Backstory caches
  for (const template of ALL_TEMPLATES) {
    const backstoryId = template.backstoryId;
    let cache = BACKSTORY_CACHE.get(backstoryId);
    if (!cache) {
      cache = [];
      BACKSTORY_CACHE.set(backstoryId, cache);
    }
    cache.push(template);
  }
}

// Initialize caches immediately
initializeCaches();

/**
 * Gets all templates of a specific tier using pre-computed cache
 * Performance: O(1) - Direct array access
 */
export function getTemplatesByTier(tier: StableTier): StableTemplate[] {
  return TIER_CACHES[tier];
}

/**
 * Gets templates by philosophy using pre-computed cache
 * Performance: O(1) - Direct Map access
 */
export function getTemplatesByPhilosophy(philosophy: StableTemplate['philosophy']): StableTemplate[] {
  return PHILOSOPHY_CACHE.get(philosophy) || [];
}

/**
 * Gets templates by personality using pre-computed cache
 * Performance: O(1) - Direct Map access
 */
export function getTemplatesByPersonality(personality: StableTemplate['personality']): StableTemplate[] {
  return PERSONALITY_CACHE.get(personality) || [];
}

/**
 * Gets templates by meta adaptation using pre-computed cache
 * Performance: O(1) - Direct Map access
 */
export function getTemplatesByMetaAdaptation(metaAdaptation: StableTemplate['metaAdaptation']): StableTemplate[] {
  return META_ADAPTATION_CACHE.get(metaAdaptation) || [];
}

/**
 * Gets templates by backstory using pre-computed cache
 * Performance: O(1) - Direct Map access
 */
export function getTemplatesByBackstory(backstoryId: StableTemplate['backstoryId']): StableTemplate[] {
  return BACKSTORY_CACHE.get(backstoryId) || [];
}

/**
 * Gets templates by fighting style (checks preferredStyles)
 * Performance: O(n) - Linear search, but optimized with early returns
 */
export function getTemplatesByStyle(style: string): StableTemplate[] {
  const cacheKey = `style:${style}`;
  const cached = templateCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const result = ALL_TEMPLATES.filter(template => 
    template.preferredStyles.includes(style as any)
  );
  
  templateCache.set(cacheKey, result);
  return result;
}

/**
 * Gets templates by fame range using cached results
 * Performance: O(n) - Linear search with caching
 */
export function getTemplatesByFameRange(minFame: number, maxFame: number): StableTemplate[] {
  const cacheKey = `fame:${minFame}-${maxFame}`;
  const cached = templateCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const result = ALL_TEMPLATES.filter(template => 
    template.fameRange[0] >= minFame && template.fameRange[1] <= maxFame
  );
  
  templateCache.set(cacheKey, result);
  return result;
}

/**
 * Gets templates by roster range using cached results
 * Performance: O(n) - Linear search with caching
 */
export function getTemplatesByRosterRange(minRoster: number, maxRoster: number): StableTemplate[] {
  const cacheKey = `roster:${minRoster}-${maxRoster}`;
  const cached = templateCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const result = ALL_TEMPLATES.filter(template => 
    template.rosterRange[0] >= minRoster && template.rosterRange[1] <= maxRoster
  );
  
  templateCache.set(cacheKey, result);
  return result;
}

/**
 * Multi-criteria template search with optimized caching
 * Performance: O(n) for first search, O(1) for subsequent identical searches
 */
export function searchTemplates(criteria: {
  tier?: StableTier;
  philosophy?: StableTemplate['philosophy'];
  personality?: StableTemplate['personality'];
  metaAdaptation?: StableTemplate['metaAdaptation'];
  backstoryId?: StableTemplate['backstoryId'];
  style?: string;
  minFame?: number;
  maxFame?: number;
  minRoster?: number;
  maxRoster?: number;
}): StableTemplate[] {
  // Create cache key from criteria
  const cacheKey = JSON.stringify(criteria);
  const cached = templateCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Start with the most selective filter first
  let result: StableTemplate[] = ALL_TEMPLATES;

  if (criteria.tier) {
    result = TIER_CACHES[criteria.tier];
  }

  if (criteria.philosophy) {
    result = result.filter(template => template.philosophy === criteria.philosophy);
  }

  if (criteria.personality) {
    result = result.filter(template => template.personality === criteria.personality);
  }

  if (criteria.metaAdaptation) {
    result = result.filter(template => template.metaAdaptation === criteria.metaAdaptation);
  }

  if (criteria.backstoryId) {
    result = result.filter(template => template.backstoryId === criteria.backstoryId);
  }

  if (criteria.style) {
    result = result.filter(template => template.preferredStyles.includes(criteria.style as any));
  }

  if (criteria.minFame !== undefined || criteria.maxFame !== undefined) {
    result = result.filter(template => {
      const [min, max] = template.fameRange;
      if (criteria.minFame !== undefined && min < criteria.minFame) return false;
      if (criteria.maxFame !== undefined && max > criteria.maxFame) return false;
      return true;
    });
  }

  if (criteria.minRoster !== undefined || criteria.maxRoster !== undefined) {
    result = result.filter(template => {
      const [min, max] = template.rosterRange;
      if (criteria.minRoster !== undefined && min < criteria.minRoster) return false;
      if (criteria.maxRoster !== undefined && max > criteria.maxRoster) return false;
      return true;
    });
  }

  templateCache.set(cacheKey, result);
  return result;
}

/**
 * Clears all caches - useful for testing or when templates are updated
 */
export function clearTemplateCache(): void {
  templateCache.clear();
}

/**
 * Gets cache statistics for monitoring performance
 */
export function getCacheStats(): {
  tierCacheSize: number;
  philosophyCacheSize: number;
  personalityCacheSize: number;
  metaAdaptationCacheSize: number;
  backstoryCacheSize: number;
  dynamicCacheSize: number;
} {
  return {
    tierCacheSize: Object.keys(TIER_CACHES).length,
    philosophyCacheSize: PHILOSOPHY_CACHE.size,
    personalityCacheSize: PERSONALITY_CACHE.size,
    metaAdaptationCacheSize: META_ADAPTATION_CACHE.size,
    backstoryCacheSize: BACKSTORY_CACHE.size,
    dynamicCacheSize: templateCache.size,
  };
}
