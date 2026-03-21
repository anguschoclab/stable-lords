import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StyleRollups } from "../../../engine/stats/styleRollups";

describe("StyleRollups", () => {
  let originalLocalStorage: Storage;

  beforeEach(() => {
    // Save original localStorage
    if (typeof globalThis.localStorage !== "undefined") {
      originalLocalStorage = globalThis.localStorage;
    }

    // Mock localStorage
    const store: Record<string, string> = {};
    const mockLocalStorage = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach((key) => delete store[key]);
      }),
      length: 0,
      key: vi.fn((index: number) => null),
    } as Storage;

    Object.defineProperty(globalThis, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalLocalStorage) {
      Object.defineProperty(globalThis, "localStorage", {
        value: originalLocalStorage,
        writable: true,
      });
    }
  });

  describe("getWeekRollup (loadWeek)", () => {
    it("returns an empty object when localStorage returns null", () => {
      (globalThis.localStorage.getItem as any).mockReturnValue(null);
      const result = StyleRollups.getWeekRollup(1);
      expect(result).toEqual({});
    });

    it("returns an empty object when localStorage returns malformed JSON", () => {
      (globalThis.localStorage.getItem as any).mockReturnValue("{ invalid json ");
      const result = StyleRollups.getWeekRollup(2);
      expect(result).toEqual({});
    });

    it("returns an empty object when localStorage.getItem throws an error", () => {
      (globalThis.localStorage.getItem as any).mockImplementation(() => {
        throw new Error("Access denied");
      });
      const result = StyleRollups.getWeekRollup(3);
      expect(result).toEqual({});
    });

    it("returns parsed JSON when localStorage returns valid JSON", () => {
      const validJson = JSON.stringify({ "Aggressive": { w: 1, l: 0, k: 0, pct: 1, fights: 1 } });
      (globalThis.localStorage.getItem as any).mockReturnValue(validJson);
      const result = StyleRollups.getWeekRollup(4);
      expect(result).toEqual({ "Aggressive": { w: 1, l: 0, k: 0, pct: 1, fights: 1 } });
    });

    it("returns an empty object when JSON has incorrect field types", () => {
      const invalidJson = JSON.stringify({ "Aggressive": { w: "1", l: 0, k: 0, pct: 1, fights: 1 } });
      (globalThis.localStorage.getItem as any).mockReturnValue(invalidJson);
      const result = StyleRollups.getWeekRollup(5);
      expect(result).toEqual({});
    });

    it("returns an empty object when JSON is missing required fields", () => {
      const invalidJson = JSON.stringify({ "Aggressive": { w: 1, l: 0 } });
      (globalThis.localStorage.getItem as any).mockReturnValue(invalidJson);
      const result = StyleRollups.getWeekRollup(6);
      expect(result).toEqual({});
    });
  });

  describe("last10 (loadRolling)", () => {
    it("returns empty array when localStorage is corrupted", () => {
      (globalThis.localStorage.getItem as any).mockReturnValue(JSON.stringify({ "Aggressive": [{ W: "invalid" }] }));
      const result = StyleRollups.last10();
      expect(result).toEqual([]);
    });

    it("returns valid records when localStorage is correct", () => {
      const validRolling = {
        "Aggressive": [{ W: 1, L: 0, K: 0, fights: 1 }]
      };
      (globalThis.localStorage.getItem as any).mockReturnValue(JSON.stringify(validRolling));
      const result = StyleRollups.last10();
      expect(result.length).toBe(1);
      expect(result[0].style).toBe("Aggressive");
      expect(result[0].W).toBe(1);
    });
  });

  describe("tournament (loadTour)", () => {
    it("returns empty array when tournament data is corrupted", () => {
      (globalThis.localStorage.getItem as any).mockReturnValue(JSON.stringify({ "tour1": { "Aggressive": { W: "invalid" } } }));
      const result = StyleRollups.tournament("tour1");
      expect(result).toEqual([]);
    });

    it("returns valid records when tournament data is correct", () => {
      const validTour = {
        "tour1": { "Aggressive": { W: 1, L: 0, K: 0, fights: 1 } }
      };
      (globalThis.localStorage.getItem as any).mockReturnValue(JSON.stringify(validTour));
      const result = StyleRollups.tournament("tour1");
      expect(result.length).toBe(1);
      expect(result[0].style).toBe("Aggressive");
      expect(result[0].W).toBe(1);
    });
  });
});
