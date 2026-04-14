
import type { GameState, Warrior, TournamentEntry } from '@/types/state.types';
import { SeededRNG } from '@/utils/random';
import { PatronTokenService } from '@/engine/tokens/patronTokenService';
import { findWarriorById } from './utils';

export function awardTournamentPrizes(tournament: TournamentEntry, state: GameState): GameState {
  const bracket = tournament.bracket;
  const finals = bracket.find(b => b.round === 6 && b.matchIndex === 0);
  const bronze = bracket.find(b => b.round === 6 && b.matchIndex === 1);

  if (!finals) return state;

  const first = finals.winner === "A" ? finals.warriorIdA : finals.warriorIdD;
  const second = finals.winner === "A" ? finals.warriorIdD : finals.warriorIdA;
  const third = bronze ? (bronze.winner === "A" ? bronze.warriorIdA : bronze.warriorIdD) : undefined;

  let updatedState = { ...state };
  const tierRaw = (tournament.tierId || tournament.id.split('-')[1] || "Iron").toUpperCase();
  const tier = tierRaw.includes("GOLD") ? "GOLD" : tierRaw.includes("SILVER") ? "SILVER" : tierRaw.includes("BRONZE") ? "BRONZE" : "IRON";
  const basePurse = tier === "GOLD" ? 5000 : tier === "SILVER" ? 2500 : tier === "BRONZE" ? 1200 : 600;
  const awardRng = new SeededRNG(tournament.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));

  const award = (warriorId: string, place: 1 | 2 | 3, awardRng: SeededRNG) => {
    const w = findWarriorById(updatedState, warriorId, tournament);
    if (!w) return;

    const isPlayer = w.stableId === updatedState.player.id;
    const purseMult = place === 1 ? 1.0 : place === 2 ? 0.5 : 0.25;
    const prizeGold = Math.floor(basePurse * purseMult);
    const prizeFame = place === 1 ? 100 : place === 2 ? 50 : 25;

    // 1. Update Carrier Medals
    updatedState = modifyWarrior(updatedState, w.id, (draft) => {
      if (!draft.career.medals) draft.career.medals = { gold: 0, silver: 0, bronze: 0 };
      if (place === 1) draft.career.medals.gold++;
      if (place === 2) draft.career.medals.silver++;
      if (place === 3) draft.career.medals.bronze++;
      draft.fame = (draft.fame || 0) + prizeFame;
    });

    // 2. Financials & Specific Rewards
    if (isPlayer) {
      updatedState.treasury += prizeGold;
      updatedState.ledger.push({
        id: awardRng.uuid("ledger"),
        week: updatedState.week,
        label: `${tournament.name} (${place}${place === 1 ? 'st' : place === 2 ? 'nd' : 'rd'})`,
        amount: prizeGold,
        category: "prize"
      });
      updatedState.fame = (updatedState.fame || 0) + prizeFame;
      updatedState.player = { ...updatedState.player, fame: (updatedState.player.fame || 0) + prizeFame };

      if (place === 1) {
        updatedState.rosterBonus = (updatedState.rosterBonus || 0) + 1;
        updatedState = PatronTokenService.awardToken(updatedState, "Style", `${tournament.name} (🥇)`, awardRng);
      } else if (place === 2) {
        updatedState = PatronTokenService.awardToken(updatedState, "Weapon", `${tournament.name} (🥈)`, awardRng);
      } else if (place === 3) {
        updatedState = PatronTokenService.awardToken(updatedState, "Rhythm", `${tournament.name} (🥉)`, awardRng);
      }
    } else {
      // Rival reward logic
      updatedState.rivals = updatedState.rivals.map(r =>
        r.owner.id === w.stableId ? { ...r, treasury: r.treasury + prizeGold, fame: (r.fame || 0) + prizeFame } : r
      );
    }
  };

  award(first, 1, awardRng);
  award(second, 2, awardRng);
  if (third) award(third, 3, awardRng);

  return updatedState;
}

export function modifyWarrior(state: GameState, warriorId: string, transform: (w: Warrior) => void): GameState {
  const updatedState = { ...state };
  let found = false;

  updatedState.roster = updatedState.roster.map(w => {
    if (w.id === warriorId) { found = true; const draft = { ...w }; transform(draft); return draft; }
    return w;
  });

  if (!found) {
    updatedState.rivals = updatedState.rivals.map(r => ({
      ...r,
      roster: r.roster.map(w => {
        if (w.id === warriorId) { const draft = { ...w }; transform(draft); return draft; }
        return w;
      })
    }));
  }

  return updatedState;
}
