/**
 * Scouting System Tests
 */
import { describe, it, expect } from "vitest";
import { generateScoutReport, getScoutCost, type ScoutQuality, getAttributeDescription } from "@/engine/scouting";
import { FightingStyle, type Warrior } from "@/types/game";
import { computeWarriorStats } from "@/engine/skillCalc";

function makeWarrior(overrides?: Partial<Warrior>): Warrior {
  const attrs = { ST: 15, CN: 12, SZ: 10, WT: 14, WL: 13, SP: 16, DF: 11 };
  const { baseSkills, derivedStats } = computeWarriorStats(attrs, FightingStyle.SlashingAttack);
  return {
    id: "w1",
    name: "Opponent",
    style: FightingStyle.SlashingAttack,
    attributes: attrs,
    baseSkills,
    derivedStats,
    fame: 5,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 8, losses: 3, kills: 2 },
    champion: false,
    status: "Active",
    age: 24,
    plan: { OE: 7, AL: 5, killDesire: 6 } as any,
    ...overrides,
  };
}

describe("Scouting System", () => {
  describe("getScoutCost", () => {
    it("should return correct costs for each quality", () => {
      expect(getScoutCost("Basic")).toBe(25);
      expect(getScoutCost("Detailed")).toBe(50);
      expect(getScoutCost("Expert")).toBe(100);
    });
  });

  describe("generateScoutReport", () => {
    it("should always reveal warrior style", () => {
      const warrior = makeWarrior();
      const report = generateScoutReport(warrior, "Basic", 1);
      
      expect(report.style).toBe(FightingStyle.SlashingAttack);
    });

    it("should include win-loss record", () => {
      const warrior = makeWarrior({ career: { wins: 12, losses: 5, kills: 3 } });
      const report = generateScoutReport(warrior, "Basic", 1);
      
      expect(report.record).toBe("12W-5L");
    });

    it("should generate attribute text based on quality", () => {
      const warrior = makeWarrior();
      const expertReport = generateScoutReport(warrior, "Expert", 1);
      
      // We expect ST (15) to be described with Great/Good range at most
      expect(typeof expertReport.attributeRanges.ST).toBe("string");
      expect(expertReport.attributeRanges.ST.length).toBeGreaterThan(0);
    });

    it("should not show injuries in Basic report", () => {
      const warrior = makeWarrior({
        injuries: [{ id: "i1", name: "Cut", description: "Ouch", severity: "Minor", weeksRemaining: 2, penalties: {} }],
      });
      const report = generateScoutReport(warrior, "Basic", 1);
      
      expect(report.knownInjuries).toEqual([]);
    });

    it("should show injuries in Detailed report", () => {
      const warrior = makeWarrior({
        injuries: ["Broken Arm" as any],
      });
      const report = generateScoutReport(warrior, "Detailed", 1);
      
      expect(report.knownInjuries.length).toBeGreaterThan(0);
    });

    it("should not reveal plan tendencies in Basic or Detailed reports", () => {
      const warrior = makeWarrior({ plan: { OE: 9, AL: 3, killDesire: 8 } as any });
      
      const basicReport = generateScoutReport(warrior, "Basic", 1);
      const detailedReport = generateScoutReport(warrior, "Detailed", 1);
      
      expect(basicReport.suspectedOE).toBeUndefined();
      expect(basicReport.suspectedAL).toBeUndefined();
      expect(detailedReport.suspectedOE).toBeUndefined();
      expect(detailedReport.suspectedAL).toBeUndefined();
    });

    it("should reveal plan tendencies in Expert report", () => {
      const warrior = makeWarrior({ plan: { OE: 9, AL: 3, killDesire: 8 } as any });
      const report = generateScoutReport(warrior, "Expert", 1);
      
      expect(report.suspectedOE).toBe("High");
      expect(report.suspectedAL).toBe("Low");
    });

    it("should categorize OE/AL as Low/Medium/High correctly", () => {
      const low = makeWarrior({ plan: { OE: 2, AL: 3, killDesire: 5 } as any });
      const medium = makeWarrior({ plan: { OE: 5, AL: 5, killDesire: 5 } as any });
      const high = makeWarrior({ plan: { OE: 8, AL: 9, killDesire: 5 } as any });
      
      const reportL = generateScoutReport(low, "Expert", 1);
      const reportM = generateScoutReport(medium, "Expert", 1);
      const reportH = generateScoutReport(high, "Expert", 1);
      
      expect(reportL.suspectedOE).toBe("Low");
      expect(reportM.suspectedOE).toBe("Medium");
      expect(reportH.suspectedOE).toBe("High");
      
      expect(reportL.suspectedAL).toBe("Low");
      expect(reportM.suspectedAL).toBe("Medium");
      expect(reportH.suspectedAL).toBe("High");
    });

    it("should generate appropriate notes based on quality", () => {
      const warrior = makeWarrior();
      
      const basicReport = generateScoutReport(warrior, "Basic", 1);
      const detailedReport = generateScoutReport(warrior, "Detailed", 1);
      const expertReport = generateScoutReport(warrior, "Expert", 1);
      
      expect(basicReport.notes).toContain("Limited intel");
      expect(detailedReport.notes.length).toBeGreaterThan(basicReport.notes.length);
      expect(expertReport.notes.length).toBeGreaterThan(detailedReport.notes.length);
    });

    it("should mention kills in Expert report for killers", () => {
      const killer = makeWarrior({ career: { wins: 10, losses: 2, kills: 5 } });
      const report = generateScoutReport(killer, "Expert", 1);
      
      expect(report.notes).toContain("kills");
    });

    it("should generate valid strings for attribute ranges", () => {
      const warrior = makeWarrior();
      const report = generateScoutReport(warrior, "Basic", 1);
      
      for (const key in report.attributeRanges) {
        expect(typeof report.attributeRanges[key]).toBe("string");
      }
    });

    it("should include all attributes in ranges", () => {
      const warrior = makeWarrior();
      const report = generateScoutReport(warrior, "Basic", 1);
      
      expect(report.attributeRanges).toHaveProperty("ST");
      expect(report.attributeRanges).toHaveProperty("CN");
      expect(report.attributeRanges).toHaveProperty("SZ");
      expect(report.attributeRanges).toHaveProperty("WT");
      expect(report.attributeRanges).toHaveProperty("WL");
      expect(report.attributeRanges).toHaveProperty("SP");
      expect(report.attributeRanges).toHaveProperty("DF");
    });

    it("should include quality in report", () => {
      const warrior = makeWarrior();
      const report = generateScoutReport(warrior, "Detailed", 1);
      
      expect(report.quality).toBe("Detailed");
    });

    it("should include week in report", () => {
      const warrior = makeWarrior();
      const report = generateScoutReport(warrior, "Basic", 42);
      
      expect(report.week).toBe(42);
    });

    it("should generate unique report IDs", () => {
      const warrior = makeWarrior();
      const report1 = generateScoutReport(warrior, "Basic", 1);
      const report2 = generateScoutReport(warrior, "Basic", 1);
      
      expect(report1.id).not.toBe(report2.id);
    });
  });
});
