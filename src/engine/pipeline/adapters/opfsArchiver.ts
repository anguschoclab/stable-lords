import type { GameState } from '@/types/state.types';
import { type Season } from '@/types/shared.types';
import { OPFSArchiveService } from '@/engine/storage/opfsArchive';

const SEASONS: Season[] = ['Spring', 'Summer', 'Fall', 'Winter'];
export function seasonToNumber(season: Season): number {
  return SEASONS.indexOf(season);
}

/**
 * Flush all deferred bout logs to OPFS
 * Call this at the end of batch operations (quarter/year)
 */
export async function flushDeferredArchives(state: GameState): Promise<GameState> {
  const opfs = new OPFSArchiveService();
  if (!opfs.isSupported()) return state;

  const deferred = (state as any).deferredBoutLogs as
    | Array<{
        year: number;
        season: number;
        boutId: string;
        transcript: string[];
      }>
    | undefined;

  if (!deferred || deferred.length === 0) return state;

  // Archive all deferred logs
  const promises = deferred.map((log) =>
    opfs.archiveBoutLog(log.year, log.season, log.boutId, log.transcript, true).catch((err) => {
      console.error(`Failed to archive bout ${log.boutId}:`, err);
    })
  );

  await Promise.all(promises);

  // Clear deferred logs
  (state as any).deferredBoutLogs = [];

  return state;
}

export function archiveWeekLogs(state: GameState): GameState {
  const opfs = new OPFSArchiveService();
  if (!opfs.isSupported()) return state;

  let stateModified = false;
  const newArenaHistory = state.arenaHistory.map((summary) => {
    if (summary.transcript && summary.transcript.length > 0) {
      stateModified = true;
      const seasonNum = seasonToNumber(state.season);
      opfs
        .archiveBoutLog(state.year, seasonNum, summary.id, summary.transcript, true)
        .catch((err) => {
          console.error(`Failed to background archive bout ${summary.id}:`, err);
        });
      return { ...summary, transcript: undefined };
    }
    return summary;
  });

  if (!stateModified) return state;
  return { ...state, arenaHistory: newArenaHistory };
}
