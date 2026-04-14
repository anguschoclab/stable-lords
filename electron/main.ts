import { app, BrowserWindow, ipcMain, Menu, dialog, shell, Tray, nativeImage } from 'electron';
import * as path from 'path';
import isDev from 'electron-is-dev';
import Store from 'electron-store';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import * as os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize electron-store for configuration
const store = new Store() as any;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// Get platform-specific save directory
function getSaveDirectory(): string {
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
    width: (store.get('windowBounds.width') as number) || 1400,
    height: (store.get('windowBounds.height') as number) || 900,
    x: store.get('windowBounds.x') as number | undefined,
    y: store.get('windowBounds.y') as number | undefined,
    minWidth: 1024,
    minHeight: 768,
    frame: true, // Start with frame, will implement custom title bar later
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
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
      store.set('windowBounds', bounds as any);
    }
  });

  mainWindow.on('move', () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds();
      store.set('windowBounds', bounds as any);
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
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(process.platform === 'darwin'
      ? [
          {
            label: app.getName(),
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const },
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
        { type: 'separator' as const },
        {
          label: 'Export Save',
          click: async () => {
            const result = await dialog.showSaveDialog(mainWindow!, {
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
            const result = await dialog.showOpenDialog(mainWindow!, {
              filters: [{ name: 'JSON Files', extensions: ['json'] }],
            });
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow?.webContents.send('menu-import-save', result.filePaths[0]);
            }
          },
        },
        { type: 'separator' as const },
        {
          label: process.platform === 'darwin' ? 'Quit' : 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          role: 'quit' as const,
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' as const },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        { role: 'selectAll' as const },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' as const },
        { role: 'forceReload' as const },
        { role: 'toggleDevTools' as const },
        { type: 'separator' as const },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' as const },
        { role: 'togglefullscreen' as const },
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

  const menu = Menu.buildFromTemplate(template);
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

// IPC Handlers for file operations
ipcMain.handle('save-game', async (_event, slotId: string, state: any) => {
  try {
    ensureSaveDirectory();
    const filePath = path.join(getSaveDirectory(), 'hot_state', `${slotId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Error saving game:', error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('load-game', async (_event, slotId: string) => {
  try {
    const filePath = path.join(getSaveDirectory(), 'hot_state', `${slotId}.json`);
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'Save file not found' };
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return { success: true, data: JSON.parse(data) };
  } catch (error) {
    console.error('Error loading game:', error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('list-saves', async () => {
  try {
    const hotStateDir = path.join(getSaveDirectory(), 'hot_state');
    if (!fs.existsSync(hotStateDir)) {
      return { success: true, saves: [] };
    }
    const files = fs.readdirSync(hotStateDir).filter(f => f.endsWith('.json'));
    return { success: true, saves: files.map(f => f.replace('.json', '')) };
  } catch (error) {
    console.error('Error listing saves:', error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('delete-save', async (_event, slotId: string) => {
  try {
    const filePath = path.join(getSaveDirectory(), 'hot_state', `${slotId}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return { success: true };
  } catch (error) {
    console.error('Error deleting save:', error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('archive-bout-log', async (_event, year: number, season: number, boutId: string, logData: string[]) => {
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
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('retrieve-bout-log', async (_event, year: number, season: number, boutId: string) => {
  try {
    const filePath = path.join(getSaveDirectory(), 'seasons', `season_${season}`, 'bouts', `${year}_${boutId}.json`);
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'Bout log not found' };
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return { success: true, data: JSON.parse(data) };
  } catch (error) {
    console.error('Error retrieving bout log:', error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('archive-gazette', async (_event, season: number, week: number, markdown: string) => {
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
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('retrieve-gazette', async (_event, season: number, week: number) => {
  try {
    const filePath = path.join(getSaveDirectory(), 'seasons', `season_${season}`, 'gazettes', `week_${week}.md`);
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'Gazette not found' };
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return { success: true, data };
  } catch (error) {
    console.error('Error retrieving gazette:', error);
    return { success: false, error: (error as Error).message };
  }
});

// IPC Handlers for electron-store
ipcMain.handle('store-get', async (_event, key: string) => {
  return store.get(key as any);
});

ipcMain.handle('store-set', async (_event, key: string, value: any) => {
  store.set(key as any, value);
  return { success: true };
});

ipcMain.handle('store-delete', async (_event, key: string) => {
  store.delete(key as any);
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
ipcMain.handle('show-notification', async (_event, options: { title: string; body: string }) => {
  const { Notification } = require('electron');
  new Notification({
    title: options.title,
    body: options.body,
  }).show();
  return { success: true };
});

// App lifecycle
app.whenReady().then(() => {
  ensureSaveDirectory();
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
