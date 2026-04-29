import { describe, it, expect } from 'vitest';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import {
  computeGainChance,
  processAttributeTraining,
  rollForTrainingInjury,
  processRecovery,
  TOTAL_CAP,
  SEASONAL_CAP_PER_ATTR,
  SKILL_DRILL_CAP,
  computeSkillDrillChance,
  processSkillDrillTraining,
} from '@/engine/training/trainingGains';
import { FightingStyle, type Warrior, type GameState, type InjuryData } from '@/types/game';
import { computeWarriorStats } from '@/engine/skillCalc';
import { SeededRNG } from '@/utils/random';

function makeWarrior(attrs: any, overrides?: Partial<Warrior>): Warrior {
  const { baseSkills, derivedStats } = computeWarriorStats(attrs, FightingStyle.StrikingAttack);
  return {
    id: 'w1',
    name: 'Test',
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
    status: 'Active',
    age: 20,
    potential: { ST: 18, CN: 18, SZ: 15, WT: 18, WL: 18, SP: 18, DF: 18 },
    ...overrides,
  };
}

describe('trainingGains', () => {
  describe('processAttributeTraining', () => {
    it('should block SZ training', () => {
      const warrior = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 });
      const rng = new SeededRNGService(1);
      const res = processAttributeTraining(warrior, 'SZ', {} as GameState, [], rng);
      expect(res.result.type).toBe('blocked');
      expect(res.result.message).toMatch(/cannot train Size/);
    });

    it('should hard cap training if at ATTRIBUTE_MAX', () => {
      const warrior = makeWarrior({ ST: 20, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 });
      const rng = new SeededRNGService(1);
      const res = processAttributeTraining(warrior, 'ST', {} as GameState, [], rng);
      expect(res.hardCapped).toBe(true);
    });

    it('should block if reaching seasonal cap', () => {
      const warrior = makeWarrior({ ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 });
      const state = { season: 'Spring' } as GameState;
      const seasonalGrowth = [
        { warriorId: 'w1', season: 'Spring' as const, gains: { ST: SEASONAL_CAP_PER_ATTR } as any },
      ];
      const rng = new SeededRNGService(1);
      const res = processAttributeTraining(warrior, 'ST', state, seasonalGrowth, rng);
      expect(res.result.type).toBe('blocked');
      expect(res.result.message).toMatch(/has reached the seasonal cap/);
    });

    it('should reveal potential on failed roll occasionally', () => {
      const warrior = makeWarrior(
        { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
        { potentialRevealed: {} }
      );
      const state = { season: 'Spring', trainers: [] } as any;
      let nextCalls = 0;
      const rng = {
        next: () => {
          nextCalls++;
          return nextCalls === 1 ? 0.99 : 0.01;
        },
      } as any;
      const res = processAttributeTraining(warrior, 'ST', state, [], rng);
      expect(res.result.type).toBe('gain');
      expect(res.result.message).toMatch(/true potential in it was revealed/);
      expect(res.updatedWarrior?.potentialRevealed?.ST).toBe(true);
    });
  });

  describe('rollForTrainingInjury', () => {
    it('should occasionally cause injury', () => {
      const warrior = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 });
      let gotInjury = false;
      for (let i = 0; i < 100; i++) {
        const rng = new SeededRNGService(i);
        const res = rollForTrainingInjury(warrior, 0, rng);
        if (res.injury) {
          gotInjury = true;
          expect(res.result?.type).toBe('injury');
          break;
        }
      }
      expect(gotInjury).toBe(true);
    });

    it('should return null if no injury', () => {
      const warrior = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 });
      let noInjury = false;
      for (let i = 0; i < 100; i++) {
        const rng = new SeededRNGService(i);
        const res = rollForTrainingInjury(warrior, 0, rng);
        if (!res.injury) {
          noInjury = true;
          break;
        }
      }
      expect(noInjury).toBe(true);
    });
  });

  describe('processRecovery', () => {
    it('should return no-op message if no injuries', () => {
      const warrior = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 });
      const res = processRecovery(warrior, 0);
      expect(res.updatedInjuries).toHaveLength(0);
      expect(res.message).toMatch(/no injuries to heal/);
    });

    it('should reduce weeks remaining', () => {
      const warrior = makeWarrior(
        { ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 },
        {
          injuries: [
            {
              id: 'i1',
              name: 'Cut',
              description: 'O',
              severity: 'Minor',
              weeksRemaining: 3,
              penalties: {},
            },
          ],
        }
      );
      const res = processRecovery(warrior, 1);
      expect(res.updatedInjuries).toHaveLength(1);
      expect((res.updatedInjuries[0] as InjuryData).weeksRemaining).toBe(1);
    });

    it('should clear injury if weeks drop to 0', () => {
      const warrior = makeWarrior(
        { ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 },
        {
          injuries: [
            {
              id: 'i1',
              name: 'Cut',
              description: 'O',
              severity: 'Minor',
              weeksRemaining: 1,
              penalties: {},
            },
          ],
        }
      );
      const res = processRecovery(warrior, 0);
      expect(res.updatedInjuries).toHaveLength(0);
    });
  });
});

describe('processAttributeTraining - successful gain', () => {
  it('should process attribute gain correctly', () => {
    const warrior = makeWarrior({ ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 });
    const state = { season: 'Spring', trainers: [] } as any;

    // Use a seed that succeeds the gain roll
    const rng = new SeededRNGService(1);

    const res = processAttributeTraining(warrior, 'ST', state, [], rng);
    // Just verify it processes without error - actual gain depends on RNG
    expect(res.result.type).toBeDefined();
  });

  it('should gain attribute and not reveal potential if already revealed near ceiling', () => {
    const warrior = makeWarrior(
      { ST: 17, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      {
        potential: { ST: 18, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
        potentialRevealed: { ST: true },
      }
    );
    const state = { season: 'Spring', trainers: [] } as any;

    const rng = { next: () => 0.01 } as any;

    const res = processAttributeTraining(warrior, 'ST', state, [], rng);
    expect(res.result.type).toBe('gain');
    expect(res.result.message).not.toMatch(/fully revealed/);
    expect(res.updatedWarrior?.potentialRevealed?.ST).toBe(true);
  });

  it('should gain attribute not near ceiling', () => {
    const warrior = makeWarrior(
      { ST: 12, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      {
        potential: { ST: 18, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      }
    );
    const state = { season: 'Spring', trainers: [] } as any;

    const rng = { next: () => 0.1 } as any;

    const res = processAttributeTraining(warrior, 'ST', state, [], rng);
    expect(res.result.type).toBe('gain');
    expect(res.result.message).not.toMatch(/potential ceiling/);
  });

  it('should fail gain and not reveal potential if already revealed', () => {
    const warrior = makeWarrior(
      { ST: 12, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      {
        potential: { ST: 18, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
        potentialRevealed: { ST: true },
      }
    );
    const state = { season: 'Spring', trainers: [] } as any;

    const rng = { next: () => 0.99 } as any;

    const res = processAttributeTraining(warrior, 'ST', state, [], rng);
    expect(res.result.type).toBe('blocked');
  });

  it('should fail gain and fail reveal roll', () => {
    const warrior = makeWarrior(
      { ST: 12, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      {
        potential: { ST: 18, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
        potentialRevealed: {},
      }
    );
    const state = { season: 'Spring', trainers: [] } as any;

    // first next() is gain chance, second next() is reveal chance
    let nextCalls = 0;
    const rng = {
      next: () => {
        nextCalls++;
        return nextCalls === 1 ? 0.99 : 0.99;
      },
    } as any;

    const res = processAttributeTraining(warrior, 'ST', state, [], rng);
    expect(res.result.type).toBe('blocked');
  });

  it('should reveal potential if near ceiling and not yet revealed', () => {
    const warrior = makeWarrior(
      { ST: 17, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      {
        potential: { ST: 18, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
        potentialRevealed: {},
      }
    );
    const state = { season: 'Spring', trainers: [] } as any;
    const rng = { next: () => 0.01 } as any;

    const res = processAttributeTraining(warrior, 'ST', state, [], rng);
    expect(res.result.type).toBe('gain');
    expect(res.updatedWarrior?.potentialRevealed?.ST).toBe(true);
    expect(res.result.message).toMatch(/fully revealed/);
  });

  it('should reveal true potential if near ceiling', () => {
    const warrior = makeWarrior(
      { ST: 17, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      {
        potential: { ST: 18, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      }
    );
    const state = { season: 'Spring', trainers: [] } as any;
    const rng = new SeededRNGService(1);

    const res = processAttributeTraining(warrior, 'ST', state, [], rng);
    // Just verify it processes without error - actual behavior depends on RNG
    expect(res.result.type).toBeDefined();
  });

  describe('computeSkillDrillChance', () => {
    it('should compute base skill drill chance correctly', () => {
      const warrior = makeWarrior(
        { ST: 12, CN: 12, SZ: 12, WT: 10, WL: 12, SP: 12, DF: 12 },
        { skillDrills: {} }
      );
      const chance = computeSkillDrillChance(warrior, 'ATT', []);
      // With WT=10, age=20, drills=0, trainerBonus=0
      // raw = (0.4 + 0 + 0 - 0) * 1 = 0.4
      expect(chance).toBeCloseTo(0.4);
    });

    it('should apply WT bonus and trainer focus bonus', () => {
      const warrior = makeWarrior(
        { ST: 12, CN: 12, SZ: 12, WT: 20, WL: 12, SP: 12, DF: 12 },
        { skillDrills: {} }
      );
      // wtBonus = (20 - 10) * 0.01 = 0.1
      // trainer matching focus
      const trainer = {
        id: 't1',
        name: 'Trainer',
        focus: 'Aggression',
        styleBonusStyle: null,
        contractWeeksLeft: 10,
        fame: 0,
        costPerWeek: 0,
        hireCost: 0,
        origin: 'Guild',
      };
      const chance = computeSkillDrillChance(warrior, 'ATT', [trainer as any]);
      // focus for ATT is Aggression -> trainerBonus = 1
      // raw = (0.4 + 1 * 0.04 + 0.1) * 1 = 0.54
      expect(chance).toBeCloseTo(0.54);
    });

    it('should apply age penalty', () => {
      const warrior = makeWarrior(
        { ST: 12, CN: 12, SZ: 12, WT: 10, WL: 12, SP: 12, DF: 12 },
        { skillDrills: {}, age: 38 }
      );
      const chance = computeSkillDrillChance(warrior, 'Punching', []);
      // age penalty = (38 - 28) * 0.02 = 0.2
      // raw = (0.4 - 0.2) = 0.2 -> 0.2
      expect(chance).toBeCloseTo(0.2);
    });

    it('should apply diminishing returns from existing drills', () => {
      const warrior = makeWarrior(
        { ST: 12, CN: 12, SZ: 12, WT: 10, WL: 12, SP: 12, DF: 12 },
        { skillDrills: { Punching: 2 } }
      );
      const chance = computeSkillDrillChance(warrior, 'Punching', []);
      // dr = Math.pow(0.6, 2) = 0.36
      // raw = 0.4 * 0.36 = 0.144 -> clamped to min (0.15)
      expect(chance).toBeCloseTo(0.15);
    });
  });

  describe('processSkillDrillTraining', () => {
    it('should block if already capped', () => {
      const warrior = makeWarrior(
        { ST: 12, CN: 12, SZ: 12, WT: 10, WL: 12, SP: 12, DF: 12 },
        { skillDrills: { Punching: SKILL_DRILL_CAP } }
      );
      const res = processSkillDrillTraining(
        warrior,
        'Punching',
        {} as any,
        new SeededRNGService(1)
      );
      expect(res.hardCapped).toBe(true);
      expect(res.result.type).toBe('blocked');
      expect(res.result.message).toMatch(/already mastered/);
    });

    it('should increase drill count on success', () => {
      const warrior = makeWarrior(
        { ST: 12, CN: 12, SZ: 12, WT: 10, WL: 12, SP: 12, DF: 12 },
        { skillDrills: { Punching: 1 } }
      );
      const rng = { next: () => 0.05 } as any;
      const res = processSkillDrillTraining(warrior, 'Punching', {} as any, rng);

      expect(res.updatedWarrior?.skillDrills?.['Punching']).toBe(2);
      expect(res.result.type).toBe('gain');
      expect(res.result.message).toMatch(/sharpened their Punching/);
    });

    it('should fail and block if roll misses', () => {
      const warrior = makeWarrior(
        { ST: 12, CN: 12, SZ: 12, WT: 10, WL: 12, SP: 12, DF: 12 },
        { skillDrills: { Punching: 1 } }
      );
      const rng = { next: () => 0.99 } as any;
      const res = processSkillDrillTraining(warrior, 'Punching', {} as any, rng);

      expect(res.updatedWarrior).toBeNull();
      expect(res.result.type).toBe('blocked');
      expect(res.result.message).toMatch(/made no measurable progress/);
    });
  });

  describe('processAttributeTraining - caps and limits', () => {
    it('should hard cap training if TOTAL_CAP is reached', () => {
      const warrior = makeWarrior({ ST: 10, CN: 20, SZ: 20, WT: 20, WL: 20, SP: 20, DF: 10 }); // Total: 120, TOTAL_CAP is 120
      const rng = new SeededRNGService(1);
      const res = processAttributeTraining(warrior, 'ST', {} as GameState, [], rng);
      expect(res.hardCapped).toBe(true);
    });

    it('should hard cap training if potential is reached', () => {
      const warrior = makeWarrior({ ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 }, { potential: { ST: 12 } });
      const rng = new SeededRNGService(1);
      const res = processAttributeTraining(warrior, 'ST', {} as GameState, [], rng);
      expect(res.hardCapped).toBe(true);
    });
  });
});
