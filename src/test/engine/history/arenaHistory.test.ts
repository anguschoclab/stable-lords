import { describe, it, expect, beforeEach } from "vitest";

// Define localStorage mock before module import
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

import { ArenaHistory } from "@/engine/history/arenaHistory";
import type { FightSummary } from "@/types/game";

describe("ArenaHistory", () => {
  const KEY = "sl.arenaHistory";

  beforeEach(() => {
    localStorageMock.clear();
  });

  const mockFight = {
    id: "f1",
    a: "Attacker",
    d: "Defender",
    styleA: "BASHING ATTACK",
    styleD: "TOTAL PARRY",
    winner: "A" as const,
    by: "KO" as const,
    title: "Attacker vs Defender",
    week: 1,
    createdAt: new Date().toISOString(),
  } satisfies FightSummary;

  describe("load fallback and all()", () => {
    it("should return an empty array if localStorage is empty", () => {
      const history = ArenaHistory.all();
      expect(history).toEqual([]);
    });

    it("should return an empty array if localStorage contains malformed JSON", () => {
      localStorageMock.setItem(KEY, "{ bad json }");
      const history = ArenaHistory.all();
      expect(history).toEqual([]);
    });

    it("should return parsed array if localStorage contains valid JSON", () => {
      localStorageMock.setItem(KEY, JSON.stringify([mockFight]));
      const history = ArenaHistory.all();
      expect(history).toEqual([mockFight]);
    });
  });

  describe("append()", () => {
    it("should append a fight to an empty history", () => {
      ArenaHistory.append(mockFight);
      const history = ArenaHistory.all();
      expect(history.length).toBe(1);
      expect(history[0]).toEqual(mockFight);
      expect(localStorageMock.getItem(KEY)).toBe(JSON.stringify([mockFight]));
    });

    it("should append a fight to an existing history", () => {
      ArenaHistory.append(mockFight);
      const mockFight2 = { ...mockFight, winner: "D" as const };
      ArenaHistory.append(mockFight2);
      const history = ArenaHistory.all();
      expect(history.length).toBe(2);
      expect(history[1]).toEqual(mockFight2);
    });

    it("should cap the history at 500 entries", () => {
      for (let i = 0; i < 505; i++) {
        ArenaHistory.append({ ...mockFight, week: i });
      }
      const history = ArenaHistory.all();
      expect(history.length).toBe(500);
      expect(history[0].week).toBe(5);
      expect(history[499].week).toBe(504);
    });

    it("should recover and append successfully if storage was malformed", () => {
      localStorageMock.setItem(KEY, "[ malformed array");
      ArenaHistory.append(mockFight);
      const history = ArenaHistory.all();
      expect(history.length).toBe(1);
      expect(history[0]).toEqual(mockFight);
    });
  });

  describe("query()", () => {
    beforeEach(() => {
      ArenaHistory.append({ ...mockFight, a: "Alice", d: "Bob", week: 1 });
      ArenaHistory.append({ ...mockFight, a: "Charlie", d: "Alice", week: 2 });
      ArenaHistory.append({ ...mockFight, a: "Dave", d: "Eve", week: 2 });
    });

    it("should return all fights if no query options are provided", () => {
      const results = ArenaHistory.query();
      expect(results.length).toBe(3);
    });

    it("should filter by week", () => {
      const results = ArenaHistory.query({ week: 2 });
      expect(results.length).toBe(2);
      expect(results.every(r => r.week === 2)).toBe(true);
    });

    it("should filter by warriorName (as attacker or defender)", () => {
      const results = ArenaHistory.query({ warriorName: "Alice" });
      expect(results.length).toBe(2);
      expect(results[0].a).toBe("Alice");
      expect(results[1].d).toBe("Alice");
    });

    it("should filter by both week and warriorName", () => {
      const results = ArenaHistory.query({ week: 2, warriorName: "Alice" });
      expect(results.length).toBe(1);
      expect(results[0].week).toBe(2);
      expect(results[0].d).toBe("Alice");
    });

    it("should return empty array if querying malformed JSON history", () => {
       localStorageMock.setItem(KEY, "not an array");
       const results = ArenaHistory.query({ week: 1 });
       expect(results).toEqual([]);
    });
  });
});
