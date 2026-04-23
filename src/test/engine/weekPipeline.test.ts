import { describe, it, expect } from 'vitest';
import { processTierProgression } from '../../engine/pipeline/core/tierProgression';
import { GameState, RivalStableData } from '../../types/game';

describe('processTierProgression', () => {
  const mockState = {
    meta: { createdAt: '2024-01-01' },
    season: 'Spring',
    week: 1,
    meta: { createdAt: 'mock-date' },
    rivals: [
      {
        owner: { id: 'rival-1', stableName: 'Rival 1' },
        tier: 'Minor',
        roster: Array(5).fill({
          status: 'Active',
          career: { wins: 20, kills: 5, losses: 0 },
        }),
      },
    ],
    meta: { createdAt: new Date().toISOString(), gameName: 'Stable Lords', version: '1.0' },
    newsletter: [],
    recruitPool: [{ id: 'old' }],
  } as unknown as GameState;

  it('should return StateImpact with tier promotion when season changes', () => {
    const impact = processTierProgression(mockState, 'Summer', 14);

    // Should return StateImpact object
    expect(impact).toBeDefined();
    expect(impact.rivalsUpdates).toBeDefined();
    expect(impact.rivalsUpdates).toBeInstanceOf(Map);

    // Should promote rival from Minor to Established
    const rivalUpdate = impact.rivalsUpdates?.get('rival-1');
    expect(rivalUpdate).toBeDefined();
    expect(rivalUpdate?.tier).toBe('Established');

    // Should clear recruit pool
    expect(impact.recruitPool).toEqual([]);

    // Should add newsletter items
    expect(impact.newsletterItems).toBeDefined();
    expect(impact.newsletterItems?.length).toBeGreaterThan(0);
    expect(impact.newsletterItems?.[0].title).toBe('Stable Rankings Update');
  });

  it("should return empty StateImpact if season hasn't changed", () => {
    const impact = processTierProgression(mockState, 'Spring', 2);

    // Should return empty object when season hasn't changed
    expect(impact).toEqual({});
  });
});
