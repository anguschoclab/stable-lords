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
  let totalKills = 0;
  let graveyardKills = 0;
  const uniqueStyles = new Set<string>();
  const activeWarriors: Warrior[] = [];

  // ⚡ Bolt: Single pass over roster to collect active warriors, total kills, and unique styles
  for (let i = 0; i < state.roster.length; i++) {
    const w = state.roster[i];
    if (w.status === "Active") {
      activeWarriors.push(w);
      uniqueStyles.add(w.style);
      totalKills += w.career?.kills || 0;
    }
  }

  // ⚡ Bolt: Single pass over graveyard to collect kills
  for (let i = 0; i < state.graveyard.length; i++) {
    graveyardKills += state.graveyard[i].career?.kills || 0;
  }

  let killBouts = 0;
  let cleanBouts = 0;

  // ⚡ Bolt: Single pass over arena history to collect bout stats
  for (let i = 0; i < state.arenaHistory.length; i++) {
    const f = state.arenaHistory[i];
    if (f.by === "Kill") {
      killBouts++;
    } else if (f.winner !== null) {
      cleanBouts++;
    }
  }

  let gazetteMentions = 0;
  const stableName = state.player.stableName;

  // ⚡ Bolt: Single pass over newsletter for mentions
  if (state.newsletter) {
    for (let i = 0; i < state.newsletter.length; i++) {
      const items = state.newsletter[i].items;
      for (let j = 0; j < items.length; j++) {
        if (items[j].includes(stableName)) {
          gazetteMentions++;
          break; // Count once per newsletter
        }
      }
    }
  }

  // ── Fame ──
  const topFame = activeWarriors.sort((a, b) => b.fame - a.fame).slice(0, 5);
  let topFameSum = 0;
  for (let i = 0; i < topFame.length; i++) {
    topFameSum += topFame[i].fame;
  }
  const avgFame = topFame.length > 0 ? topFameSum / topFame.length : 0;
  // Reduced average fame multiplier and scaled down carryover fame to prevent early-game snowballing
  const fame = Math.min(100, Math.round(avgFame * 2.0 + gazetteMentions * 1.0 + (state.fame ?? 0) * 0.85));

  // ── Notoriety ──
  // Make recent kills and historical lethality impact reputation more quickly
  const notorietyRaw = (totalKills * 4) + (graveyardKills * 2) + (killBouts * 5);
  const notoriety = Math.min(100, Math.round(notorietyRaw * 2));

  // ── Honor ──
  // Base 50, reduced by kills, boosted by clean bouts
  const honorRaw = 50 + cleanBouts * 0.5 - totalKills * 5;
  const honor = Math.min(100, Math.max(0, Math.round(honorRaw)));

  // ── Adaptability ──
  // Style diversity among roster + training activity
  const trainingCount = (state.trainingAssignments ?? []).length;
  const adaptRaw = uniqueStyles.size * 8 + trainingCount * 3 + (state.trainers?.length ?? 0) * 2;
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
  let totalKills = 0;
  let cleanBouts = 0;
  const uniqueStyles = new Set<string>();
  const activeWarriors: Warrior[] = [];

  // ⚡ Bolt: Single pass over roster to compute stats instead of multiple filters and reduce
  for (let i = 0; i < roster.length; i++) {
    const w = roster[i];
    if (w.status === "Active") {
      activeWarriors.push(w);
      uniqueStyles.add(w.style);
    }

    // Total kills and clean bouts uses full roster, not just active
    totalKills += w.career?.kills || 0;
    cleanBouts += (w.career?.wins || 0) + (w.career?.losses || 0) - (w.career?.kills || 0);
  }

  const topFame = activeWarriors.sort((a, b) => b.fame - a.fame).slice(0, 5);
  let topFameSum = 0;
  for (let i = 0; i < topFame.length; i++) {
    topFameSum += topFame[i].fame;
  }
  const avgFame = topFame.length > 0 ? topFameSum / topFame.length : 0;
  const fame = Math.min(100, Math.round(avgFame * 2.0));

  const notoriety = Math.min(100, Math.round(totalKills * 8));
  const honor = Math.min(100, Math.max(0, Math.round(50 + cleanBouts * 0.3 - totalKills * 5)));

  const adaptability = Math.min(100, Math.round(uniqueStyles.size * 10));

  return { fame, notoriety, honor, adaptability };
}
