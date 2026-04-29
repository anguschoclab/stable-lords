import type { ArenaConfig, ArenaTag } from '@/types/shared.types';

const registry = new Map<string, ArenaConfig>();

export function registerArena(arena: ArenaConfig): void {
  registry.set(arena.id, arena);
}

export function getArenaById(id: string): ArenaConfig {
  return registry.get(id) ?? STANDARD_ARENA;
}

export function getAllArenas(): ArenaConfig[] {
  return Array.from(registry.values());
}

export function getArenasByTag(tag: ArenaTag): ArenaConfig[] {
  return getAllArenas().filter((a) => a.tags.includes(tag));
}

export function getArenasByTier(tier: 1 | 2 | 3): ArenaConfig[] {
  return getAllArenas().filter((a) => a.tier === tier);
}

export function isIndoorArena(id?: string): boolean {
  if (!id) return false;
  const arena = registry.get(id);
  return !!arena?.tags.includes('indoor');
}

// ─── Seed Arenas ─────────────────────────────────────────────────────────────

export const STANDARD_ARENA: ArenaConfig = {
  id: 'standard_arena',
  name: 'The Proving Grounds',
  tags: ['outdoor', 'open'],
  tier: 1,
  description: 'A flat, sandy arena. No particular advantage to either style.',
  zoneDef: { Edge: -2, Corner: -4 },
  surfaceMod: { initiativeMod: 0, enduranceMult: 1.0, riposteMod: 0 },
  startingZone: 'Center',
};

export const MUDPIT_ARENA: ArenaConfig = {
  id: 'mudpit_arena',
  name: 'The Mudpit',
  tags: ['outdoor', 'water'],
  tier: 1,
  description: 'A sunken, rain-soaked arena. Footing is treacherous.',
  zoneDef: { Edge: -2, Corner: -4 },
  surfaceMod: { initiativeMod: -2, enduranceMult: 1.15, riposteMod: -1 },
  startingZone: 'Center',
};

export const BLOODSANDS_ARENA: ArenaConfig = {
  id: 'bloodsands_arena',
  name: 'The Bloodsands',
  tags: ['outdoor', 'open', 'premium'],
  tier: 2,
  description: 'The grand arena. Fine sand, excellent footing, long sight lines.',
  zoneDef: { Edge: -2, Corner: -3 },
  surfaceMod: { initiativeMod: 1, enduranceMult: 0.95, riposteMod: 1 },
  startingZone: 'Center',
};

export const UNDERPIT_ARENA: ArenaConfig = {
  id: 'underpit_arena',
  name: 'The Underpit',
  tags: ['indoor', 'cramped'],
  tier: 2,
  description: 'A torch-lit subterranean pit. Tight quarters favour close-range fighters.',
  zoneDef: { Edge: -3, Corner: -5, Obstacle: -1 },
  surfaceMod: { initiativeMod: -1, enduranceMult: 1.05, riposteMod: 0 },
  startingZone: 'Center',
};

// ─── Auto-register ────────────────────────────────────────────────────────────
[STANDARD_ARENA, MUDPIT_ARENA, BLOODSANDS_ARENA, UNDERPIT_ARENA].forEach(registerArena);
