import { describe, it, expect, vi } from 'vitest';
import {
  computeReachScore,
  getWeaponPreferredRange,
  contestDistance,
  getZonePenalty,
  transitionZone,
  resetZone,
} from '@/engine/combat/mechanics/distanceResolution';

describe('computeReachScore', () => {
  it('returns INI + 0 when OE=5, no motivation, no debt', () => {
    expect(computeReachScore(10, 5, 0, 0)).toBe(10);
  });
  it('adds (OE-5)*2 for OE above 5', () => {
    expect(computeReachScore(10, 7, 0, 0)).toBe(14);
  });
  it('subtracts (5-OE)*2 for OE below 5', () => {
    expect(computeReachScore(10, 3, 0, 0)).toBe(6);
  });
  it('adds motivation bonus', () => {
    expect(computeReachScore(10, 5, 2, 0)).toBe(12);
  });
  it('subtracts recoveryDebt*2', () => {
    expect(computeReachScore(10, 5, 0, 2)).toBe(6);
  });
});

describe('getWeaponPreferredRange', () => {
  // Updated 2026-04: weapon ids must match those in src/data/equipment.ts.
  // Prior tests used `open_hand` and `pike` which were never real weapon ids,
  // (Fixed: pike -> short_spear to use a valid weapon id)
  // exposing the underlying weapon-id-mismatch bug that silently disabled the
  // entire range/weapon system.
  it('returns Tight for short_sword', () => {
    expect(getWeaponPreferredRange('short_sword')).toBe('Tight');
  });
  it('returns Extended for halberd', () => {
    expect(getWeaponPreferredRange('halberd')).toBe('Extended');
  });
  it('returns Striking as default for unknown weapon', () => {
    expect(getWeaponPreferredRange('unknown_weapon')).toBe('Striking');
  });
  it('returns Striking as default when weaponId is undefined', () => {
    expect(getWeaponPreferredRange(undefined)).toBe('Striking');
  });
});

describe('contestDistance', () => {
  it('winner gets +1 rangeMod, loser gets -1', () => {
    const rng = vi.fn().mockReturnValue(0.1);
    const fA = {
      skills: { INI: 15 },
      activePlan: { OE: 5 },
      recoveryDebt: 0,
      weaponId: 'broadsword',
    } as any;
    const fD = {
      skills: { INI: 5 },
      activePlan: { OE: 5 },
      recoveryDebt: 0,
      weaponId: 'broadsword',
    } as any;
    const result = contestDistance(rng, fA, fD, 5, 5, 'Striking');
    expect(result.rangeModA).toBe(1);
    expect(result.rangeModD).toBe(-1);
    expect(result.distanceWinner).toBe('A');
  });

  it("produces newRange = one step toward winner's preferred range", () => {
    const rng = vi.fn().mockReturnValue(0.1);
    const fA = {
      skills: { INI: 15 },
      activePlan: { OE: 5, rangePreference: 'Extended' },
      recoveryDebt: 0,
      weaponId: 'short_spear',
    } as any;
    const fD = {
      skills: { INI: 5 },
      activePlan: { OE: 5 },
      recoveryDebt: 0,
      weaponId: 'broadsword',
    } as any;
    const result = contestDistance(rng, fA, fD, 5, 5, 'Striking');
    // Striking → Extended (one step toward Extended)
    expect(result.newRange).toBe('Extended');
  });

  it('keeps current range when scores are equal (pure tie)', () => {
    // Equal INI, equal OE, equal recoveryDebt — reach scores are identical
    // contestCheck will break the tie with rng, but we test no RANGE_SHIFT event when range stays same
    const rng = vi.fn().mockReturnValue(0.5);
    const fA = {
      skills: { INI: 10 },
      activePlan: { OE: 5, rangePreference: 'Striking' },
      recoveryDebt: 0,
      weaponId: 'broadsword',
    } as any;
    const fD = {
      skills: { INI: 10 },
      activePlan: { OE: 5, rangePreference: 'Striking' },
      recoveryDebt: 0,
      weaponId: 'broadsword',
    } as any;
    const result = contestDistance(rng, fA, fD, 5, 5, 'Striking');
    // Both prefer Striking, so newRange stays Striking regardless of who wins
    expect(result.newRange).toBe('Striking');
  });
});

describe('getZonePenalty', () => {
  it('returns 0 for Center', () => {
    const config = { zoneDef: { Edge: -2, Corner: -4 } } as any;
    expect(getZonePenalty('Center', config)).toBe(0);
  });
  it('returns -2 for Edge in standard config', () => {
    const config = { zoneDef: { Edge: -2, Corner: -4 } } as any;
    expect(getZonePenalty('Edge', config)).toBe(-2);
  });
  it('returns -4 for Corner in standard config', () => {
    const config = { zoneDef: { Edge: -2, Corner: -4 } } as any;
    expect(getZonePenalty('Corner', config)).toBe(-4);
  });
  it('returns 0 when zone not in config', () => {
    const config = { zoneDef: {} } as any;
    expect(getZonePenalty('Edge', config)).toBe(0);
  });
});

describe('transitionZone', () => {
  it('Center → Edge when pushed', () => {
    expect(transitionZone('Center')).toBe('Edge');
  });
  it('Edge → Corner when pushed again', () => {
    expect(transitionZone('Edge')).toBe('Corner');
  });
  it('Corner stays Corner', () => {
    expect(transitionZone('Corner')).toBe('Corner');
  });
  it('Obstacle stays Obstacle', () => {
    expect(transitionZone('Obstacle')).toBe('Obstacle');
  });
});

describe('resetZone', () => {
  it('Corner → Edge on reset', () => {
    expect(resetZone('Corner')).toBe('Edge');
  });
  it('Edge → Center on reset', () => {
    expect(resetZone('Edge')).toBe('Center');
  });
  it('Center stays Center on reset', () => {
    expect(resetZone('Center')).toBe('Center');
  });
});
