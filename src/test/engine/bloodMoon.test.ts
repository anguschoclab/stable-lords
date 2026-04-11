import { describe, it, expect } from "vitest";
import { weatherStaminaModifier } from "@/engine/combat/combatMath";
import { rollWeather } from "@/engine/pipeline/passes/WorldPass";
import { SeededRNGService } from "@/engine/core/rng/SeededRNGService";

describe("Blood Moon Feature", () => {
  it("should return a 1.1 multiplier for Blood Moon stamina drain", () => {
    expect(weatherStaminaModifier("Blood Moon")).toBe(1.1);
  });

  it("should roll Blood Moon weather when rng yields high enough value", () => {
    // rollWeather returns Blood Moon if roll >= 0.95 and roll < 0.98 -> Drafty, roll >= 0.98 -> Blood Moon
    const rng = new SeededRNGService(1);
    rng.next = () => 0.99;
    expect(rollWeather(rng)).toBe("Blood Moon");
  });
});
