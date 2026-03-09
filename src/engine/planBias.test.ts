/**
 * Plan Bias Tests
 */
import { describe, it, expect } from "vitest";
import { autoTuneFromBias, reconcileGearTwoHanded, type Bias } from "./planBias";
import { FightingStyle, type FightPlan } from "@/types/game";

describe("Plan Bias", () => {
  describe("autoTuneFromBias", () => {
    const basePlan: FightPlan = {
      OE: 5,
      AL: 5,
      killDesire: 5,
      style: "STRIKING ATTACK",
      target: "Any",
      offensiveTactic: "none",
      defensiveTactic: "none",
    };

    it("should set head targeting for head-hunt bias", () => {
      const tuned = autoTuneFromBias(basePlan, "head-hunt");
      expect(tuned.target).toBe("Head");
    });

    it("should increase kill desire for head-hunt bias", () => {
      const tuned = autoTuneFromBias(basePlan, "head-hunt");
      expect(tuned.killDesire).toBeGreaterThanOrEqual(7);
    });

    it("should set leg targeting for hamstring bias", () => {
      const tuned = autoTuneFromBias(basePlan, "hamstring");
      expect(tuned.target).toBe("Right Leg");
    });

    it("should increase AL for hamstring bias", () => {
      const tuned = autoTuneFromBias(basePlan, "hamstring");
      expect(tuned.AL).toBeGreaterThanOrEqual(7);
    });

    it("should set abdomen targeting for gut bias", () => {
      const tuned = autoTuneFromBias(basePlan, "gut");
      expect(tuned.target).toBe("Abdomen");
    });

    it("should increase OE for gut bias", () => {
      const tuned = autoTuneFromBias(basePlan, "gut");
      expect(tuned.OE).toBeGreaterThanOrEqual(7);
    });

    it("should set arm targeting for guard-break bias", () => {
      const tuned = autoTuneFromBias(basePlan, "guard-break");
      expect(tuned.target).toBe("Right Arm");
    });

    it("should increase OE for guard-break bias", () => {
      const tuned = autoTuneFromBias(basePlan, "guard-break");
      expect(tuned.OE).toBeGreaterThanOrEqual(8);
    });

    it("should set Any target for balanced bias", () => {
      const tuned = autoTuneFromBias(basePlan, "balanced");
      expect(tuned.target).toBe("Any");
    });

    it("should suggest Lunge for lunging styles", () => {
      const lungePlan: FightPlan = { ...basePlan, style: "LUNGING ATTACK" };
      const tuned = autoTuneFromBias(lungePlan, "balanced");
      expect(tuned.offensiveTactic).toBe("Lunge");
    });

    it("should suggest Bash for bashing styles", () => {
      const bashPlan: FightPlan = { ...basePlan, style: "BASHING ATTACK" };
      const tuned = autoTuneFromBias(bashPlan, "balanced");
      expect(tuned.offensiveTactic).toBe("Bash");
    });

    it("should suggest Riposte for parry-riposte styles", () => {
      const ripostePlan: FightPlan = { ...basePlan, style: "PARRY RIPOSTE" };
      const tuned = autoTuneFromBias(ripostePlan, "balanced");
      expect(tuned.defensiveTactic).toBe("Riposte");
    });

    it("should suggest Parry for total parry styles", () => {
      const parryPlan: FightPlan = { ...basePlan, style: "TOTAL PARRY" };
      const tuned = autoTuneFromBias(parryPlan, "balanced");
      expect(tuned.defensiveTactic).toBe("Parry");
    });

    it("should not override existing high values", () => {
      const highKDPlan: FightPlan = { ...basePlan, killDesire: 9 };
      const tuned = autoTuneFromBias(highKDPlan, "head-hunt");
      expect(tuned.killDesire).toBeGreaterThanOrEqual(9);
    });

    it("should not override existing high AL", () => {
      const highALPlan: FightPlan = { ...basePlan, AL: 9 };
      const tuned = autoTuneFromBias(highALPlan, "hamstring");
      expect(tuned.AL).toBeGreaterThanOrEqual(9);
    });

    it("should not override existing high OE", () => {
      const highOEPlan: FightPlan = { ...basePlan, OE: 9 };
      const tuned = autoTuneFromBias(highOEPlan, "gut");
      expect(tuned.OE).toBeGreaterThanOrEqual(9);
    });
  });

  describe("reconcileGearTwoHanded", () => {
    it("should remove shield when weapon is two-handed", () => {
      const plan: FightPlan = {
        OE: 5,
        AL: 5,
        killDesire: 5,
        style: "STRIKING ATTACK",
        target: "Any",
        offensiveTactic: "none",
        defensiveTactic: "none",
        gear: {
          weapon: { name: "Greatsword", twoHanded: true, damage: 10, init: 0, skill: "none" },
          shield: "Tower Shield",
          armor: "Leather",
        },
      };

      const draft: Partial<FightPlan> = {};
      reconcileGearTwoHanded(plan, draft);

      expect(draft.gear?.shield).toBe("None");
    });

    it("should not modify gear if weapon is one-handed", () => {
      const plan: FightPlan = {
        OE: 5,
        AL: 5,
        killDesire: 5,
        style: "STRIKING ATTACK",
        target: "Any",
        offensiveTactic: "none",
        defensiveTactic: "none",
        gear: {
          weapon: { name: "Sword", twoHanded: false, damage: 8, init: 0, skill: "none" },
          shield: "Round Shield",
          armor: "Leather",
        },
      };

      const draft: Partial<FightPlan> = {};
      reconcileGearTwoHanded(plan, draft);

      expect(draft.gear).toBeUndefined();
    });

    it("should not modify gear if no shield equipped", () => {
      const plan: FightPlan = {
        OE: 5,
        AL: 5,
        killDesire: 5,
        style: "STRIKING ATTACK",
        target: "Any",
        offensiveTactic: "none",
        defensiveTactic: "none",
        gear: {
          weapon: { name: "Greatsword", twoHanded: true, damage: 10, init: 0, skill: "none" },
          shield: "None",
          armor: "Leather",
        },
      };

      const draft: Partial<FightPlan> = {};
      reconcileGearTwoHanded(plan, draft);

      expect(draft.gear).toBeUndefined();
    });

    it("should handle missing gear gracefully", () => {
      const plan: FightPlan = {
        OE: 5,
        AL: 5,
        killDesire: 5,
        style: "STRIKING ATTACK",
        target: "Any",
        offensiveTactic: "none",
        defensiveTactic: "none",
      };

      const draft: Partial<FightPlan> = {};
      expect(() => reconcileGearTwoHanded(plan, draft)).not.toThrow();
    });

    it("should preserve other gear properties when removing shield", () => {
      const plan: FightPlan = {
        OE: 5,
        AL: 5,
        killDesire: 5,
        style: "STRIKING ATTACK",
        target: "Any",
        offensiveTactic: "none",
        defensiveTactic: "none",
        gear: {
          weapon: { name: "Greatsword", twoHanded: true, damage: 10, init: 0, skill: "none" },
          shield: "Tower Shield",
          armor: "Plate",
        },
      };

      const draft: Partial<FightPlan> = {};
      reconcileGearTwoHanded(plan, draft);

      expect(draft.gear?.weapon?.name).toBe("Greatsword");
      expect(draft.gear?.armor).toBe("Plate");
    });
  });
});
