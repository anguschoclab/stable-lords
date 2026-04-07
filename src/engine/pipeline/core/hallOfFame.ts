import type { GameState, AnnualAward } from "@/types/state.types";
import type { Warrior } from "@/types/warrior.types";
import { FightingStyle } from "@/types/shared.types";
import { SeededRNG } from "@/utils/random";

export function processHallOfFame(state: GameState, newWeek: number): GameState {
  // Only process at the transition from Week 52 -> Week 1 (Year rollover)
  // Since advanceWeek already updated week/year, we check if we are at Week 1 and Year > 1
  if (state.week !== 1 || state.year === 1) return state;

  const prevYear = state.year - 1;
  const hofNews: string[] = [];
  const rng = new SeededRNG(state.year * 777);
  let updatedState = { ...state };

  interface WarriorStats { w: Warrior; wins: number; kills: number; fame: number; }
  const eligible: WarriorStats[] = [];

  const collect = (w: Warrior) => {
    const snapshot = w.yearlySnapshots?.[prevYear] || { wins: 0, losses: 0, kills: 0 };
    const wins = (w.career?.wins || 0) - (snapshot.wins || 0);
    const kills = (w.career?.kills || 0) - (snapshot.kills || 0);
    const fameGain = (w.fame || 0) - (snapshot.fame || 0); 
    eligible.push({ w, wins: Math.max(0, wins), kills: Math.max(0, kills), fame: Math.max(0, fameGain) });
  };

  state.roster.forEach(collect);
  state.rivals.forEach(r => r.roster.forEach(collect));

  if (eligible.length === 0) return state;

  // 1. Warrior of the Year (Most Wins delta)
  const woty = [...eligible].sort((a, b) => b.wins - a.wins || b.fame - a.fame)[0];
  if (woty && woty.wins > 0) {
    const award: AnnualAward = {
      year: prevYear,
      type: "WARRIOR_OF_YEAR",
      warriorId: woty.w.id,
      warriorName: woty.w.name,
      stableId: woty.w.stableId,
      value: woty.wins,
      reason: `Recorded ${woty.wins} victories in Year ${prevYear}`
    };
    updatedState = applyAward(updatedState, award, 50);
    hofNews.push(`🏛️ WARRIOR OF THE YEAR: ${woty.w.name} is the champion of Year ${prevYear} with ${woty.wins} wins!`);
  }

  // 2. Killer of the Year (Most Kills delta)
  const koty = [...eligible].sort((a, b) => b.kills - a.kills || b.wins - a.wins)[0];
  if (koty && koty.kills > 0) {
    const award: AnnualAward = {
      year: prevYear,
      type: "KILLER_OF_YEAR",
      warriorId: koty.w.id,
      warriorName: koty.w.name,
      stableId: koty.w.stableId,
      value: koty.kills,
      reason: `Claimed ${koty.kills} lives in Year ${prevYear}`
    };
    updatedState = applyAward(updatedState, award, 50);
    hofNews.push(`💀 KILLER OF THE YEAR: ${koty.w.name} earned the 'Reaper's Gaze' with ${koty.kills} kills.`);
  }

  // 3. Class MVPs (10 Styles)
  Object.values(FightingStyle).forEach(style => {
    const styleEligible = eligible.filter(e => e.w.style === style);
    const mvp = styleEligible.sort((a, b) => b.wins - a.wins || b.fame - a.fame)[0];
    if (mvp && mvp.wins > 0) {
      const award: AnnualAward = {
        year: prevYear,
        type: "CLASS_MVP",
        warriorId: mvp.w.id,
        warriorName: mvp.w.name,
        stableId: mvp.w.stableId,
        style,
        value: mvp.wins,
        reason: `Leading ${style} specialist in Year ${prevYear}`
      };
      updatedState = applyAward(updatedState, award, 20);
      hofNews.push(`⚔️ ${style.toUpperCase()} MVP: ${mvp.w.name} honored as the elite of their class.`);
    }
  });

  // 4. Stable of the Year
  const stableStats = new Map<string, { name: string; wins: number; fame: number }>();
  const addStable = (id: string, name: string, wins: number, fame: number) => {
    const s = stableStats.get(id) || { name, wins: 0, fame: 0 };
    s.wins += wins;
    s.fame += fame;
    stableStats.set(id, s);
  };

  eligible.forEach(e => {
    if (e.w.stableId) {
      const stableName = e.w.stableId === state.player.id ? state.player.stableName : state.rivals.find(r => r.owner.id === e.w.stableId)?.owner.stableName || "Unknown";
      addStable(e.w.stableId, stableName, e.wins, e.fame);
    }
  });

  const bestStable = [...stableStats.entries()].sort((a, b) => b[1].wins - a[1].wins || b[1].fame - a[1].fame)[0];
  if (bestStable && bestStable[1].wins > 0) {
    const award: AnnualAward = {
      year: prevYear,
      type: "STABLE_OF_YEAR",
      stableId: bestStable[0],
      stableName: bestStable[1].name,
      value: bestStable[1].wins,
      reason: `Winningest stable of Year ${prevYear} with ${bestStable[1].wins} total victories.`
    };
    updatedState = applyAward(updatedState, award, 50);
    hofNews.push(`🏟️ STABLE OF THE YEAR: ${bestStable[1].name} dominated the arenas of Year ${prevYear}.`);
  }

  // 5. Cleanup: Create new snapshots for all warriors for the new year
  updatedState = createYearlySnapshots(updatedState);

  if (hofNews.length === 0) return updatedState;

  return { 
    ...updatedState, 
    newsletter: [
      ...updatedState.newsletter, 
      { id: rng.uuid("newsletter"), week: 1, title: `Year ${prevYear} Global Accolades`, items: hofNews }
    ] 
  };
}

function applyAward(state: GameState, award: AnnualAward, fameBonus: number): GameState {
  let updatedState = { 
    ...state, 
    awards: [...(state.awards || []), award] 
  };
  const wId = award.warriorId;
  const sId = award.stableId;

  if (wId) {
    updatedState = {
      ...updatedState,
      roster: updatedState.roster.map(w => w.id === wId ? { ...w, fame: (w.fame || 0) + fameBonus, awards: [...(w.awards || []), award] } : w),
      rivals: updatedState.rivals.map(r => ({
        ...r,
        roster: r.roster.map(w => w.id === wId ? { ...w, fame: (w.fame || 0) + fameBonus, awards: [...(w.awards || []), award] } : w)
      }))
    };
  }

  if (sId) {
    if (sId === state.player.id) {
      updatedState = { 
        ...updatedState, 
        fame: (updatedState.fame || 0) + fameBonus,
        player: { ...updatedState.player, fame: (updatedState.player.fame || 0) + fameBonus }
      };
    } else {
      updatedState = {
        ...updatedState,
        rivals: updatedState.rivals.map(r => r.owner.id === sId ? { ...r, fame: (r.fame || 0) + fameBonus } : r)
      };
    }
  }

  return updatedState;
}

function createYearlySnapshots(state: GameState): GameState {
  const currentYear = state.year;
  const snap = (w: Warrior): Warrior => {
    const career = w.career || { wins: 0, losses: 0, kills: 0 };
    return {
      ...w,
      yearlySnapshots: {
        ...(w.yearlySnapshots || {}),
        [currentYear]: { ...career, fame: w.fame || 0 }
      }
    };
  };

  return {
    ...state,
    roster: state.roster.map(snap),
    rivals: state.rivals.map(r => ({ ...r, roster: r.roster.map(snap) }))
  };
}
