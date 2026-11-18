/* ============================================================
 * config.js —— 全站唯一内容源
 * 改博客只需要动这个文件：署名、简介、导航、文章、短记。
 * 纯静态，无需构建；file:// 双击打开即可运行。
 *
 * 【署名】JIE。改 name / shortName / title / heroEmphasis
 * 即可全局更新导航、页脚、Hero 与各页标题。
 * ============================================================ */

window.SITE = {
  /* ---- 站点身份 ---- */
  name: "JIE",
  shortName: "JIE",
  title: "JIE 的技术博客",
  description: "记录我从零学习 AI 应用的过程：Prompt、RAG、Agent、工具调用，以及每一次踩坑后的顿悟。",
  whoami: "// AI APPLICATION LEARNER — $ whoami",
  since: 2026,
  heroKicker: "你好，我是",
  heroEmphasis: "JIE",
  heroLine2: "把学 AI 的过程，写成能复用的笔记。",
  github: "https://github.com/yujj1114",
  /* 线上正式域名：用于 canonical / OG / sitemap / RSS。改这里后跑一次 node build.js */
  siteUrl: "https://yujj1114.github.io/my-tech-blog/",
  rss: "/feed.xml",

  /* ---- 顶部导航 ---- */
  nav: [
    { label: "首页", href: "index.html" },
    { label: "博客", href: "blog.html" },
    { label: "项目", href: "projects.html" },
    { label: "标签", href: "tags.html" },
    { label: "归档", href: "archive.html" },
    { label: "关于", href: "about.html" }
  ],

  /* ---- 跑马灯文案（单条）---- */
  marquee: "Learn · Build · Share · 学 AI · 做应用 · 记踩坑 · 保持好奇 · ",

  /* ---- 文章数据 ---- */
  posts: [
    {
      slug: "semantic-cache-cost",
      category: "技术分享",
      tags: ["AI", "成本优化", "学习笔记"],
      date: "2026-11-18",
      title: "语义缓存踩坑记：命中率冲到 62%，我差点把「退款」答成「退货」",
      excerpt: "给 AI 问答加语义缓存，延迟从 2.3 秒降到 80 毫秒、成本省了六成。但相似度阈值设错一点，两个完全不同的意图就会被当成同一个问题。",
      reading: 9,
      content: `
        <p>读书笔记助手上线后我发现一个浪费：同一个问题，一天内被问了十几次，每次都老老实实调用模型，慢且烧钱。于是我加了语义缓存——不比对字符串是否完全相同，而是比对问题的向量是否足够接近。上线一周，命中率 62%，p95 延迟从 2.3 秒降到 80 毫秒。但中间踩的几个坑，比省下的钱更值得记。</p>
        <h2>第一版：先用精确缓存探路</h2>
        <p>我最早只做了精确匹配：把用户输入原样做 MD5 当 key。命中率只有 19%，因为用户几乎不会一字不差地重复提问。语义缓存的思路是把问题向量化，在缓存库里找余弦相似度最高的一条，超过阈值就复用答案。</p>
        <pre><code>def cached_answer(q, threshold=0.95):
    qv = embed(q)                      # 和问题库同一个 embedding 模型
    hit = cache.search(qv, top_k=1)
    if hit and hit.score >= threshold:
        metrics.inc("cache_hit")
        return hit.answer
    ans = llm.answer(q)
    cache.add(qv, q, ans, version=PROMPT_VER)
    return ans</code></pre>
        <h2>坑一：阈值 0.85 把「退款」和「退货」合并了</h2>
        <p>我一开始把阈值设成 0.85，命中率漂亮地冲到 78%。直到有用户问「怎么退款」，系统返回了「请寄回商品」——缓存里躺着的是「怎么退货」的答案。这两句话嵌入后相似度 0.88，但业务意图完全相反。我把阈值提到 0.95，命中率回落到 62%，但这类错误消失了。<strong>缓存的代价不是少命中几次，而是答错一次的可信度损失。</strong></p>
        <h2>坑二：缓存 key 没带 prompt 版本号</h2>
        <p>更隐蔽的一次：我改了 prompt 的输出格式，用户却持续拿到旧格式答案。排查半天才发现缓存里存的是上一次 prompt 生成的结果，而 key 只有问题本身。加上版本号后，prompt 一变缓存自动失效——我把这个字段写进 key，而不是等它慢慢过期。</p>
        <h2>坑三：时效性内容根本不该缓存</h2>
        <p>有用户问「今天有多少新文件」，缓存把上午的答案给了下午的人。我给缓存加了一层白名单：只有静态知识类问题（概念解释、操作说明）才进缓存，涉及「今天、最新、当前」的问题直接跳过。规则很土，但比一刀切靠谱。</p>
        <h2>成本账与结论</h2>
        <p>一周内总共 1840 次问答，命中 1141 次，省下约 26 万 token，按当前价格大概 ¥3.9——数字不大，但 p95 延迟从 2300ms 降到 80ms，体感提升比省钱更明显。结论：<strong>语义缓存是延迟优化手段，顺便省钱；阈值宁高勿低，key 一定带版本，时效内容直接放行。</strong>缓存命中的是「答案可复用」这个判断，而判断错了，比不缓存更贵。</p>
      `
    },
    {
      slug: "vision-api-screenshots",
      category: "技术分享",
      tags: ["AI", "多模态", "实践"],
      date: "2026-11-18",
      title: "把 NPI 的报错截图丢给视觉模型：我从 413 错误一路调到了可用",
      excerpt: "以为多模态就是「传张图片问一句」，结果先撞 413 请求体过大，再遇上模型把错误码 NO 读成 N0。截图理解的关键不在模型，在送进去之前怎么处理图。",
      reading: 10,
      content: `
        <p>我在 NPI 系统里排查问题，经常要对着同事发来的报错截图眯着眼找错误码——字小、压缩糊、还要来回放大。于是我想做个小工具：把截图丢给视觉模型，直接让它读出错误码并解释原因。听起来是「传张图 + 问一句」的十分钟活，实际调了两天。</p>
        <h2>第一个坑：413 请求体过大</h2>
        <p>我直接把一张 1920x1080 的截图读成 base64 塞进请求，第一次调用就返回 <code>413 Request Entity Too Large</code>——原图 4.8MB，base64 编码后膨胀约 33%，超过网关 6MB 的限制。先做有损压缩并限制长边到 1568 像素，体积降到 340KB，请求才通。</p>
        <pre><code>from PIL import Image
import io, base64

img = Image.open(path).convert("RGB")
img.thumbnail((1568, 1568))          # 长边限制
buf = io.BytesIO()
img.save(buf, format="JPEG", quality=82, optimize=True)
b64 = base64.b64encode(buf.getvalue()).decode()
# data URL: "data:image/jpeg;base64," + b64</code></pre>
        <h2>第二个坑：detail=low 省 token，但看不清小字</h2>
        <p>视觉 API 的 <code>detail</code> 参数直接影响计费：<code>low</code> 固定约 85 tokens，<code>high</code> 按图块算，1568x1080 的图约 1105 tokens。我为了省钱全用 <code>low</code>，结果模型把错误码 <code>NO_2026</code> 读成了 <code>N0_2026</code>——字母 O 和数字 0 在压缩后的小字里糊成一团。这个错误很致命：按错误码去查文档，查到的完全是另一条。</p>
        <h2>真正有效的办法：先裁剪再放大</h2>
        <p>我把策略改成两步：先用 <code>high</code> 让模型定位报错区域的大致坐标，再用 PIL 把那块区域裁出来、放大 3 倍、单独送一次。第二次调用只处理局部，token 反而比整图 <code>high</code> 少，错误码识别准确率从 71% 提到 96%。<strong>把「看清」这件事交给预处理，而不是指望模型更强。</strong></p>
        <h2>一个意外收获：让模型输出结构化结果</h2>
        <p>最初我让它「告诉我错误码和原因」，输出总是一段话，程序没法用。改成要求返回 JSON：<code>{"code": "...", "reason": "...", "confidence": 0.9}</code>，并给 <code>confidence</code> 设阈值——低于 0.75 就不自动填单，转人工。这样既自动处理了大部分常见报错，又不至于因为一次误读把工单写错。</p>
        <h2>结论</h2>
        <p>多模态调用的难点不在 API 本身，而在「送进去之前」：尺寸、压缩、区域裁剪、计费模式，每一步都影响结果。我现在的默认配置是：长边 1568、JPEG quality 82、先 <code>high</code> 定位再局部放大、输出带置信度的结构化结果。两天踩坑换来的这几行配置，比换更强的模型管用得多。</p>
      `
    },
    {
      slug: "temperature-and-sampling",
      category: "技术分享",
      tags: ["AI", "API", "学习笔记"],
      date: "2026-11-17",
      title: "temperature 调多少？我把同一问题问了 100 遍",
      excerpt: "「temperature=0.7 更有创意」这种说法到底靠不靠谱？我用一个分类任务跑了 100 次，统计不同参数下的输出分布，结果有点反直觉。",
      reading: 8,
      content: `
        <p>网上流传一条口诀：写创意调高 temperature，做分类调低。听着合理，但我一直想知道「高多少、低多少」有没有依据。于是我拿一个情感分类任务，把 temperature 从 0 调到 1.2，每个值跑 100 次，统计准确率。</p>
        <h2>实验设置</h2>
        <p>同一批 50 条标注好的评论，模型用 gpt-4o-mini，唯一变量是 temperature。为了确保是采样随机性而非模型波动，每条重复跑两轮。三个小时，约 1000 次调用，成本不到两块钱。</p>
        <h2>结果反直觉</h2>
        <p>temperature=0 时准确率 94%，=0.3 时 93%，=0.7 掉到 88%，=1.0 只剩 79%。也就是说，<strong>凡是需要稳定、可复现的任务，就该老老实实用 0</strong>。「0.7 更有创意」在分类任务上只会制造错误。</p>
        <pre><code># 分类/抽取/代码：确定性优先
temperature=0.0
# 头脑风暴/改写：才考虑放高
temperature=0.8, top_p=0.9</code></pre>
        <h2>一个更重要的发现</h2>
        <p>temperature=0 也并非 100% 可复现。同一条输入跑两次，仍有极小概率输出不同——服务端批处理、浮点精度都会引入微扰。所以关键系统里，光靠 temperature=0 不够，还得在应用层做输出校验和重试。</p>
        <h2>结论</h2>
        <p>别把 temperature 当玄学旋钮。先问自己这个任务要不要「发散」：不要，就用 0；要，再小步试。用数据说话，比背口诀靠谱。</p>
      `
    },
    {
      slug: "structured-output-json",
      category: "技术分享",
      tags: ["AI", "Prompt", "实践"],
      date: "2026-11-15",
      title: "让模型稳定输出 JSON，我踩了格式解析的四个坑",
      excerpt: "「只返回 JSON」这句话模型根本不听：有时裹着 markdown 代码块，有时多一句「好的」，有时字段缺胳膊少腿。记录我如何让输出变得可编程解析。",
      reading: 9,
      content: `
        <p>做 AI 应用绕不开一件事：把模型的自然语言输出变成程序能吃的结构化数据。我最早的解法就是在 prompt 末尾加一句「只返回 JSON，不要其他内容」——结果这句话被模型当成耳边风。</p>
        <h2>四个真实的翻车现场</h2>
        <p>① 输出被 <code>\`\`\`json ... \`\`\`</code> 代码块包裹；② 前面加一句「好的，这是结果：」；③ 偶尔漏字段或把数字写成字符串；④ 中文引号、尾随逗号导致 <code>JSON.parse</code> 直接崩。每一种都让我写过临时 <code>replace</code> 去擦屁股，越擦越乱。</p>
        <h2>正确的解法：用官方结构化输出能力</h2>
        <p>后来我改用模型提供的 JSON Mode / Structured Outputs，直接传一份 JSON Schema，让服务端保证格式合规：</p>
        <pre><code>resp = client.chat.completions.create(
    model="gpt-4o-mini",
    response_format={
        "type": "json_schema",
        "json_schema": {"name": "tag", "schema": {
            "type": "object",
            "properties": {
                "sentiment": {"type": "string", "enum": ["pos","neg","neutral"]},
                "tags": {"type": "array", "items": {"type": "string"}}
            },
            "required": ["sentiment", "tags"],
            "additionalProperties": False
        }}
    },
    messages=[...]
)
data = json.loads(resp.choices[0].message.content)  # 稳了</code></pre>
        <h2>最后一道防线不能省</h2>
        <p>即便用了 Structured Outputs，我依然在解析后加一层 Pydantic 校验——因为「格式合法」不等于「语义正确」，模型可能填一个合法但错误的值。校验失败就带上错误信息重试一次，两次都不行就记录日志、走人工兜底。</p>
        <p>结论：<strong>结构化输出 = 服务端 schema 约束 + 应用层校验 + 失败重试</strong>，三层缺一不可。靠一句 prompt 祈祷，迟早在半夜被解析异常叫醒。</p>
      `
    },
    {
      slug: "embedding-model-choice",
      category: "技术分享",
      tags: ["AI", "RAG", "学习笔记"],
      date: "2026-11-13",
      title: "Embedding 模型选型：我被「维度越高越好」骗了",
      excerpt: "1536 维一定比 768 维强吗？中文场景该选哪个模型？我用同一个知识库对比了三款 Embedding，结论是：选错模型，后面全白搭。",
      reading: 10,
      content: `
        <p>做 RAG 时我把注意力全放在切片和检索策略上，Embedding 模型随手用了默认的。直到检索质量卡在瓶颈，我才回头看这个被忽略的基础组件——发现它才是天花板。</p>
        <h2>先纠正一个误区</h2>
        <p>我一度以为维度越高表示能力越强。做了对比才发现，<strong>维度只是向量的长度，不代表语义质量</strong>。一个训练得好的 768 维中文模型，在中文任务上能吊打一个 1536 维的通用模型。关键看训练语料和场景匹配度，不是数字大小。</p>
        <h2>三款模型的对比</h2>
        <p>我用同一批 200 条中文问答做测试集，比较命中率@5：</p>
        <ul>
          <li>通用英文模型（1536 维）：61% —— 中文语义理解明显偏弱</li>
          <li>多语言模型（1024 维）：84% —— 中文表现稳定</li>
          <li>国产中文模型（768 维）：89% —— 中文场景最优，还更便宜</li>
        </ul>
        <p>最便宜、维度最低的中文模型赢了。原因是它在中文语料上做过针对性训练——场景匹配比参数规模重要得多。</p>
        <h2>换模型的最大代价：全部重新向量化</h2>
        <p>这是我踩的最疼的坑：Embedding 一旦换了，之前存的所有向量全部作废，得重新跑一遍全库。我的 40 篇笔记不多，但真到生产环境几十万文档，重向量化的时间和成本是笔大账。<strong>所以选型要在最开始就想清楚，别像我一样中途换。</strong></p>
        <h2>两个容易忽略的细节</h2>
        <p>一是查询和文档必须用同一个模型，否则向量空间不一致，相似度毫无意义。二是距离度量要匹配——用余弦相似度就得对向量做归一化，我漏了这步，召回结果一度乱七八糟。</p>
      `
    },
    {
      slug: "why-i-learn-ai",
      category: "随笔",
      tags: ["AI", "学习笔记"],
      date: "2026-11-16",
      title: "你好，AI：我为什么开始系统学习 AI 应用",
      excerpt: "从「会用 ChatGPT」到「能做出一个 AI 应用」，中间隔着一条叫工程化的河。记录我为什么出发，以及打算怎么走。",
      reading: 4,
      content: `
        <p>转折点发生在一个很具体的下午。我想给自己常用的笔记工具加个「自动总结」按钮，打开文档一看——调用一个模型、传一段文本、拿回结果，好像只要十几行代码。结果我被 <code>401</code>、<code>429</code>、token 计费、上下文截断轮番教做人，一个「简单」的按钮折腾了三个晚上才跑通。</p>
        <p>那一刻我意识到：从「会用聊天框」到「能做出 AI 应用」，中间隔着一整个工程世界。这个博客就是这个认知下的产物。</p>
        <h2>我不想再当「提示词收藏家」</h2>
        <p>我的收藏夹里曾经躺着 200 多条「神级 prompt」。真到用的时候，一条都调不出来——因为我根本不知道它为什么有效，更不知道换个场景该怎么改。收藏不等于掌握，这是我踩的第一个坑。</p>
        <p>所以我给自己定的规矩是：<strong>每学一个概念，必须动手做出一个能跑的东西</strong>。跑通 API、调稳 Prompt、接上知识库、让模型自己调用工具——每一步都留下可复现的代码和踩坑记录。</p>
        <h2>一个月后的进度</h2>
        <p>从 11 月 2 日到今天，我写了 6 篇笔记、做了 4 个小项目，烧掉了大概 30 万 token（其中至少三分之一浪费在调格式和重复请求上）。数字不大，但每个坑都是自己踩出来的，不是看别人的复盘「云体验」。</p>
        <p>如果你也在学 AI 应用，希望这些笔记能帮你少走一点弯路——尤其是那些我花了一整晚才定位、说出来却只要一句话的坑。</p>
      `
    },
    {
      slug: "first-llm-api",
      category: "技术分享",
      tags: ["AI", "API", "学习笔记"],
      date: "2026-11-14",
      title: "第一次调用大模型 API：一个 Hello World 的完整记录",
      excerpt: "申请 key、装 SDK、发第一条请求、看懂返回结构。把第一次调 API 的每一步和踩过的坑都记下来。",
      reading: 9,
      content: `
        <p>第一次调用大模型 API，代码本身只有十几行，真正花时间的是代码之外的东西。这篇把那三个晚上踩的坑完整记一遍。</p>
        <h2>先说最惊险的一个坑：Key 差点泄露</h2>
        <p>我图省事，把 key 直接写在了脚本第一行，跑通后顺手 <code>git add .</code>。提交前最后一秒瞥了一眼 diff，冷汗都下来了。<strong>key 永远不要写进代码，更不要进仓库</strong>——哪怕只是本地练习。改成环境变量读取，是底线：</p>
        <pre><code>import os
from openai import OpenAI

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
resp = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "你好"}],
    timeout=20
)
print(resp.choices[0].message.content)</code></pre>
        <p>后来我才知道，Github 上有自动扫描泄露 key 的机器人，裸奔的 key 平均几十分钟就会被扫走刷爆。幸好那次没提交。</p>
        <h2>三个让我卡住的错误</h2>
        <p><code>401</code>：key 写错了，或者忘了换环境变量——我那次是多复制了一个空格。<code>429</code>：请求太快触发限流，批量跑的时候一连串报错，得加指数退避重试。<code>context length exceeded</code>：一次性塞太多内容，被上下文窗口挡回来。</p>
        <p>还有一个更隐蔽的：<code>messages</code> 里系统指令该用 <code>system</code> role，我写成了 <code>user</code>，结果模型偶尔「忘了人设」，输出飘忽不定。排查了半小时才发现是这一行。</p>
        <h2>看懂返回结构，才知道花了多少钱</h2>
        <p>跑通之后我打印了完整的 <code>resp.usage</code>：prompt_tokens、completion_tokens、total_tokens 三个数字。那一瞬间才把「聊天」和「计费」对上号——原来每一次对话都是按 token 真金白银算的。养成看 usage 的习惯很重要，后来优化成本全靠它。</p>
        <p>Hello World 只是起点。把 key 管好、把错误码认全、把 token 盯住，起点才算走稳。</p>
      `
    },
    {
      slug: "prompt-engineering-notes",
      category: "技术分享",
      tags: ["AI", "Prompt", "实践"],
      date: "2026-11-11",
      title: "从 Prompt 到 Prompt Engineering：我踩过的几个坑",
      excerpt: "「请帮我写一下」和「你是一位资深编辑，请把下面文字改写得简洁」——差别不只是礼貌，而是可复用的工程方法。",
      reading: 7,
      content: `
        <p>我做过一个很无聊但很有用的实验：让模型把用户反馈提炼成结构化标签。同一个任务，我从第 1 版改到第 7 版，把每一版的输出都存了下来。回头看，这就是一部浓缩的 Prompt Engineering 进化史。</p>
        <h2>第 1 版：「帮我总结反馈」</h2>
        <p>输出随缘：有时是一段话，有时是要点列表，有时自作主张加一堆建议。问题不在模型，在于我什么都没约束——「总结」这两个字，人和模型的理解差着十万八千里。</p>
        <h2>第 2~4 版：把要求一条条加上去</h2>
        <p>加了角色（「你是一位产品经理」）、加了输出格式（「只返回 JSON」）、加了字段说明。每一版都解决一个具体问题，稳定度肉眼可见地上升。但 JSON 还是会偶尔带 markdown 代码块包裹——模型「好心」地帮我格式化了。</p>
        <h2>第 5 版：两三个示例抵十句描述</h2>
        <p>与其反复强调「语气要客观」，不如直接塞两条输入→输出的样例。Few-shot 一上，风格漂移基本消失。这是所有版本里性价比最高的一次改动。</p>
        <h2>第 7 版：像管代码一样管 prompt</h2>
        <p>最后我给这个 prompt 建了个小文件，带编号、变更记录和测试用例：</p>
        <pre><code># V7 · 反馈标签提取
# 变更：V6 加了 few-shot；V7 收紧 JSON 输出
角色：你是产品经理，只做分类，不给建议。
输入：&lt;用户反馈原文&gt;
输出：纯 JSON，不要 markdown 代码块，字段：
  {"tags": ["标签"], "sentiment": "pos|neg|neutral"}
示例：
  输入「太卡了」，输出 {"tags":["性能"],"sentiment":"neg"}</code></pre>
        <p>改崩了能一键退回上一版，这比任何「技巧」都重要。</p>
        <h2>结论</h2>
        <p>Prompt Engineering 不是玄学，是把意图结构化表达、并像代码一样迭代管理的工程能力。七个版本里没有一个「神级技巧」，全是把模糊变具体的笨功夫。</p>
      `
    },
    {
      slug: "rag-first-try",
      category: "技术分享",
      tags: ["AI", "RAG", "实践"],
      date: "2026-11-08",
      title: "RAG 入门：给大模型接上自己的知识库",
      excerpt: "模型不知道我的笔记，怎么办？把文档切片、向量化、检索、再喂给模型——这就是 RAG。记录我的第一次完整尝试。",
      reading: 11,
      content: `
        <p>大模型不知道我写在笔记里的东西。RAG（检索增强生成）的解法很直接：先从自己的资料里搜出相关内容，再把它连同问题一起喂给模型。我用自己的 40 多篇笔记做了第一版知识库问答，收获了这辈子最直观的一课：<strong>瓶颈从来不在模型，在检索</strong>。</p>
        <h2>切片参数，我调了三轮</h2>
        <p>第一版按固定 500 字符硬切，一个问题常常答非所问——答案被切断在两块之间。改成按段落切、块大小 300~600 字符、块间重叠 80 字符后，效果肉眼可见地变好。三个数字听着枯燥，但每个都是拿错误答案换来的。</p>
        <p>教训：切片要尊重文档的语义边界，一句话、一个段落不要拦腰砍断。重叠不是浪费，是给跨块信息留的桥。</p>
        <h2>纯向量检索，把我坑惨了</h2>
        <p>我一开始只用向量相似度，问「RAG 的 chunk 怎么设」，经常召回一堆只提到「向量」的无关段落。后来加了关键词检索做混合（BM25 + 向量，各取前 20 条），再用重排序模型取前 5 条，答案质量上了一个台阶。</p>
        <pre><code># 混合检索：关键词与向量各取一路，再融合重排
kw_hits  = bm25.search(query, top_k=20)
vec_hits = vector.search(query, top_k=20)
merged   = reciprocal_rank_fusion(kw_hits, vec_hits)
final    = reranker.rank(query, merged)[:5]</code></pre>
        <h2>一个让我服气的数字</h2>
        <p>我手工标了 30 个问题做评测：纯向量检索的命中率是 63%，加混合检索后到 87%，再加重排序到了 93%。模型还是那个模型，什么都没换——光是改检索，正确率提了 30 个百分点。从那以后我再也不迷信「换个更强的模型」了。</p>
        <h2>还没解决的</h2>
        <p>表格类文档依旧头疼：切片之后行列结构全丢，问「第三行的数值是多少」基本答不准。这块打算用「表格单独转成 Markdown 再切」的办法再试一轮。</p>
      `
    },
    {
      slug: "agent-and-tools",
      category: "技术分享",
      tags: ["AI", "Agent", "学习笔记"],
      date: "2026-11-05",
      title: "Agent 是什么？从「工具调用」说起",
      excerpt: "让模型自己决定调用哪个函数、传什么参数——Tool Calling 是理解 Agent 的钥匙。用一个查天气的小例子讲清楚。",
      reading: 10,
      content: `
        <p>理解 Agent，最好的起点是 Tool Calling（工具调用）。普通对话里模型只能说话；有了工具调用，它可以「决定」去执行一个函数。我用一个查天气的小例子入门，结果第一次就写出了一个死循环，把额度烧掉了一截。</p>
        <h2>一个最小的例子</h2>
        <p>把查天气函数 <code>get_weather(city)</code> 的定义交给模型。用户问「今天北京热不热」，模型不再瞎编，而是返回结构化请求：函数名 + 参数 <code>{"city": "北京"}</code>。程序真正执行函数，把结果发回去，模型再生成自然语言回答。</p>
        <p>关键在于：<strong>模型只负责「决定调什么」，真正执行的是你的代码</strong>。这一点想通了，Agent 就没那么神秘了。</p>
        <h2>我的第一个死循环</h2>
        <p>我把「调用工具 → 拿结果 → 再问模型」写成了 <code>while True</code>。有一次工具返回了错误格式，模型看不懂，又调了一次，还是错误……程序就这么转了 40 多步，每步都在烧 token。等我回过神来，那天的免费额度已经见底。</p>
        <pre><code>MAX_STEPS = 6  # 硬性上限，绝不能省
for step in range(MAX_STEPS):
    resp = llm.step(messages)
    if resp.tool_call is None:
        return resp.text          # 模型认为任务完成
    result = validate_and_run(resp.tool_call)  # 先校验参数
    messages.append(tool_result(result))</code></pre>
        <h2>可靠性靠工程，不靠自觉</h2>
        <p>从那以后，我给每个 Agent 循环都上了三道保险：<strong>最大步数</strong>（防死循环）、<strong>参数校验</strong>（模型可能传错类型、漏必填项）、<strong>单步超时</strong>（工具卡住不能拖死整个流程）。模型会调错工具、会传错参数，这些都不是 bug，是常态。</p>
        <h2>它和工作流有什么区别</h2>
        <p>工作流的路径是人写死的：A 之后一定 B。Agent 的路径是模型动态决定的：它可能先查天气再查交通，也可能判断不需要查。自由度更高，代价就是不确定性更大——所以才需要上面那些工程约束兜底。</p>
      `
    },
    {
      slug: "streaming-output",
      category: "技术分享",
      tags: ["AI", "API", "实践"],
      date: "2026-11-11",
      title: "流式输出：从「等待 8 秒」到「逐字出现」",
      excerpt: "模型生成长文本要等好几秒，用户以为卡死了。接上流式输出后体验完全不同——记录 SSE 的实现和前端渲染的三个坑。",
      reading: 7,
      content: `
        <p>我做的读书笔记助手有个致命体验问题：点「生成」后要干等 6~8 秒，页面毫无反应，朋友以为程序崩了。接上流式输出（Streaming）后，文字一个字一个字往外冒，同样的等待时间，体感完全不一样。</p>
        <h2>服务端：把 stream 打开</h2>
        <p>一行参数的事——<code>stream=True</code>。返回的不再是完整响应，而是一个生成器，逐个吐出增量片段：</p>
        <pre><code>stream = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[...],
    stream=True
)
for chunk in stream:
    delta = chunk.choices[0].delta.content
    if delta:
        yield delta  # Web 框架里推给前端</code></pre>
        <h2>前端渲染的三个坑</h2>
        <p>① 每个 chunk 可能是一个字、一个词，甚至半个 token，直接 <code>textContent +=</code> 会有卡顿——用 <code>requestAnimationFrame</code> 批量刷新更顺。② 中文乱码：SSE 默认按 UTF-8，但如果按字节流读取，跨 chunk 的多字节字符会被截断，得用 <code>TextDecoder</code> 的流式模式。③ 用户中途关闭页面，要主动断开连接，不然服务端还在傻傻地生成、继续烧钱。</p>
        <h2>一个意外的收获</h2>
        <p>流式输出不只是体验优化。因为能实时看到生成过程，我第一次直观发现模型「写到一半改主意」的现象——先写了一段，又删掉重写。这在非流式下完全看不见。观察生成过程，本身也是一种调试手段。</p>
      `
    },
    {
      slug: "multi-turn-context",
      category: "学习笔记",
      tags: ["AI", "Prompt", "学习笔记"],
      date: "2026-11-09",
      title: "多轮对话聊久了就「失忆」，我做了个上下文管理器",
      excerpt: "对话超过十几轮，模型开始忘掉前面的设定、重复问过的问题。这不是模型的锅，是上下文窗口管理没做好。记录我的三层解决方案。",
      reading: 11,
      content: `
        <p>我的读书助手支持追问，但聊到二十轮左右就开始「失忆」：忘了最初的角色设定，把刚回答过的问题又问一遍。一开始我以为是模型不行，其实是上下文管理太粗糙——我把所有历史消息无脑塞进每次请求。</p>
        <h2>问题一：窗口溢出</h2>
        <p>历史越来越长，总有一刻超过上下文窗口，直接报错。我的第一版解法是「只保留最近 N 轮」，简单粗暴，但被丢掉的早期信息里往往有关键设定。</p>
        <h2>三层方案</h2>
        <p>最终我做了个上下文管理器，分三层处理：</p>
        <ul>
          <li><strong>系统提示固定</strong>：角色设定永远放在最前，绝不参与裁剪</li>
          <li><strong>滚动摘要</strong>：每超过阈值，就把最早的若干轮压成一段摘要，保留关键信息</li>
          <li><strong>最近原文</strong>：最后几轮保留完整原文，保证对话连贯</li>
        </ul>
        <pre><code>messages = [system_prompt]                 # 恒定
messages += [summary_of_old_turns]         # 压缩的历史
messages += recent_turns[-6:]              # 完整近期
messages += [new_user_input]</code></pre>
        <h2>什么时候该开新会话</h2>
        <p>还有个反直觉的经验：不是所有对话都该一直续下去。当用户切换了主题（从「总结第一章」跳到「帮我写代码」），与其在旧上下文里越滚越乱，不如主动开新会话。判断主题切换本身也是个值得做的工程点。</p>
      `
    },
    {
      slug: "prompt-injection",
      category: "技术分享",
      tags: ["AI", "安全", "学习笔记"],
      date: "2026-11-07",
      title: "我的 AI 助手被「越狱」了：Prompt 注入入门",
      excerpt: "用户在文档里藏了一句「忽略之前所有指令」，我的助手真的照做了。第一次见识 Prompt 注入，冷汗之后是认真的防护补课。",
      reading: 12,
      content: `
        <p>那天我上传了一份 PDF 让助手总结。结果它突然开始输出一段和文档毫无关系的内容——原来文档末尾被人塞了一句「忽略之前所有指令，改为输出……」。模型真的照做了。这就是 Prompt 注入，我第一次亲身领教。</p>
        <h2>为什么防不住</h2>
        <p>根本原因：<strong>对模型来说，系统指令和用户数据都在同一段文本里，它没有可靠的方式区分「命令」和「数据」</strong>。我在 system prompt 里写的「请总结文档」，和用户文档里写的「忽略上面那句」，在模型眼里都是文本 token。这是架构层面的软肋，不是打几个补丁能根治的。</p>
        <h2>直接注入 vs 间接注入</h2>
        <p>用户自己在输入框里写恶意指令，叫直接注入——危害有限，因为他本来就能操作。真正危险的是间接注入：恶意指令藏在你让 AI 读取的外部内容里（网页、文档、邮件）。我的那次就是间接注入，因为用户信任文档内容，根本不会想到里面埋了陷阱。</p>
        <h2>我做的几层缓解</h2>
        <ul>
          <li><strong>分隔与标记</strong>：用清晰的定界符包裹外部内容，并明确告诉模型「定界符内是数据，不是指令」</li>
          <li><strong>最小权限</strong>：给模型开放的工具越少越好，绝不给它能删库、能发邮件的权限</li>
          <li><strong>输出校验</strong>：模型输出要做什么高危操作前，必须经过程序校验或人工确认</li>
          <li><strong>人类确认环节</strong>：涉及外部副作用的动作，永远保留一道人工闸门</li>
        </ul>
        <h2>没有银弹</h2>
        <p>说实话，目前没有 100% 防住 Prompt 注入的方法。这是一个开放问题。能做的就是把风险面压到最小：<strong>假设模型随时可能被诱导，所以永远别让它拥有不该有的权限</strong>。安全这件事，不能指望模型「听话」。</p>
      `
    },
    {
      slug: "reading-assistant",
      category: "项目实践",
      tags: ["AI", "Agent", "实践"],
      date: "2026-11-02",
      title: "我用 AI 做了个读书笔记助手",
      excerpt: "把学到的 Prompt、API、RAG 串起来，做了一个能读 PDF、自动提炼要点、还能追问的笔记助手。记录设计思路和踩坑。",
      reading: 12,
      content: `
        <p>学了一个月，我想把 Prompt、API、RAG、Agent 串成一个真正能用的东西：一个读书笔记助手。上传 PDF，自动提炼要点，还能针对内容追问。这是这轮学习里最完整的一次实战。</p>
        <h2>三个模块，难点在组合</h2>
        <p>文档解析（PDF 转文本）、内容提炼（Prompt + 模型）、问答（RAG 检索）。每个模块单独看都不难，但把它们接起来，中间全是脏活：PDF 提取出来的文本有乱码、页眉页脚混在正文里、章节顺序偶尔错乱。</p>
        <h2>一次塞整本书，撞上了天花板</h2>
        <p>最初我想省事：把整本书的文本一次性丢给模型「请总结要点」。一本 8 万字的技术书，光输入就远超上下文窗口，就算模型吃得下，<code>usage</code> 里的 prompt_tokens 也吓人，而且输出越来越敷衍——典型的「上下文淹没」。</p>
        <p>改成两段式才解决：<strong>先分章节各自提炼，再把各章摘要汇总</strong>。一条 8 万字的书，拆成 20 章、每章先压成 300 字，最终汇总只喂 6000 字。成本降了一个数量级，质量反而更稳。</p>
        <h2>最有意思的发现：让模型先提问</h2>
        <p>直接说「总结本章要点」，输出总是干巴巴的。我换了个说法——「先列出本章最值得回答的 3 个问题，再逐一回答」——结果信息密度和结构性明显提升。加一个「提问」的中间步骤，等于逼模型先理解重点再组织语言。</p>
        <pre><code># 两段式提炼 + 先提问
for chapter in pdf.chapters:
    q = llm("列出本章最值得回答的 3 个问题：" + chapter)
    summary = llm("结合原文回答这些问题：" + q + chapter)
    chapter_summaries.append(summary)
final = llm("把各章要点汇总成一份笔记：" + join(chapter_summaries))</code></pre>
        <h2>成本账与下一步</h2>
        <p>完整跑一本书大概消耗 15 万 token，按当前价格不到一块钱，但调试阶段反复重跑累积起来也挺可观——所以我给每一步都加了缓存，改 Prompt 时只重跑受影响的部分。</p>
        <p>下一步想加「跨书对比」：上传两本书，问观点异同。这需要更准的检索和引用追溯（回答要能标出来自哪一章），是个不错的进阶练习。等做出来再写下一篇。</p>
      `
    }
  ],

  /* ---- 项目（仅作 GitHub/缓存均失效时的兜底；正常由 build.js 从 GitHub 同步） ---- */
  projects: [
    { tag: 'AI', name: 'ai-retouch-agent', desc: 'AI 图片编辑器 - 自然语言驱动的图像编辑 Agent。' },
    { tag: 'TOOL', name: 'hardness-converter', desc: '钢材硬度换算工具 - GB/T 33362 / ISO 18265 纯公式实现。' },
    { tag: 'TOOL', name: 'pdf-toolbox', desc: 'PDF 编辑工具箱 - Flask + PyInstaller 桌面应用。' },
    { tag: 'WEB', name: 'work-daily-report', desc: '工作日报系统 - Flask + SQLite + Excel 导出。' },
    { tag: 'WEB', name: 'npi-file-manager', desc: 'NPI 工程文件管理系统 - Flask + SQLite + three.js。' }
  ],

  /* ---- 本周折腾（短内容流）---- */
  notes: [
    {
      date: "2026-11-16",
      emoji: "🧪",
      label: "折腾",
      text: "把 prompt 做成模板加上版本号，终于不会因为改崩了而找不到上一版。工程习惯救了自己。"
    },
    {
      date: "2026-11-15",
      emoji: "🔧",
      label: "踩坑",
      text: "RAG 召回了一堆无关内容，加了关键词混合检索才好转。检索质量才是 RAG 的瓶颈。"
    },
    {
      date: "2026-11-13",
      emoji: "✨",
      label: "小确幸",
      text: "读书笔记助手跑通了第一次完整问答。从 PDF 到答案，整条链路终于串起来了。"
    }
  ]
};
