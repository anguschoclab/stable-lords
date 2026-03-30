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

// Mock ResizeObserver for JSDOM
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock OPFS FileSystem interfaces for Vitest
const createMockDirHandle = (name) => ({
  kind: 'directory',
  name,
  getDirectoryHandle: async (dirName) => createMockDirHandle(dirName),
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
