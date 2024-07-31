const tokenIpt = document.getElementById('ipt-tk')
const tokenBtn = document.getElementById('btn-tk')
const tokenEditBtn = document.getElementById('btn-tk-edit')
const tokenGetBtn = document.getElementById('btn-tk-get')
const inputBox = document.getElementById('ipt-box')
const btn = document.getElementById('btn')

let token;
let rawText;
/**
 * @type {Boolean}
 * @description check if translate board is init
 */
let translateBoardInited = false;
/**
 * @type {Document}c
 * @description the traslate board component
 */
let translateBoard;

// on renderer loaded
window.addEventListener('DOMContentLoaded', async () => {

  window.electronAPI.getAppConfig()
  .then(config => {
    console.log('renderer got app config', config);
    if (config && config.token) {
      tokenIpt.value = token = config.token
      disableTokenEdit()
    }
    
  })

  // get from main process
  window.electronAPI.onUpdate(val => {
    console.log('on selected');
    // remove all translateBoard's children nodes
    if (translateBoard) {
      removeAllChildrenNodes(translateBoard)
    }

    console.log('selected contents: ', val);
    inputBox.value = val
    rawText = val
  })
})

tokenBtn.addEventListener('click', () => {
  const token = tokenIpt.value
  if (!token) {
    return
  }

  // save token to local config file
  window.electronAPI.saveAppConfig({token: token})

  // token saved
  disableTokenEdit()
})

const disableTokenEdit = () => {
  tokenIpt.setAttribute('disabled', 'disabled')
  tokenBtn.setAttribute('disabled', 'disabled')
}

const enableTokenEdit = () => {
  tokenIpt.disabled = false
  tokenBtn.disabled = false
}

tokenEditBtn.addEventListener('click', () => {
  enableTokenEdit()
})

tokenGetBtn.addEventListener('click', () => {
  window.electronAPI.openInExternalBrowser('https://cloud-hk.siliconflow.cn/account/ak')
})

btn.addEventListener('click', async () => {
  if (!rawText) {
    rawText = inputBox.value
  }
  const translateText = rawText.trim().replace(/\n/g, ' ');
  const jsonResult = await window.electronAPI.doTranslate({text: translateText});
  console.log(jsonResult);
  if (jsonResult.choices.length < 0) {
    console.log('get target result failed');
    return
  }
  const answerChoice = jsonResult.choices[0]
  const targetText = answerChoice.message.content
  console.log(targetText);
  // append target text to board
  appendTranslateBoard(inputBox, targetText)
})

/**
 * appendTranslateBoard
 * @param {Document} roof
 * @returns {any}
 */
const appendTranslateBoard = (roof, content) => {
  console.log('translate board init?', translateBoardInited);
  if (!translateBoardInited) {
    translateBoard = initTranslateBoard()
    // console.log({roof});
    // append translate board comopent as roof's neibour
    roof.parentElement.append(translateBoard)

    translateBoardInited = true
  }

  if (content) {
    // remove all translateBoard's children nodes
    removeAllChildrenNodes(translateBoard)
    // append new translate target text
    let p = document.createElement("p");
    p.innerText = content
  
    translateBoard.append(p)
  }
}

/**
 * remove Document's all children nodes
 * @param {Document} doc
 * @returns {void}
 */
const removeAllChildrenNodes = (doc) => {
  // remove all translateBoard's child node
  while (doc.firstChild) {
    doc.removeChild(doc.firstChild);
  }
}

/**
 * init translate board
 * @returns {Document}
 */
const initTranslateBoard = () => {
  const div = document.createElement("div");
  div.style.webkitAppRegion = 'no-drag';
  div.style.backgroundColor = '#ccc'
  return div
}