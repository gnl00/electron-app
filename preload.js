const { contextBridge, ipcRenderer } = require('electron');
const { FROM_RENDERER, FROM_MAIN, ON_COPY } = require('./constants');

// const translatePrompt = `
// 你是一位精通简体中文的专业翻译，我希望你能帮我将以下英文视频字幕翻译成中文。  
// 规则： 
// - 这些字幕可能和机器学习或AI等专业知识相关，注意翻译时术语的准确性。
// - 译文需要通俗、简洁、易懂。 
// - 保留特定的英文术语或名字，并在其前后加上空格，例如“中 English 文” 
// - 字幕在语音识别时可能有错别字，请注意纠错 
// - 本条消息包含完整的字幕内容，但你不需要翻译，只需要回复OK 
// - 我会分段在后续消息中发送给你翻译，每次你只需要翻译一段。  
// - 翻译时采用以下步骤，每一步都完整打印结果。
// 1. 第一步，按照字面意思直译翻译这一段文本内容 
// 2. 第二步，参照第一步直译的结果，结合上下文，对内容进行意译 
// 3. 第三步，参照直译和意译的结果，结合上下文，采用创意的方式对结果进行翻译 
// 4. 第四步，现在假设你是个中学语文老师，阅读上面三个翻译结果，然后融合所有翻译结果的优点，重写翻译结果，忠于原意，符合上下文，通俗易懂
// `

const translatePrompt = `
你是一位精通简体中文的专业翻译，尤其擅长将专业学术论文翻译成浅显易懂的科普文章。请你帮我将以下英文段落翻译成中文，风格与中文科普读物相似。

规则：
- 翻译内容以“【翻译内容开始】”为翻译内容起始位置，以“【翻译内容结束】”为翻译内容结束位置，只翻译在“【翻译内容开始】”到“【翻译内容结束】”这两个位置之内的文本。
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

策略：

分三步进行翻译工作，并打印每步的结果：
1. 根据英文内容直译，保持原有格式，不要遗漏任何信息
2. 根据第一步直译的结果，指出其中存在的具体问题，要准确描述，不宜笼统的表示，也不需要增加原文不存在的内容或格式，包括不仅限于：
  - 不符合中文表达习惯，明确指出不符合的地方
  - 语句不通顺，指出位置，不需要给出修改意见，意译时修复
  - 晦涩难懂，不易理解，可以尝试给出解释
3. 根据第一步直译的结果和第二步指出的问题，重新进行意译，保证内容的原意的基础上，使其更易于理解，更符合中文的表达习惯，同时保持原有的格式不变

返回格式如下，"{xxx}"表示占位符：

### 直译
{直译结果}

***

### 问题
{直译的具体问题列表}

***

### 意译
{意译结果}

***

接下来是需要你翻译的内容：
【翻译内容开始】\n
`

const translatePromptSuffix = "\n【翻译内容结束】。"

const headers = {
  accept: "application/json",
  authorization: "Bearer sk-hryhgnnbhedrcosjlsrylsewcxpjcjejoyxsxgtcznykdmfz"
}

const postHeaders = {
  ...headers,
  'content-type': 'application/json',
}

// Qwen/Qwen2-1.5B-Instruct
// Qwen/Qwen2-7B-Instruct
// deepseek-ai/DeepSeek-V2-Chat
const translateFunc = ({rawText: text, model = 'deepseek-ai/DeepSeek-V2-Chat'}) => {
  console.log('raw text: ', text);
  console.log('translate model: ', model);
  console.log('translating');

  fetch('https://api.siliconflow.cn/v1/chat/completions', {
    method: 'POST',
    headers: postHeaders,
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'user',
          content: translatePrompt + text + translatePromptSuffix
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
  })
  .then(response => response.json())
  .then(response => {
    console.log(response);
    return response;
  })
  .catch(err => console.error(err));
}

// 封装方法并暴露给 renderer 线程
contextBridge.exposeInMainWorld('electronAPI', {
  fromRenderer: (arg) => ipcRenderer.invoke(FROM_RENDERER, arg),
  fromMain: () => ipcRenderer.invoke(FROM_MAIN),
  onUpdate: (callback) => ipcRenderer.on(ON_COPY, (_event, val) => callback(val)),
  doTranslate: translateFunc
})