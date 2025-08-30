
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  
  openMini: () => ipcRenderer.send("open-mini"),

  
  updateSong: (data) => ipcRenderer.send("update-song", data),

  
  sendMiniControl: (action) => ipcRenderer.send("mini-control", action),

  
  onMiniControlFromMini: (cb) =>
    ipcRenderer.on("mini-control", (_e, action) => cb(action)),

  
  onSongUpdate: (cb) =>
    ipcRenderer.on("update-song", (_e, payload) => cb(payload)),
});
