const options = {
  method: 'GET',
  headers: {
    accept: "application/json",
    authorization: "Bearer sk-xxx"
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

module.exports = {
  getUserInfo
}