/**
 * Stable Reputation System — computes Fame, Notoriety, Honor, Adaptability.
 * Per Design Bible v3.0 §9.2
 */
import type { GameState, Warrior, FightSummary } from "@/types/game";

export interface StableReputation {
  fame: number;       // 0-100: public acclaim
  notoriety: number;  // 0-100: feared reputation
  honor: number;      // 0-100: moral standing
  adaptability: number; // 0-100: strategic responsiveness
}

/**
 * Compute stable reputation from current game state.
 * Fame = average top-5 warrior fame + gazette mentions
 * Notoriety = kills * 2 + fatal finishers * 3 + rival kills * 5
 * Honor = base 50 + yields - dishonorable acts
 * Adaptability = style diversity + meta drift participation
 */
export function computeStableReputation(state: GameState): StableReputation {
  const roster = state.roster.filter(w => w.status === "Active");

  // ── Fame ──
  const topFame = [...roster].sort((a, b) => b.fame - a.fame).slice(0, 5);
  const avgFame = topFame.length > 0
    ? topFame.reduce((s, w) => s + w.fame, 0) / topFame.length
    : 0;
  const gazetteMentions = state.newsletter.filter(n =>
    n.items.some(item => item.includes(state.player.stableName))
  ).length;
  const fame = Math.min(100, Math.round(avgFame * 3 + gazetteMentions * 0.5 + (state.fame ?? 0)));

  // ── Notoriety ──
  const totalKills = roster.reduce((s, w) => s + w.career.kills, 0);
  const graveyardKills = state.graveyard.reduce((s, w) => s + w.career.kills, 0);
  const killBouts = state.arenaHistory.filter(f => f.by === "Kill").length;
  const notorietyRaw = (totalKills + graveyardKills) * 2 + killBouts * 1;
  const notoriety = Math.min(100, Math.round(notorietyRaw * 2));

  // ── Honor ──
  // Base 50, reduced by kills, boosted by clean bouts
  const cleanBouts = state.arenaHistory.filter(f =>
    f.by !== "Kill" && f.winner !== null
  ).length;
  const honorRaw = 50 + cleanBouts * 0.5 - totalKills * 3;
  const honor = Math.min(100, Math.max(0, Math.round(honorRaw)));

  // ── Adaptability ──
  // Style diversity among roster + training activity
  const uniqueStyles = new Set(roster.map(w => w.style)).size;
  const trainingCount = (state.trainingAssignments ?? []).length;
  const adaptRaw = uniqueStyles * 8 + trainingCount * 3 + (state.trainers?.length ?? 0) * 2;
  const adaptability = Math.min(100, Math.round(adaptRaw));

  return { fame, notoriety, honor, adaptability };
}

/**
 * Compute a rival stable's reputation from its data.
 */
export function computeRivalReputation(
  roster: Warrior[],
  arenaHistory: FightSummary[],
  stableName: string
): StableReputation {
  const active = roster.filter(w => w.status === "Active");

  const topFame = [...active].sort((a, b) => b.fame - a.fame).slice(0, 5);
  const avgFame = topFame.length > 0
    ? topFame.reduce((s, w) => s + w.fame, 0) / topFame.length
    : 0;
  const fame = Math.min(100, Math.round(avgFame * 3));

  const totalKills = roster.reduce((s, w) => s + w.career.kills, 0);
  const notoriety = Math.min(100, Math.round(totalKills * 4));

  const cleanBouts = roster.reduce((s, w) => s + w.career.wins + w.career.losses, 0) - totalKills;
  const honor = Math.min(100, Math.max(0, Math.round(50 + cleanBouts * 0.3 - totalKills * 3)));

  const uniqueStyles = new Set(active.map(w => w.style)).size;
  const adaptability = Math.min(100, Math.round(uniqueStyles * 10));

  return { fame, notoriety, honor, adaptability };
}
