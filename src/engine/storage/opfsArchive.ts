import type { GameState } from '@/types/state.types';

export interface ArchiveService {
  isSupported: () => boolean;

  // Bout Logs (JSON)
  archiveBoutLog: (
    year: number,
    season: number,
    boutId: string,
    logData: string[],
    overwrite?: boolean
  ) => Promise<void>;
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

export class OPFSArchiveService implements ArchiveService {
  private writeQueue: Promise<void> = Promise.resolve();

  private async enqueue<T>(task: () => Promise<T>): Promise<T> {
    const p = this.writeQueue.then(task);
    this.writeQueue = p.catch(() => {}); // catch errors to allow next task in queue
    return p;
  }

  isSupported(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      typeof navigator.storage !== 'undefined' &&
      typeof navigator.storage.getDirectory === 'function'
    );
  }

  private async getDirectory(
    season: number,
    type: 'bouts' | 'gazettes'
  ): Promise<FileSystemDirectoryHandle | null> {
    if (!this.isSupported()) return null;

    try {
      const rootHandle = await navigator.storage.getDirectory();
      const seasonHandle = await rootHandle.getDirectoryHandle(`season_${season}`, {
        create: true,
      });
      return await seasonHandle.getDirectoryHandle(type, { create: true });
    } catch (error) {
      console.warn(
        'Failed to get directory handle (OPFS may be restricted in this environment):',
        error
      );
      return null;
    }
  }

  private async getHotStateDirectory(): Promise<FileSystemDirectoryHandle | null> {
    if (!this.isSupported()) return null;
    try {
      const rootHandle = await navigator.storage.getDirectory();
      return await rootHandle.getDirectoryHandle('hot_state', { create: true });
    } catch (error) {
      console.warn(
        'Failed to get hot_state directory handle (OPFS may be restricted in this environment):',
        error
      );
      return null;
    }
  }

  async archiveHotState(slotId: string, stateData: GameState): Promise<void> {
    let writable: FileSystemWritableFileStream | null = null;
    try {
      const dirHandle = await this.getHotStateDirectory();
      if (!dirHandle) return;
      const fileName = `${slotId}.json`;
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
      writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(stateData));
    } catch (error) {
      if ((error as Error)?.name === 'QuotaExceededError') {
        console.error('OPFS Quota Exceeded during hot state archival', error);
        if (typeof window !== 'undefined')
          window.dispatchEvent(
            new CustomEvent('OPFS_QUOTA_EXCEEDED', {
              detail: 'Storage Quota Exceeded: Archival failed.',
            })
          );
        return;
      }
    } finally {
      if (writable) {
        try {
          await writable.close();
        } catch (closeError) {
          console.warn('Failed to close writable stream:', closeError);
        }
      }
    }
  }

  async retrieveHotState(slotId: string): Promise<GameState | null> {
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
      console.warn('Error retrieving hot state:', error);
      return null;
    }
  }

  async archiveBoutLog(
    year: number,
    season: number,
    boutId: string,
    logData: string[],
    overwrite = false
  ): Promise<void> {
    return this.enqueue(async () => {
      let writable: FileSystemWritableFileStream | null = null;
      try {
        const dirHandle = await this.getDirectory(season, 'bouts');
        if (!dirHandle) return;

        const fileName = `${year}_${boutId}.json`;

        let fileHandle;
        try {
          fileHandle = await dirHandle.getFileHandle(fileName, { create: false });
          if (fileHandle && !overwrite) {
            throw new ArchiveConflictError(`Bout log ${boutId} already exists in archive.`);
          }
        } catch (error: unknown) {
          if (error instanceof ArchiveConflictError) {
            throw error;
          }
          // File doesn't exist, proceed
          fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
        }

        writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(logData));
      } catch (error) {
        if (error instanceof ArchiveConflictError) {
          throw error;
        }
        if ((error as Error)?.name === 'QuotaExceededError') {
          console.error('OPFS Quota Exceeded during bout log archival', error);
          if (typeof window !== 'undefined')
            window.dispatchEvent(
              new CustomEvent('OPFS_QUOTA_EXCEEDED', {
                detail: 'Storage Quota Exceeded: Archival failed.',
              })
            );
          return;
        }
        if ((error as Error)?.name === 'NoModificationAllowedError') {
          throw new ArchiveConflictError(`Bout log ${boutId} already exists in archive.`);
        }
        console.error('Unknown error during bout log archival', error);
      } finally {
        if (writable) {
          try {
            await writable.close();
          } catch (closeError) {
            console.warn('Failed to close writable stream:', closeError);
          }
        }
      }
    });
  }

  async retrieveBoutLog(year: number, season: number, boutId: string): Promise<string[] | null> {
    try {
      const dirHandle = await this.getDirectory(season, 'bouts');
      if (!dirHandle) return null;

      const fileName = `${year}_${boutId}.json`;
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: false });
      const file = await fileHandle.getFile();

      if (typeof file.text === 'function') {
        const text = await file.text();
        return JSON.parse(text);
      }

      return null;
    } catch (error) {
      if ((error as Error)?.name === 'NotFoundError') {
        return null; // Graceful degradation for missing files
      }
      console.warn('Error retrieving bout log:', error);
      return null;
    }
  }

  async archiveGazette(season: number, week: number, markdown: string): Promise<void> {
    return this.enqueue(async () => {
      let writable: FileSystemWritableFileStream | null = null;
      try {
        const dirHandle = await this.getDirectory(season, 'gazettes');
        if (!dirHandle) return;

        const fileName = `week_${week}.md`;
        const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
        writable = await fileHandle.createWritable();
        await writable.write(markdown);
      } catch (error) {
        if ((error as Error)?.name === 'QuotaExceededError') {
          console.error('OPFS Quota Exceeded during gazette archival', error);
          // Dispatch to Zustand to show Toast
          if (typeof window !== 'undefined')
            window.dispatchEvent(
              new CustomEvent('OPFS_QUOTA_EXCEEDED', {
                detail: 'Storage Quota Exceeded: Archival failed.',
              })
            );
          return;
        }
      } finally {
        if (writable) {
          try {
            await writable.close();
          } catch (closeError) {
            console.warn('Failed to close writable stream:', closeError);
          }
        }
      }
    });
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
      console.warn('Error retrieving gazette:', error);
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
      console.warn('Error getting archived bout ids:', error);
      return [];
    }
  }
}

export const opfsArchive = new OPFSArchiveService();
