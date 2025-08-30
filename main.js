
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let mainWindow = null;
let miniPlayerWindow = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "src", "index.html"));
  mainWindow.on("closed", () => (mainWindow = null));
}

function createMiniPlayer() {
  if (miniPlayerWindow) {
    miniPlayerWindow.focus();
    return;
  }

  miniPlayerWindow = new BrowserWindow({
    width: 1000,
    height: 280,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    transparent: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  miniPlayerWindow.setMenuBarVisibility(false);
  miniPlayerWindow.loadFile(path.join(__dirname, "src", "mini.html"));

  miniPlayerWindow.on("closed", () => {
    miniPlayerWindow = null;
  });
}


app.whenReady().then(() => {

  app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});


ipcMain.on("open-mini", () => {
  createMiniPlayer();
});


ipcMain.on("update-song", (_evt, data) => {
  if (!miniPlayerWindow) return;
  miniPlayerWindow.webContents.send("update-song", data);
});


ipcMain.on("mini-control", (_evt, action) => {
  if (action === "close") {
    if (miniPlayerWindow) miniPlayerWindow.close();
    return;
  }
  if (mainWindow) mainWindow.webContents.send("mini-control", action);
});
