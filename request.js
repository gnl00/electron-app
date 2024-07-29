const getUserInfo = () => {
  // https://api.siliconflow.cn/v1/user/info
  fetch('https://api.siliconflow.cn/v1/user/info', {
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer sk-hryhgnnbhedrcosjlsrylsewcxpjcjejoyxsxgtcznykdmfz"
    }
  }).then(res => {
    console.log('response: ', res);
  }).catch(err => {
    console.log('error: ', err);
  })
}

module.exports = {
  getUserInfo
}