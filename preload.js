const { contextBridge, ipcRenderer, shell } = require('electron');
const { FROM_RENDERER, FROM_MAIN, ON_COPY, GET_APP_CONFIG, SAVE_CONFIG } = require('./constants');

const translatePrompt = `
现在你要帮忙将一段英文内容翻译成简体中文给大学生阅读。


请你帮我将以下英文翻译成中文，语言风格与中文科普读物相似。在翻译之前，你应该先提取英文句子或者段落中的关键词组，先解释它们的意思，最后再翻译。

规则：
- 翻译时要准确传达原文的事实和背景。
- 即使上意译也要保留原始段落格式，以及保留术语，例如 FLAC，JPEG 等。保留公司缩写，例如 Microsoft, Amazon, OpenAI 等。
- 人名不翻译
- 同时要保留引用的论文，例如 [20] 这样的引用。
- 对于 Figure 和 Table，翻译的同时保留原有格式，例如：“Figure 1: ”翻译为“图 1: ”，“Table 1: ”翻译为：“表 1: ”。
- 全角括号换成半角括号，并在左括号前面加半角空格，右括号后面加半角空格。
- 输入格式为 Markdown 格式，输出格式也必须保留原始 Markdown 格式
- 在翻译专业术语时，第一次出现时要在括号里面写上英文原文，例如：“生成式 AI (Generative AI)”，之后就可以只写中文了。
- 以下是常见的 AI 相关术语词汇对应表（English -> 中文）：
  * Transformer -> Transformer
  * Token -> Token
  * LLM/Large Language Model -> 大语言模型
  * Zero-shot -> 零样本
  * Few-shot -> 少样本
  * AI Agent -> AI 智能体
  * AGI -> 通用人工智能
- 如果需要翻译的内容是一个单词，直接将单词翻译成中文即可

现在有三个角色：
- 专业英文翻译家，精通英文，熟练掌握英文俚语，并且熟练掌握中文，能清晰准确的表达中文。
- 专业中文老师，精通中文，擅长得体的中文表达，擅长将使用中文撰写通俗易懂的科普文
- 专业校对者，精通中文和英文，擅长校对审查和翻译

策略：
分三步进行翻译工作，并打印每步的结果：
1. 现在你是专业英文翻译家，请根据英文内容直译，翻译时保持原始英文的段落结构，不要合并分段，不要遗漏任何信息
2. 现在扮演中文老师，精通中文，擅长写通俗易懂的科普文章，对英语老师翻译的内容重新意译，遵守原意的前提下让内容更通俗易懂，符合中文表达习惯，但不要增加和删减内容，保持原始分段
3. 英文老师将中文老师的文稿反向翻译成英文（回译稿）
4. 扮演专业校对者，精通中文和英文，校对回译稿和原稿中的区别，重点检查两点：翻译稿和原文有出入的位置；不符合中文表达习惯的位置；
根据直译和回译，保持原文内容或格式，准确描述其中存在的具体问题，不宜笼统的表示，包括不仅限于：
  - 不符合中文表达习惯，明确指出不符合的地方
  - 语句不通顺，指出位置，不需要给出修改意见，意译时修复
  - 晦涩难懂，不易理解，可以尝试给出解释
3. 中文老师根据指出的问题，修改初稿，重新进行意译，保证翻译内容原来的意思，使其更易于理解，更符合中文的表达习惯。注意：保持原有的格式不变，如果有补充说明，在翻译完之后使用括号输出。

4. 你的回答应该遵循以下的格式，"{xxx}"表示占位符：

### 直译
{直接翻译英文内容}

***

### 初稿
{中文老师意译初稿}

***

### 分析
{校对意见}
{分析直译结果存在的问题，重复以下列表，列出需要关键词组，解释它的意思}
- 关键词组{1...n}:
  - 词组：{English}
  - 释义：{该词组表达什么意思，会用在什么地方}

***

### 终稿
{中文老师翻译终稿，结合以上分析，最终翻译得到的译文。保持原文内容给出最终译文，不要过度扩展译文的内容}

***
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
const defaultModel = 'Qwen/Qwen2-7B-Instruct'

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