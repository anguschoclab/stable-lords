import { type GameState, type AnnualAward, type RivalStableData } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { FightingStyle, type WarriorId, type StableId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { StateImpact } from '@/engine/impacts';

export function processHallOfFame(
  state: GameState,
  newWeek: number,
  rng?: IRNGService
): StateImpact {
  const rngService = rng || new SeededRNGService(state.year * 777);
  if (state.week !== 1 || state.year === 1) return {};

  const prevYear = state.year - 1;
  const hofNews: string[] = [];
  const rosterUpdates = new Map<WarriorId, Partial<Warrior>>();
  const rivalsUpdates = new Map<StableId, Partial<RivalStableData>>();
  const awards: AnnualAward[] = [];

  interface WarriorStats {
    w: Warrior;
    wins: number;
    kills: number;
    fame: number;
  }
  const eligible: WarriorStats[] = [];

  const collect = (w: Warrior) => {
    const snapshot = w.yearlySnapshots?.[prevYear] || { wins: 0, losses: 0, kills: 0, fame: 0 };
    const wins = (w.career?.wins || 0) - (snapshot.wins || 0);
    const kills = (w.career?.kills || 0) - (snapshot.kills || 0);
    const fameGain = (w.fame || 0) - (snapshot.fame || 0);
    eligible.push({
      w,
      wins: Math.max(0, wins),
      kills: Math.max(0, kills),
      fame: Math.max(0, fameGain),
    });
  };

  state.roster.forEach(collect);
  state.rivals.forEach((r) => r.roster.forEach(collect));

  if (eligible.length === 0) return {};

  const woty = eligible.reduce(
    (max, curr) =>
      curr.wins > max.wins || (curr.wins === max.wins && curr.fame > max.fame) ? curr : max,
    eligible[0]
  );
  if (woty && woty.wins > 0) {
    const award: AnnualAward = {
      year: prevYear,
      type: 'WARRIOR_OF_YEAR',
      warriorId: woty.w.id,
      warriorName: woty.w.name,
      stableId: woty.w.stableId,
      value: woty.wins,
      reason: `Recorded ${woty.wins} victories in Year ${prevYear}`,
    };
    const { updatedWarrior } = applyAward(woty.w, award, 50);
    if (woty.w.stableId === state.player.id) {
      rosterUpdates.set(woty.w.id, updatedWarrior);
    } else if (woty.w.stableId) {
      const stableId = woty.w.stableId;
      const existingRoster = rivalsUpdates.get(stableId)?.roster || [];
      const updatedRoster = existingRoster.map((w: Warrior) =>
        w.id === woty.w.id ? updatedWarrior : w
      );
      if (!existingRoster.find((w: Warrior) => w.id === woty.w.id)) {
        updatedRoster.push(updatedWarrior);
      }
      rivalsUpdates.set(stableId, { roster: updatedRoster });
    }
    awards.push(award);
    hofNews.push(
      `🏛️ WARRIOR OF THE YEAR: ${woty.w.name} is the champion of Year ${prevYear} with ${woty.wins} wins!`
    );
  }

  const koty = eligible.reduce(
    (max, curr) =>
      curr.kills > max.kills || (curr.kills === max.kills && curr.wins > max.wins) ? curr : max,
    eligible[0]
  );
  if (koty && koty.kills > 0) {
    const award: AnnualAward = {
      year: prevYear,
      type: 'KILLER_OF_YEAR',
      warriorId: koty.w.id,
      warriorName: koty.w.name,
      stableId: koty.w.stableId,
      value: koty.kills,
      reason: `Claimed ${koty.kills} lives in Year ${prevYear}`,
    };
    const { updatedWarrior } = applyAward(koty.w, award, 50);
    if (koty.w.stableId === state.player.id) {
      rosterUpdates.set(koty.w.id, updatedWarrior);
    } else if (koty.w.stableId) {
      const existingRoster = rivalsUpdates.get(koty.w.stableId)?.roster || [];
      const updatedRoster = existingRoster.map((w) => (w.id === koty.w.id ? updatedWarrior : w));
      if (!existingRoster.find((w) => w.id === koty.w.id)) {
        updatedRoster.push(updatedWarrior);
      }
      rivalsUpdates.set(koty.w.stableId, { roster: updatedRoster });
    }
    awards.push(award);
    hofNews.push(
      `💀 KILLER OF THE YEAR: ${koty.w.name} earned the 'Reaper's Gaze' with ${koty.kills} kills.`
    );
  }

  Object.values(FightingStyle).forEach((style) => {
    const styleEligible = eligible.filter((e) => e.w.style === style);
    const mvp =
      styleEligible.length > 0
        ? styleEligible.reduce((max, curr) =>
            curr.wins > max.wins || (curr.wins === max.wins && curr.fame > max.fame) ? curr : max
          )
        : undefined;
    if (mvp && mvp.wins > 0) {
      const award: AnnualAward = {
        year: prevYear,
        type: 'CLASS_MVP',
        warriorId: mvp.w.id,
        warriorName: mvp.w.name,
        stableId: mvp.w.stableId,
        style,
        value: mvp.wins,
        reason: `Leading ${style} specialist in Year ${prevYear}`,
      };
      const { updatedWarrior } = applyAward(mvp.w, award, 20);
      if (mvp.w.stableId === state.player.id) {
        rosterUpdates.set(mvp.w.id, updatedWarrior);
      } else if (mvp.w.stableId) {
        const existingRoster = rivalsUpdates.get(mvp.w.stableId)?.roster || [];
        const updatedRoster = existingRoster.map((w) => (w.id === mvp.w.id ? updatedWarrior : w));
        if (!existingRoster.find((w) => w.id === mvp.w.id)) {
          updatedRoster.push(updatedWarrior);
        }
        rivalsUpdates.set(mvp.w.stableId, { roster: updatedRoster });
      }
      awards.push(award);
      hofNews.push(
        `⚔️ ${style.toUpperCase()} MVP: ${mvp.w.name} honored as the elite of their class.`
      );
    }
  });

  const impact: StateImpact = {
    awards: [...(state.awards || []), ...awards],
    rosterUpdates,
    rivalsUpdates,
  };

  if (hofNews.length > 0) {
    impact.newsletterItems = [
      {
        id: rngService.uuid(),
        week: newWeek,
        title: 'Hall of Fame Inductions',
        items: hofNews,
      },
    ];
  }

  return impact;
}

function applyAward(
  warrior: Warrior,
  award: AnnualAward,
  fameBonus: number
): { updatedWarrior: Warrior } {
  const updatedWarrior = {
    ...warrior,
    fame: (warrior.fame || 0) + fameBonus,
    flair: [...(warrior.flair || []), award.type],
  };

  return { updatedWarrior };
}

function createYearlySnapshots(state: GameState): StateImpact {
  const currentYear = state.year;
  const rosterUpdates = new Map<WarriorId, Partial<Warrior>>();
  const rivalsUpdates = new Map<StableId, Partial<RivalStableData>>();

  state.roster.forEach((w: Warrior) => {
    const career = w.career || { wins: 0, losses: 0, kills: 0 };
    rosterUpdates.set(w.id, {
      yearlySnapshots: {
        ...(w.yearlySnapshots || {}),
        [currentYear]: { ...career, fame: w.fame || 0 },
      },
    });
  });

  state.rivals.forEach((r) => {
    const updatedRoster = r.roster.map((w: Warrior) => {
      const career = w.career || { wins: 0, losses: 0, kills: 0 };
      return {
        ...w,
        yearlySnapshots: {
          ...(w.yearlySnapshots || {}),
          [currentYear]: { ...career, fame: w.fame || 0 },
        },
      };
    });
    rivalsUpdates.set(r.id, { roster: updatedRoster });
  });

  return { rosterUpdates, rivalsUpdates };
}
