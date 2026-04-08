import { describe, it, expect } from "vitest";
import { getSeasonalGains, updateSeasonalGains } from "@/engine/training/facilityUpkeep";
import type { SeasonalGrowth } from "@/types/game";

describe("facilityUpkeep", () => {
  describe("getSeasonalGains", () => {
    it("should return empty object if no entry found", () => {
      expect(getSeasonalGains([], "w1", "Spring")).toMatchObject({});
    });

    it("should return gains for specific warrior and season", () => {
      const growth: SeasonalGrowth[] = [
        { warriorId: "w1", season: "Spring", gains: { ST: 1, CN: 2 } }
      ];
      expect(getSeasonalGains(growth, "w1", "Spring")).toMatchObject({ ST: 1, CN: 2 });
    });
  });

  describe("updateSeasonalGains", () => {
    it("should create new entry if none exists", () => {
      const result = updateSeasonalGains([], "w1", "Spring", "ST");
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ warriorId: "w1", season: "Spring", gains: { ST: 1 } });
    });

    it("should update existing entry", () => {
      const growth: SeasonalGrowth[] = [
        { warriorId: "w1", season: "Spring", gains: { ST: 1 } }
      ];
      const result = updateSeasonalGains(growth, "w1", "Spring", "ST");
      expect(result).toHaveLength(1);
      expect(result[0].gains.ST).toBe(2);
    });
  });
});
