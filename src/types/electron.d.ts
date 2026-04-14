// Type declaration for Electron API exposed via preload script
declare global {
  interface Window {
    electronAPI?: {
      saveGame: (slotId: string, state: any) => Promise<{ success: boolean; error?: string }>;
      loadGame: (slotId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
      listSaves: () => Promise<{ success: boolean; data?: string[]; error?: string }>;
      deleteSave: (slotId: string) => Promise<{ success: boolean; error?: string }>;
      archiveBoutLog: (year: number, season: number, boutId: string, logData: string[]) => Promise<{ success: boolean; error?: string }>;
      retrieveBoutLog: (year: number, season: number, boutId: string) => Promise<{ success: boolean; data?: string[]; error?: string }>;
      archiveGazette: (season: number, week: number, markdown: string) => Promise<{ success: boolean; error?: string }>;
      retrieveGazette: (season: number, week: number) => Promise<{ success: boolean; data?: string; error?: string }>;
      storeGet: (key: string) => Promise<any>;
      storeSet: (key: string, value: any) => Promise<{ success: boolean }>;
      storeDelete: (key: string) => Promise<{ success: boolean }>;
      getAppInfo: () => Promise<{ name: string; version: string; platform: string }>;
      showNotification: (options: { title: string; body: string }) => Promise<{ success: boolean; error?: string }>;
    };
  }
}

export {};
