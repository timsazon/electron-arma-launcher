const electron = require('electron');
const app = electron.app;
const ipcMain = electron.ipcMain;
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const isDev = require('electron-is-dev');

const { autoUpdater } = require('electron-updater');

let mainWindow, ftpWindow;

function createWindows() {
  ftpWindow = new BrowserWindow({
    width: 1000,
    height: 500,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false
    }
  });
  ftpWindow.loadURL(isDev ? 'http://localhost:3000/ftp.html' : `file://${path.join(__dirname, '../build/ftp.html')}`);
  ftpWindow.webContents.openDevTools({
    detach: false
  });
  ftpWindow.on('close', () => app.quit());

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 600,
    minWidth: 1000,
    minHeight: 600,
    frame: false,
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: true
    }
  });
  mainWindow.setMenu(null);
  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`);
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  mainWindow.on('close', () => app.quit());

  setUpIpcHandlers();
}

function setUpIpcHandlers() {
  if (!mainWindow || !ftpWindow) return;

  ipcMain.on('ftp', (event, arg) => {
    try {
      ftpWindow.webContents.send('ftp', arg)
    } catch (e) {
    }
  });

  ipcMain.on('web', (event, arg) => {
    try {
      mainWindow.webContents.send('web', arg)
    } catch (e) {
    }
  });
}

app.on('ready', () => {
  app.setAppUserModelId("com.timsazon.newlife");
  autoUpdater.checkForUpdatesAndNotify();
  createWindows();
});

app.on('window-all-closed', () => {
  ipcMain.removeAllListeners();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindows();
  }
});