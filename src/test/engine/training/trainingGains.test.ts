import { describe, it, expect } from "vitest";
import {
  computeGainChance,
  processAttributeTraining,
  rollForTrainingInjury,
  processRecovery,
  TOTAL_CAP,
  SEASONAL_CAP_PER_ATTR
} from "@/engine/training/trainingGains";
import { FightingStyle, type Warrior, type GameState, type InjuryData } from "@/types/game";
import { computeWarriorStats } from "@/engine/skillCalc";
import { SeededRNG } from "@/utils/random";

function makeWarrior(attrs: any, overrides?: Partial<Warrior>): Warrior {
  const { baseSkills, derivedStats } = computeWarriorStats(attrs, FightingStyle.StrikingAttack);
  return {
    id: "w1",
    name: "Test",
    style: FightingStyle.StrikingAttack,
    attributes: attrs,
    baseSkills,
    derivedStats,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: "Active",
    age: 20,
    potential: { ST: 18, CN: 18, SZ: 15, WT: 18, WL: 18, SP: 18, DF: 18 },
    ...overrides,
  };
}

describe("trainingGains", () => {
  describe("processAttributeTraining", () => {
    it("should block SZ training", () => {
      const warrior = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 });
      const rng = new SeededRNG(1);
      const res = processAttributeTraining(warrior, "SZ", {} as GameState, [], rng);
      expect(res.result.type).toBe("blocked");
      expect(res.result.message).toMatch(/cannot train Size/);
    });

    it("should hard cap training if at ATTRIBUTE_MAX", () => {
      const warrior = makeWarrior({ ST: 20, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 });
      const rng = new SeededRNG(1);
      const res = processAttributeTraining(warrior, "ST", {} as GameState, [], rng);
      expect(res.hardCapped).toBe(true);
    });

    it("should block if reaching seasonal cap", () => {
      const warrior = makeWarrior({ ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 });
      const state = { season: "Spring" } as GameState;
      const seasonalGrowth = [{ warriorId: "w1", season: "Spring", gains: { ST: SEASONAL_CAP_PER_ATTR } as any }];
      const rng = new SeededRNG(1);
      const res = processAttributeTraining(warrior, "ST", state, seasonalGrowth, rng);
      expect(res.result.type).toBe("blocked");
      expect(res.result.message).toMatch(/has reached the seasonal cap/);
    });

    it("should reveal potential on failed roll occasionally", () => {
      const warrior = makeWarrior({ ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 }, { potentialRevealed: {} });
      const state = { season: "Spring", trainers: [] } as any;
      // We need a specific seed where gain roll fails but reveal roll succeeds (0.2 chance)
      let foundSeed = -1;
      for (let i = 0; i < 1000; i++) {
        const r = new SeededRNG(i);
        const gainRoll = r.chance(0.55); // approx base chance
        const revealRoll = r.chance(0.20);
        if (!gainRoll && revealRoll) {
          foundSeed = i;
          break;
        }
      }
      const rng = new SeededRNG(foundSeed);
      const res = processAttributeTraining(warrior, "ST", state, [], rng);
      expect(res.result.type).toBe("gain");
      expect(res.result.message).toMatch(/true potential in it was revealed/);
      expect(res.updatedWarrior?.potentialRevealed?.ST).toBe(true);
    });
  });

  describe("rollForTrainingInjury", () => {
    it("should occasionally cause injury", () => {
      const warrior = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 });
      let gotInjury = false;
      for (let i = 0; i < 100; i++) {
        const rng = new SeededRNG(i);
        const res = rollForTrainingInjury(warrior, 0, rng);
        if (res.injury) {
          gotInjury = true;
          expect(res.result?.type).toBe("injury");
          break;
        }
      }
      expect(gotInjury).toBe(true);
    });

    it("should return null if no injury", () => {
      const warrior = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 });
      let noInjury = false;
      for (let i = 0; i < 100; i++) {
        const rng = new SeededRNG(i);
        const res = rollForTrainingInjury(warrior, 0, rng);
        if (!res.injury) {
          noInjury = true;
          break;
        }
      }
      expect(noInjury).toBe(true);
    });
  });

  describe("processRecovery", () => {
    it("should return no-op message if no injuries", () => {
      const warrior = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 });
      const res = processRecovery(warrior, 0);
      expect(res.updatedInjuries).toHaveLength(0);
      expect(res.message).toMatch(/no injuries to heal/);
    });

    it("should reduce weeks remaining", () => {
      const warrior = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 }, {
        injuries: [{ id: "i1", name: "Cut", description: "O", severity: "Minor", weeksRemaining: 3, penalties: {} }]
      });
      const res = processRecovery(warrior, 1);
      expect(res.updatedInjuries).toHaveLength(1);
      expect((res.updatedInjuries[0] as InjuryData).weeksRemaining).toBe(1);
    });

    it("should clear injury if weeks drop to 0", () => {
      const warrior = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 }, {
        injuries: [{ id: "i1", name: "Cut", description: "O", severity: "Minor", weeksRemaining: 1, penalties: {} }]
      });
      const res = processRecovery(warrior, 0);
      expect(res.updatedInjuries).toHaveLength(0);
    });
  });
});

  describe("processAttributeTraining - successful gain", () => {
    it("should process attribute gain correctly", () => {
      const warrior = makeWarrior({ ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 });
      const state = { season: "Spring", trainers: [] } as any;

      // we need rng to succeed the chance(gainChance) roll. 0 returns true for chance()
      const rng = new SeededRNG(1);
      rng.chance = () => true;

      const res = processAttributeTraining(warrior, "ST", state, [], rng);
      expect(res.result.type).toBe("gain");
      expect(res.updatedWarrior?.attributes.ST).toBe(11);
      expect(res.updatedSeasonalGrowth?.[0]?.gains.ST).toBe(1);
    });

    it("should reveal true potential if near ceiling", () => {
      const warrior = makeWarrior({ ST: 17, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 }, {
        potential: { ST: 18, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 }
      });
      const state = { season: "Spring", trainers: [] } as any;
      const rng = new SeededRNG(1);
      rng.chance = () => true;

      const res = processAttributeTraining(warrior, "ST", state, [], rng);
      expect(res.updatedWarrior?.potentialRevealed?.ST).toBe(true);
      expect(res.result.message).toMatch(/reached potential ceiling/);
    });
  });
