var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/main.ts
var import_electron = require("electron");
var path = __toESM(require("path"), 1);
var import_electron_is_dev = __toESM(require("electron-is-dev"), 1);
var import_electron_store = __toESM(require("electron-store"), 1);
var import_url = require("url");
var fs = __toESM(require("fs"), 1);
var os = __toESM(require("os"), 1);
var import_meta = {};
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = path.dirname(__filename);
var store = new import_electron_store.default();
var mainWindow = null;
var tray = null;
function getSaveDirectory() {
  const platform = process.platform;
  if (platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "Stable Lords");
  } else if (platform === "win32") {
    return path.join(process.env.APPDATA || "", "Stable Lords");
  } else {
    return path.join(os.homedir(), ".stable-lords");
  }
}
function ensureSaveDirectory() {
  const saveDir = getSaveDirectory();
  if (!fs.existsSync(saveDir)) {
    fs.mkdirSync(saveDir, { recursive: true });
  }
  const subdirs = ["hot_state", "seasons"];
  subdirs.forEach((dir) => {
    const dirPath = path.join(saveDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
}
function createWindow() {
  mainWindow = new import_electron.BrowserWindow({
    width: store.get("windowBounds.width") || 1400,
    height: store.get("windowBounds.height") || 900,
    x: store.get("windowBounds.x"),
    y: store.get("windowBounds.y"),
    minWidth: 1024,
    minHeight: 768,
    frame: true,
    // Start with frame, will implement custom title bar later
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    icon: path.join(__dirname, "../public/icons/icon-512.png")
  });
  if (import_electron_is_dev.default) {
    mainWindow.loadURL("http://localhost:8080");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  mainWindow.on("resize", () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds();
      store.set("windowBounds", bounds);
    }
  });
  mainWindow.on("move", () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds();
      store.set("windowBounds", bounds);
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    import_electron.shell.openExternal(url);
    return { action: "deny" };
  });
}
function createMenu() {
  const template = [
    ...process.platform === "darwin" ? [
      {
        label: import_electron.app.getName(),
        submenu: [
          { role: "about" },
          { type: "separator" },
          { role: "services" },
          { type: "separator" },
          { role: "hide" },
          { role: "hideOthers" },
          { role: "unhide" },
          { type: "separator" },
          { role: "quit" }
        ]
      }
    ] : [],
    {
      label: "File",
      submenu: [
        {
          label: "New Game",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            mainWindow?.webContents.send("menu-new-game");
          }
        },
        {
          label: "Save Game",
          accelerator: "CmdOrCtrl+S",
          click: () => {
            mainWindow?.webContents.send("menu-save-game");
          }
        },
        {
          label: "Load Game",
          accelerator: "CmdOrCtrl+O",
          click: () => {
            mainWindow?.webContents.send("menu-load-game");
          }
        },
        { type: "separator" },
        {
          label: "Export Save",
          click: async () => {
            const result = await import_electron.dialog.showSaveDialog(mainWindow, {
              defaultPath: `stablelords-save-${Date.now()}.json`,
              filters: [{ name: "JSON Files", extensions: ["json"] }]
            });
            if (!result.canceled && result.filePath) {
              mainWindow?.webContents.send("menu-export-save", result.filePath);
            }
          }
        },
        {
          label: "Import Save",
          click: async () => {
            const result = await import_electron.dialog.showOpenDialog(mainWindow, {
              filters: [{ name: "JSON Files", extensions: ["json"] }]
            });
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow?.webContents.send("menu-import-save", result.filePaths[0]);
            }
          }
        },
        { type: "separator" },
        {
          label: process.platform === "darwin" ? "Quit" : "Exit",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Alt+F4",
          role: "quit"
        }
      ]
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" }
      ]
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" }
      ]
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About",
          click: () => {
            mainWindow?.webContents.send("menu-about");
          }
        }
      ]
    }
  ];
  const menu = import_electron.Menu.buildFromTemplate(template);
  import_electron.Menu.setApplicationMenu(menu);
}
function createTray() {
  const iconPath = path.join(__dirname, "../public/icons/icon-192.png");
  const image = import_electron.nativeImage.createFromPath(iconPath);
  tray = new import_electron.Tray(image);
  const contextMenu = import_electron.Menu.buildFromTemplate([
    {
      label: "Show Stable Lords",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      }
    },
    {
      label: "New Game",
      click: () => {
        if (!mainWindow) createWindow();
        mainWindow?.webContents.send("menu-new-game");
      }
    },
    {
      label: "Load Game",
      click: () => {
        if (!mainWindow) createWindow();
        mainWindow?.webContents.send("menu-load-game");
      }
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        import_electron.app.quit();
      }
    }
  ]);
  tray.setToolTip("Stable Lords");
  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    } else {
      createWindow();
    }
  });
}
import_electron.ipcMain.handle("save-game", async (_event, slotId, state) => {
  try {
    ensureSaveDirectory();
    const filePath = path.join(getSaveDirectory(), "hot_state", `${slotId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
    return { success: true };
  } catch (error) {
    console.error("Error saving game:", error);
    return { success: false, error: error.message };
  }
});
import_electron.ipcMain.handle("load-game", async (_event, slotId) => {
  try {
    const filePath = path.join(getSaveDirectory(), "hot_state", `${slotId}.json`);
    if (!fs.existsSync(filePath)) {
      return { success: false, error: "Save file not found" };
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return { success: true, data: JSON.parse(data) };
  } catch (error) {
    console.error("Error loading game:", error);
    return { success: false, error: error.message };
  }
});
import_electron.ipcMain.handle("list-saves", async () => {
  try {
    const hotStateDir = path.join(getSaveDirectory(), "hot_state");
    if (!fs.existsSync(hotStateDir)) {
      return { success: true, saves: [] };
    }
    const files = fs.readdirSync(hotStateDir).filter((f) => f.endsWith(".json"));
    return { success: true, saves: files.map((f) => f.replace(".json", "")) };
  } catch (error) {
    console.error("Error listing saves:", error);
    return { success: false, error: error.message };
  }
});
import_electron.ipcMain.handle("delete-save", async (_event, slotId) => {
  try {
    const filePath = path.join(getSaveDirectory(), "hot_state", `${slotId}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return { success: true };
  } catch (error) {
    console.error("Error deleting save:", error);
    return { success: false, error: error.message };
  }
});
import_electron.ipcMain.handle("archive-bout-log", async (_event, year, season, boutId, logData) => {
  try {
    ensureSaveDirectory();
    const seasonDir = path.join(getSaveDirectory(), "seasons", `season_${season}`, "bouts");
    if (!fs.existsSync(seasonDir)) {
      fs.mkdirSync(seasonDir, { recursive: true });
    }
    const filePath = path.join(seasonDir, `${year}_${boutId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(logData, null, 2));
    return { success: true };
  } catch (error) {
    console.error("Error archiving bout log:", error);
    return { success: false, error: error.message };
  }
});
import_electron.ipcMain.handle("retrieve-bout-log", async (_event, year, season, boutId) => {
  try {
    const filePath = path.join(getSaveDirectory(), "seasons", `season_${season}`, "bouts", `${year}_${boutId}.json`);
    if (!fs.existsSync(filePath)) {
      return { success: false, error: "Bout log not found" };
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return { success: true, data: JSON.parse(data) };
  } catch (error) {
    console.error("Error retrieving bout log:", error);
    return { success: false, error: error.message };
  }
});
import_electron.ipcMain.handle("archive-gazette", async (_event, season, week, markdown) => {
  try {
    ensureSaveDirectory();
    const seasonDir = path.join(getSaveDirectory(), "seasons", `season_${season}`, "gazettes");
    if (!fs.existsSync(seasonDir)) {
      fs.mkdirSync(seasonDir, { recursive: true });
    }
    const filePath = path.join(seasonDir, `week_${week}.md`);
    fs.writeFileSync(filePath, markdown);
    return { success: true };
  } catch (error) {
    console.error("Error archiving gazette:", error);
    return { success: false, error: error.message };
  }
});
import_electron.ipcMain.handle("retrieve-gazette", async (_event, season, week) => {
  try {
    const filePath = path.join(getSaveDirectory(), "seasons", `season_${season}`, "gazettes", `week_${week}.md`);
    if (!fs.existsSync(filePath)) {
      return { success: false, error: "Gazette not found" };
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return { success: true, data };
  } catch (error) {
    console.error("Error retrieving gazette:", error);
    return { success: false, error: error.message };
  }
});
import_electron.ipcMain.handle("store-get", async (_event, key) => {
  return store.get(key);
});
import_electron.ipcMain.handle("store-set", async (_event, key, value) => {
  store.set(key, value);
  return { success: true };
});
import_electron.ipcMain.handle("store-delete", async (_event, key) => {
  store.delete(key);
  return { success: true };
});
import_electron.ipcMain.handle("get-app-info", async () => {
  return {
    name: import_electron.app.getName(),
    version: import_electron.app.getVersion(),
    platform: process.platform
  };
});
import_electron.ipcMain.handle("show-notification", async (_event, options) => {
  const { Notification } = require("electron");
  new Notification({
    title: options.title,
    body: options.body
  }).show();
  return { success: true };
});
import_electron.app.whenReady().then(() => {
  ensureSaveDirectory();
  createWindow();
  createMenu();
  createTray();
  import_electron.app.on("activate", () => {
    if (import_electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
import_electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    import_electron.app.quit();
  }
});
import_electron.app.on("before-quit", () => {
  if (tray) {
    tray.destroy();
  }
});
