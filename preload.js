const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
    'api', {
        closeWindow: () => ipcRenderer.send('close-window')
    }
);
