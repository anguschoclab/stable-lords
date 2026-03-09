/**
 * Style Passives Tests — combat mechanics, tempo, mastery, kill mechanics
 */
import { describe, it, expect } from "vitest";
import {
  getTempoBonus,
  getEnduranceMult,
  getMastery,
  getStylePassive,
  getKillMechanic,
  type Phase,
  type MasteryTier,
} from "./stylePassives";
import { FightingStyle } from "@/types/game";

describe("Style Passives", () => {
  describe("getTempoBonus", () => {
    it("should return phase-specific bonuses for each style", () => {
      const opening = getTempoBonus(FightingStyle.LungingAttack, "OPENING");
      const mid = getTempoBonus(FightingStyle.LungingAttack, "MID");
      const late = getTempoBonus(FightingStyle.LungingAttack, "LATE");
      
      expect(opening).toBeGreaterThan(mid);
      expect(opening).toBeGreaterThan(late);
    });

    it("should give Total Parry negative opening tempo", () => {
      const tempo = getTempoBonus(FightingStyle.TotalParry, "OPENING");
      expect(tempo).toBeLessThan(0);
    });

    it("should give Wall of Steel positive late tempo", () => {
      const tempo = getTempoBonus(FightingStyle.WallOfSteel, "LATE");
      expect(tempo).toBeGreaterThan(0);
    });

    it("should give Aimed Blow positive late tempo", () => {
      const tempo = getTempoBonus(FightingStyle.AimedBlow, "LATE");
      expect(tempo).toBeGreaterThan(0);
    });
  });

  describe("getEnduranceMult", () => {
    it("should return multipliers less than or equal to 1.0 for efficient styles", () => {
      const tp = getEnduranceMult(FightingStyle.TotalParry);
      const ws = getEnduranceMult(FightingStyle.WallOfSteel);
      const ab = getEnduranceMult(FightingStyle.AimedBlow);
      
      expect(tp).toBeLessThanOrEqual(1.0);
      expect(ws).toBeLessThanOrEqual(1.0);
      expect(ab).toBeLessThanOrEqual(1.0);
    });

    it("should return multipliers greater than 1.0 for wasteful styles", () => {
      const lu = getEnduranceMult(FightingStyle.LungingAttack);
      expect(lu).toBeGreaterThan(1.0);
    });
  });

  describe("getMastery", () => {
    it("should return Novice for 0-9 fights", () => {
      expect(getMastery(0).tier).toBe("Novice");
      expect(getMastery(5).tier).toBe("Novice");
      expect(getMastery(9).tier).toBe("Novice");
    });

    it("should return Practiced for 10-19 fights", () => {
      expect(getMastery(10).tier).toBe("Practiced");
      expect(getMastery(15).tier).toBe("Practiced");
      expect(getMastery(19).tier).toBe("Practiced");
    });

    it("should return Veteran for 20-29 fights", () => {
      expect(getMastery(20).tier).toBe("Veteran");
      expect(getMastery(25).tier).toBe("Veteran");
      expect(getMastery(29).tier).toBe("Veteran");
    });

    it("should return Master for 30-49 fights", () => {
      expect(getMastery(30).tier).toBe("Master");
      expect(getMastery(40).tier).toBe("Master");
      expect(getMastery(49).tier).toBe("Master");
    });

    it("should return Grandmaster for 50+ fights", () => {
      expect(getMastery(50).tier).toBe("Grandmaster");
      expect(getMastery(100).tier).toBe("Grandmaster");
    });

    it("should increase multipliers with mastery tier", () => {
      const novice = getMastery(0);
      const veteran = getMastery(20);
      const grandmaster = getMastery(50);
      
      expect(veteran.mult).toBeGreaterThan(novice.mult);
      expect(grandmaster.mult).toBeGreaterThan(veteran.mult);
    });
  });

  describe("getStylePassive", () => {
    const baseContext = {
      phase: "MID" as Phase,
      exchange: 5,
      hitsLanded: 2,
      hitsTaken: 1,
      ripostes: 0,
      consecutiveHits: 0,
      hpRatio: 0.8,
      endRatio: 0.7,
      opponentStyle: FightingStyle.StrikingAttack,
      totalFights: 0,
    };

    it("should return passive bonuses for Aimed Blow when targeting", () => {
      const passive = getStylePassive(FightingStyle.AimedBlow, {
        ...baseContext,
        targetedLocation: "Head",
      });
      
      expect(passive.attBonus).toBeGreaterThan(0);
      expect(passive.critChance).toBeGreaterThan(0);
    });

    it("should not give Aimed Blow bonuses without targeting", () => {
      const passive = getStylePassive(FightingStyle.AimedBlow, {
        ...baseContext,
        targetedLocation: "Any",
      });
      
      expect(passive.attBonus).toBe(0);
      expect(passive.critChance).toBe(0);
    });

    it("should increase Bashing Attack damage with consecutive hits", () => {
      const passive0 = getStylePassive(FightingStyle.BashingAttack, {
        ...baseContext,
        consecutiveHits: 0,
      });
      const passive3 = getStylePassive(FightingStyle.BashingAttack, {
        ...baseContext,
        consecutiveHits: 3,
      });
      
      expect(passive3.dmgBonus).toBeGreaterThan(passive0.dmgBonus);
    });

    it("should give Lunging Attack strong opening bonuses", () => {
      const opening = getStylePassive(FightingStyle.LungingAttack, {
        ...baseContext,
        exchange: 0,
        phase: "OPENING",
      });
      const late = getStylePassive(FightingStyle.LungingAttack, {
        ...baseContext,
        exchange: 10,
        phase: "LATE",
      });
      
      expect(opening.iniBonus).toBeGreaterThan(late.iniBonus);
    });

    it("should give Parry-Riposte bonuses for ripostes", () => {
      const passive = getStylePassive(FightingStyle.ParryRiposte, {
        ...baseContext,
        ripostes: 3,
      });
      
      expect(passive.ripBonus).toBeGreaterThan(0);
    });

    it("should penalize Parry-Riposte ATT", () => {
      const passive = getStylePassive(FightingStyle.ParryRiposte, baseContext);
      expect(passive.attBonus).toBeLessThan(0);
    });

    it("should give Total Parry parry bonuses", () => {
      const passive = getStylePassive(FightingStyle.TotalParry, baseContext);
      expect(passive.parBonus).toBeGreaterThan(0);
    });

    it("should penalize Total Parry ATT", () => {
      const passive = getStylePassive(FightingStyle.TotalParry, baseContext);
      expect(passive.attBonus).toBeLessThan(0);
    });

    it("should increase Slashing Attack damage with hits landed", () => {
      const passive0 = getStylePassive(FightingStyle.SlashingAttack, {
        ...baseContext,
        hitsLanded: 0,
      });
      const passive5 = getStylePassive(FightingStyle.SlashingAttack, {
        ...baseContext,
        hitsLanded: 5,
      });
      
      expect(passive5.dmgBonus).toBeGreaterThan(passive0.dmgBonus);
    });

    it("should give Striking Attack consistent bonuses", () => {
      const passive = getStylePassive(FightingStyle.StrikingAttack, baseContext);
      expect(passive.attBonus).toBeGreaterThan(0);
      expect(passive.dmgBonus).toBeGreaterThan(0);
    });

    it("should increase Wall of Steel defense over time", () => {
      const early = getStylePassive(FightingStyle.WallOfSteel, {
        ...baseContext,
        exchange: 0,
      });
      const late = getStylePassive(FightingStyle.WallOfSteel, {
        ...baseContext,
        exchange: 15,
      });
      
      expect(late.defBonus).toBeGreaterThanOrEqual(early.defBonus);
    });

    it("should scale bonuses with mastery", () => {
      const novice = getStylePassive(FightingStyle.BashingAttack, {
        ...baseContext,
        totalFights: 0,
        consecutiveHits: 2,
      });
      const master = getStylePassive(FightingStyle.BashingAttack, {
        ...baseContext,
        totalFights: 30,
        consecutiveHits: 2,
      });
      
      expect(master.dmgBonus).toBeGreaterThanOrEqual(novice.dmgBonus);
    });
  });

  describe("getKillMechanic", () => {
    const baseContext = {
      phase: "MID" as Phase,
      hitsLanded: 3,
      consecutiveHits: 1,
      hitLocation: "torso",
    };

    it("should give Aimed Blow bonus for headshots", () => {
      const headshot = getKillMechanic(FightingStyle.AimedBlow, {
        ...baseContext,
        hitLocation: "head",
        targetedLocation: "Head",
      });
      const bodyshot = getKillMechanic(FightingStyle.AimedBlow, {
        ...baseContext,
        hitLocation: "torso",
        targetedLocation: "Torso",
      });
      
      expect(headshot.killBonus).toBeGreaterThan(bodyshot.killBonus);
    });

    it("should increase Bashing Attack kill chance with momentum", () => {
      const low = getKillMechanic(FightingStyle.BashingAttack, {
        ...baseContext,
        consecutiveHits: 0,
      });
      const high = getKillMechanic(FightingStyle.BashingAttack, {
        ...baseContext,
        consecutiveHits: 3,
      });
      
      expect(high.killBonus).toBeGreaterThan(low.killBonus);
    });

    it("should give Lunging Attack bonus in opening phase", () => {
      const opening = getKillMechanic(FightingStyle.LungingAttack, {
        ...baseContext,
        phase: "OPENING",
      });
      const late = getKillMechanic(FightingStyle.LungingAttack, {
        ...baseContext,
        phase: "LATE",
      });
      
      expect(opening.killBonus).toBeGreaterThan(late.killBonus);
    });

    it("should give Slashing Attack bonus after multiple hits", () => {
      const few = getKillMechanic(FightingStyle.SlashingAttack, {
        ...baseContext,
        hitsLanded: 2,
      });
      const many = getKillMechanic(FightingStyle.SlashingAttack, {
        ...baseContext,
        hitsLanded: 6,
      });
      
      expect(many.killBonus).toBeGreaterThan(few.killBonus);
    });

    it("should penalize Total Parry kill chances", () => {
      const tp = getKillMechanic(FightingStyle.TotalParry, baseContext);
      const st = getKillMechanic(FightingStyle.StrikingAttack, baseContext);
      
      expect(tp.killBonus).toBeLessThan(st.killBonus);
    });

    it("should include narrative text for all styles", () => {
      const mechanic = getKillMechanic(FightingStyle.BashingAttack, baseContext);
      expect(mechanic.killNarrative).toBeDefined();
      expect(mechanic.killNarrative.length).toBeGreaterThan(0);
    });

    it("should have lower kill window for defensive styles", () => {
      const tp = getKillMechanic(FightingStyle.TotalParry, baseContext);
      const ba = getKillMechanic(FightingStyle.BashingAttack, baseContext);
      
      expect(tp.killWindowHpMult).toBeLessThan(ba.killWindowHpMult);
    });
  });
});
