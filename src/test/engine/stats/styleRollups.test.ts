import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StyleRollups } from '@/engine/stats/styleRollups';

describe('StyleRollups', () => {
  describe('loadWeek (via getWeekRollup)', () => {
    let originalLocalStorage: any;

    beforeEach(() => {
      // Save the original localStorage if it exists
      originalLocalStorage = globalThis.localStorage;

      // Create a mock localStorage
      const localStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        clear: vi.fn(),
        removeItem: vi.fn(),
        length: 0,
        key: vi.fn(),
      };

      // Override the global object
      Object.defineProperty(globalThis, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });
    });

    afterEach(() => {
      // Restore original
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
      });
      vi.restoreAllMocks();
    });

    it('returns {} if localStorage is undefined', () => {
      Object.defineProperty(globalThis, 'localStorage', {
        value: undefined,
        writable: true,
      });
      expect(StyleRollups.getWeekRollup(1)).toEqual({});
    });

    it('returns {} if localStorage.getItem returns null', () => {
      vi.mocked(globalThis.localStorage.getItem).mockReturnValue(null);
      expect(StyleRollups.getWeekRollup(1)).toEqual({});
    });

    it('returns {} if localStorage.getItem returns invalid JSON', () => {
      vi.mocked(globalThis.localStorage.getItem).mockReturnValue('{ invalid json');
      expect(StyleRollups.getWeekRollup(1)).toEqual({});
    });

    it('returns {} if localStorage.getItem throws an Error', () => {
      vi.mocked(globalThis.localStorage.getItem).mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      expect(StyleRollups.getWeekRollup(1)).toEqual({});
    });

    it('returns valid records if localStorage has valid data', () => {
      const validData = {
        'Sword': { w: 1, l: 0, k: 0, pct: 1, fights: 1 }
      };
      vi.mocked(globalThis.localStorage.getItem).mockReturnValue(JSON.stringify(validData));
      expect(StyleRollups.getWeekRollup(1)).toEqual(validData);
    });

    it('filters out invalid records', () => {
      const mixedData = {
        'Sword': { w: 1, l: 0, k: 0, pct: 1, fights: 1 },
        'Axe': { invalid: 'data' }, // Should be ignored by validateWeekRecord
        'Spear': 'string', // Should be ignored
      };
      vi.mocked(globalThis.localStorage.getItem).mockReturnValue(JSON.stringify(mixedData));
      expect(StyleRollups.getWeekRollup(1)).toEqual({
        'Sword': { w: 1, l: 0, k: 0, pct: 1, fights: 1 }
      });
    });
  });
});
