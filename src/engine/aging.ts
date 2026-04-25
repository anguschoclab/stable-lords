/**
 * Aging System — warriors age each week and may face forced retirement at old age.
 *
 * - Warriors age +1 year every 52 weeks (1 game year)
 * - At age 30+, each week there's a growing chance of forced retirement
 * - At age 40, forced retirement is guaranteed
 * - Aging penalties apply to SP and DF after age 28
 */
import type { GameState, RivalStableData } from '@/types/state.types';
import type { Warrior, WarriorStatus } from '@/types/warrior.types';
import { computeWarriorStats } from './skillCalc';

const WEEKS_PER_YEAR = 52;
const AGING_PENALTY_START = 25;
// Retirement window tuned 2026-04 against measured ~17 bouts/warrior/year and
// ~6% per-bout kill rate (lifespan ~0.7y in calendar terms even after lethality
// halving). Pulling MIN to 26 / MAX to 32 lets a 5-7 calendar-year career
// reach the retirement curve, restoring the generational turnover that the
// 25-year stress test was missing entirely.
const FORCED_RETIRE_MIN = 26;
const FORCED_RETIRE_MAX = 32;

import { type StateImpact } from './impacts';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';

/** Compute the aging impact of the current week. */
export function computeAgingImpact(state: GameState, rng: IRNGService): StateImpact {
  const ageEvents: string[] = [];
  const rosterUpdates = new Map<string, Partial<Warrior>>();
  const rivalsUpdates = new Map<string, Partial<RivalStableData>>();
  const toRetire: string[] = [];
  const retiredWarriors: Warrior[] = [];

  const allWarriors: { w: Warrior; isPlayer: boolean; rivalId?: string }[] = [];
  state.roster.forEach((w) => allWarriors.push({ w, isPlayer: true }));
  state.rivals.forEach((r) =>
    r.roster.forEach((w) => allWarriors.push({ w, isPlayer: false, rivalId: r.id }))
  );

  const isAgeTick = state.week % WEEKS_PER_YEAR === 0;

  for (const { w, isPlayer, rivalId } of allWarriors) {
    let currentAge = w.age ?? 18;
    let update: Partial<Warrior> = {};

    // 1. Age tick
    if (isAgeTick) {
      currentAge += 1;
      update.age = currentAge;

      if (currentAge > AGING_PENALTY_START) {
        const penalty = Math.floor((currentAge - AGING_PENALTY_START) / 3);
        if (penalty > 0) {
          const newAttrs = {
            ...w.attributes,
            SP: Math.max(3, w.attributes.SP - 1),
            DF: Math.max(3, w.attributes.DF - 1),
          };
          const { baseSkills, derivedStats } = computeWarriorStats(newAttrs, w.style);
          Object.assign(update, { attributes: newAttrs, baseSkills, derivedStats });
          if (isPlayer) ageEvents.push(`${w.name} shows signs of aging (SP/DF declining).`);
        }
      }
    }

    // 2. Forced retirement check
    let retired = false;
    if (currentAge >= FORCED_RETIRE_MAX) {
      retired = true;
      if (isPlayer)
        ageEvents.push(
          `${w.name} (age ${currentAge}) has been forced to retire — too old to fight.`
        );
    } else if (currentAge >= FORCED_RETIRE_MIN) {
      const retireChance =
        ((currentAge - FORCED_RETIRE_MIN) / (FORCED_RETIRE_MAX - FORCED_RETIRE_MIN)) * 0.15;
      if (rng.next() < retireChance) {
        retired = true;
        if (isPlayer)
          ageEvents.push(`${w.name} (age ${currentAge}) has decided to hang up the blade.`);
      }
    }

    if (retired) {
      console.log(`[Aging] Retired: ${w.name} (age ${currentAge}) from ${rivalId || 'Player'}`);
      const retiredObj = {
        ...w,
        age: currentAge,
        status: 'Retired' as any,
        retiredWeek: state.week,
      };
      retiredWarriors.push(retiredObj);
      if (isPlayer) {
        toRetire.push(w.id);
      } else if (rivalId) {
        // Prepare rival update to remove the warrior
        const rivalUpdate = rivalsUpdates.get(rivalId) || {};
        // We can't easily filter here, but we can set a flag or handle it in impacts.ts
        // Actually, StateImpact.rivalsUpdates handles Partial<RivalStableData>.
        // It's better to provide the whole new roster for that rival.
        // But since we are looping over ALL warriors, we should group them by rival first.
      }
    } else if (Object.keys(update).length > 0) {
      if (isPlayer) {
        rosterUpdates.set(w.id, update);
      } else if (rivalId) {
        const rUpdate = rivalsUpdates.get(rivalId) || {
          roster: [...state.rivals.find((r) => r.id === rivalId)!.roster],
        };
        rUpdate.roster = rUpdate.roster!.map((rw) => (rw.id === w.id ? { ...rw, ...update } : rw));
        rivalsUpdates.set(rivalId, rUpdate);
      }
    }
  }

  // Handle rival retirements (filtering out retired ones)
  retiredWarriors.forEach((rw) => {
    if (rw.stableId && rw.stableId !== state.player.id) {
      const rivalId = rw.stableId;
      const currentRival = state.rivals.find((r) => r.id === rivalId);
      if (currentRival) {
        const rUpdate = rivalsUpdates.get(rivalId) || { roster: [...currentRival.roster] };
        rUpdate.roster = rUpdate.roster!.filter((w) => w.id !== rw.id);
        rivalsUpdates.set(rivalId, rUpdate);
      }
    }
  });

  return {
    rosterUpdates,
    rosterRemovals: toRetire,
    rivalsUpdates,
    retired: retiredWarriors,
    newsletterItems:
      ageEvents.length > 0
        ? [{ id: rng.uuid(), week: state.week, title: 'Aging Report', items: ageEvents }]
        : [],
  };
}
