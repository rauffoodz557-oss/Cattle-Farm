const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let win;

function createWindow () {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Renderer (app.js via preload) asks main process to print.
// silent:false forces the native OS print dialog to appear,
// where the user can pick printer, paper size (A4/A6) and scale.
ipcMain.handle('do-print', () => {
  return new Promise((resolve) => {
    if (!win) return resolve(false);
    win.webContents.print(
      {
        silent: false,
        printBackground: true
      },
      (success, errorType) => {
        resolve({ success, errorType });
      }
    );
  });
});
