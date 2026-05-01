import * as Comlink from 'comlink';
import type { EngineWorker } from './worker';

type AsyncEngine = {
  [K in keyof EngineWorker]: (
    ...args: Parameters<EngineWorker[K]>
  ) => Promise<ReturnType<EngineWorker[K]>>;
};

/**
 * Stable Lords — Engine Worker Proxy
 * In production: offloads simulation to a Web Worker via Comlink.
 * In development: runs engine functions directly on the main thread to avoid
 * the react-refresh/window crash injected by Vite's SWC plugin into workers.
 */
function buildProxy(): AsyncEngine {
  if (import.meta.env.DEV) {
    let cached: EngineWorker | null = null;
    const load = async (): Promise<EngineWorker> => {
      if (cached) return cached;
      const [
        { advanceWeek },
        { advanceDay },
        { createFreshState },
        { TournamentSelectionService },
      ] = await Promise.all([
        import('./pipeline/services/weekPipelineService'),
        import('./dayPipeline'),
        import('./factories/gameStateFactory'),
        import('./matchmaking/tournamentSelection'),
      ]);
      cached = {
        advanceWeek,
        advanceDay,
        createFreshState,
        resolveTournamentRound: TournamentSelectionService.resolveRound.bind(
          TournamentSelectionService
        ),
      };
      return cached;
    };
    return {
      advanceWeek: async (...args) => (await load()).advanceWeek(...args),
      advanceDay: async (...args) => (await load()).advanceDay(...args),
      createFreshState: async (...args) => (await load()).createFreshState(...args),
      resolveTournamentRound: async (...args) => (await load()).resolveTournamentRound(...args),
    };
  }

  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  return Comlink.wrap<EngineWorker>(worker) as unknown as AsyncEngine;
}

export const engineProxy = buildProxy();
