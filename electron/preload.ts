import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File system operations
  saveGame: (slotId: string, state: any) => ipcRenderer.invoke('save-game', slotId, state),
  loadGame: (slotId: string) => ipcRenderer.invoke('load-game', slotId),
  listSaves: () => ipcRenderer.invoke('list-saves'),
  deleteSave: (slotId: string) => ipcRenderer.invoke('delete-save', slotId),
  
  // Archive operations
  archiveBoutLog: (year: number, season: number, boutId: string, logData: string[]) => 
    ipcRenderer.invoke('archive-bout-log', year, season, boutId, logData),
  retrieveBoutLog: (year: number, season: number, boutId: string) => 
    ipcRenderer.invoke('retrieve-bout-log', year, season, boutId),
  archiveGazette: (season: number, week: number, markdown: string) => 
    ipcRenderer.invoke('archive-gazette', season, week, markdown),
  retrieveGazette: (season: number, week: number) => 
    ipcRenderer.invoke('retrieve-gazette', season, week),
  
  // Store operations (electron-store)
  storeGet: (key: string) => ipcRenderer.invoke('store-get', key),
  storeSet: (key: string, value: any) => ipcRenderer.invoke('store-set', key, value),
  storeDelete: (key: string) => ipcRenderer.invoke('store-delete', key),
  
  // App info
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  // Notifications
  showNotification: (options: { title: string; body: string }) => 
    ipcRenderer.invoke('show-notification', options),
  
  // Menu event listeners
  onMenuNewGame: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('menu-new-game', handler);
    return () => ipcRenderer.removeListener('menu-new-game', handler);
  },
  onMenuSaveGame: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('menu-save-game', handler);
    return () => ipcRenderer.removeListener('menu-save-game', handler);
  },
  onMenuLoadGame: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('menu-load-game', handler);
    return () => ipcRenderer.removeListener('menu-load-game', handler);
  },
  onMenuExportSave: (callback: (filePath: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, filePath: string) => callback(filePath);
    ipcRenderer.on('menu-export-save', handler);
    return () => ipcRenderer.removeListener('menu-export-save', handler);
  },
  onMenuImportSave: (callback: (filePath: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, filePath: string) => callback(filePath);
    ipcRenderer.on('menu-import-save', handler);
    return () => ipcRenderer.removeListener('menu-import-save', handler);
  },
  onMenuAbout: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('menu-about', handler);
    return () => ipcRenderer.removeListener('menu-about', handler);
  },
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      saveGame: (slotId: string, state: any) => Promise<{ success: boolean; error?: string }>;
      loadGame: (slotId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
      listSaves: () => Promise<{ success: boolean; saves?: string[]; error?: string }>;
      deleteSave: (slotId: string) => Promise<{ success: boolean; error?: string }>;
      archiveBoutLog: (year: number, season: number, boutId: string, logData: string[]) => Promise<{ success: boolean; error?: string }>;
      retrieveBoutLog: (year: number, season: number, boutId: string) => Promise<{ success: boolean; data?: string[]; error?: string }>;
      archiveGazette: (season: number, week: number, markdown: string) => Promise<{ success: boolean; error?: string }>;
      retrieveGazette: (season: number, week: number) => Promise<{ success: boolean; data?: string; error?: string }>;
      storeGet: (key: string) => Promise<any>;
      storeSet: (key: string, value: any) => Promise<{ success: boolean }>;
      storeDelete: (key: string) => Promise<{ success: boolean }>;
      getAppInfo: () => Promise<{ name: string; version: string; platform: string }>;
      showNotification: (options: { title: string; body: string }) => Promise<{ success: boolean }>;
      onMenuNewGame: (callback: () => void) => () => void;
      onMenuSaveGame: (callback: () => void) => () => void;
      onMenuLoadGame: (callback: () => void) => () => void;
      onMenuExportSave: (callback: (filePath: string) => void) => () => void;
      onMenuImportSave: (callback: (filePath: string) => void) => () => void;
      onMenuAbout: (callback: () => void) => () => void;
    };
  }
}
