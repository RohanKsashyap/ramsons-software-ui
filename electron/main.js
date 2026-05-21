const { app, BrowserWindow } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const PROD_URL = 'https://ramsons-accounting-software.vercel.app'; // Replace with your actual deployed URL

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../public/icon.png'),
    title: "Ramsons Accounting"
  });

  if (isDev) {
    mainWindow.loadURL('https://ramsons-accounting-software.vercel.app');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the deployed URL
    mainWindow.loadURL(PROD_URL);
  }

  // Handle broken links/refresh on routes
  mainWindow.webContents.on('did-fail-load', () => {
    if (!isDev) {
      mainWindow.loadURL(PROD_URL);
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
