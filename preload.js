const { contextBridge, ipcRenderer, shell } = require('electron');
const { FROM_RENDERER, FROM_MAIN, ON_COPY, GET_APP_CONFIG, SAVE_CONFIG } = require('./constants');

const translatePrompt = `
你将扮演两个角色，一个精通英文俚语和擅长中文表达的翻译家； 另一个角色是一个精通英文和中文的校对者，能够理解英文的俚语、深层次意思，也同样擅长中文表达。

每次我都会给你一句英文：
1. 请你先作为翻译家，把它翻译成中文，用尽可能地道的中文表达。在翻译之前，你应该先提取英文句子或者段落中的关键词组，先解释它们的意思，再翻译。
2. 然后你扮演校对者，审视原文和译文，检查原文和译文中意思有所出入的地方，提出修改意见
3. 最后，你再重新扮演翻译家，根据修改意见重新翻译，得到最后的译文

你的回答应该遵循以下的格式：

### 分析
{重复以下列表，列出需要关键词组，解释它的意思}
- 关键词组{1...n}:
  - 词组：{English}
  - 释义：{该词组表达什么意思，会用在什么地方}


### 译文初稿
{结合以上分析，翻译得到的译文}

### 校对
{重复以下列表，列出可能需要修改的地方}
- 校对意见{1...n}:
  - 原文：{English}
  - 译文：{相关译文}
  - 问题：{原文跟译文意见有哪些出入，或者译文的表达不够地道的地方}
  - 建议：{应如何修改}

### 译文终稿
{结合以上意见，最终翻译得到的译文}

`

const tokenPrefix = 'Bearer '
let token = ''

let headers = {
  accept: "application/json",
  authorization: tokenPrefix + token
}

let postHeaders = {
  ...headers,
  'content-type': 'application/json',
}

const initPostHeaders = async () => {
  const config = await ipcRenderer.invoke(GET_APP_CONFIG)
  console.log('preload got config', config);
  postHeaders = {
    ...postHeaders,
    authorization: tokenPrefix + config.token
  }
}

initPostHeaders()

const initMessage = {
  role: 'user',
  content: translatePrompt
}

// Qwen/Qwen2-1.5B-Instruct
// Qwen/Qwen2-7B-Instruct
// deepseek-ai/DeepSeek-V2-Chat
// 01-ai/Yi-1.5-9B-Chat-16K
// THUDM/glm-4-9b-chat
const defaultModel = 'THUDM/glm-4-9b-chat'

const translateFunc = async ({text = translatePrompt, model = defaultModel}) => {
  console.log('raw text: ', text);
  console.log('translate model: ', model);
  console.log('translating');

  if (!text) {
    console.log('no translate content');
    return;
  }

  const json = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
    method: 'POST',
    headers: postHeaders,
    body: JSON.stringify({
      model: model,
      messages: [
        {...initMessage},
        {
          role: 'user',
          content: text
        }
      ],
      stream: false,
      max_tokens: 512,
      temperature: 0.7,
      top_p: 0.7,
      top_k: 50,
      frequency_penalty: 0.5,
      n: 1
    })
  }).then(response => response.json())
  .catch(err => {
    console.log('ERROR', err);
  })

  return json
}

// 封装方法并暴露给 renderer 线程
contextBridge.exposeInMainWorld('electronAPI', {
  fromRenderer: (arg) => ipcRenderer.invoke(FROM_RENDERER, arg),
  fromMain: () => ipcRenderer.invoke(FROM_MAIN),
  onUpdate: (callback) => ipcRenderer.on(ON_COPY, (_event, val) => callback(val)),
  doTranslate: translateFunc,
  getAppConfig: () => ipcRenderer.invoke(GET_APP_CONFIG),
  saveAppConfig: config => ipcRenderer.invoke(SAVE_CONFIG, config),
  openInExternalBrowser: url => shell.openExternal(url)
})