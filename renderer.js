const btn = document.getElementById('btn')
const inputBox = document.getElementById('ipt-box')

window.addEventListener('DOMContentLoaded', async () => {
  // get from main process
  window.electronAPI.onUpdate(val => {
    console.log(val);
    inputBox.value = val
  })
})