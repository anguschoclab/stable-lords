import type { GameState } from '@/types/state.types';
import type { Season } from '@/types/shared.types';
import type { FightSummary } from '@/types/combat.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { getRecentFights } from '@/engine/core/historyUtils';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';

/**
 * Generate personality-driven gazette events based on recent performance.
 * Runs once per season change.
 */
export function generateOwnerNarratives(
  state: GameState,
  newSeason: Season,
  rng?: IRNGService
): string[] {
  const rngService = rng || new SeededRNGService(state.week * 7919 + 7);
  if (newSeason === state.season) return [];

  const gazetteItems: string[] = [];
  const recentFights = getRecentFights(state.arenaHistory, state.week - 13);
  const rivals = state.rivals || [];

  for (const rival of rivals) {
    const personality = rival.owner.personality ?? 'Pragmatic';
    const names = new Set(rival.roster.map((w) => w.name));

    const { wins, losses, kills, deaths } = calculateRecentRecord(recentFights, names);

    const totalFights = wins + losses;
    if (totalFights === 0) continue;
    const winRate = wins / totalFights;

    // Aggressive owner losing badly
    if (personality === 'Aggressive' && winRate < 0.35 && totalFights >= 4) {
      const templates = [
        `😤 ${rival.owner.name} (${rival.owner.stableName}) rages: "Heads will roll if results don't improve!"`,
        `🔥 ${rival.owner.name} fires ${rival.owner.stableName}'s head trainer after a dismal ${state.season}!`,
        `⚔️ ${rival.owner.name} declares: "Next season, we fight with fury or not at all!"`,
      ];
      gazetteItems.push(rngService.pick(templates));
    }

    // Methodical owner on a winning streak
    if (personality === 'Methodical' && winRate >= 0.7 && totalFights >= 4) {
      gazetteItems.push(
        `📊 ${rival.owner.name} (${rival.owner.stableName}): "Our preparation is paying dividends — ${wins}W/${losses}L this ${state.season}."`
      );
    }

    // Showman with lots of kills
    if (personality === 'Showman' && kills >= 2) {
      gazetteItems.push(
        `🎭 ${rival.owner.name} (${rival.owner.stableName}) boasts: "${kills} kills this ${state.season}! The crowd demands blood, and we deliver!"`
      );
    }

    // Pragmatic owner suffering deaths
    if (personality === 'Pragmatic' && deaths >= 2) {
      gazetteItems.push(
        `💀 ${rival.owner.name} (${rival.owner.stableName}) grimly assesses: "${deaths} warriors lost this ${state.season}. Costs are unsustainable."`
      );
    }

    // Tactician dominating
    if (personality === 'Tactician' && winRate >= 0.65 && kills === 0 && totalFights >= 3) {
      gazetteItems.push(
        `🧠 ${rival.owner.name} (${rival.owner.stableName}): "Clean victories, no unnecessary bloodshed — ${wins}W/${losses}L. Strategy prevails."`
      );
    }

    // Any owner with a dominant season
    if (winRate >= 0.8 && totalFights >= 5) {
      gazetteItems.push(
        `🏆 ${rival.owner.stableName} dominated ${state.season} with a record of ${wins}-${losses}!`
      );
    }

    // Any owner with devastating losses
    if (deaths >= 3) {
      gazetteItems.push(
        `⚰️ A grim ${state.season} for ${rival.owner.stableName} — ${deaths} warriors fell in the arena.`
      );
    }
  }

  // Add Blood Feud public taunts for player rivalry
  for (const rival of rivals) {
    const rivalry = (state.rivalries || []).find(
      (rv) =>
        (rv.stableIdA === state.player.id && rv.stableIdB === rival.owner.id) ||
        (rv.stableIdB === state.player.id && rv.stableIdA === rival.owner.id)
    );

    if (rivalry && rivalry.intensity >= 4 && rngService.next() < 0.25) {
      const tauntTemplates = [
        `🗣️ "${state.player.stableName} is a disgrace to the sands. I will see them bleed," vows ${rival.owner.name} (${rival.owner.stableName}).`,
        `🗣️ ${rival.owner.name} (${rival.owner.stableName}) issues a public challenge: "My warriors will hunt down the dogs of ${state.player.stableName}."`,
        `🗣️ "The feud with ${state.player.stableName} ends when their stable is ash," declares ${rival.owner.name}.`,
        `🗣️ Public Grudge: ${rival.owner.name} (${rival.owner.stableName}) was heard mocking the recent performances of ${state.player.stableName}.`,
      ];
      gazetteItems.push(rngService.pick(tauntTemplates));
    }
  }

  return gazetteItems;
}

function calculateRecentRecord(recentFights: FightSummary[], rosterNames: Set<string>) {
  let wins = 0,
    losses = 0,
    kills = 0,
    deaths = 0;
  for (const f of recentFights) {
    const isA = rosterNames.has(f.a),
      isD = rosterNames.has(f.d);
    if (isA || isD) {
      const isWin = (isA && f.winner === 'A') || (isD && f.winner === 'D');
      const isLoss = (isA && f.winner === 'D') || (isD && f.winner === 'A');
      if (isWin) wins++;
      if (isLoss) losses++;
      if (f.by === 'Kill') {
        if (isWin) kills++;
        if (isLoss) deaths++;
      }
    }
  }
  return { wins, losses, kills, deaths };
}
