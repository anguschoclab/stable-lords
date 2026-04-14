"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const electron_is_dev_1 = __importDefault(require("electron-is-dev"));
const electron_store_1 = __importDefault(require("electron-store"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
// Initialize electron-store for configuration
const store = new electron_store_1.default();
let mainWindow = null;
let tray = null;
// Get platform-specific save directory
function getSaveDirectory() {
    const platform = process.platform;
    if (platform === 'darwin') {
        return path.join(os.homedir(), 'Library', 'Application Support', 'Stable Lords');
    }
    else if (platform === 'win32') {
        return path.join(process.env.APPDATA || '', 'Stable Lords');
    }
    else {
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
    mainWindow = new electron_1.BrowserWindow({
        width: store.get('windowBounds.width') || 1400,
        height: store.get('windowBounds.height') || 900,
        x: store.get('windowBounds.x'),
        y: store.get('windowBounds.y'),
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
    if (electron_is_dev_1.default) {
        mainWindow.loadURL('http://localhost:8080');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
    // Save window bounds on resize/move
    mainWindow.on('resize', () => {
        if (mainWindow) {
            const bounds = mainWindow.getBounds();
            store.set('windowBounds', bounds);
        }
    });
    mainWindow.on('move', () => {
        if (mainWindow) {
            const bounds = mainWindow.getBounds();
            store.set('windowBounds', bounds);
        }
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        electron_1.shell.openExternal(url);
        return { action: 'deny' };
    });
}
function createMenu() {
    const template = [
        ...(process.platform === 'darwin'
            ? [
                {
                    label: electron_1.app.getName(),
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
                        const result = await electron_1.dialog.showSaveDialog(mainWindow, {
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
                        const result = await electron_1.dialog.showOpenDialog(mainWindow, {
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
    const menu = electron_1.Menu.buildFromTemplate(template);
    electron_1.Menu.setApplicationMenu(menu);
}
function createTray() {
    const iconPath = path.join(__dirname, '../public/icons/icon-192.png');
    const image = electron_1.nativeImage.createFromPath(iconPath);
    tray = new electron_1.Tray(image);
    const contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: 'Show Stable Lords',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
                else {
                    createWindow();
                }
            },
        },
        {
            label: 'New Game',
            click: () => {
                if (!mainWindow)
                    createWindow();
                mainWindow?.webContents.send('menu-new-game');
            },
        },
        {
            label: 'Load Game',
            click: () => {
                if (!mainWindow)
                    createWindow();
                mainWindow?.webContents.send('menu-load-game');
            },
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                electron_1.app.quit();
            },
        },
    ]);
    tray.setToolTip('Stable Lords');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            }
            else {
                mainWindow.show();
                mainWindow.focus();
            }
        }
        else {
            createWindow();
        }
    });
}
// IPC Handlers for file operations
electron_1.ipcMain.handle('save-game', async (_event, slotId, state) => {
    try {
        ensureSaveDirectory();
        const filePath = path.join(getSaveDirectory(), 'hot_state', `${slotId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
        return { success: true };
    }
    catch (error) {
        console.error('Error saving game:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('load-game', async (_event, slotId) => {
    try {
        const filePath = path.join(getSaveDirectory(), 'hot_state', `${slotId}.json`);
        if (!fs.existsSync(filePath)) {
            return { success: false, error: 'Save file not found' };
        }
        const data = fs.readFileSync(filePath, 'utf-8');
        return { success: true, data: JSON.parse(data) };
    }
    catch (error) {
        console.error('Error loading game:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('list-saves', async () => {
    try {
        const hotStateDir = path.join(getSaveDirectory(), 'hot_state');
        if (!fs.existsSync(hotStateDir)) {
            return { success: true, saves: [] };
        }
        const files = fs.readdirSync(hotStateDir).filter(f => f.endsWith('.json'));
        return { success: true, saves: files.map(f => f.replace('.json', '')) };
    }
    catch (error) {
        console.error('Error listing saves:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('delete-save', async (_event, slotId) => {
    try {
        const filePath = path.join(getSaveDirectory(), 'hot_state', `${slotId}.json`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        return { success: true };
    }
    catch (error) {
        console.error('Error deleting save:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('archive-bout-log', async (_event, year, season, boutId, logData) => {
    try {
        ensureSaveDirectory();
        const seasonDir = path.join(getSaveDirectory(), 'seasons', `season_${season}`, 'bouts');
        if (!fs.existsSync(seasonDir)) {
            fs.mkdirSync(seasonDir, { recursive: true });
        }
        const filePath = path.join(seasonDir, `${year}_${boutId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(logData, null, 2));
        return { success: true };
    }
    catch (error) {
        console.error('Error archiving bout log:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('retrieve-bout-log', async (_event, year, season, boutId) => {
    try {
        const filePath = path.join(getSaveDirectory(), 'seasons', `season_${season}`, 'bouts', `${year}_${boutId}.json`);
        if (!fs.existsSync(filePath)) {
            return { success: false, error: 'Bout log not found' };
        }
        const data = fs.readFileSync(filePath, 'utf-8');
        return { success: true, data: JSON.parse(data) };
    }
    catch (error) {
        console.error('Error retrieving bout log:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('archive-gazette', async (_event, season, week, markdown) => {
    try {
        ensureSaveDirectory();
        const seasonDir = path.join(getSaveDirectory(), 'seasons', `season_${season}`, 'gazettes');
        if (!fs.existsSync(seasonDir)) {
            fs.mkdirSync(seasonDir, { recursive: true });
        }
        const filePath = path.join(seasonDir, `week_${week}.md`);
        fs.writeFileSync(filePath, markdown);
        return { success: true };
    }
    catch (error) {
        console.error('Error archiving gazette:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('retrieve-gazette', async (_event, season, week) => {
    try {
        const filePath = path.join(getSaveDirectory(), 'seasons', `season_${season}`, 'gazettes', `week_${week}.md`);
        if (!fs.existsSync(filePath)) {
            return { success: false, error: 'Gazette not found' };
        }
        const data = fs.readFileSync(filePath, 'utf-8');
        return { success: true, data };
    }
    catch (error) {
        console.error('Error retrieving gazette:', error);
        return { success: false, error: error.message };
    }
});
// IPC Handlers for electron-store
electron_1.ipcMain.handle('store-get', async (_event, key) => {
    return store.get(key);
});
electron_1.ipcMain.handle('store-set', async (_event, key, value) => {
    store.set(key, value);
    return { success: true };
});
electron_1.ipcMain.handle('store-delete', async (_event, key) => {
    store.delete(key);
    return { success: true };
});
// IPC Handler for app info
electron_1.ipcMain.handle('get-app-info', async () => {
    return {
        name: electron_1.app.getName(),
        version: electron_1.app.getVersion(),
        platform: process.platform,
    };
});
// IPC Handler for notifications
electron_1.ipcMain.handle('show-notification', async (_event, options) => {
    const { Notification } = require('electron');
    new Notification({
        title: options.title,
        body: options.body,
    }).show();
    return { success: true };
});
// App lifecycle
electron_1.app.whenReady().then(() => {
    ensureSaveDirectory();
    createWindow();
    createMenu();
    createTray();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('before-quit', () => {
    if (tray) {
        tray.destroy();
    }
});
