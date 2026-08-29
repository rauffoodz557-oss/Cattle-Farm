const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

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
// Electron has no built-in Chrome-style Print Preview (with paper size /
// scale controls on screen) — only a bare OS print dialog. So instead we
// render the bill to a PDF and open it in the user's default PDF viewer
// (Edge / Acrobat / etc.), whose own print dialog looks and works just
// like Chrome's Print Preview: paper size (A4/A6), scale, live preview.
ipcMain.handle('do-print', async () => {
  if (!win) return { success: false };
  try {
    const pdfBuffer = await win.webContents.printToPDF({
      printBackground: true
    });
    const tempPath = path.join(os.tmpdir(), `bill-${Date.now()}.pdf`);
    fs.writeFileSync(tempPath, pdfBuffer);
    await shell.openPath(tempPath);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
