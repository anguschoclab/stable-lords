import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OPFSArchiveService, ArchiveConflictError } from '@/engine/storage/opfsArchive';

// Define our mock interfaces
interface MockFileHandle {
  kind: 'file';
  name: string;
  getFile: () => Promise<File>;
  createWritable: () => Promise<MockWritableStream>;
}

interface MockWritableStream {
  write: (data: any) => Promise<void>;
  close: () => Promise<void>;
}

interface MockDirectoryHandle {
  kind: 'directory';
  name: string;
  getDirectoryHandle: (name: string, options?: { create?: boolean }) => Promise<MockDirectoryHandle>;
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<MockFileHandle>;
  values: () => AsyncIterableIterator<MockFileHandle | MockDirectoryHandle>;
}

describe('OPFS Archival System', () => {
  let rootHandle: any;

  beforeEach(() => {
    // Reset vi mocks
    vi.clearAllMocks();

    // Create mock structure
    rootHandle = {
      kind: 'directory',
      name: 'root',
      getDirectoryHandle: vi.fn(),
      getFileHandle: vi.fn(),
      values: vi.fn()
    };

    // Setup mock navigator
    Object.defineProperty(global.navigator, 'storage', {
      value: {
        getDirectory: vi.fn().mockResolvedValue(rootHandle)
      },
      configurable: true
    });
  });

  describe('Suite 1: Initialization & Support Checking', () => {
    it('Test 1.1: isSupported() returns true in modern environments', () => {
      const service = new OPFSArchiveService();
      expect(service.isSupported()).toBe(true);
    });

    it('Test 1.2: isSupported() returns false when API is missing', () => {
      Object.defineProperty(global.navigator, 'storage', {
        value: undefined,
        configurable: true
      });
      const service = new OPFSArchiveService();
      expect(service.isSupported()).toBe(false);
    });
  });

  describe('Suite 2: Archiving Play-by-Play (PBP) Logs (Append-Only)', () => {
    it('Test 2.1: archiveBoutLog creates the correct directory structure', async () => {
      const seasonHandle = {
        kind: 'directory',
        name: 'season_1',
        getDirectoryHandle: vi.fn(),
        getFileHandle: vi.fn(),
        values: vi.fn()
      };

      const boutsHandle = {
        kind: 'directory',
        name: 'bouts',
        getDirectoryHandle: vi.fn(),
        getFileHandle: vi.fn(),
        values: vi.fn()
      };

      const fileHandle = {
        kind: 'file',
        name: 'b-123.json',
        getFile: vi.fn(),
        createWritable: vi.fn().mockResolvedValue({
          write: vi.fn(),
          close: vi.fn()
        })
      };

      rootHandle.getDirectoryHandle.mockResolvedValueOnce(seasonHandle);
      seasonHandle.getDirectoryHandle.mockResolvedValueOnce(boutsHandle);
      boutsHandle.getFileHandle.mockRejectedValueOnce(new DOMException('Not found', 'NotFoundError')).mockResolvedValueOnce(fileHandle);

      const service = new OPFSArchiveService();
      await service.archiveBoutLog(1, 1, 'b-123', []);

      expect(rootHandle.getDirectoryHandle).toHaveBeenCalledWith('season_1', { create: true });
      expect(seasonHandle.getDirectoryHandle).toHaveBeenCalledWith('bouts', { create: true });
      expect(boutsHandle.getFileHandle).toHaveBeenCalledWith('1_b-123.json', { create: true });
    });

    it('Test 2.2: archiveBoutLog successfully writes stringified JSON', async () => {
      const seasonHandle = {
        kind: 'directory',
        name: 'season_1',
        getDirectoryHandle: vi.fn(),
        getFileHandle: vi.fn(),
        values: vi.fn()
      } as unknown as FileSystemDirectoryHandle;

      const boutsHandle = {
        kind: 'directory',
        name: 'bouts',
        getDirectoryHandle: vi.fn(),
        getFileHandle: vi.fn(),
        values: vi.fn()
      } as unknown as FileSystemDirectoryHandle;

      const writeMock = vi.fn();
      const closeMock = vi.fn();
      const fileHandle = {
        createWritable: vi.fn().mockResolvedValue({
          write: writeMock,
          close: closeMock
        })
      };

      rootHandle.getDirectoryHandle.mockResolvedValueOnce(seasonHandle);
      seasonHandle.getDirectoryHandle.mockResolvedValueOnce(boutsHandle);
      boutsHandle.getFileHandle.mockRejectedValueOnce(new DOMException('Not found', 'NotFoundError')).mockResolvedValueOnce(fileHandle);

      const service = new OPFSArchiveService();
      const payload = [{ action: 'slash', damage: 15 }];
      await service.archiveBoutLog(1, 2, 'b-999', payload);

      expect(writeMock).toHaveBeenCalledWith(JSON.stringify(payload));
      expect(closeMock).toHaveBeenCalled();
    });

    it('Test 2.3: Overwrite Protection', async () => {
      const seasonHandle = {
        kind: 'directory',
        name: 'season_1',
        getDirectoryHandle: vi.fn(),
        getFileHandle: vi.fn(),
        values: vi.fn()
      } as unknown as FileSystemDirectoryHandle;

      const boutsHandle = {
        kind: 'directory',
        name: 'bouts',
        getDirectoryHandle: vi.fn(),
        getFileHandle: vi.fn().mockResolvedValue({}), // Resolves meaning file exists
        values: vi.fn()
      } as unknown as FileSystemDirectoryHandle;

      rootHandle.getDirectoryHandle.mockResolvedValueOnce(seasonHandle);
      seasonHandle.getDirectoryHandle.mockResolvedValueOnce(boutsHandle);

      const service = new OPFSArchiveService();

      await expect(service.archiveBoutLog(1, 1, 'b-123', [])).rejects.toThrow(ArchiveConflictError);
    });
  });

  describe('Suite 3: Retrieval & Hydration', () => {
    it('Test 3.1: retrieveBoutLog returns parsed JSON', async () => {
      const seasonHandle = { getDirectoryHandle: vi.fn() } as unknown as FileSystemDirectoryHandle;
      const boutsHandle = { getFileHandle: vi.fn() } as unknown as FileSystemFileHandle;

      const mockData = [{ action: 'hit' }];
      const fileHandle = {
        getFile: vi.fn().mockResolvedValue({
          text: vi.fn().mockResolvedValue(JSON.stringify(mockData))
        })
      };

      rootHandle.getDirectoryHandle.mockResolvedValueOnce(seasonHandle);
      seasonHandle.getDirectoryHandle.mockResolvedValueOnce(boutsHandle);
      boutsHandle.getFileHandle.mockResolvedValueOnce(fileHandle);

      const service = new OPFSArchiveService();
      const result = await service.retrieveBoutLog(1, 1, 'b-123');

      expect(result).toEqual(mockData);
    });

    it('Test 3.2: retrieveBoutLog handles missing files gracefully', async () => {
      const seasonHandle = { getDirectoryHandle: vi.fn() } as unknown as FileSystemDirectoryHandle;
      const boutsHandle = {
        getFileHandle: vi.fn().mockRejectedValue(new DOMException('File not found', 'NotFoundError'))
      } as unknown;

      rootHandle.getDirectoryHandle.mockResolvedValueOnce(seasonHandle);
      seasonHandle.getDirectoryHandle.mockResolvedValueOnce(boutsHandle);

      const service = new OPFSArchiveService();
      const result = await service.retrieveBoutLog(1, 1, 'missing-bout');

      expect(result).toBeNull();
    });
  });

  describe('Suite 4: Seasonal Gazette Archiving', () => {
    it('Test 4.1: archiveGazette saves text files natively', async () => {
      const seasonHandle = { getDirectoryHandle: vi.fn() } as unknown as FileSystemDirectoryHandle;
      const gazettesHandle = { getFileHandle: vi.fn() } as unknown as FileSystemFileHandle;

      const writeMock = vi.fn();
      const closeMock = vi.fn();
      const fileHandle = {
        createWritable: vi.fn().mockResolvedValue({
          write: writeMock,
          close: closeMock
        })
      };

      rootHandle.getDirectoryHandle.mockResolvedValueOnce(seasonHandle);
      seasonHandle.getDirectoryHandle.mockResolvedValueOnce(gazettesHandle);
      gazettesHandle.getFileHandle.mockResolvedValueOnce(fileHandle);

      const service = new OPFSArchiveService();
      const markdown = '# Weekly Gazette\\nIt was a good week.';
      await service.archiveGazette(1, 1, markdown);

      expect(rootHandle.getDirectoryHandle).toHaveBeenCalledWith('season_1', { create: true });
      expect(seasonHandle.getDirectoryHandle).toHaveBeenCalledWith('gazettes', { create: true });
      expect(gazettesHandle.getFileHandle).toHaveBeenCalledWith('week_1.md', { create: true });
      expect(writeMock).toHaveBeenCalledWith(markdown);
      expect(closeMock).toHaveBeenCalled();
    });
  });

  describe('Suite 5: Fallback & Quota Management', () => {
    it('Test 5.1: Graceful degradation on QuotaExceededError', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const seasonHandle = {
        kind: 'directory',
        name: 'season_1',
        getDirectoryHandle: vi.fn(),
        getFileHandle: vi.fn(),
        values: vi.fn()
      } as unknown as FileSystemDirectoryHandle;

      const boutsHandle = {
        kind: 'directory',
        name: 'bouts',
        getDirectoryHandle: vi.fn(),
        getFileHandle: vi.fn(),
        values: vi.fn()
      } as unknown as FileSystemDirectoryHandle;

      const fileHandle = {
        createWritable: vi.fn().mockResolvedValue({
          write: vi.fn().mockRejectedValue(new DOMException('Quota Exceeded', 'QuotaExceededError')),
          close: vi.fn()
        })
      };

      rootHandle.getDirectoryHandle.mockResolvedValueOnce(seasonHandle);
      seasonHandle.getDirectoryHandle.mockResolvedValueOnce(boutsHandle);
      boutsHandle.getFileHandle.mockRejectedValueOnce(new DOMException('Not found', 'NotFoundError')).mockResolvedValueOnce(fileHandle);

      // Assuming we inject a store or emit an event later, we just ensure it doesn't throw unhandled
      const service = new OPFSArchiveService();

      // We expect it to catch the error, possibly dispatch to Zustand, and return safely
      await expect(service.archiveBoutLog(1, 1, 'b-123', [])).resolves.toBeUndefined();
      errorSpy.mockRestore();
    });

    it('Test 5.2: archiveBoutLog throws ArchiveConflictError on NoModificationAllowedError', async () => {
      const seasonHandle = {
        kind: 'directory',
        name: 'season_1',
        getDirectoryHandle: vi.fn(),
        getFileHandle: vi.fn(),
        values: vi.fn()
      } as unknown as FileSystemDirectoryHandle;

      const boutsHandle = {
        kind: 'directory',
        name: 'bouts',
        getDirectoryHandle: vi.fn(),
        getFileHandle: vi.fn(),
        values: vi.fn()
      } as unknown as FileSystemDirectoryHandle;

      const fileHandle = {
        createWritable: vi.fn().mockResolvedValue({
          write: vi.fn().mockRejectedValue(new DOMException('No Modification Allowed', 'NoModificationAllowedError')),
          close: vi.fn()
        })
      };

      rootHandle.getDirectoryHandle.mockResolvedValueOnce(seasonHandle);
      seasonHandle.getDirectoryHandle.mockResolvedValueOnce(boutsHandle);
      boutsHandle.getFileHandle.mockRejectedValueOnce(new DOMException('Not found', 'NotFoundError')).mockResolvedValueOnce(fileHandle);

      const service = new OPFSArchiveService();

      await expect(service.archiveBoutLog(1, 1, 'b-123', [])).rejects.toThrow(ArchiveConflictError);
    });

    it('Test 5.3: archiveBoutLog fails gracefully on unknown generic errors', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const seasonHandle = {
        kind: 'directory',
        name: 'season_1',
        getDirectoryHandle: vi.fn(),
        getFileHandle: vi.fn(),
        values: vi.fn()
      } as unknown as FileSystemDirectoryHandle;

      const boutsHandle = {
        kind: 'directory',
        name: 'bouts',
        getDirectoryHandle: vi.fn(),
        getFileHandle: vi.fn(),
        values: vi.fn()
      } as unknown as FileSystemDirectoryHandle;

      const fileHandle = {
        createWritable: vi.fn().mockResolvedValue({
          write: vi.fn().mockRejectedValue(new Error('Generic fallback error')),
          close: vi.fn()
        })
      };

      rootHandle.getDirectoryHandle.mockResolvedValueOnce(seasonHandle);
      seasonHandle.getDirectoryHandle.mockResolvedValueOnce(boutsHandle);
      boutsHandle.getFileHandle.mockRejectedValueOnce(new DOMException('Not found', 'NotFoundError')).mockResolvedValueOnce(fileHandle);

      const service = new OPFSArchiveService();

      // Ensure it fails gracefully (resolves to undefined) instead of throwing
      await expect(service.archiveBoutLog(1, 1, 'b-123', [])).resolves.toBeUndefined();

      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe('Suite 6: Hot State Storage', () => {
    it('Test 6.1: retrieveHotState handles missing files gracefully', async () => {
      const hotStateHandle = {
        getDirectoryHandle: vi.fn(),
        getFileHandle: vi.fn().mockRejectedValue(new DOMException('File not found', 'NotFoundError'))
      } as unknown;

      rootHandle.getDirectoryHandle.mockResolvedValueOnce(hotStateHandle);

      const service = new OPFSArchiveService();
      const result = await service.retrieveHotState('save-slot-1');

      expect(result).toBeNull();
    });
  });
});
