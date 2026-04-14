import { app, BrowserWindow, ipcMain, Menu, dialog, shell, Tray, nativeImage, Notification } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple development mode check - force dev mode for now since we're testing
const isDev = true;
// Vite uses port 8080 by default, but may use 8081 if 8080 is in use
const devPort = process.env.VITE_PORT || '8080';

// Simple in-memory store for configuration (can be replaced with electron-store later)
const store = new Map();
let configPath: string;
let configSaveTimeout: NodeJS.Timeout | null = null;

// Load config from file
async function loadConfig() {
  if (!configPath) {
    console.warn('Config path not initialized yet');
    return;
  }
  try {
    try {
      await fs.access(configPath);
    } catch {
      return; // File doesn't exist, that's fine
    }
    const data = await fs.readFile(configPath, 'utf-8');
    const parsed = JSON.parse(data);
    Object.keys(parsed).forEach(key => store.set(key, parsed[key]));
  } catch (e) {
    console.error('Failed to load config:', e);
  }
}

// Save config to file (debounced)
function saveConfig() {
  if (configSaveTimeout) {
    clearTimeout(configSaveTimeout);
  }
  configSaveTimeout = setTimeout(async () => {
    if (!configPath) {
      console.warn('Config path not initialized yet');
      return;
    }
    try {
      const data = {};
      store.forEach((value, key) => {
        data[key] = value;
      });
      await fs.writeFile(configPath, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('Failed to save config:', e);
    }
  }, 500); // Debounce for 500ms
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
async function ensureSaveDirectory() {
  const saveDir = getSaveDirectory();
  try {
    await fs.access(saveDir);
  } catch {
    await fs.mkdir(saveDir, { recursive: true });
  }
  
  // Create subdirectories
  const subdirs = ['hot_state', 'seasons'];
  for (const dir of subdirs) {
    const dirPath = path.join(saveDir, dir);
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }
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
    console.log(`Loading from http://localhost:${devPort}`);
    mainWindow.loadURL(`http://localhost:${devPort}`)
      .catch(err => console.error('Failed to load URL:', err));
    mainWindow.webContents.openDevTools();
  } else {
    console.log(`Loading from ${path.join(__dirname, '../dist/index.html')}`);
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
      .catch(err => console.error('Failed to load file:', err));
  }

  // Log any loading errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', errorCode, errorDescription, validatedURL);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`Renderer [${level}]: ${message} (${sourceId}:${line})`);
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('Renderer process gone:', details);
  });

  // Check if preload script loaded
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript('window.electronAPI ? "preload loaded" : "preload NOT loaded"')
      .then(result => console.log('Preload script status:', result))
      .catch(err => console.error('Failed to check preload:', err));
  });

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
  // Validate slot ID format
  function validateSlotId(slotId: string): boolean {
    return typeof slotId === 'string' && slotId.length > 0 && /^[a-zA-Z0-9_-]+$/.test(slotId);
  }

  // Validate season and week numbers
  function validateSeasonWeek(value: number): boolean {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0;
  }

  // Validate year
  function validateYear(value: number): boolean {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 9999;
  }

  // Validate bout ID
  function validateBoutId(boutId: string): boolean {
    return typeof boutId === 'string' && boutId.length > 0 && /^[a-zA-Z0-9_-]+$/.test(boutId);
  }

  ipcMain.handle('save-game', async (_event, slotId, state) => {
    try {
      if (!validateSlotId(slotId)) {
        return { success: false, error: 'Invalid slot ID format' };
      }
      if (!state || typeof state !== 'object') {
        return { success: false, error: 'Invalid state data' };
      }
      await ensureSaveDirectory();
      const filePath = path.join(getSaveDirectory(), 'hot_state', `${slotId}.json`);
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
      return { success: true };
    } catch (error) {
      console.error('Error saving game:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('load-game', async (_event, slotId) => {
    try {
      if (!validateSlotId(slotId)) {
        return { success: false, error: 'Invalid slot ID format' };
      }
      const filePath = path.join(getSaveDirectory(), 'hot_state', `${slotId}.json`);
      try {
        await fs.access(filePath);
      } catch {
        return { success: false, error: 'Save file not found' };
      }
      const data = await fs.readFile(filePath, 'utf-8');
      return { success: true, data: JSON.parse(data) };
    } catch (error) {
      console.error('Error loading game:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('list-saves', async () => {
    try {
      const saveDir = path.join(getSaveDirectory(), 'hot_state');
      try {
        await fs.access(saveDir);
      } catch {
        return { success: true, data: [] };
      }
      const files = await fs.readdir(saveDir);
      const saveIds = files
        .filter((f: string) => f.endsWith('.json'))
        .map((f: string) => f.replace('.json', ''))
        .filter(validateSlotId);
      return { success: true, data: saveIds };
    } catch (error) {
      console.error('Error listing saves:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('delete-save', async (_event, slotId) => {
    try {
      if (!validateSlotId(slotId)) {
        return { success: false, error: 'Invalid slot ID format' };
      }
      const filePath = path.join(getSaveDirectory(), 'hot_state', `${slotId}.json`);
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
      } catch {
        // File doesn't exist, that's fine
      }
      return { success: true };
    } catch (error) {
      console.error('Error deleting save:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('archive-bout-log', async (_event, year, season, boutId, logData) => {
    try {
      if (!validateYear(year)) {
        return { success: false, error: 'Invalid year' };
      }
      if (!validateSeasonWeek(season)) {
        return { success: false, error: 'Invalid season' };
      }
      if (!validateBoutId(boutId)) {
        return { success: false, error: 'Invalid bout ID format' };
      }
      if (!Array.isArray(logData)) {
        return { success: false, error: 'Invalid log data format' };
      }
      await ensureSaveDirectory();
      const seasonDir = path.join(getSaveDirectory(), 'seasons', `season_${season}`, 'bouts');
      try {
        await fs.access(seasonDir);
      } catch {
        await fs.mkdir(seasonDir, { recursive: true });
      }
      const filePath = path.join(seasonDir, `${year}_${boutId}.json`);
      await fs.writeFile(filePath, JSON.stringify(logData, null, 2));
      return { success: true };
    } catch (error) {
      console.error('Error archiving bout log:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('retrieve-bout-log', async (_event, year, season, boutId) => {
    try {
      if (!validateYear(year)) {
        return { success: false, error: 'Invalid year' };
      }
      if (!validateSeasonWeek(season)) {
        return { success: false, error: 'Invalid season' };
      }
      if (!validateBoutId(boutId)) {
        return { success: false, error: 'Invalid bout ID format' };
      }
      const filePath = path.join(getSaveDirectory(), 'seasons', `season_${season}`, 'bouts', `${year}_${boutId}.json`);
      try {
        await fs.access(filePath);
      } catch {
        return { success: false, error: 'Bout log not found' };
      }
      const data = await fs.readFile(filePath, 'utf-8');
      return { success: true, data: JSON.parse(data) };
    } catch (error) {
      console.error('Error retrieving bout log:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('archive-gazette', async (_event, season, week, markdown) => {
    try {
      if (!validateSeasonWeek(season)) {
        return { success: false, error: 'Invalid season' };
      }
      if (!validateSeasonWeek(week)) {
        return { success: false, error: 'Invalid week' };
      }
      if (typeof markdown !== 'string') {
        return { success: false, error: 'Invalid markdown format' };
      }
      await ensureSaveDirectory();
      const seasonDir = path.join(getSaveDirectory(), 'seasons', `season_${season}`, 'gazettes');
      try {
        await fs.access(seasonDir);
      } catch {
        await fs.mkdir(seasonDir, { recursive: true });
      }
      const filePath = path.join(seasonDir, `week_${week}.md`);
      await fs.writeFile(filePath, markdown);
      return { success: true };
    } catch (error) {
      console.error('Error archiving gazette:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('retrieve-gazette', async (_event, season, week) => {
    try {
      if (!validateSeasonWeek(season)) {
        return { success: false, error: 'Invalid season' };
      }
      if (!validateSeasonWeek(week)) {
        return { success: false, error: 'Invalid week' };
      }
      const filePath = path.join(getSaveDirectory(), 'seasons', `season_${season}`, 'gazettes', `week_${week}.md`);
      try {
        await fs.access(filePath);
      } catch {
        return { success: false, error: 'Gazette not found' };
      }
      const data = await fs.readFile(filePath, 'utf-8');
      return { success: true, data };
    } catch (error) {
      console.error('Error retrieving gazette:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // IPC Handlers for store
  ipcMain.handle('store-get', async (_event, key) => {
    if (typeof key !== 'string' || key.length === 0) {
      return null;
    }
    return store.get(key);
  });

  ipcMain.handle('store-set', async (_event, key, value) => {
    if (typeof key !== 'string' || key.length === 0) {
      return { success: false, error: 'Invalid key' };
    }
    store.set(key, value);
    saveConfig();
    return { success: true };
  });

  ipcMain.handle('store-delete', async (_event, key) => {
    if (typeof key !== 'string' || key.length === 0) {
      return { success: false, error: 'Invalid key' };
    }
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
    if (!options || typeof options !== 'object') {
      return { success: false, error: 'Invalid options' };
    }
    if (typeof options.title !== 'string' || options.title.length === 0) {
      return { success: false, error: 'Invalid notification title' };
    }
    if (typeof options.body !== 'string' || options.body.length === 0) {
      return { success: false, error: 'Invalid notification body' };
    }
    new Notification({
      title: options.title,
      body: options.body,
    }).show();
    return { success: true };
  });
}
app.whenReady().then(async () => {
  // Initialize config path now that app is ready
  configPath = path.join(app.getPath('userData'), 'config.json');
  await loadConfig();
  
  await ensureSaveDirectory();
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
