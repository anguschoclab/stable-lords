import { describe, it, expect } from 'vitest';
import { getSpecialtyMods, defaultSpecialtyMods } from '@/engine/trainerSpecialties';
import type { Trainer } from '@/types/shared.types';
import type { FighterState, ResolutionContext } from '@/engine/combat/resolution';

describe('trainerSpecialties', () => {
  const createMockFighter = (overrides: Partial<FighterState> = {}): FighterState =>
    ({
      hp: 100,
      maxHp: 100,
      endurance: 100,
      maxEndurance: 100,
      momentum: 0,
      wounds: 0,
      ...overrides,
    }) as FighterState;

  const createMockContext = (phase: 'OPENING' | 'MID' | 'LATE' = 'OPENING'): ResolutionContext =>
    ({
      phase,
      round: 1,
      exchange: 1,
    }) as ResolutionContext;

  it('should return default mods if trainers is undefined', () => {
    const mods = getSpecialtyMods(
      undefined,
      createMockFighter(),
      createMockFighter(),
      createMockContext()
    );
    expect(mods).toEqual(defaultSpecialtyMods());
  });

  it('should return default mods if trainers list is empty', () => {
    const mods = getSpecialtyMods(
      [],
      createMockFighter(),
      createMockFighter(),
      createMockContext()
    );
    expect(mods).toEqual(defaultSpecialtyMods());
  });

  it('should ignore trainers with negative or zero contract weeks', () => {
    const trainers: Trainer[] = [
      {
        id: '1',
        name: 'T1',
        specialty: 'KillerInstinct',
        tier: 'Master',
        cost: 10,
        contractWeeksLeft: 0,
        isPlayer: false,
      },
      {
        id: '2',
        name: 'T2',
        specialty: 'IronConditioning',
        tier: 'Master',
        cost: 10,
        contractWeeksLeft: -1,
        isPlayer: false,
      },
    ];
    const mods = getSpecialtyMods(
      trainers,
      createMockFighter(),
      createMockFighter({ hp: 10 }), // Should trigger KillerInstinct if active
      createMockContext()
    );
    expect(mods).toEqual(defaultSpecialtyMods());
  });

  it('should apply KillerInstinct bonus when opponent HP is < 40%', () => {
    const trainers: Trainer[] = [
      {
        id: '1',
        name: 'T1',
        specialty: 'KillerInstinct',
        tier: 'Novice',
        cost: 10,
        contractWeeksLeft: 1,
        isPlayer: false,
      },
    ];
    const mods = getSpecialtyMods(
      trainers,
      createMockFighter(),
      createMockFighter({ hp: 39, maxHp: 100 }),
      createMockContext()
    );
    expect(mods.killWindowBonus).toBe(0.01 * 1); // Novice tier = 1 (halved 2026-04 to match 0.025 cap)
  });

  it('should NOT apply KillerInstinct bonus when opponent HP is >= 40%', () => {
    const trainers: Trainer[] = [
      {
        id: '1',
        name: 'T1',
        specialty: 'KillerInstinct',
        tier: 'Seasoned',
        cost: 10,
        contractWeeksLeft: 1,
        isPlayer: false,
      },
    ];
    const mods = getSpecialtyMods(
      trainers,
      createMockFighter(),
      createMockFighter({ hp: 40, maxHp: 100 }),
      createMockContext()
    );
    expect(mods.killWindowBonus).toBe(0);
  });

  it('should apply IronConditioning bonus in LATE phase', () => {
    const trainers: Trainer[] = [
      {
        id: '1',
        name: 'T1',
        specialty: 'IronConditioning',
        tier: 'Master',
        cost: 10,
        contractWeeksLeft: 1,
        isPlayer: false,
      }, // Master = 3
    ];
    const mods = getSpecialtyMods(
      trainers,
      createMockFighter(),
      createMockFighter(),
      createMockContext('LATE')
    );
    expect(mods.endMod).toBeCloseTo(0.1 * 3);
  });

  it('should NOT apply IronConditioning bonus in non-LATE phase', () => {
    const trainers: Trainer[] = [
      {
        id: '1',
        name: 'T1',
        specialty: 'IronConditioning',
        tier: 'Master',
        cost: 10,
        contractWeeksLeft: 1,
        isPlayer: false,
      },
    ];
    const mods = getSpecialtyMods(
      trainers,
      createMockFighter(),
      createMockFighter(),
      createMockContext('MID')
    );
    expect(mods.endMod).toBe(0);
  });

  it('should apply CounterFighter riposte damage amplification unconditionally', () => {
    const trainers: Trainer[] = [
      {
        id: '1',
        name: 'T1',
        specialty: 'CounterFighter',
        tier: 'Seasoned',
        cost: 10,
        contractWeeksLeft: 1,
        isPlayer: false,
      }, // Seasoned = 2
    ];
    const mods = getSpecialtyMods(
      trainers,
      createMockFighter(),
      createMockFighter(),
      createMockContext()
    );
    expect(mods.riposteDamageMult).toBeCloseTo(1 + 0.15 * 2);
  });

  it('should apply Footwork initiative bonus in MID/LATE phase', () => {
    const trainers: Trainer[] = [
      {
        id: '1',
        name: 'T1',
        specialty: 'Footwork',
        tier: 'Novice',
        cost: 10,
        contractWeeksLeft: 1,
        isPlayer: false,
      },
    ];
    const modsMid = getSpecialtyMods(
      trainers,
      createMockFighter(),
      createMockFighter(),
      createMockContext('MID')
    );
    expect(modsMid.iniMod).toBe(3 * 1);
  });

  it('should NOT apply Footwork initiative bonus in OPENING phase', () => {
    const trainers: Trainer[] = [
      {
        id: '1',
        name: 'T1',
        specialty: 'Footwork',
        tier: 'Novice',
        cost: 10,
        contractWeeksLeft: 1,
        isPlayer: false,
      },
    ];
    const modsOpening = getSpecialtyMods(
      trainers,
      createMockFighter(),
      createMockFighter(),
      createMockContext('OPENING')
    );
    expect(modsOpening.iniMod).toBe(0);
  });

  it('should apply IronGuard damage reduction when endurance is > 60%', () => {
    const trainers: Trainer[] = [
      {
        id: '1',
        name: 'T1',
        specialty: 'IronGuard',
        tier: 'Master',
        cost: 10,
        contractWeeksLeft: 1,
        isPlayer: false,
      }, // Master = 3
    ];
    const mods = getSpecialtyMods(
      trainers,
      createMockFighter({ endurance: 61, maxEndurance: 100 }),
      createMockFighter(),
      createMockContext()
    );
    expect(mods.damageReceivedMult).toBeCloseTo(1 * (1 - 0.1 * 3));
  });

  it('should NOT apply IronGuard damage reduction when endurance is <= 60%', () => {
    const trainers: Trainer[] = [
      {
        id: '1',
        name: 'T1',
        specialty: 'IronGuard',
        tier: 'Master',
        cost: 10,
        contractWeeksLeft: 1,
        isPlayer: false,
      },
    ];
    const mods = getSpecialtyMods(
      trainers,
      createMockFighter({ endurance: 60, maxEndurance: 100 }),
      createMockFighter(),
      createMockContext()
    );
    expect(mods.damageReceivedMult).toBe(1);
  });

  it('should apply Finisher attack bonus when momentum is >= 2', () => {
    const trainers: Trainer[] = [
      {
        id: '1',
        name: 'T1',
        specialty: 'Finisher',
        tier: 'Seasoned',
        cost: 10,
        contractWeeksLeft: 1,
        isPlayer: false,
      }, // Seasoned = 2
    ];
    const mods = getSpecialtyMods(
      trainers,
      createMockFighter({ momentum: 2 }),
      createMockFighter(),
      createMockContext()
    );
    expect(mods.attMod).toBeCloseTo(0.1 * 2);
  });

  it('should NOT apply Finisher attack bonus when momentum is < 2', () => {
    const trainers: Trainer[] = [
      {
        id: '1',
        name: 'T1',
        specialty: 'Finisher',
        tier: 'Seasoned',
        cost: 10,
        contractWeeksLeft: 1,
        isPlayer: false,
      },
    ];
    const mods = getSpecialtyMods(
      trainers,
      createMockFighter({ momentum: 1 }),
      createMockFighter(),
      createMockContext()
    );
    expect(mods.attMod).toBe(0);
  });

  it('should apply RopeADope fatigue penalty reduction (capped at 50%)', () => {
    const trainers: Trainer[] = [
      {
        id: '1',
        name: 'T1',
        specialty: 'RopeADope',
        tier: 'Master',
        cost: 10,
        contractWeeksLeft: 1,
        isPlayer: false,
      }, // Master = 3. 0.3 * 3 = 0.9. Cap is 0.5.
    ];
    const mods = getSpecialtyMods(
      trainers,
      createMockFighter(),
      createMockFighter(),
      createMockContext()
    );
    expect(mods.fatiguePenaltyReduction).toBe(0.5); // should be capped
  });

  it('should apply KillerInstinct + Finisher chemistry combo', () => {
    const trainers: Trainer[] = [
      {
        id: '1',
        name: 'T1',
        specialty: 'KillerInstinct',
        tier: 'Novice',
        cost: 10,
        contractWeeksLeft: 1,
        isPlayer: false,
      }, // 0.01 * 1 (halved 2026-04)
      {
        id: '2',
        name: 'T2',
        specialty: 'Finisher',
        tier: 'Novice',
        cost: 10,
        contractWeeksLeft: 1,
        isPlayer: false,
      }, // 0.1 * 1
    ];
    const mods = getSpecialtyMods(
      trainers,
      createMockFighter({ momentum: 2 }), // Trigger Finisher & combo
      createMockFighter({ hp: 30, maxHp: 100 }), // Trigger KillerInstinct & combo
      createMockContext()
    );

    // killWindowBonus: 0.01 (KillerInstinct) + 0.005 (Combo) = 0.015 (both halved 2026-04)
    expect(mods.killWindowBonus).toBeCloseTo(0.015);
    // Finisher is also applied
    expect(mods.attMod).toBeCloseTo(0.1);
  });

  it('should floor damageReceivedMult to 0.5', () => {
    // If IronGuard somehow reduces it below 0.5 (e.g. multiple Master IronGuard trainers)
    const trainers: Trainer[] = [
      {
        id: '1',
        name: 'T1',
        specialty: 'IronGuard',
        tier: 'Master',
        cost: 10,
        contractWeeksLeft: 1,
        isPlayer: false,
      },
      {
        id: '2',
        name: 'T2',
        specialty: 'IronGuard',
        tier: 'Master',
        cost: 10,
        contractWeeksLeft: 1,
        isPlayer: false,
      },
    ];
    const mods = getSpecialtyMods(
      trainers,
      createMockFighter({ endurance: 100, maxEndurance: 100 }),
      createMockFighter(),
      createMockContext()
    );
    // (1 - 0.3) * (1 - 0.3) = 0.49. Should be floored to 0.5
    expect(mods.damageReceivedMult).toBe(0.5);
  });

  it('should handle undefined tier on a trainer (default to 1)', () => {
    const trainers: any[] = [
      {
        id: '1',
        name: 'T1',
        specialty: 'Footwork',
        cost: 10,
        contractWeeksLeft: 1,
        isPlayer: false,
      }, // Missing tier
    ];
    const mods = getSpecialtyMods(
      trainers,
      createMockFighter(),
      createMockFighter(),
      createMockContext('LATE')
    );
    expect(mods.iniMod).toBe(3 * 1);
  });
});
