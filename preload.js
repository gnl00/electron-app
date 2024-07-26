const { contextBridge, ipcRenderer } = require('electron');
const { FROM_RENDERER, FROM_MAIN, ON_COPY } = require('./constants')

contextBridge.exposeInMainWorld('electronAPI', {
  fromRenderer: (arg) => ipcRenderer.invoke(FROM_RENDERER, arg),
  fromMain: () => ipcRenderer.invoke(FROM_MAIN),
  onUpdate: (callback) => ipcRenderer.on(ON_COPY, (_event, val) => callback(val))
})