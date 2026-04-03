/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach , Mock} from 'vitest';
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
        configurable: true,
      });
    });

    afterEach(() => {
      // Restore original
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
        configurable: true,
      });
      vi.restoreAllMocks();
    });

    it('returns {} if localStorage is undefined', () => {
      Object.defineProperty(globalThis, 'localStorage', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      expect(StyleRollups.getWeekRollup(1)).toEqual({});
    });

    it('returns {} if localStorage.getItem returns null', () => {
      (globalThis.localStorage.getItem as Mock).mockReturnValue(null);
      expect(StyleRollups.getWeekRollup(1)).toEqual({});
    });

    it('returns {} if localStorage.getItem returns invalid JSON', () => {
      (globalThis.localStorage.getItem as Mock).mockReturnValue('{ invalid json');
      expect(StyleRollups.getWeekRollup(1)).toEqual({});
    });

    it('returns {} if localStorage.getItem throws an Error', () => {
      (globalThis.localStorage.getItem as Mock).mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      expect(StyleRollups.getWeekRollup(1)).toEqual({});
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
      expect(StyleRollups.getWeekRollup(1)).toEqual({
        'Sword': { w: 1, l: 0, k: 0, pct: 1, fights: 1 }
      });
    });
  });
});
