// preload.ts
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("electronAPI", {
  // File system operations
  saveGame: (slotId, state) => import_electron.ipcRenderer.invoke("save-game", slotId, state),
  loadGame: (slotId) => import_electron.ipcRenderer.invoke("load-game", slotId),
  listSaves: () => import_electron.ipcRenderer.invoke("list-saves"),
  deleteSave: (slotId) => import_electron.ipcRenderer.invoke("delete-save", slotId),
  // Archive operations
  archiveBoutLog: (year, season, boutId, logData) => import_electron.ipcRenderer.invoke("archive-bout-log", year, season, boutId, logData),
  retrieveBoutLog: (year, season, boutId) => import_electron.ipcRenderer.invoke("retrieve-bout-log", year, season, boutId),
  archiveGazette: (season, week, markdown) => import_electron.ipcRenderer.invoke("archive-gazette", season, week, markdown),
  retrieveGazette: (season, week) => import_electron.ipcRenderer.invoke("retrieve-gazette", season, week),
  // Store operations (electron-store)
  storeGet: (key) => import_electron.ipcRenderer.invoke("store-get", key),
  storeSet: (key, value) => import_electron.ipcRenderer.invoke("store-set", key, value),
  storeDelete: (key) => import_electron.ipcRenderer.invoke("store-delete", key),
  // App info
  getAppInfo: () => import_electron.ipcRenderer.invoke("get-app-info"),
  // Notifications
  showNotification: (options) => import_electron.ipcRenderer.invoke("show-notification", options),
  // Menu event listeners
  onMenuNewGame: (callback) => {
    const handler = () => callback();
    import_electron.ipcRenderer.on("menu-new-game", handler);
    return () => import_electron.ipcRenderer.removeListener("menu-new-game", handler);
  },
  onMenuSaveGame: (callback) => {
    const handler = () => callback();
    import_electron.ipcRenderer.on("menu-save-game", handler);
    return () => import_electron.ipcRenderer.removeListener("menu-save-game", handler);
  },
  onMenuLoadGame: (callback) => {
    const handler = () => callback();
    import_electron.ipcRenderer.on("menu-load-game", handler);
    return () => import_electron.ipcRenderer.removeListener("menu-load-game", handler);
  },
  onMenuExportSave: (callback) => {
    const handler = (_event, filePath) => callback(filePath);
    import_electron.ipcRenderer.on("menu-export-save", handler);
    return () => import_electron.ipcRenderer.removeListener("menu-export-save", handler);
  },
  onMenuImportSave: (callback) => {
    const handler = (_event, filePath) => callback(filePath);
    import_electron.ipcRenderer.on("menu-import-save", handler);
    return () => import_electron.ipcRenderer.removeListener("menu-import-save", handler);
  },
  onMenuAbout: (callback) => {
    const handler = () => callback();
    import_electron.ipcRenderer.on("menu-about", handler);
    return () => import_electron.ipcRenderer.removeListener("menu-about", handler);
  }
});
