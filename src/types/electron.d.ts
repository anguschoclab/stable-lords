// Type declaration for Electron API exposed via preload script
declare global {
  interface Window {
    electronAPI?: {
      saveGame: (slotId: string, state: import('./state.types').GameState) => Promise<{ success: boolean; error?: string }>;
      loadGame: (slotId: string) => Promise<{ success: boolean; data?: import('./state.types').GameState; error?: string }>;
      listSaves: () => Promise<{ success: boolean; data?: string[]; error?: string }>;
      deleteSave: (slotId: string) => Promise<{ success: boolean; error?: string }>;
      archiveBoutLog: (year: number, season: number, boutId: string, logData: string[]) => Promise<{ success: boolean; error?: string }>;
      retrieveBoutLog: (year: number, season: number, boutId: string) => Promise<{ success: boolean; data?: string[]; error?: string }>;
      archiveGazette: (season: number, week: number, markdown: string) => Promise<{ success: boolean; error?: string }>;
      retrieveGazette: (season: number, week: number) => Promise<{ success: boolean; data?: string; error?: string }>;
      storeGet: <T = unknown>(key: string) => Promise<T>;
      storeSet: <T = unknown>(key: string, value: T) => Promise<{ success: boolean }>;
      storeDelete: (key: string) => Promise<{ success: boolean }>;
      getAppInfo: () => Promise<{ name: string; version: string; platform: string }>;
      showNotification: (options: { title: string; body: string }) => Promise<{ success: boolean; error?: string }>;
    };
  }
}

export {};
