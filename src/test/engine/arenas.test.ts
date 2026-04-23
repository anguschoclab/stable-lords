import { describe, it, expect } from 'vitest';
import {
  registerArena,
  getArenaById,
  getAllArenas,
  getArenasByTag,
  getArenasByTier,
  STANDARD_ARENA,
} from '@/data/arenas';
import type { ArenaConfig } from '@/types/shared.types';

describe('Arena Registry', () => {
  it('getArenaById returns STANDARD_ARENA for unknown id', () => {
    expect(getArenaById('nonexistent_arena')).toBe(STANDARD_ARENA);
  });

  it('getArenaById returns the registered arena', () => {
    expect(getArenaById('standard_arena')).toBe(STANDARD_ARENA);
  });

  it('getAllArenas includes standard_arena', () => {
    const all = getAllArenas();
    expect(all.some((a) => a.id === 'standard_arena')).toBe(true);
  });

  it('getArenasByTag returns only arenas with that tag', () => {
    const outdoor = getArenasByTag('outdoor');
    expect(outdoor.every((a) => a.tags.includes('outdoor'))).toBe(true);
  });

  it('getArenasByTier returns only arenas of that tier', () => {
    const tier1 = getArenasByTier(1);
    expect(tier1.every((a) => a.tier === 1)).toBe(true);
  });

  it('registerArena adds to the registry', () => {
    const custom: ArenaConfig = {
      id: 'test_arena',
      name: 'Test Arena',
      tags: ['indoor'],
      tier: 1,
      description: 'A test arena',
      zoneDef: { Edge: -2, Corner: -4 },
      surfaceMod: { initiativeMod: 0, enduranceMult: 1.0, riposteMod: 0 },
    };
    registerArena(custom);
    expect(getArenaById('test_arena')).toEqual(custom);
  });
});
