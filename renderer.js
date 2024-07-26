const inputBox = document.getElementById('ipt-box')

window.addEventListener('DOMContentLoaded', async () => {
  // get from main process
  window.electronAPI.onUpdate(val => {
    console.log(val);
    inputBox.value = val
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