import type { GameState, Season } from "@/types/game";
import { FightingStyle } from "@/types/shared.types";
import { OPFSArchiveService } from "@/engine/storage/opfsArchive";

const SEASONS: Season[] = ["Spring", "Summer", "Fall", "Winter"];
export function seasonToNumber(season: Season): number { return SEASONS.indexOf(season); }

export function archiveWeekLogs(state: GameState): GameState {
  const opfs = new OPFSArchiveService();
  if (!opfs.isSupported()) return state;

  let stateModified = false;
  const newArenaHistory = state.arenaHistory.map(summary => {
    if (summary.transcript && summary.transcript.length > 0) {
      stateModified = true;
      const seasonNum = seasonToNumber(state.season);
      opfs.archiveBoutLog(seasonNum, summary.id, summary.transcript).catch(err => {
        console.error(`Failed to background archive bout ${summary.id}:`, err);
      });
      return { ...summary, transcript: undefined };
    }
    return summary;
  });

  if (!stateModified) return state;
  return { ...state, arenaHistory: newArenaHistory };
}
