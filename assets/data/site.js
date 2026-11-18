/* 由 build.js 自动生成，勿手改 */
window.SITE = {
  "name": "JIE",
  "shortName": "JIE",
  "title": "JIE 的技术博客",
  "description": "记录我从零学习 AI 应用的过程：Prompt、RAG、Agent、工具调用，以及每一次踩坑后的顿悟。",
  "whoami": "// AI APPLICATION LEARNER — $ whoami",
  "since": 2026,
  "heroKicker": "你好，我是",
  "heroEmphasis": "JIE",
  "heroLine2": "把学 AI 的过程，写成能复用的笔记。",
  "github": "https://github.com/yujj1114",
  "siteUrl": "https://yujj1114.github.io/my-tech-blog",
  "rss": "/feed.xml",
  "nav": [
    {
      "label": "首页",
      "href": "index.html"
    },
    {
      "label": "博客",
      "href": "blog.html"
    },
    {
      "label": "项目",
      "href": "projects.html"
    },
    {
      "label": "标签",
      "href": "tags.html"
    },
    {
      "label": "归档",
      "href": "archive.html"
    },
    {
      "label": "关于",
      "href": "about.html"
    }
  ],
  "marquee": "Learn · Build · Share · 学 AI · 做应用 · 记踩坑 · 保持好奇 · ",
  "posts": [
    {
      "slug": "semantic-cache-cost",
      "category": "技术分享",
      "tags": [
        "AI",
        "成本优化",
        "学习笔记"
      ],
      "date": "2026-11-18",
      "title": "语义缓存踩坑记：命中率冲到 62%，我差点把「退款」答成「退货」",
      "excerpt": "给 AI 问答加语义缓存，延迟从 2.3 秒降到 80 毫秒、成本省了六成。但相似度阈值设错一点，两个完全不同的意图就会被当成同一个问题。",
      "reading": 9
    },
    {
      "slug": "vision-api-screenshots",
      "category": "技术分享",
      "tags": [
        "AI",
        "多模态",
        "实践"
      ],
      "date": "2026-11-18",
      "title": "把 NPI 的报错截图丢给视觉模型：我从 413 错误一路调到了可用",
      "excerpt": "以为多模态就是「传张图片问一句」，结果先撞 413 请求体过大，再遇上模型把错误码 NO 读成 N0。截图理解的关键不在模型，在送进去之前怎么处理图。",
      "reading": 10
    },
    {
      "slug": "temperature-and-sampling",
      "category": "技术分享",
      "tags": [
        "AI",
        "API",
        "学习笔记"
      ],
      "date": "2026-11-17",
      "title": "temperature 调多少？我把同一问题问了 100 遍",
      "excerpt": "「temperature=0.7 更有创意」这种说法到底靠不靠谱？我用一个分类任务跑了 100 次，统计不同参数下的输出分布，结果有点反直觉。",
      "reading": 8
    },
    {
      "slug": "why-i-learn-ai",
      "category": "随笔",
      "tags": [
        "AI",
        "学习笔记"
      ],
      "date": "2026-11-16",
      "title": "你好，AI：我为什么开始系统学习 AI 应用",
      "excerpt": "从「会用 ChatGPT」到「能做出一个 AI 应用」，中间隔着一条叫工程化的河。记录我为什么出发，以及打算怎么走。",
      "reading": 4
    },
    {
      "slug": "structured-output-json",
      "category": "技术分享",
      "tags": [
        "AI",
        "Prompt",
        "实践"
      ],
      "date": "2026-11-15",
      "title": "让模型稳定输出 JSON，我踩了格式解析的四个坑",
      "excerpt": "「只返回 JSON」这句话模型根本不听：有时裹着 markdown 代码块，有时多一句「好的」，有时字段缺胳膊少腿。记录我如何让输出变得可编程解析。",
      "reading": 9
    },
    {
      "slug": "first-llm-api",
      "category": "技术分享",
      "tags": [
        "AI",
        "API",
        "学习笔记"
      ],
      "date": "2026-11-14",
      "title": "第一次调用大模型 API：一个 Hello World 的完整记录",
      "excerpt": "申请 key、装 SDK、发第一条请求、看懂返回结构。把第一次调 API 的每一步和踩过的坑都记下来。",
      "reading": 9
    },
    {
      "slug": "embedding-model-choice",
      "category": "技术分享",
      "tags": [
        "AI",
        "RAG",
        "学习笔记"
      ],
      "date": "2026-11-13",
      "title": "Embedding 模型选型：我被「维度越高越好」骗了",
      "excerpt": "1536 维一定比 768 维强吗？中文场景该选哪个模型？我用同一个知识库对比了三款 Embedding，结论是：选错模型，后面全白搭。",
      "reading": 10
    },
    {
      "slug": "prompt-engineering-notes",
      "category": "技术分享",
      "tags": [
        "AI",
        "Prompt",
        "实践"
      ],
      "date": "2026-11-11",
      "title": "从 Prompt 到 Prompt Engineering：我踩过的几个坑",
      "excerpt": "「请帮我写一下」和「你是一位资深编辑，请把下面文字改写得简洁」——差别不只是礼貌，而是可复用的工程方法。",
      "reading": 7
    },
    {
      "slug": "streaming-output",
      "category": "技术分享",
      "tags": [
        "AI",
        "API",
        "实践"
      ],
      "date": "2026-11-11",
      "title": "流式输出：从「等待 8 秒」到「逐字出现」",
      "excerpt": "模型生成长文本要等好几秒，用户以为卡死了。接上流式输出后体验完全不同——记录 SSE 的实现和前端渲染的三个坑。",
      "reading": 7
    },
    {
      "slug": "multi-turn-context",
      "category": "学习笔记",
      "tags": [
        "AI",
        "Prompt",
        "学习笔记"
      ],
      "date": "2026-11-09",
      "title": "多轮对话聊久了就「失忆」，我做了个上下文管理器",
      "excerpt": "对话超过十几轮，模型开始忘掉前面的设定、重复问过的问题。这不是模型的锅，是上下文窗口管理没做好。记录我的三层解决方案。",
      "reading": 11
    },
    {
      "slug": "rag-first-try",
      "category": "技术分享",
      "tags": [
        "AI",
        "RAG",
        "实践"
      ],
      "date": "2026-11-08",
      "title": "RAG 入门：给大模型接上自己的知识库",
      "excerpt": "模型不知道我的笔记，怎么办？把文档切片、向量化、检索、再喂给模型——这就是 RAG。记录我的第一次完整尝试。",
      "reading": 11
    },
    {
      "slug": "prompt-injection",
      "category": "技术分享",
      "tags": [
        "AI",
        "安全",
        "学习笔记"
      ],
      "date": "2026-11-07",
      "title": "我的 AI 助手被「越狱」了：Prompt 注入入门",
      "excerpt": "用户在文档里藏了一句「忽略之前所有指令」，我的助手真的照做了。第一次见识 Prompt 注入，冷汗之后是认真的防护补课。",
      "reading": 12
    },
    {
      "slug": "agent-and-tools",
      "category": "技术分享",
      "tags": [
        "AI",
        "Agent",
        "学习笔记"
      ],
      "date": "2026-11-05",
      "title": "Agent 是什么？从「工具调用」说起",
      "excerpt": "让模型自己决定调用哪个函数、传什么参数——Tool Calling 是理解 Agent 的钥匙。用一个查天气的小例子讲清楚。",
      "reading": 10
    },
    {
      "slug": "reading-assistant",
      "category": "项目实践",
      "tags": [
        "AI",
        "Agent",
        "实践"
      ],
      "date": "2026-11-02",
      "title": "我用 AI 做了个读书笔记助手",
      "excerpt": "把学到的 Prompt、API、RAG 串起来，做了一个能读 PDF、自动提炼要点、还能追问的笔记助手。记录设计思路和踩坑。",
      "reading": 12
    }
  ],
  "projects": [
    {
      "tag": "AI",
      "name": "ai-retouch-agent",
      "desc": "AI 图片编辑器 - 自然语言驱动的图像编辑 Agent。"
    },
    {
      "tag": "TOOL",
      "name": "hardness-converter",
      "desc": "钢材硬度换算工具 - GB/T 33362 / ISO 18265 纯公式实现。"
    },
    {
      "tag": "TOOL",
      "name": "pdf-toolbox",
      "desc": "PDF 编辑工具箱 - Flask + PyInstaller 桌面应用。"
    },
    {
      "tag": "WEB",
      "name": "work-daily-report",
      "desc": "工作日报系统 - Flask + SQLite + Excel 导出。"
    },
    {
      "tag": "WEB",
      "name": "npi-file-manager",
      "desc": "NPI 工程文件管理系统 - Flask + SQLite + three.js。"
    }
  ],
  "notes": [
    {
      "date": "2026-11-16",
      "emoji": "🧪",
      "label": "折腾",
      "text": "把 prompt 做成模板加上版本号，终于不会因为改崩了而找不到上一版。工程习惯救了自己。"
    },
    {
      "date": "2026-11-15",
      "emoji": "🔧",
      "label": "踩坑",
      "text": "RAG 召回了一堆无关内容，加了关键词混合检索才好转。检索质量才是 RAG 的瓶颈。"
    },
    {
      "date": "2026-11-13",
      "emoji": "✨",
      "label": "小确幸",
      "text": "读书笔记助手跑通了第一次完整问答。从 PDF 到答案，整条链路终于串起来了。"
    }
  ]
};
