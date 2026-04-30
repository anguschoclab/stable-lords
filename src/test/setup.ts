import '@testing-library/jest-dom';
import { enableMapSet } from 'immer';

enableMapSet();

// Mock localStorage for Bun/Vitest environment
const localStorageMock = (function () {
  let store: Record<string, string> = {};
  return {
    getItem: function (key: string) {
      return store[key] || null;
    },
    setItem: function (key: string, value: string) {
      store[key] = value.toString();
    },
    removeItem: function (key: string) {
      const { [key]: _, ...rest } = store;
      store = rest;
    },
    clear: function () {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Mock ResizeObserver for JSDOM

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = MockResizeObserver as typeof ResizeObserver;

// Mock OPFS FileSystem interfaces for Vitest
const createMockDirHandle = (name: string) => ({
  kind: 'directory',
  name,
  getDirectoryHandle: async (dirName: string) => createMockDirHandle(dirName),
  getFileHandle: async () => ({
    kind: 'file',
    createWritable: async () => ({
      write: async () => {},
      close: async () => {},
    }),
    getFile: async () => ({
      text: async () => '{}',
    }),
  }),
  values: async function* () {},
});

if (typeof global.navigator === 'undefined') {
  (global as any).navigator = {};
}

Object.defineProperty(global.navigator, 'storage', {
  value: {
    getDirectory: async () => createMockDirHandle('root'),
  },
  configurable: true,
});

// Mock Worker for Vitest

class MockWorker {
  url: string;
  onmessage: (event: MessageEvent) => void = () => {};
  onerror: (event: ErrorEvent) => void = () => {};

  constructor(stringUrl: string) {
    this.url = stringUrl;
  }

  postMessage(_msg: unknown) {
    setTimeout(() => {
      this.onmessage({ data: { type: 'WORKER_READY' } } as MessageEvent);
    }, 0);
  }

  terminate() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent(): boolean {
    return true;
  }
}
global.Worker = MockWorker as unknown as typeof Worker;
