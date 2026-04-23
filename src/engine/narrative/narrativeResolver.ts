/**
 * Bard Gen 2 Narrative Resolver
 *
 * Tiered lookup: domain > subdomain > tone > tier
 * Recursive tag expansion: {{FOO_BAR}} resolves against the Dictionary domain,
 *   with visited-set tracking to stop infinite recursion.
 *
 * Call sites pass a DomainContext that must match the domain's required keys.
 * On miss, the resolver returns a deterministic fallback rather than throwing
 * so it never breaks a bout mid-simulation.
 */
import narrativeContent from '@/data/narrativeContent.json';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

// ─── Domain context typing ────────────────────────────────────────────────

export interface CombatDomainContext {
  attacker: string;
  defender: string;
  weapon?: string;
  bodyPart?: string;
  styleVoice?: string;
  crowdMood?: string;
  causeBucket?: string;
}

export interface GazetteDomainContext {
  winner?: string;
  loser?: string;
  week?: number;
  headline?: string;
  crowdMood?: string;
}

export interface DomainContextMap {
  combat: CombatDomainContext;
  gazette: GazetteDomainContext;
}

export type Domain = keyof DomainContextMap;

export interface ResolveRequest<D extends Domain = Domain> {
  domain: D;
  subdomain: string;
  tone?: string;
  tier?: string;
  ctx: DomainContextMap[D];
}

// ─── Recursive tag expansion ───────────────────────────────────────────────

const TAG_RE = /\{\{([A-Z_]+)\}\}/g;
const MAX_TAG_DEPTH = 8;

function expandDictionaryTags(
  template: string,
  rng: IRNGService,
  visited: Set<string>,
  depth: number
): string {
  if (depth > MAX_TAG_DEPTH) return template;
  return template.replace(TAG_RE, (match, tag: string) => {
    if (visited.has(tag)) return match; // cycle guard
    const dict = (narrativeContent as Record<string, unknown>).dictionary as
      | Record<string, unknown>
      | undefined;
    const entry = dict?.[tag.toLowerCase()] ?? dict?.[tag];
    if (!Array.isArray(entry) || entry.length === 0) return match;
    const pick = rng.pick(entry as string[]);
    const next = new Set(visited);
    next.add(tag);
    return expandDictionaryTags(pick, rng, next, depth + 1);
  });
}

// ─── Context interpolation ────────────────────────────────────────────────

function interpolateContext(template: string, ctx: Record<string, unknown>): string {
  return template.replace(/\{\{([a-z][a-zA-Z0-9_]*)\}\}/g, (_, key: string) => {
    const v = ctx[key];
    return v === undefined || v === null ? '' : String(v);
  });
}

// ─── Tiered archive walk ──────────────────────────────────────────────────

function walkArchive(request: ResolveRequest): string[] {
  const root = (narrativeContent as Record<string, unknown>)[request.domain];
  if (!root || typeof root !== 'object') return [];
  const sub = (root as Record<string, unknown>)[request.subdomain];
  if (!sub) return [];

  // Tier walk: prefer tone+tier > tone > flat list
  if (request.tone && typeof sub === 'object' && !Array.isArray(sub)) {
    const toneNode = (sub as Record<string, unknown>)[request.tone];
    if (toneNode) {
      if (request.tier && typeof toneNode === 'object' && !Array.isArray(toneNode)) {
        const tierNode = (toneNode as Record<string, unknown>)[request.tier];
        if (Array.isArray(tierNode) && tierNode.length > 0) return tierNode as string[];
      }
      if (Array.isArray(toneNode)) return toneNode as string[];
    }
  }
  if (Array.isArray(sub) && sub.length > 0) return sub as string[];
  return [];
}

// ─── Public API ────────────────────────────────────────────────────────────

export function resolveNarrative(rng: IRNGService, request: ResolveRequest): string {
  const pool = walkArchive(request);
  if (pool.length === 0) {
    // Deterministic fallback — never break a bout
    return `A fierce exchange in the arena unfolds.`;
  }
  const picked = rng.pick(pool);
  const expanded = expandDictionaryTags(picked, rng, new Set(), 0);
  return interpolateContext(expanded, request.ctx as Record<string, unknown>);
}

/**
 * Gen-1 compatibility shim — lets existing `%A`/`%D` call sites migrate incrementally.
 * New code should use `resolveNarrative` directly.
 */
export function resolveLegacy(
  rng: IRNGService,
  path: string[],
  ctx: Record<string, unknown>
): string {
  let node: unknown = narrativeContent;
  for (const key of path) {
    if (node && typeof node === 'object' && key in node) {
      node = (node as Record<string, unknown>)[key];
    } else {
      return 'A fierce exchange occurs.';
    }
  }
  if (!Array.isArray(node) || node.length === 0) return 'A fierce exchange occurs.';
  const picked = rng.pick(node as string[]);
  const expanded = expandDictionaryTags(picked, rng, new Set(), 0);
  return interpolateContext(expanded, ctx);
}
