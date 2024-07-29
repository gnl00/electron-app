const inputBox = document.getElementById('ipt-box')
const btn = document.getElementById('btn')

let rawText

btn.addEventListener('click', async () => {
  const translateText = rawText.trim().replace(/\n/g, ' ');
  const result = await window.electronAPI.doTranslate({rawText: translateText});
  console.log('translate result: ', result);
})

const options = {
  method: 'GET',
  headers: {
    accept: "application/json",
    authorization: "Bearer sk-hryhgnnbhedrcosjlsrylsewcxpjcjejoyxsxgtcznykdmfz"
  }
}

const getUserInfo = () => {
  fetch('https://api.siliconflow.cn/v1/user/info', options)
  .then(res => res.json())
  .then(res => {
    console.log('response: ', res);
  }).catch(err => {
    console.log(err);
  })
}

window.addEventListener('DOMContentLoaded', async () => {
  // get from main process
  window.electronAPI.onUpdate(val => {
    console.log('selected contents: ', val);
    inputBox.value = val
    rawText = val
    appendTranslateBoard(inputBox)
  })
})

/**
 * appendTranslateBoard
 * @param {Document} roof
 * @returns {any}
 */
const appendTranslateBoard = (roof) => {
  let div = document.createElement("div");
  div.style.webkitAppRegion = 'no-drag';
  div.style.backgroundColor = '#999'
  console.log({roof});
  let p = document.createElement("p");
  p.innerText = 'translation board'
  div.append(p)
  roof.parentElement.append(div)
}