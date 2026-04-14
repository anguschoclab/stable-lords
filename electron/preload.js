const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // File system operations
    saveGame: (slotId, state) => ipcRenderer.invoke('save-game', slotId, state),
    loadGame: (slotId) => ipcRenderer.invoke('load-game', slotId),
    listSaves: () => ipcRenderer.invoke('list-saves'),
    deleteSave: (slotId) => ipcRenderer.invoke('delete-save', slotId),
    // Archive operations
    archiveBoutLog: (year, season, boutId, logData) => ipcRenderer.invoke('archive-bout-log', year, season, boutId, logData),
    retrieveBoutLog: (year, season, boutId) => ipcRenderer.invoke('retrieve-bout-log', year, season, boutId),
    archiveGazette: (season, week, markdown) => ipcRenderer.invoke('archive-gazette', season, week, markdown),
    retrieveGazette: (season, week) => ipcRenderer.invoke('retrieve-gazette', season, week),
    // Store operations (electron-store)
    storeGet: (key) => ipcRenderer.invoke('store-get', key),
    storeSet: (key, value) => ipcRenderer.invoke('store-set', key, value),
    storeDelete: (key) => ipcRenderer.invoke('store-delete', key),
    // App info
    getAppInfo: () => ipcRenderer.invoke('get-app-info'),
    // Notifications
    showNotification: (options) => ipcRenderer.invoke('show-notification', options),
});
