import type { GameState } from "@/types/state.types";

export interface ArchiveService {
  isSupported: () => boolean;

  // Bout Logs (JSON)
  archiveBoutLog: (year: number, season: number, boutId: string, logData: string[], overwrite?: boolean) => Promise<void>;
  retrieveBoutLog: (year: number, season: number, boutId: string) => Promise<string[] | null>;

  // Gazettes (Markdown)
  archiveGazette: (season: number, week: number, markdown: string) => Promise<void>;
  retrieveGazette: (season: number, week: number) => Promise<string | null>;

  // Hot State Save/Load (JSON)
  archiveHotState: (slotId: string, stateData: GameState) => Promise<void>;
  retrieveHotState: (slotId: string) => Promise<GameState | null>;

  // Utility
  getArchivedBoutIdsForSeason: (season: number) => Promise<string[]>;
}

export class ArchiveConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ArchiveConflictError';
  }
}

export class ElectronArchiveService implements ArchiveService {
  private writeQueue: Promise<any> = Promise.resolve();

  private async enqueue<T>(task: () => Promise<T>): Promise<T> {
    const p = this.writeQueue.then(task);
    this.writeQueue = p.catch(() => {}); // catch errors to allow next task in queue
    return p;
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && window.electronAPI !== undefined;
  }

  async archiveHotState(slotId: string, stateData: GameState): Promise<void> {
    return this.enqueue(async () => {
      if (!this.isSupported() || !window.electronAPI) return;
      
      try {
        const result = await window.electronAPI.saveGame(slotId, stateData);
        if (!result.success) {
          console.error('Failed to archive hot state:', result.error);
        }
      } catch (error) {
        console.error('Error archiving hot state:', error);
      }
    });
  }

  async retrieveHotState(slotId: string): Promise<GameState | null> {
    if (!this.isSupported() || !window.electronAPI) return null;
    
    try {
      const result = await window.electronAPI.loadGame(slotId);
      if (result.success && result.data) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Error retrieving hot state:', error);
      return null;
    }
  }

  async archiveBoutLog(year: number, season: number, boutId: string, logData: string[], _overwrite?: boolean): Promise<void> {
    return this.enqueue(async () => {
      if (!this.isSupported() || !window.electronAPI) return;
      
      try {
        const result = await window.electronAPI.archiveBoutLog(year, season, boutId, logData);
        if (!result.success) {
          console.error('Failed to archive bout log:', result.error);
        }
      } catch (error) {
        console.error('Error archiving bout log:', error);
      }
    });
  }

  async retrieveBoutLog(year: number, season: number, boutId: string): Promise<string[] | null> {
    if (!this.isSupported() || !window.electronAPI) return null;
    
    try {
      const result = await window.electronAPI.retrieveBoutLog(year, season, boutId);
      if (result.success && result.data) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Error retrieving bout log:', error);
      return null;
    }
  }

  async archiveGazette(season: number, week: number, markdown: string): Promise<void> {
    return this.enqueue(async () => {
      if (!this.isSupported() || !window.electronAPI) return;
      
      try {
        const result = await window.electronAPI.archiveGazette(season, week, markdown);
        if (!result.success) {
          console.error('Failed to archive gazette:', result.error);
        }
      } catch (error) {
        console.error('Error archiving gazette:', error);
      }
    });
  }

  async retrieveGazette(season: number, week: number): Promise<string | null> {
    if (!this.isSupported() || !window.electronAPI) return null;
    
    try {
      const result = await window.electronAPI.retrieveGazette(season, week);
      if (result.success && result.data) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Error retrieving gazette:', error);
      return null;
    }
  }

  async getArchivedBoutIdsForSeason(_season: number): Promise<string[]> {
    // This would require additional IPC handler to list bout IDs in a season
    // For now, return empty array as this is not critical for Electron version
    return [];
  }
}

// Export appropriate archive service based on environment
export let archiveService: ArchiveService;

if (typeof window !== 'undefined' && window.electronAPI) {
  archiveService = new ElectronArchiveService();
} else {
  // Fallback to OPFS for web version (will be removed after full Electron migration)
  const { OPFSArchiveService } = await import('./opfsArchive');
  archiveService = new OPFSArchiveService();
}

// Re-export the instance for backward compatibility
export { archiveService as opfsArchive };
