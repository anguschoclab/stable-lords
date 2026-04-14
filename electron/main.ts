import { app, BrowserWindow, ipcMain, Menu, dialog, shell, Tray, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// Simple development mode check
const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_IS_DEV === 'true';

// Simple in-memory store for configuration (can be replaced with electron-store later)
const store = new Map();
let configPath;

// Load config from file
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(data);
      Object.keys(parsed).forEach(key => store.set(key, parsed[key]));
    }
  } catch (e) {
    console.error('Failed to load config:', e);
  }
}

// Save config to file
function saveConfig() {
  try {
    const data = {};
    store.forEach((value, key) => {
      data[key] = value;
    });
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed to save config:', e);
  }
}

let mainWindow = null;
let tray = null;

// Get platform-specific save directory
function getSaveDirectory() {
  const platform = process.platform;
  if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Stable Lords');
  } else if (platform === 'win32') {
    return path.join(process.env.APPDATA || '', 'Stable Lords');
  } else {
    return path.join(os.homedir(), '.stable-lords');
  }
}

// Ensure save directory exists
function ensureSaveDirectory() {
  const saveDir = getSaveDirectory();
  if (!fs.existsSync(saveDir)) {
    fs.mkdirSync(saveDir, { recursive: true });
  }
  
  // Create subdirectories
  const subdirs = ['hot_state', 'seasons'];
  subdirs.forEach(dir => {
    const dirPath = path.join(saveDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: (store.get('windowBounds.width')) || 1400,
    height: (store.get('windowBounds.height')) || 900,
    x: store.get('windowBounds.x'),
    y: store.get('windowBounds.y'),
    minWidth: 1024,
    minHeight: 768,
    frame: true, // Start with frame, will implement custom title bar later
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    icon: path.join(__dirname, '../public/icons/icon-512.png'),
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Save window bounds on resize/move
  mainWindow.on('resize', () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds();
      store.set('windowBounds', bounds);
      saveConfig();
    }
  });

  mainWindow.on('move', () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds();
      store.set('windowBounds', bounds);
      saveConfig();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function createMenu() {
  const template = [
    ...(process.platform === 'darwin'
      ? [
          {
            label: app.getName(),
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Game',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('menu-new-game');
          },
        },
        {
          label: 'Save Game',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow?.webContents.send('menu-save-game');
          },
        },
        {
          label: 'Load Game',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow?.webContents.send('menu-load-game');
          },
        },
        { type: 'separator' },
        {
          label: 'Export Save',
          click: async () => {
            const result = await dialog.showSaveDialog(mainWindow, {
              defaultPath: `stablelords-save-${Date.now()}.json`,
              filters: [{ name: 'JSON Files', extensions: ['json'] }],
            });
            if (!result.canceled && result.filePath) {
              mainWindow?.webContents.send('menu-export-save', result.filePath);
            }
          },
        },
        {
          label: 'Import Save',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              filters: [{ name: 'JSON Files', extensions: ['json'] }],
            });
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow?.webContents.send('menu-import-save', result.filePaths[0]);
            }
          },
        },
        { type: 'separator' },
        {
          label: process.platform === 'darwin' ? 'Quit' : 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          role: 'quit',
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            mainWindow?.webContents.send('menu-about');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template as any);
  Menu.setApplicationMenu(menu);
}

function createTray() {
  const iconPath = path.join(__dirname, '../public/icons/icon-192.png');
  const image = nativeImage.createFromPath(iconPath);
  
  tray = new Tray(image);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Stable Lords',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      },
    },
    {
      label: 'New Game',
      click: () => {
        if (!mainWindow) createWindow();
        mainWindow?.webContents.send('menu-new-game');
      },
    },
    {
      label: 'Load Game',
      click: () => {
        if (!mainWindow) createWindow();
        mainWindow?.webContents.send('menu-load-game');
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);
  
  tray.setToolTip('Stable Lords');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
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

function registerIPCHandlers() {
  ipcMain.handle('save-game', async (_event, slotId, state) => {
    try {
      ensureSaveDirectory();
      const filePath = path.join(getSaveDirectory(), 'hot_state', `${slotId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
      return { success: true };
    } catch (error) {
      console.error('Error saving game:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('load-game', async (_event, slotId) => {
    try {
      const filePath = path.join(getSaveDirectory(), 'hot_state', `${slotId}.json`);
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'Save file not found' };
      }
      const data = fs.readFileSync(filePath, 'utf-8');
      return { success: true, data: JSON.parse(data) };
    } catch (error) {
      console.error('Error loading game:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-save', async (_event, slotId) => {
    try {
      const filePath = path.join(getSaveDirectory(), 'hot_state', `${slotId}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return { success: true };
    } catch (error) {
      console.error('Error deleting save:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('archive-bout-log', async (_event, year, season, boutId, logData) => {
    try {
      ensureSaveDirectory();
      const seasonDir = path.join(getSaveDirectory(), 'seasons', `season_${season}`, 'bouts');
      if (!fs.existsSync(seasonDir)) {
        fs.mkdirSync(seasonDir, { recursive: true });
      }
      const filePath = path.join(seasonDir, `${year}_${boutId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(logData, null, 2));
      return { success: true };
    } catch (error) {
      console.error('Error archiving bout log:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('retrieve-bout-log', async (_event, year, season, boutId) => {
    try {
      const filePath = path.join(getSaveDirectory(), 'seasons', `season_${season}`, 'bouts', `${year}_${boutId}.json`);
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'Bout log not found' };
      }
      const data = fs.readFileSync(filePath, 'utf-8');
      return { success: true, data: JSON.parse(data) };
    } catch (error) {
      console.error('Error retrieving bout log:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('archive-gazette', async (_event, season, week, markdown) => {
    try {
      ensureSaveDirectory();
      const seasonDir = path.join(getSaveDirectory(), 'seasons', `season_${season}`, 'gazettes');
      if (!fs.existsSync(seasonDir)) {
        fs.mkdirSync(seasonDir, { recursive: true });
      }
      const filePath = path.join(seasonDir, `week_${week}.md`);
      fs.writeFileSync(filePath, markdown);
      return { success: true };
    } catch (error) {
      console.error('Error archiving gazette:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('retrieve-gazette', async (_event, season, week) => {
    try {
      const filePath = path.join(getSaveDirectory(), 'seasons', `season_${season}`, 'gazettes', `week_${week}.md`);
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'Gazette not found' };
      }
      const data = fs.readFileSync(filePath, 'utf-8');
      return { success: true, data };
    } catch (error) {
      console.error('Error retrieving gazette:', error);
      return { success: false, error: error.message };
    }
  });

  // IPC Handlers for store
  ipcMain.handle('store-get', async (_event, key) => {
    return store.get(key);
  });

  ipcMain.handle('store-set', async (_event, key, value) => {
    store.set(key, value);
    saveConfig();
    return { success: true };
  });

  ipcMain.handle('store-delete', async (_event, key) => {
    store.delete(key);
    saveConfig();
    return { success: true };
  });

  // IPC Handler for app info
  ipcMain.handle('get-app-info', async () => {
    return {
      name: app.getName(),
      version: app.getVersion(),
      platform: process.platform,
    };
  });

  // IPC Handler for notifications
  ipcMain.handle('show-notification', async (_event, options) => {
    const { Notification } = require('electron');
    new Notification({
      title: options.title,
      body: options.body,
    }).show();
    return { success: true };
  });
}
app.whenReady().then(() => {
  // Initialize config path now that app is ready
  configPath = path.join(app.getPath('userData'), 'config.json');
  loadConfig();
  
  ensureSaveDirectory();
  registerIPCHandlers();
  createWindow();
  createMenu();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (tray) {
    tray.destroy();
  }
});
