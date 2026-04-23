import { describe, it, expect, vi } from 'vitest';
import {
  makeExchangeState,
  runCommit,
  runFeint,
  runRecovery,
} from '@/engine/combat/resolution/exchangeSubPhases';
import type { FighterState } from '@/engine/combat/resolution';

function makeFighter(overrides: Partial<FighterState> = {}): FighterState {
  return {
    label: 'A',
    style: 'SLASHING ATTACK' as any,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    skills: { ATT: 10, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 },
    derived: { hp: 100, endurance: 100, damage: 5, encumbrance: 0 },
    plan: { style: 'SLASHING ATTACK' as any, OE: 5, AL: 5 },
    activePlan: { style: 'SLASHING ATTACK' as any, OE: 5, AL: 5 },
    psychState: 'Neutral',
    hp: 100,
    maxHp: 100,
    endurance: 100,
    maxEndurance: 100,
    hitsLanded: 0,
    hitsTaken: 0,
    ripostes: 0,
    consecutiveHits: 0,
    armHits: 0,
    legHits: 0,
    totalFights: 0,
    momentum: 0,
    committed: false,
    survivalStrike: false,
    recoveryDebt: 0,
    ...overrides,
  } as FighterState;
}

describe('makeExchangeState', () => {
  it('initialises with zero modifiers', () => {
    const es = makeExchangeState();
    expect(es.rangeModA).toBe(0);
    expect(es.rangeModD).toBe(0);
    expect(es.distanceWinner).toBeNull();
    expect(es.feintBonus).toBe(0);
    expect(es.feintFailed).toBe(false);
    expect(es.commitLevelA).toBe('Standard');
    expect(es.commitLevelD).toBe('Standard');
    expect(es.recoveryDebtToWriteA).toBe(0);
    expect(es.recoveryDebtToWriteD).toBe(0);
    expect(es.events).toEqual([]);
  });
});

describe('runCommit', () => {
  it('returns Cautious when OE ≤ 3', () => {
    const fA = makeFighter({ activePlan: { style: 'SLASHING ATTACK' as any, OE: 3, AL: 5 } });
    const result = runCommit(fA, 3);
    expect(result.level).toBe('Cautious');
    expect(result.attBonus).toBe(0);
    expect(result.defPenalty).toBe(1);
    expect(result.debtToWrite).toBe(0);
  });

  it('returns Full when OE ≥ 7', () => {
    const fA = makeFighter({
      activePlan: { style: 'SLASHING ATTACK' as any, OE: 7, AL: 5 },
      momentum: 0,
    });
    const result = runCommit(fA, 7);
    expect(result.level).toBe('Full');
    expect(result.attBonus).toBe(1);
    expect(result.defPenalty).toBe(-1);
    expect(result.debtToWrite).toBe(1);
  });

  it('returns Full when momentum ≥ 2 regardless of OE', () => {
    const fA = makeFighter({
      momentum: 2,
      activePlan: { style: 'SLASHING ATTACK' as any, OE: 5, AL: 5 },
    });
    const result = runCommit(fA, 5);
    expect(result.level).toBe('Full');
  });

  it('returns Cautious when HP < 30% regardless of OE', () => {
    const fA = makeFighter({
      hp: 25,
      maxHp: 100,
      activePlan: { style: 'SLASHING ATTACK' as any, OE: 8, AL: 5 },
    });
    const result = runCommit(fA, 8);
    expect(result.level).toBe('Cautious');
  });

  it('returns Standard for OE 4-6 without special conditions', () => {
    const fA = makeFighter({
      activePlan: { style: 'SLASHING ATTACK' as any, OE: 5, AL: 5 },
      momentum: 0,
    });
    const result = runCommit(fA, 5);
    expect(result.level).toBe('Standard');
    expect(result.attBonus).toBe(0);
    expect(result.debtToWrite).toBe(0);
  });
});

describe('runFeint', () => {
  it('does not trigger when feintTendency is 0', () => {
    const rng = vi.fn();
    const att = makeFighter({
      attributes: { ST: 10, CN: 10, SZ: 10, WT: 15, WL: 10, SP: 10, DF: 10 },
      activePlan: { style: 'SLASHING ATTACK' as any, OE: 6, AL: 5, feintTendency: 0 },
    });
    const def = makeFighter();
    const result = runFeint(rng, att, def);
    expect(result.triggered).toBe(false);
    expect(rng).not.toHaveBeenCalled();
  });

  it('does not trigger when WT < 15', () => {
    const rng = vi.fn();
    const att = makeFighter({
      attributes: { ST: 10, CN: 10, SZ: 10, WT: 14, WL: 10, SP: 10, DF: 10 },
      activePlan: { style: 'SLASHING ATTACK' as any, OE: 6, AL: 5, feintTendency: 5 },
    });
    const def = makeFighter();
    const result = runFeint(rng, att, def);
    expect(result.triggered).toBe(false);
  });

  it('does not trigger when OE < 4', () => {
    const rng = vi.fn();
    const att = makeFighter({
      attributes: { ST: 10, CN: 10, SZ: 10, WT: 15, WL: 10, SP: 10, DF: 10 },
      activePlan: { style: 'SLASHING ATTACK' as any, OE: 3, AL: 5, feintTendency: 5 },
    });
    const def = makeFighter();
    const result = runFeint(rng, att, def);
    expect(result.triggered).toBe(false);
  });

  it('succeeds when rng roll is below threshold', () => {
    // roll = WT(15) + feintTendency(5) - AL_def(5) - WT_def(10)*0.5 = 10
    // threshold = clamp(10/20, 0.05, 0.95) = 0.5; rng=0.3 < 0.5 → success
    const rng = vi.fn().mockReturnValue(0.3);
    const att = makeFighter({
      attributes: { ST: 10, CN: 10, SZ: 10, WT: 15, WL: 10, SP: 10, DF: 10 },
      activePlan: { style: 'SLASHING ATTACK' as any, OE: 6, AL: 5, feintTendency: 5 },
    });
    const def = makeFighter({
      attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      activePlan: { style: 'SLASHING ATTACK' as any, OE: 5, AL: 5 },
    });
    const result = runFeint(rng, att, def);
    expect(result.triggered).toBe(true);
    expect(result.succeeded).toBe(true);
    expect(result.feintBonus).toBe(4);
  });

  it('fails when rng roll is above threshold', () => {
    const rng = vi.fn().mockReturnValue(0.9);
    const att = makeFighter({
      attributes: { ST: 10, CN: 10, SZ: 10, WT: 15, WL: 10, SP: 10, DF: 10 },
      activePlan: { style: 'SLASHING ATTACK' as any, OE: 6, AL: 5, feintTendency: 5 },
    });
    const def = makeFighter({
      attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      activePlan: { style: 'SLASHING ATTACK' as any, OE: 5, AL: 5 },
    });
    const result = runFeint(rng, att, def);
    expect(result.triggered).toBe(true);
    expect(result.succeeded).toBe(false);
    expect(result.feintBonus).toBe(0);
    expect(result.feintFailed).toBe(true);
  });
});

describe('runRecovery', () => {
  it('writes recoveryDebt, taking max of existing and new, capped at 3', () => {
    const fA = makeFighter({ recoveryDebt: 1 });
    const fD = makeFighter({ recoveryDebt: 0 });
    runRecovery(fA, fD, 3, 0, []);
    expect(fA.recoveryDebt).toBe(3);
  });

  it('decays recoveryDebt by 1 per exchange when toWrite is 0', () => {
    const fA = makeFighter({ recoveryDebt: 2 });
    const fD = makeFighter({ recoveryDebt: 0 });
    runRecovery(fA, fD, 0, 0, []);
    expect(fA.recoveryDebt).toBe(1);
  });

  it('does not decay below 0', () => {
    const fA = makeFighter({ recoveryDebt: 0 });
    const fD = makeFighter({ recoveryDebt: 0 });
    runRecovery(fA, fD, 0, 0, []);
    expect(fA.recoveryDebt).toBe(0);
  });

  it('writes recoveryDebt for fD correctly', () => {
    const fA = makeFighter({ recoveryDebt: 0 });
    const fD = makeFighter({ recoveryDebt: 1 });
    runRecovery(fA, fD, 0, 2, []);
    expect(fD.recoveryDebt).toBe(2);
  });

  it('does not stack: max(existing, written) — writing 1 over existing 2 stays at 2', () => {
    const fA = makeFighter({ recoveryDebt: 2 });
    const fD = makeFighter({ recoveryDebt: 0 });
    runRecovery(fA, fD, 1, 0, []);
    expect(fA.recoveryDebt).toBe(2);
  });
});

describe('runRecovery — zone transitions', () => {
  it('pushes zone Center → Edge when HIT lands on A', () => {
    const fA = makeFighter();
    const fD = makeFighter();
    const ctx: any = { zone: 'Center', pushedFighter: undefined };
    const events: any[] = [{ type: 'HIT', actor: 'D', target: 'A', location: 'torso', value: 10 }];
    runRecovery(fA, fD, 0, 0, events, ctx);
    expect(ctx.zone).toBe('Edge');
    expect(ctx.pushedFighter).toBe('A');
    expect(events.some((e: any) => e.type === 'ZONE_SHIFT')).toBe(true);
  });

  it('pushes zone Edge → Corner on a second hit on the same fighter', () => {
    const fA = makeFighter();
    const fD = makeFighter();
    const ctx: any = { zone: 'Edge', pushedFighter: 'A' };
    const events: any[] = [{ type: 'HIT', actor: 'D', target: 'A', location: 'torso', value: 10 }];
    runRecovery(fA, fD, 0, 0, events, ctx);
    expect(ctx.zone).toBe('Corner');
  });

  it('Corner stays Corner when another hit occurs (no further push)', () => {
    const fA = makeFighter();
    const fD = makeFighter();
    const ctx: any = { zone: 'Corner', pushedFighter: 'A' };
    const events: any[] = [{ type: 'HIT', actor: 'D', target: 'A', location: 'torso', value: 10 }];
    const initialEventCount = events.length;
    runRecovery(fA, fD, 0, 0, events, ctx);
    expect(ctx.zone).toBe('Corner');
    // No ZONE_SHIFT emitted since zone didn't change
    expect(events.filter((e: any) => e.type === 'ZONE_SHIFT').length).toBe(0);
  });

  it('zone drifts back toward Center when no hit lands (recovery)', () => {
    const fA = makeFighter();
    const fD = makeFighter();
    const ctx: any = { zone: 'Edge', pushedFighter: 'A' };
    runRecovery(fA, fD, 0, 0, [], ctx);
    expect(ctx.zone).toBe('Center');
  });

  it('no zone drift when pushedFighter is undefined', () => {
    const fA = makeFighter();
    const fD = makeFighter();
    const ctx: any = { zone: 'Center', pushedFighter: undefined };
    runRecovery(fA, fD, 0, 0, [], ctx);
    expect(ctx.zone).toBe('Center');
  });
});
