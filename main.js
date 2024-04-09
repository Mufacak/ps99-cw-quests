const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let win;

function createWindow () {
  win = new BrowserWindow({
    width: 600,
    height: 320,
    icon: path.join(__dirname, 'favicon.ico'),
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: true
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

ipcMain.on('close-window', () => {
  if (win) {
    win.close();
  }
});

app.on('window-all-closed', () => {
  //  if (process.platform !== 'darwin') {
    app.quit();
  //  }
});
