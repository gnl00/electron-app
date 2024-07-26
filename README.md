# e-app

## 踩坑

1、failed to install electron, edit `~/.npmrc`

```text
registry=https://registry.npmmirror.com
electron_mirror=https://cdn.npmmirror.com/binaries/electron/
electron_builder_binaries_mirror=https://npmmirror.com/mirrors/electron-builder-binaries/
```

2、failed to install robotjs on Ubuntu 22.04 lts

```shell
sudo apt-get install libxtst-dev libpng++-dev python3 python-is-python3 gcc
```

3、failed to start electron by yarn after install robotjs

```shell
npm install -g node-gyp
npm install -D electron-rebuild
npx electron-rebuild -f -t prod,optional,dev -w robotjs
```

4、terminal 中不显示 renderer 线程的 log

只有开启 DevTools，才能在 DevTools 中的 console 看到 renderer 线程的 log，terminal 只输出 main 线程的 log

## Run

```shell
yarn start
```

## 线程通信

1、使用 ipcRenderer.send
> 可双向通信，from electron 7，目前更加推荐 ipcMain.handle/ipcRenderer.invoke

`main.js`

```js
// 监听来自渲染进程的消息
ipcMain.on('message-from-renderer', (event, arg) => {
  console.log(arg);

  // 向渲染进程发送回复
  event.reply('message-from-main', 'Hello from main process');
});
```

`renderer.js`

```js
// receive
ipcRenderer.on('message-from-main', (event, arg) => {
  console.log(arg);
})
// send
ipcRenderer.send('message-from-renderer', 'ping')
```

2、使用 ipcMain.handle/ipcRenderer.invoke
> 双向通信

`constants.js`

```js
module.exports = {
  FROM_RENDERER: 'from-renderer',
  FROM_MAIN: 'from-main'
}
```

`main.js`

```js
ipcMain.handle(FROM_RENDERER, (evt, arg) => {
  console.log('msg received in main ', arg);
})

ipcMain.handle(FROM_MAIN, () => 'message from main')
```

`preload.js`

```js
const { contextBridge, ipcRenderer } = require('electron');
const { FROM_RENDERER, FROM_MAIN } = require('./apiConstants')

contextBridge.exposeInMainWorld('electronAPI', {
  fromRenderer: (arg) => ipcRenderer.invoke(FROM_RENDERER, arg),
  fromMain: () => ipcRenderer.invoke(FROM_MAIN),
})
```

`renderer.js`

```js
// from renderer
window.electronAPI.fromRenderer('msg from renderer')

// from main
const result = await window.electronAPI.fromMain()
console.log(result);
```

3、webContents.send 主线程主动推送消息到渲染线程

`main.js`

```js
win.webContents.send('update', selectedContent)
```

`preload.js`

```js
contextBridge.exposeInMainWorld('electronAPI', {
  onUpdate: (callback) => ipcRenderer.on('update', (_event, val) => callback(val))
})
```

`renderer.js`

```js
window.addEventListener('DOMContentLoaded', async () => {
  window.electronAPI.onUpdate(val => {
    console.log(val);
  })
})
```