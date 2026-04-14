"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // File system operations
    saveGame: (slotId, state) => electron_1.ipcRenderer.invoke('save-game', slotId, state),
    loadGame: (slotId) => electron_1.ipcRenderer.invoke('load-game', slotId),
    listSaves: () => electron_1.ipcRenderer.invoke('list-saves'),
    deleteSave: (slotId) => electron_1.ipcRenderer.invoke('delete-save', slotId),
    // Archive operations
    archiveBoutLog: (year, season, boutId, logData) => electron_1.ipcRenderer.invoke('archive-bout-log', year, season, boutId, logData),
    retrieveBoutLog: (year, season, boutId) => electron_1.ipcRenderer.invoke('retrieve-bout-log', year, season, boutId),
    archiveGazette: (season, week, markdown) => electron_1.ipcRenderer.invoke('archive-gazette', season, week, markdown),
    retrieveGazette: (season, week) => electron_1.ipcRenderer.invoke('retrieve-gazette', season, week),
    // Store operations (electron-store)
    storeGet: (key) => electron_1.ipcRenderer.invoke('store-get', key),
    storeSet: (key, value) => electron_1.ipcRenderer.invoke('store-set', key, value),
    storeDelete: (key) => electron_1.ipcRenderer.invoke('store-delete', key),
    // App info
    getAppInfo: () => electron_1.ipcRenderer.invoke('get-app-info'),
    // Notifications
    showNotification: (options) => electron_1.ipcRenderer.invoke('show-notification', options),
    // Menu event listeners
    onMenuNewGame: (callback) => {
        const handler = () => callback();
        electron_1.ipcRenderer.on('menu-new-game', handler);
        return () => electron_1.ipcRenderer.removeListener('menu-new-game', handler);
    },
    onMenuSaveGame: (callback) => {
        const handler = () => callback();
        electron_1.ipcRenderer.on('menu-save-game', handler);
        return () => electron_1.ipcRenderer.removeListener('menu-save-game', handler);
    },
    onMenuLoadGame: (callback) => {
        const handler = () => callback();
        electron_1.ipcRenderer.on('menu-load-game', handler);
        return () => electron_1.ipcRenderer.removeListener('menu-load-game', handler);
    },
    onMenuExportSave: (callback) => {
        const handler = (_event, filePath) => callback(filePath);
        electron_1.ipcRenderer.on('menu-export-save', handler);
        return () => electron_1.ipcRenderer.removeListener('menu-export-save', handler);
    },
    onMenuImportSave: (callback) => {
        const handler = (_event, filePath) => callback(filePath);
        electron_1.ipcRenderer.on('menu-import-save', handler);
        return () => electron_1.ipcRenderer.removeListener('menu-import-save', handler);
    },
    onMenuAbout: (callback) => {
        const handler = () => callback();
        electron_1.ipcRenderer.on('menu-about', handler);
        return () => electron_1.ipcRenderer.removeListener('menu-about', handler);
    },
});
