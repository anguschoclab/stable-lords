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
});
