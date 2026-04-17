/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach , Mock} from 'vitest';
import { StyleRollups } from '@/engine/stats/styleRollups';

describe('StyleRollups', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadWeek (via getWeekRollup)', () => {
    beforeEach(() => {
      // Ensure localStorage is a valid mock object before each test
      if (!globalThis.localStorage) {
        Object.defineProperty(globalThis, 'localStorage', {
          value: {
            getItem: vi.fn(),
            setItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn(),
          },
          writable: true,
          configurable: true,
        });
      }
      (globalThis.localStorage as any).clear();
    });

    it('returns {} if localStorage is undefined', () => {
      Object.defineProperty(globalThis, 'localStorage', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      expect(StyleRollups.getWeekRollup(1)).toMatchObject({});
    });

    it('returns {} if localStorage.getItem returns null', () => {
      (globalThis.localStorage.getItem as Mock).mockReturnValue(null);
      expect(StyleRollups.getWeekRollup(1)).toMatchObject({});
    });


    it('returns {} if localStorage.getItem returns an invalid JSON string (loadWeek error path)', () => {
      (globalThis.localStorage.getItem as Mock).mockReturnValue('{invalid}');
      expect(StyleRollups.getWeekRollup(1)).toMatchObject({});
    });

    it('returns {} if localStorage.getItem returns invalid JSON', () => {
      (globalThis.localStorage.getItem as Mock).mockReturnValue('{ invalid json');
      expect(StyleRollups.getWeekRollup(1)).toMatchObject({});
    });

    it('returns {} if localStorage.getItem throws an Error', () => {
      (globalThis.localStorage.getItem as Mock).mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      expect(StyleRollups.getWeekRollup(1)).toMatchObject({});
    });

    it('returns valid records if localStorage has valid data', () => {
      const validData = {
        'Sword': { w: 1, l: 0, k: 0, pct: 1, fights: 1 }
      };
      (globalThis.localStorage.getItem as Mock).mockReturnValue(JSON.stringify(validData));
      expect(StyleRollups.getWeekRollup(1)).toEqual(validData);
    });

    it('filters out invalid records', () => {
      const mixedData = {
        'Sword': { w: 1, l: 0, k: 0, pct: 1, fights: 1 },
        'Axe': { invalid: 'data' }, // Should be ignored by validateWeekRecord
        'Spear': 'string', // Should be ignored
      };
      (globalThis.localStorage.getItem as Mock).mockReturnValue(JSON.stringify(mixedData));
      expect(StyleRollups.getWeekRollup(1)).toMatchObject({
        'Sword': { w: 1, l: 0, k: 0, pct: 1, fights: 1 }
      });
    });
  });

  describe('loadRolling (via last10)', () => {
    beforeEach(() => {
      if (!globalThis.localStorage) {
        Object.defineProperty(globalThis, 'localStorage', {
          value: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() },
          writable: true,
          configurable: true,
        });
      }
      (globalThis.localStorage as any).clear();
    });

    it('returns [] if localStorage is undefined', () => {
      Object.defineProperty(globalThis, 'localStorage', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      expect(StyleRollups.last10()).toEqual([]);
    });

    it('returns [] if localStorage.getItem returns null', () => {
      (globalThis.localStorage.getItem as Mock).mockReturnValue(null);
      expect(StyleRollups.last10()).toEqual([]);
    });

    it('returns [] if localStorage.getItem returns invalid JSON', () => {
      (globalThis.localStorage.getItem as Mock).mockReturnValue('{ invalid json');
      expect(StyleRollups.last10()).toEqual([]);
    });

    it('returns [] if localStorage.getItem throws an Error', () => {
      (globalThis.localStorage.getItem as Mock).mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      expect(StyleRollups.last10()).toEqual([]);
    });

    it('returns valid records if localStorage has valid data', () => {
      const validData = {
        'Sword': [
          { W: 1, L: 0, K: 0, fights: 1 },
          { W: 0, L: 1, K: 0, fights: 1 }
        ]
      };
      (globalThis.localStorage.getItem as Mock).mockReturnValue(JSON.stringify(validData));
      const result = StyleRollups.last10();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        style: 'Sword',
        W: 1,
        L: 1,
        K: 0,
        fights: 2,
        P: 50
      });
    });

    it('filters out invalid records', () => {
      const mixedData = {
        'Sword': [
          { W: 1, L: 0, K: 0, fights: 1 },
          { invalid: 'data' }
        ],
        'Axe': { notAnArray: true },
        'Spear': 'string',
      };
      (globalThis.localStorage.getItem as Mock).mockReturnValue(JSON.stringify(mixedData));
      const result = StyleRollups.last10();
      expect(result).toHaveLength(1);
      expect(result[0]!.style).toBe('Sword');
      expect(result[0]!.fights).toBe(1);
    });
  });

  describe('loadTour (via tournament)', () => {
    beforeEach(() => {
      if (!globalThis.localStorage) {
        Object.defineProperty(globalThis, 'localStorage', {
          value: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() },
          writable: true,
          configurable: true,
        });
      }
      (globalThis.localStorage as any).clear();
    });

    it('returns [] if localStorage is undefined', () => {
      Object.defineProperty(globalThis, 'localStorage', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      expect(StyleRollups.tournament('tour1')).toEqual([]);
    });

    it('returns [] if localStorage.getItem returns null', () => {
      (globalThis.localStorage.getItem as Mock).mockReturnValue(null);
      expect(StyleRollups.tournament('tour1')).toEqual([]);
    });

    it('returns [] if localStorage.getItem returns invalid JSON', () => {
      (globalThis.localStorage.getItem as Mock).mockReturnValue('{ invalid json');
      expect(StyleRollups.tournament('tour1')).toEqual([]);
    });

    it('returns [] if localStorage.getItem throws an Error', () => {
      (globalThis.localStorage.getItem as Mock).mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      expect(StyleRollups.tournament('tour1')).toEqual([]);
    });

    it('returns valid records if localStorage has valid data', () => {
      const validData = {
        'tour1': {
          'Sword': { W: 1, L: 0, K: 0, fights: 1 }
        }
      };
      (globalThis.localStorage.getItem as Mock).mockReturnValue(JSON.stringify(validData));
      const result = StyleRollups.tournament('tour1');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        style: 'Sword',
        W: 1,
        L: 0,
        K: 0,
        fights: 1,
        P: 100
      });
    });

    it('filters out invalid records', () => {
      const mixedData = {
        'tour1': {
          'Sword': { W: 1, L: 0, K: 0, fights: 1 },
          'Axe': { invalid: 'data' },
        },
        'tour2': {
           'Spear': { W: 0, L: 1, K: 0, fights: 1 }
        }
      };
      (globalThis.localStorage.getItem as Mock).mockReturnValue(JSON.stringify(mixedData));
      const result = StyleRollups.tournament('tour1');
      expect(result).toHaveLength(1);
      expect(result[0]!.style).toBe('Sword');
    });
  });
});
