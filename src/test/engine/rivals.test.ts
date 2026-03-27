import { describe, it, expect } from "vitest";
import { generateRivalStables } from "../../engine/rivals";
import { MetaAdaptation } from "../../types/game";

describe("generateRivalStables", () => {
  it("should generate a variety of metaAdaptation types", () => {
    // Generate a large number of rivals to get a good distribution
    const rivals = generateRivalStables(20, 12345);

    const adaptations = new Set<MetaAdaptation>();
    const counts: Record<string, number> = {};

    for (const rival of rivals) {
      const type = rival.owner.metaAdaptation;
      if (type) {
        adaptations.add(type);
        counts[type] = (counts[type] || 0) + 1;
      }
    }

    // We expect to see all 4 types represented in a pool of 20 stables
    const msg = `MetaAdaptation counts: ${JSON.stringify(counts)}`;
    expect(adaptations.size, msg).toBe(4);
    expect(adaptations.has("MetaChaser"), msg).toBe(true);
    expect(adaptations.has("Traditionalist"), msg).toBe(true);
    expect(adaptations.has("Opportunist"), msg).toBe(true);
    expect(adaptations.has("Innovator"), msg).toBe(true);
  });
});
