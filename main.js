const { app, BrowserWindow, globalShortcut, clipboard, contextBridge, ipcMain, ipcRenderer } = require('electron')
const robot = require('robotjs');
const path = require('node:path')
const { ON_COPY } = require('./constants')

let selectedContent = ''
app.whenReady().then(() => {
  globalShortcut.register('CommandOrControl+G', () => {
    showWindow();
  })
  globalShortcut.register('Esc', () => {
    win.hide()
  })

  createWindow();
})

app.on('will-quit', () => {})

let win;
const createWindow = () => {
  win = initWindow();

  win.on('show', () => {
    win.webContents.focus()

    // 模拟按下 Ctrl 键（Windows/Linux）或 Cmd 键（macOS）
    if (process.platform === 'darwin') {
      robot.keyTap('c', 'command');
      robot.keyTap('c', 'command');
    } else {
      robot.keyTap('c', 'control');
      robot.keyTap('c', 'control');
    }

    selectedContent = clipboard.readText();
    console.log('from clipboard: ', selectedContent);
    // send to renderer process
    win.webContents.send(ON_COPY, selectedContent)
  })

  win.on('blur', () => {
    console.log('on blur');
    win.hide()
  })

  win.loadFile('index.html');
  win.webContents.openDevTools(); // error "Request Autofill.enable failed. {"code":-32601,"message":"'Autofill.enable' wasn't found"}"
}

const initWindow = () => {
  return new BrowserWindow({
    width: 800,
    height: 285,
    frame: false, // 无边框
    alwaysOnTop: true,
    focusable: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true, // 是否允许在渲染进程中执行 Node.js API
      enableDevTools: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
}

const showWindow = () => {
  win.show()
}
