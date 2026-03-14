/**
 * Tactic Suitability Tests
 */
import { describe, it, expect } from "vitest";
import {
  getOffensiveSuitability,
  getDefensiveSuitability,
  suitabilityMultiplier,
  type SuitabilityRating,
} from "@/engine/tacticSuitability";
import { FightingStyle, type OffensiveTactic, type DefensiveTactic } from "@/types/game";

describe("Tactic Suitability", () => {
  describe("getOffensiveSuitability", () => {
    it("should return WS for 'none' tactic", () => {
      expect(getOffensiveSuitability(FightingStyle.BashingAttack, "none")).toBe("WS");
    });

    it("should rate Bashing Attack as WS for Bash", () => {
      expect(getOffensiveSuitability(FightingStyle.BashingAttack, "Bash")).toBe("WS");
    });

    it("should rate Bashing Attack as U for Lunge", () => {
      expect(getOffensiveSuitability(FightingStyle.BashingAttack, "Lunge")).toBe("U");
    });

    it("should rate Lunging Attack as WS for Lunge", () => {
      expect(getOffensiveSuitability(FightingStyle.LungingAttack, "Lunge")).toBe("WS");
    });

    it("should rate Lunging Attack as U for Bash", () => {
      expect(getOffensiveSuitability(FightingStyle.LungingAttack, "Bash")).toBe("U");
    });

    it("should rate Aimed Blow as WS for Decisiveness", () => {
      expect(getOffensiveSuitability(FightingStyle.AimedBlow, "Decisiveness")).toBe("WS");
    });

    it("should rate Aimed Blow as U for Bash", () => {
      expect(getOffensiveSuitability(FightingStyle.AimedBlow, "Bash")).toBe("U");
    });

    it("should rate Total Parry as U for all offensive tactics", () => {
      expect(getOffensiveSuitability(FightingStyle.TotalParry, "Lunge")).toBe("U");
      expect(getOffensiveSuitability(FightingStyle.TotalParry, "Slash")).toBe("U");
      expect(getOffensiveSuitability(FightingStyle.TotalParry, "Bash")).toBe("U");
      expect(getOffensiveSuitability(FightingStyle.TotalParry, "Decisiveness")).toBe("U");
    });

    it("should rate Slashing Attack as WS for Slash", () => {
      expect(getOffensiveSuitability(FightingStyle.SlashingAttack, "Slash")).toBe("WS");
    });

    it("should rate Striking Attack as WS for Decisiveness", () => {
      expect(getOffensiveSuitability(FightingStyle.StrikingAttack, "Decisiveness")).toBe("WS");
    });

    it("should rate Striking Attack as S for most tactics", () => {
      expect(getOffensiveSuitability(FightingStyle.StrikingAttack, "Lunge")).toBe("S");
      expect(getOffensiveSuitability(FightingStyle.StrikingAttack, "Slash")).toBe("S");
      expect(getOffensiveSuitability(FightingStyle.StrikingAttack, "Bash")).toBe("S");
    });
  });

  describe("getDefensiveSuitability", () => {
    it("should return WS for 'none' tactic", () => {
      expect(getDefensiveSuitability(FightingStyle.BashingAttack, "none")).toBe("WS");
    });

    it("should rate Parry-Riposte as WS for Parry and Riposte", () => {
      expect(getDefensiveSuitability(FightingStyle.ParryRiposte, "Parry")).toBe("WS");
      expect(getDefensiveSuitability(FightingStyle.ParryRiposte, "Riposte")).toBe("WS");
    });

    it("should rate Parry-Riposte as WS for Responsiveness", () => {
      expect(getDefensiveSuitability(FightingStyle.ParryRiposte, "Responsiveness")).toBe("WS");
    });

    it("should rate Lunging Attack as WS for Dodge", () => {
      expect(getDefensiveSuitability(FightingStyle.LungingAttack, "Dodge")).toBe("WS");
    });

    it("should rate Lunging Attack as U for Parry", () => {
      expect(getDefensiveSuitability(FightingStyle.LungingAttack, "Parry")).toBe("U");
    });

    it("should rate Aimed Blow as WS for Dodge", () => {
      expect(getDefensiveSuitability(FightingStyle.AimedBlow, "Dodge")).toBe("WS");
    });

    it("should rate Bashing Attack as U for Dodge and Riposte", () => {
      expect(getDefensiveSuitability(FightingStyle.BashingAttack, "Dodge")).toBe("U");
      expect(getDefensiveSuitability(FightingStyle.BashingAttack, "Riposte")).toBe("U");
    });

    it("should rate Total Parry as WS for Parry", () => {
      expect(getDefensiveSuitability(FightingStyle.TotalParry, "Parry")).toBe("WS");
    });

    it("should rate Wall of Steel as WS for Responsiveness", () => {
      expect(getDefensiveSuitability(FightingStyle.WallOfSteel, "Responsiveness")).toBe("WS");
    });

    it("should rate Striking Attack as U for Riposte", () => {
      expect(getDefensiveSuitability(FightingStyle.StrikingAttack, "Riposte")).toBe("U");
    });

    it("should rate Slashing Attack as U for Parry", () => {
      expect(getDefensiveSuitability(FightingStyle.SlashingAttack, "Parry")).toBe("U");
    });
  });

  describe("suitabilityMultiplier", () => {
    it("should return 1.0 for WS", () => {
      expect(suitabilityMultiplier("WS")).toBe(1.0);
    });

    it("should return 0.6 for S", () => {
      expect(suitabilityMultiplier("S")).toBe(0.6);
    });

    it("should return 0.3 for U", () => {
      expect(suitabilityMultiplier("U")).toBe(0.3);
    });
  });

  describe("Edge cases", () => {
    it("should handle all fighting styles", () => {
      const styles = Object.values(FightingStyle);
      const tactics: OffensiveTactic[] = ["Lunge", "Slash", "Bash", "Decisiveness"];
      
      for (const style of styles) {
        for (const tactic of tactics) {
          const rating = getOffensiveSuitability(style, tactic);
          expect(["WS", "S", "U"]).toContain(rating);
        }
      }
    });

    it("should handle all defensive tactics", () => {
      const styles = Object.values(FightingStyle);
      const tactics: DefensiveTactic[] = ["Dodge", "Parry", "Riposte", "Responsiveness"];
      
      for (const style of styles) {
        for (const tactic of tactics) {
          const rating = getDefensiveSuitability(style, tactic);
          expect(["WS", "S", "U"]).toContain(rating);
        }
      }
    });
  });
});
