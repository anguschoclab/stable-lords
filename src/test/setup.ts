import { vi } from "vitest";
import "@testing-library/jest-dom";

// Mock localStorage for Bun/Vitest environment
const localStorageMock = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: function(key: string) {
      return store[key] || null;
    },
    setItem: function(key: string, value: string) {
      store[key] = value.toString();
    },
    removeItem: function(key: string) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete store[key];
    },
    clear: function() {
      store = {};
    }
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
});

// Clear localStorage before each test to prevent pollution
beforeEach(() => {
  localStorageMock.clear();
});

// Mock ResizeObserver for JSDOM
 
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock OPFS FileSystem interfaces for Vitest
const createMockDirHandle = (name: string) => ({
  kind: 'directory',
  name,
  getDirectoryHandle: async (dirName: string) => createMockDirHandle(dirName),
  getFileHandle: async () => ({}),
  values: async function* () {}
});

if (typeof global.navigator === 'undefined') {
  (global as any).navigator = {};
}

Object.defineProperty(global.navigator, 'storage', {
  value: {
    getDirectory: async () => createMockDirHandle('root')
  },
  configurable: true
});

// Mock Worker for Vitest
 
global.Worker = class Worker {
  url: string;
  onmessage: (event: any) => void = () => {};
  onerror: (event: any) => void = () => {};

  constructor(stringUrl: string) {
    this.url = stringUrl;
  }

  postMessage(msg: any) {
    // Basic mock: echo back a completion message for common simulation worker patterns
    setTimeout(() => {
      this.onmessage({ data: { type: "WORKER_READY" } });
    }, 0);
  }

  terminate() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
} as any;
