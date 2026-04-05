export interface ArchiveService {
  isSupported: () => boolean;

  // Bout Logs (JSON)
  archiveBoutLog: (season: number, boutId: string, logData: import("@/types/game").FightSummary) => Promise<void>;
  retrieveBoutLog: (season: number, boutId: string) => Promise<import("@/types/game").FightSummary | null>;

  // Gazettes (Markdown)
  archiveGazette: (season: number, week: number, markdown: string) => Promise<void>;
  retrieveGazette: (season: number, week: number) => Promise<string | null>;

  // Hot State Save/Load (JSON)
  archiveHotState: (slotId: string, stateData: import("@/types/game").GameState) => Promise<void>;
  retrieveHotState: (slotId: string) => Promise<import("@/types/game").GameState | null>;

  // Utility
  getArchivedBoutIdsForSeason: (season: number) => Promise<string[]>;
}

export class ArchiveConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ArchiveConflictError';
  }
}

export class OPFSArchiveService implements ArchiveService {
  isSupported(): boolean {
    return typeof navigator !== 'undefined' &&
           typeof navigator.storage !== 'undefined' &&
           typeof navigator.storage.getDirectory === 'function';
  }

  private async getDirectory(season: number, type: 'bouts' | 'gazettes'): Promise<FileSystemDirectoryHandle | null> {
    if (!this.isSupported()) return null;

    try {
      const rootHandle = await navigator.storage.getDirectory();
      const seasonHandle = await rootHandle.getDirectoryHandle(`season_${season}`, { create: true });
      return await seasonHandle.getDirectoryHandle(type, { create: true });
    } catch (error) {
      console.error('Failed to get directory handle:', error);
      return null;
    }
  }

  private async getHotStateDirectory(): Promise<FileSystemDirectoryHandle | null> {
    if (!this.isSupported()) return null;
    try {
      const rootHandle = await navigator.storage.getDirectory();
      return await rootHandle.getDirectoryHandle('hot_state', { create: true });
    } catch (error) {
      console.error('Failed to get hot_state directory handle:', error);
      return null;
    }
  }

  async archiveHotState(slotId: string, stateData: import("@/types/game").GameState): Promise<void> {
    try {
      const dirHandle = await this.getHotStateDirectory();
      if (!dirHandle) return;
      const fileName = `${slotId}.json`;
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(stateData));
      await writable.close();
    } catch (error) {
      if ((error as Error)?.name === 'QuotaExceededError') {
         console.error('OPFS Quota Exceeded during hot state archival', error);
         if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('OPFS_QUOTA_EXCEEDED', { detail: 'Storage Quota Exceeded: Archival failed.' }));
         return;
      }
      console.error('Error archiving hot state:', error);
    }
  }

  async retrieveHotState(slotId: string): Promise<import("@/types/game").GameState | null> {
    try {
      const dirHandle = await this.getHotStateDirectory();
      if (!dirHandle) return null;
      const fileName = `${slotId}.json`;
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: false });
      const file = await fileHandle.getFile();
      if (typeof file.text === 'function') {
         const text = await file.text();
         return JSON.parse(text);
      }
      return null;
    } catch (error) {
      if ((error as Error)?.name === 'NotFoundError') {
        return null;
      }
      console.error('Error retrieving hot state:', error);
      return null;
    }
  }

  async archiveBoutLog(season: number, boutId: string, logData: import("@/types/game").FightSummary): Promise<void> {
    try {
      const dirHandle = await this.getDirectory(season, 'bouts');
      if (!dirHandle) return;

      const fileName = `${boutId}.json`;

      let fileHandle;
      try {
        fileHandle = await dirHandle.getFileHandle(fileName, { create: false });
        if (fileHandle) {
          throw new ArchiveConflictError(`Bout log ${boutId} already exists in archive.`);
        }
      } catch (error) {
         if (error instanceof ArchiveConflictError) {
             throw error;
         }
         // File doesn't exist, proceed
         fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
      }

      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(logData));
      await writable.close();

    } catch (error) {
      if (error instanceof ArchiveConflictError) {
        throw error;
      }
      if ((error as Error)?.name === 'QuotaExceededError') {
        console.error('OPFS Quota Exceeded during bout log archival', error);
        // Dispatch to Zustand to show Toast
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('OPFS_QUOTA_EXCEEDED', { detail: 'Storage Quota Exceeded: Archival failed.' }));
        return;
      }
      if ((error as Error)?.name === 'NoModificationAllowedError') {
        throw new ArchiveConflictError(`Bout log ${boutId} already exists in archive.`);
      }
      console.error('Error archiving bout log:', error);
      // Fail gracefully
    }
  }

  async retrieveBoutLog(season: number, boutId: string): Promise<import("@/types/game").GameState | null> {
    try {
      const dirHandle = await this.getDirectory(season, 'bouts');
      if (!dirHandle) return null;

      const fileName = `${boutId}.json`;
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: false });
      const file = await fileHandle.getFile();

      // Handle standard File objects in tests
      if (typeof file.text === 'function') {
         const text = await file.text();
         return JSON.parse(text);
      }

      return null;
    } catch (error) {
      if ((error as Error)?.name === 'NotFoundError') {
        return null; // Graceful degradation for missing files
      }
      console.error('Error retrieving bout log:', error);
      return null;
    }
  }

  async archiveGazette(season: number, week: number, markdown: string): Promise<void> {
    try {
      const dirHandle = await this.getDirectory(season, 'gazettes');
      if (!dirHandle) return;

      const fileName = `week_${week}.md`;
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(markdown);
      await writable.close();

    } catch (error) {
      if ((error as Error)?.name === 'QuotaExceededError') {
         console.error('OPFS Quota Exceeded during gazette archival', error);
         // Dispatch to Zustand to show Toast
         if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('OPFS_QUOTA_EXCEEDED', { detail: 'Storage Quota Exceeded: Archival failed.' }));
         return;
      }
      console.error('Error archiving gazette:', error);
    }
  }

  async retrieveGazette(season: number, week: number): Promise<string | null> {
    try {
      const dirHandle = await this.getDirectory(season, 'gazettes');
      if (!dirHandle) return null;

      const fileName = `week_${week}.md`;
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: false });
      const file = await fileHandle.getFile();

      if (typeof file.text === 'function') {
          return await file.text();
      }
      return null;
    } catch (error) {
      if ((error as Error)?.name === 'NotFoundError') {
        return null;
      }
      console.error('Error retrieving gazette:', error);
      return null;
    }
  }

  async getArchivedBoutIdsForSeason(season: number): Promise<string[]> {
     try {
       const dirHandle = await this.getDirectory(season, 'bouts');
       if (!dirHandle) return [];

       const boutIds: string[] = [];
       // @ts-expect-error - async iterator type issue
       for await (const entry of dirHandle.values()) {
         if (entry.kind === 'file' && entry.name.endsWith('.json')) {
           boutIds.push(entry.name.replace('.json', ''));
         }
       }
       return boutIds;
     } catch (error) {
       console.error('Error getting archived bout ids:', error);
       return [];
     }
  }
}
