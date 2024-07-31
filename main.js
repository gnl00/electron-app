const { app, BrowserWindow, globalShortcut, clipboard, ipcMain } = require('electron')
const robot = require('robotjs');
const path = require('node:path')
const fs = require('node:fs');
const { ON_COPY, GET_APP_CONFIG, SAVE_CONFIG } = require('./constants')

const USER_CONFIG_PATH = app.getPath('userData')
const APP_CONFIG_FILE = path.join(USER_CONFIG_PATH, 'config.json')

const configData = {
  token: ''
};

const getAppConfigFunc = () => {
  const jsonStr = fs.readFileSync(APP_CONFIG_FILE)
  const json = JSON.parse(jsonStr)
  console.log('read config: ', json);
  return json
}

const initConfigFunc = () => {
  console.log('initing config file');
  if (!fs.existsSync(USER_CONFIG_PATH)) {
    fs.mkdirSync(USER_CONFIG_PATH);
  }

  if (!fs.existsSync(APP_CONFIG_FILE)) {
    fs.writeFileSync(APP_CONFIG_FILE, JSON.stringify({...configData}, null, 2))
  }
  console.log('inited config file');
}

const saveConfigFunc = (_, config) => {
  console.log('saving config', config);
  if (fs.existsSync(APP_CONFIG_FILE)) {
    fs.writeFileSync(APP_CONFIG_FILE, JSON.stringify({...configData, ...config}, null, 2))
    console.log('configured config file');
  }
}

ipcMain.handle(GET_APP_CONFIG, getAppConfigFunc)
ipcMain.handle(SAVE_CONFIG, saveConfigFunc)

app.whenReady().then(() => {
  console.log('user config path', USER_CONFIG_PATH);
  console.log('app config file', APP_CONFIG_FILE);
  initConfigFunc({})

  // TODO save shortcut to shortcut.json

  globalShortcut.register('CommandOrControl+G', () => {
    showWindow();
  })
  globalShortcut.register('CommandOrControl+Esc', () => {
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

    const selectedContent = clipboard.readText();
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
    width: 1080,
    height: 500,
    frame: false, // 无边框
    alwaysOnTop: true,
    focusable: true,
    resizable: true,
    webPreferences: {
      nodeIntegration: true, // 是否允许在渲染进程中执行 Node.js API
      enableDevTools: true,
      contextIsolation: true,
      // enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
}

const showWindow = () => {
  win.show()
}
