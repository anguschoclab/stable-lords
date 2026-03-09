/**
 * Trainer System Tests
 */
import { describe, it, expect } from "vitest";
import {
  generateHiringPool,
  convertRetiredToTrainer,
  getTrainingBonus,
  type Trainer,
  type TrainerFocus,
  type TrainerTier,
  TIER_COST,
  TIER_BONUS,
} from "./trainers";
import { FightingStyle, type Warrior } from "@/types/game";
import { computeWarriorStats } from "./skillCalc";

function makeWarrior(style: FightingStyle, overrides?: Partial<Warrior>): Warrior {
  const attrs = { ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 };
  const { baseSkills, derivedStats } = computeWarriorStats(attrs, style);
  return {
    id: "w1",
    name: "Test Warrior",
    style,
    attributes: attrs,
    baseSkills,
    derivedStats,
    fame: 5,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 10, losses: 5, kills: 2 },
    champion: false,
    status: "Retired",
    age: 28,
    ...overrides,
  };
}

describe("Trainer System", () => {
  describe("generateHiringPool", () => {
    it("should generate the requested number of trainers", () => {
      const pool = generateHiringPool(5);
      expect(pool).toHaveLength(5);
    });

    it("should generate trainers with valid properties", () => {
      const pool = generateHiringPool(10);
      
      for (const trainer of pool) {
        expect(trainer.id).toBeDefined();
        expect(trainer.name).toBeDefined();
        expect(["Novice", "Seasoned", "Master"]).toContain(trainer.tier);
        expect(["Aggression", "Defense", "Endurance", "Mind", "Healing"]).toContain(trainer.focus);
        expect(trainer.fame).toBeGreaterThanOrEqual(0);
        expect(trainer.contractWeeksLeft).toBe(52);
      }
    });

    it("should generate mostly Novice/Seasoned trainers", () => {
      const pool = generateHiringPool(100, 12345);
      const noviceCount = pool.filter(t => t.tier === "Novice").length;
      const seasonedCount = pool.filter(t => t.tier === "Seasoned").length;
      const masterCount = pool.filter(t => t.tier === "Master").length;
      
      // Expected distribution: ~50% Novice, ~35% Seasoned, ~15% Master
      expect(noviceCount).toBeGreaterThan(masterCount);
      expect(seasonedCount).toBeGreaterThan(masterCount);
    });

    it("should assign fame based on tier", () => {
      const pool = generateHiringPool(100);
      
      for (const trainer of pool) {
        if (trainer.tier === "Master") expect(trainer.fame).toBe(5);
        else if (trainer.tier === "Seasoned") expect(trainer.fame).toBe(3);
        else expect(trainer.fame).toBe(1);
      }
    });

    it("should be deterministic with same seed", () => {
      const pool1 = generateHiringPool(10, 12345);
      const pool2 = generateHiringPool(10, 12345);
      
      expect(pool1.map(t => t.name)).toEqual(pool2.map(t => t.name));
      expect(pool1.map(t => t.tier)).toEqual(pool2.map(t => t.tier));
      expect(pool1.map(t => t.focus)).toEqual(pool2.map(t => t.focus));
    });
  });

  describe("convertRetiredToTrainer", () => {
    it("should map aggressive styles to Aggression focus", () => {
      const warrior = makeWarrior(FightingStyle.BashingAttack);
      const trainer = convertRetiredToTrainer(warrior);
      
      expect(trainer.focus).toBe("Aggression");
    });

    it("should map defensive styles to Defense focus", () => {
      const warrior = makeWarrior(FightingStyle.TotalParry);
      const trainer = convertRetiredToTrainer(warrior);
      
      expect(trainer.focus).toBe("Defense");
    });

    it("should map counter styles to Mind focus", () => {
      const warrior = makeWarrior(FightingStyle.ParryRiposte);
      const trainer = convertRetiredToTrainer(warrior);
      
      expect(trainer.focus).toBe("Mind");
    });

    it("should assign tier based on career stats", () => {
      const novice = makeWarrior(FightingStyle.StrikingAttack, { career: { wins: 3, losses: 2, kills: 0 } });
      const seasoned = makeWarrior(FightingStyle.StrikingAttack, { career: { wins: 8, losses: 4, kills: 1 } });
      const master = makeWarrior(FightingStyle.StrikingAttack, { career: { wins: 20, losses: 10, kills: 5 } });
      
      expect(convertRetiredToTrainer(novice).tier).toBe("Novice");
      expect(convertRetiredToTrainer(seasoned).tier).toBe("Seasoned");
      expect(convertRetiredToTrainer(master).tier).toBe("Master");
    });

    it("should promote to Master with 3+ kills even with low fight count", () => {
      const killer = makeWarrior(FightingStyle.LungingAttack, { career: { wins: 5, losses: 0, kills: 3 } });
      const trainer = convertRetiredToTrainer(killer);
      
      expect(trainer.tier).toBe("Master");
    });

    it("should preserve warrior fame", () => {
      const warrior = makeWarrior(FightingStyle.SlashingAttack, { fame: 15 });
      const trainer = convertRetiredToTrainer(warrior);
      
      expect(trainer.fame).toBe(15);
    });

    it("should set style bonus to warrior's original style", () => {
      const warrior = makeWarrior(FightingStyle.WallOfSteel);
      const trainer = convertRetiredToTrainer(warrior);
      
      expect(trainer.styleBonusStyle).toBe(FightingStyle.WallOfSteel);
    });

    it("should include warrior name in trainer name", () => {
      const warrior = makeWarrior(FightingStyle.AimedBlow, { name: "SNIPER" });
      const trainer = convertRetiredToTrainer(warrior);
      
      expect(trainer.name).toContain("SNIPER");
    });

    it("should set 52-week contract", () => {
      const warrior = makeWarrior(FightingStyle.ParryStrike);
      const trainer = convertRetiredToTrainer(warrior);
      
      expect(trainer.contractWeeksLeft).toBe(52);
    });
  });

  describe("getTrainingBonus", () => {
    it("should return zero bonuses with no trainers", () => {
      const bonus = getTrainingBonus([], FightingStyle.StrikingAttack);
      
      expect(bonus.Aggression).toBe(0);
      expect(bonus.Defense).toBe(0);
      expect(bonus.Endurance).toBe(0);
      expect(bonus.Mind).toBe(0);
      expect(bonus.Healing).toBe(0);
    });

    it("should apply tier bonuses", () => {
      const trainers: Trainer[] = [
        {
          id: "t1",
          name: "Novice Trainer",
          tier: "Novice",
          focus: "Aggression",
          fame: 1,
          contractWeeksLeft: 52,
        },
        {
          id: "t2",
          name: "Master Trainer",
          tier: "Master",
          focus: "Defense",
          fame: 5,
          contractWeeksLeft: 52,
        },
      ];
      
      const bonus = getTrainingBonus(trainers, FightingStyle.StrikingAttack);
      
      expect(bonus.Aggression).toBe(TIER_BONUS.Novice);
      expect(bonus.Defense).toBe(TIER_BONUS.Master);
    });

    it("should ignore expired trainers", () => {
      const trainers: Trainer[] = [
        {
          id: "t1",
          name: "Expired Trainer",
          tier: "Master",
          focus: "Aggression",
          fame: 5,
          contractWeeksLeft: 0,
        },
      ];
      
      const bonus = getTrainingBonus(trainers, FightingStyle.BashingAttack);
      
      expect(bonus.Aggression).toBe(0);
    });

    it("should apply style affinity bonus", () => {
      const trainers: Trainer[] = [
        {
          id: "t1",
          name: "Style Specialist",
          tier: "Novice",
          focus: "Aggression",
          fame: 1,
          contractWeeksLeft: 52,
          styleBonusStyle: FightingStyle.BashingAttack,
        },
      ];
      
      const bonusMatching = getTrainingBonus(trainers, FightingStyle.BashingAttack);
      const bonusNonMatching = getTrainingBonus(trainers, FightingStyle.TotalParry);
      
      expect(bonusMatching.Aggression).toBeGreaterThan(bonusNonMatching.Aggression);
    });

    it("should stack multiple trainers of same focus", () => {
      const trainers: Trainer[] = [
        {
          id: "t1",
          name: "Trainer 1",
          tier: "Seasoned",
          focus: "Mind",
          fame: 3,
          contractWeeksLeft: 52,
        },
        {
          id: "t2",
          name: "Trainer 2",
          tier: "Master",
          focus: "Mind",
          fame: 5,
          contractWeeksLeft: 52,
        },
      ];
      
      const bonus = getTrainingBonus(trainers, FightingStyle.AimedBlow);
      
      expect(bonus.Mind).toBe(TIER_BONUS.Seasoned + TIER_BONUS.Master);
    });
  });

  describe("Trainer constants", () => {
    it("should have correct tier costs", () => {
      expect(TIER_COST.Novice).toBe(50);
      expect(TIER_COST.Seasoned).toBe(100);
      expect(TIER_COST.Master).toBe(200);
    });

    it("should have correct tier bonuses", () => {
      expect(TIER_BONUS.Novice).toBe(1);
      expect(TIER_BONUS.Seasoned).toBe(2);
      expect(TIER_BONUS.Master).toBe(3);
    });
  });
});
