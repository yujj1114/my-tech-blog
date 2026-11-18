#!/usr/bin/env node
/* ============================================================
 * build.js —— 零依赖静态构建
 * 从 config.js 读取唯一内容源，生成：
 *   1. posts/<slug>.html   每篇文章的完整静态页（爬虫可读正文）
 *   2. assets/data/site.js 运行时轻量数据（去掉正文，供搜索/组件用）
 *   3. assets/data/text.js 正文纯文本索引（供全文搜索用）
 *   4. feed.xml / sitemap.xml / robots.txt / favicon.svg
 *   5. 把静态内容注入 index/blog/tags/archive 的 BUILD 标记区
 *
 * 用法：node build.js   （改完 config.js 后跑一次即可）
 * ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = __dirname;
const P = (...a) => path.join(ROOT, ...a);
const read = f => fs.readFileSync(P(f), 'utf8');
const write = (f, s) => {
  fs.mkdirSync(path.dirname(P(f)), { recursive: true });
  fs.writeFileSync(P(f), s, 'utf8');
};

/* ---- 1. 载入唯一内容源 ---- */
const sandbox = { window: {} };
vm.runInNewContext(read('assets/js/config.js'), sandbox, { filename: 'config.js' });
const S = sandbox.window.SITE;
const posts = S.posts.slice().sort((a, b) => b.date.localeCompare(a.date));
const siteUrl = String(S.siteUrl || 'https://yujj1114.github.io/my-tech-blog/').replace(/\/$/, '');
const postUrl = slug => siteUrl + '/posts/' + slug + '.html';
const pageUrl = f => siteUrl + '/' + f;

/* ---- 1b. GitHub 仓库自动同步（构建时拉取，失败回退缓存） ---- */
const { execFileSync } = require('child_process');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const GH_USER = (String(S.github || '').match(/github\.com\/([^/]+)/) || [])[1] || 'yujj1114';
const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', HTML: '#e34c26', CSS: '#563d7c',
  Java: '#b07219', 'C++': '#f34b7d', 'C#': '#178600', Go: '#00ADD8', Rust: '#dea584',
  Ruby: '#701516', PHP: '#4F5D95', Swift: '#F05138', Kotlin: '#A97BFF', Shell: '#89e051', Vue: '#41b883'
};
function normalizeRepo(r) {
  const pushed = r.pushed_at || r.updated_at || '';
  const days = pushed ? Math.max(0, Math.floor((Date.now() - new Date(pushed).getTime()) / 86400000)) : null;
  return {
    name: r.name,
    full_name: r.full_name,
    url: r.html_url,
    desc: r.description || '（这个项目还没有写描述）',
    lang: r.language || 'Other',
    langColor: LANG_COLORS[r.language] || '#8b7fa8',
    stars: r.stargazers_count || 0,
    forks: r.forks_count || 0,
    topics: (r.topics || []).slice(0, 5),
    updated: pushed ? (days === 0 ? '今天更新' : days < 30 ? days + ' 天前更新' : new Date(pushed).toISOString().slice(0, 10) + ' 更新') : '',
    homepage: r.homepage || '',
    license: r.license && r.license.spdx_id && r.license.spdx_id !== 'NOASSERTION' ? r.license.spdx_id : ''
  };
}
let repos = [];
let repoSource = 'cache';
try {
  const out = execFileSync('curl', [
    '-sS', '--max-time', '12',
    '-H', 'User-Agent: jie-blog-build',
    '-H', 'Accept: application/vnd.github+json',
    'https://api.github.com/users/' + GH_USER + '/repos?per_page=100&sort=pushed&type=owner'
  ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const arr = JSON.parse(out);
  if (!Array.isArray(arr)) throw new Error('API 返回格式异常');
  repos = arr.filter(r => !r.fork && !r.archived && !r.private).map(normalizeRepo);
  write('assets/data/repos.json', JSON.stringify({ fetchedAt: new Date().toISOString(), repos }, null, 2));
  repoSource = 'github';
} catch (e) {
  console.warn('GitHub 同步失败，改用本地缓存：' + e.message);
  try {
    repos = JSON.parse(read('assets/data/repos.json')).repos || [];
  } catch (e2) {
    repos = (S.projects || []).map(p => ({
      name: p.name, full_name: GH_USER + '/' + p.name, url: S.github + '/' + p.name,
      desc: p.desc, lang: 'Other', langColor: '#8b7fa8', stars: 0, forks: 0,
      topics: [], updated: '', homepage: '', license: ''
    }));
    repoSource = 'config';
  }
}
write('assets/data/repos.js', '/* 由 build.js 自动生成，勿手改 */\nwindow.REPOS = ' + JSON.stringify(repos, null, 2) + ';\n');

/* ---- 2. 模板工具 ---- */
const fmtDate = iso => { const [y, m, d] = iso.split('-'); return y + '年' + Number(m) + '月' + Number(d) + '日'; };
const tagLinks = p => p.tags.map(t => '<a class="tag" href="tags.html?tag=' + encodeURIComponent(t) + '">#' + t + '</a>').join('');

function navHtml(current) {
  return S.nav.map(n => '<a href="' + n.href + '"' + (n.href.replace('.html', '') === current ? ' aria-current="page"' : '') + '>' + n.label + '</a>').join('');
}
function headerHtml(current) {
  return '<header class="site-header"><div class="container nav-inner">'
    + '<a href="index.html" class="brand" aria-label="' + S.title + ' 首页">'
    + '<span class="brand-full">' + S.title + '</span><span class="brand-short">' + S.shortName + '</span></a>'
    + '<nav class="nav-links" aria-label="主导航">' + navHtml(current) + '</nav>'
    + '<div class="nav-actions">'
    + '<button type="button" class="icon-btn search-trigger" data-search-open aria-label="搜索文章">🔍</button>'
    + '<button type="button" class="icon-btn theme-trigger" data-theme-toggle aria-label="切换深浅主题">◐</button>'
    + '<button type="button" class="icon-btn menu-trigger" data-menu-toggle aria-label="打开菜单" aria-expanded="false">☰</button>'
    + '</div></div><div class="mobile-menu" id="mobile-menu"><div class="container" style="padding-bottom:16px">'
    + navHtml(current) + '<a href="#" data-search-open>搜索文章</a><a href="#" data-theme-toggle>切换深浅主题</a>'
    + '</div></div></header>';
}
function footerHtml() {
  const links = S.nav.filter(n => n.href !== 'index.html').map(n => '<a href="' + n.href + '">' + n.label + '</a>').join('');
  return '<footer class="site-footer"><div class="container footer-inner">'
    + '<p>© ' + S.since + ' ' + S.name + ' · 由原生 HTML/CSS/JS 强力驱动</p>'
    + '<div class="footer-links">' + links + '<a href="' + S.github + '" target="_blank" rel="noopener">GitHub</a>'
    + '<a href="feed.xml">RSS</a><button type="button" data-search-open>搜索</button></div></div></footer>';
}
function postCardHtml(p) {
  return '<article class="post-card" data-reveal><a class="card-link" href="posts/' + p.slug + '.html" aria-label="' + p.title + '"></a>'
    + '<div class="post-meta"><time datetime="' + p.date + '">' + fmtDate(p.date) + '</time>'
    + '<span class="post-cat">' + p.category + '</span>' + tagLinks(p)
    + '<span class="reading">' + p.reading + ' min</span></div>'
    + '<h3><a href="posts/' + p.slug + '.html">' + p.title + '</a></h3>'
    + '<p>' + p.excerpt + '</p><span class="card-underline" aria-hidden="true"></span></article>';
}
function listRowHtml(p) {
  return '<article class="list-row" data-reveal><div class="post-meta">'
    + '<time datetime="' + p.date + '">' + fmtDate(p.date) + '</time>'
    + '<span class="post-cat">' + p.category + '</span>' + tagLinks(p)
    + '<span class="reading">' + p.reading + ' min</span></div>'
    + '<h3><a href="posts/' + p.slug + '.html">' + p.title + '</a></h3><p>' + p.excerpt + '</p></article>';
}
function projectCardHtml(r) {
  const lang = '<span class="repo-lang"><i class="lang-dot" style="background:' + r.langColor + '"></i>' + esc(r.lang) + '</span>';
  const stats = '<span class="repo-stats"><span title="Stars">★ ' + r.stars + '</span><span title="Forks">⑂ ' + r.forks + '</span></span>';
  const topics = r.topics.length ? '<div class="repo-topics">' + r.topics.map(t => '<span class="repo-topic">#' + esc(t) + '</span>').join('') + '</div>' : '';
  return '<article class="project-card" data-reveal>'
    + '<a class="card-link" href="' + esc(r.url) + '" target="_blank" rel="noopener" aria-label="在 GitHub 打开 ' + esc(r.full_name) + '"></a>'
    + '<div class="repo-head">' + lang + stats + '</div>'
    + '<h3>' + esc(r.name) + '<span class="repo-arrow" aria-hidden="true">↗</span></h3>'
    + '<p>' + esc(r.desc) + '</p>'
    + topics
    + '<div class="repo-foot">' + (r.updated ? '<time>' + esc(r.updated) + '</time>' : '') + '<span class="repo-open">查看仓库 ↗</span></div>'
    + '</article>';
}

/* ---- 3. 页面骨架 ---- */
function shell(o) {
  const b = o.base || '';
  const baseTag = b ? '  <base href="' + b + '" />\n' : '';
  return '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n'
    + '  <meta charset="utf-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1" />\n'
    + baseTag
    + '  <title>' + o.title + '</title>\n'
    + '  <meta name="description" content="' + o.desc + '" />\n'
    + '  <link rel="canonical" href="' + o.canonical + '" />\n'
    + '  <meta property="og:type" content="' + (o.ogType || 'website') + '" />\n'
    + '  <meta property="og:site_name" content="' + S.title + '" />\n'
    + '  <meta property="og:title" content="' + o.title + '" />\n'
    + '  <meta property="og:description" content="' + o.desc + '" />\n'
    + '  <meta property="og:url" content="' + o.canonical + '" />\n'
    + '  <meta name="twitter:card" content="summary" />\n'
    + '  <meta name="theme-color" content="#a8435f" />\n'
    + '  <link rel="icon" href="favicon.svg" type="image/svg+xml" />\n'
    + '  <script>(function(){var t="light";try{var d=matchMedia("(prefers-color-scheme: dark)").matches;t=localStorage.getItem("theme-v2")||(d?"dark":"light")}catch(e){}document.documentElement.dataset.theme=t})();</script>\n'
    + '  <script>(function(){try{if(sessionStorage.getItem("jie-dissolve")==="1"){sessionStorage.removeItem("jie-dissolve");document.documentElement.classList.add("pre-dissolve")}}catch(e){}})();</script>\n'
    + '  <link rel="stylesheet" href="assets/css/style.css" />\n'
    + '</head>\n<body data-page="' + o.page + '">\n'
    + '  <a class="skip-link" href="#main">跳到主要内容</a>\n'
    + '  <div id="site-header">' + headerHtml(o.page) + '</div>\n'
    + '  <main id="main">' + o.body + '</main>\n'
    + '  <div id="site-footer">' + footerHtml() + '</div>\n'
    + '  <div id="search-root"></div>\n'
    + '  <script src="assets/data/site.js"></script>\n'
    + '  <script src="assets/data/text.js"></script>\n'
    + '  <script src="assets/js/components.js"></script>\n'
    + '  <script src="assets/js/app.js"></script>\n'
    + '</body>\n</html>\n';
}

/* ---- 4. 生成文章静态页 ---- */
let made = 0;
posts.forEach((p, idx) => {
  let n = 0;
  const headsRaw = [];
  const selfHref = p.slug + '.html';
  const bodyHtml = p.content.replace(/<h2>([\s\S]*?)<\/h2>/g, (m, t) => {
    const plain = t.replace(/<[^>]+>/g, '');
    headsRaw.push(plain);
    return '<h2 id="sec-' + (n++) + '" tabindex="-1">' + t + '</h2>';
  });
  const toc = headsRaw.map((h, i) => '<li><a href="posts/' + selfHref + '#sec-' + i + '" data-toc="sec-' + i + '">' + h + '</a></li>').join('');
  const newer = posts[idx - 1] || null;
  const older = posts[idx + 1] || null;
  const related = posts.filter(q => q.slug !== p.slug && q.tags.some(t => p.tags.includes(t))).slice(0, 3);
  const navParts = [];
  if (newer) navParts.push('<a class="post-nav-item" href="' + newer.slug + '.html"><span>← 更新一篇</span><strong>' + newer.title + '</strong></a>');
  if (older) navParts.push('<a class="post-nav-item" href="' + older.slug + '.html"><span>更旧一篇 →</span><strong>' + older.title + '</strong></a>');
  const relatedHtml = related.length
    ? '<section class="related-posts"><h2> related / 相关阅读</h2><div class="related-grid">'
      + related.map(q => '<a href="' + q.slug + '.html"><span>' + fmtDate(q.date) + '</span><strong>' + q.title + '</strong></a>').join('')
      + '</div></section>'
    : '';
  const body = '<div class="article-shell"><article class="article">'
    + '<p class="label-mono accent">// ' + p.category + '</p>'
    + '<h1>' + p.title + '</h1>'
    + '<div class="article-meta"><time datetime="' + p.date + '">' + fmtDate(p.date) + '</time>'
    + '<span>·</span><span>约 ' + p.reading + ' 分钟</span>' + tagLinks(p) + '</div>'
    + (toc ? '<details class="toc-inline"><summary>本文目录</summary><ul class="toc-list">' + toc + '</ul></details>' : '')
    + '<div class="article-body">' + bodyHtml + '</div>'
    + '<nav class="article-nav">' + navParts.join('') + '</nav>'
    + '<div class="article-nav"><a class="back-link" href="../blog.html">← 返回全部文章</a></div>'
    + relatedHtml + '</article>'
    + (toc ? '<aside class="toc toc-side" id="toc-side" aria-label="文章目录"><p class="toc-title">目录 / CONTENTS</p><ul class="toc-list">' + toc + '</ul></aside>' : '')
    + '</div>';
  write('posts/' + p.slug + '.html', shell({
    base: '../', page: 'post', title: p.title + ' · ' + S.title, desc: p.excerpt,
    canonical: postUrl(p.slug), ogType: 'article', body: body
  }));
  made++;
});

/* ---- 5. 运行时轻量数据（去掉正文，避免每页加载全文） ---- */
const light = Object.assign({}, S);
light.posts = posts.map(p => { const c = {}; for (const k in p) if (k !== 'content') c[k] = p[k]; return c; });
light.siteUrl = siteUrl;
write('assets/data/site.js', '/* 由 build.js 自动生成，勿手改 */\nwindow.SITE = ' + JSON.stringify(light, null, 2) + ';\n');
const textIndex = {};
posts.forEach(p => { textIndex[p.slug] = p.content.replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim(); });
write('assets/data/text.js', '/* 由 build.js 自动生成，供全文搜索 */\nwindow.POST_TEXT = ' + JSON.stringify(textIndex, null, 2) + ';\n');

/* ---- 6. 静态内容注入到 BUILD 标记区 ---- */
function inject(file, blocks) {
  let s = read(file);
  let hit = 0;
  for (const [name, html] of Object.entries(blocks)) {
    const re = new RegExp('<!--BUILD:' + name + '-->[\\s\\S]*?<!--/BUILD:' + name + '-->');
    if (re.test(s)) { s = s.replace(re, '<!--BUILD:' + name + '-->' + html + '<!--/BUILD:' + name + '-->'); hit++; }
  }
  write(file, s);
  return hit;
}
let injectCount = 0;
try {
  const tagSet = new Set(); posts.forEach(p => p.tags.forEach(t => tagSet.add(t)));
  injectCount += inject('index.html', {
    hero: S.whoami,
    kicker: S.heroKicker,
    emphasis: S.heroEmphasis,
    lede: S.description + ' ' + S.heroLine2,
    marquee1: S.marquee.repeat(2), marquee2: S.marquee.repeat(2),
    stats: [
      { label: 'Posts', num: posts.length, plus: '+', sub: '篇文章' },
      { label: 'Tags', num: tagSet.size, plus: '+', sub: '个标签' },
      { label: 'Since', num: S.since, plus: '', sub: '持续更新中' }
    ].map(x => '<div data-reveal><p class="stat-label">' + x.label + '</p><p class="stat-num">' + x.num + '<span class="plus">' + x.plus + '</span></p><p class="stat-sub">' + x.sub + '</p></div>').join(''),
    latest: posts.slice(0, 4).map(postCardHtml).join(''),
    notes: (S.notes || []).map(n => '<a class="note-card" href="blog.html" data-reveal><div class="note-meta"><time datetime="' + n.date + '">' + n.date.replace(/-/g, '/') + '</time><span class="note-label">' + n.emoji + ' ' + n.label + '</span></div><p>' + n.text + '</p></a>').join(''),
    timeline: (() => {
      const byYear = {};
      posts.forEach(p => { const [y, m] = p.date.split('-'); (byYear[y] = byYear[y] || {})[m] = (byYear[y][m] || []).concat(p); });
      let i = 0;
      return Object.keys(byYear).sort().reverse().map(y => {
        const months = byYear[y];
        const yc = Object.values(months).reduce((a, arr) => a + arr.length, 0);
        const yid = 'tl-y-' + y;
        const mh = Object.keys(months).sort().reverse().map(m => {
          const mid = 'tl-m-' + y + '-' + m;
          const items = months[m].map(p => '<li><a href="posts/' + p.slug + '.html"><time datetime="' + p.date + '">' + Number(m) + '.' + Number(p.date.split('-')[2]) + '</time><span>' + p.title + '</span></a></li>').join('');
          return '<div class="tl-month-row"><button class="tl-toggle" type="button" data-target="' + mid + '" aria-expanded="false"><span class="tl-month">' + Number(m) + ' 月</span><span class="tl-right"><span>' + months[m].length + ' 篇</span><svg class="tl-chev" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m3 6 5 5 5-5"/></svg></span></button><div class="tl-panel" id="' + mid + '"><div><ul class="tl-list">' + items + '</ul></div></div></div>';
        }).join('');
        const open = i++ === 0 ? ' open' : '';
        return '<div class="tl-year"><button class="tl-toggle" type="button" data-target="' + yid + '" aria-expanded="' + (open ? 'true' : 'false') + '"><span class="tl-title">' + y + '</span><span class="tl-right"><span>' + yc + ' 篇</span><svg class="tl-chev" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m3 6 5 5 5-5"/></svg></span></button><div class="tl-panel' + open + '" id="' + yid + '"><div>' + mh + '</div></div></div>';
      }).join('');
    })(),
    tags: (() => { const c = {}; posts.forEach(p => p.tags.forEach(t => c[t] = (c[t] || 0) + 1));
      return Object.keys(c).sort((a, b) => c[b] - c[a]).map(t => '<a class="tag" href="tags.html?tag=' + encodeURIComponent(t) + '">#' + t + ' <span class="count">' + c[t] + '</span></a>').join(''); })()
  });
  injectCount += inject('blog.html', {
    kicker: '// ALL POSTS', desc: '共 ' + posts.length + ' 篇文章，按时间从新到旧排列。',
    list: posts.map(listRowHtml).join('')
  });
  const counts = {}; posts.forEach(p => p.tags.forEach(t => counts[t] = (counts[t] || 0) + 1));
  const tags = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  injectCount += inject('tags.html', {
    filters: ['全部'].concat(tags).map(t => '<button class="tag' + (t === '全部' ? ' active' : '') + '" data-tag="' + t + '">#' + t + ' <span class="count">' + (t === '全部' ? posts.length : counts[t]) + '</span></button>').join(''),
    list: posts.map(listRowHtml).join('')
  });
  injectCount += inject('archive.html', {
    list: (() => { const by = {}; posts.forEach(p => { const y = p.date.split('-')[0]; (by[y] = by[y] || []).push(p); });
      return Object.keys(by).sort().reverse().map(y => '<section data-reveal style="margin-bottom:40px"><h2 style="font-family:var(--font-mono);font-size:22px;font-weight:800;padding-bottom:12px;border-bottom:1px solid var(--border)">' + y + ' <span style="color:var(--muted);font-size:13px;font-weight:400">· ' + by[y].length + ' 篇</span></h2>' + by[y].map(listRowHtml).join('') + '</section>').join(''); })()
  });
  injectCount += inject('projects.html', {
    intro: '从 GitHub 自动同步的 ' + repos.length + ' 个公开仓库 · 技术栈不限于 AI',
    projects: repos.map(projectCardHtml).join('')
  });

  /* 根目录页面：SEO head + 静态导航/页脚（无 JS 也能看到骨架与元信息） */
  const pageMeta = {
    'index.html': { t: S.title, d: S.description, page: 'index' },
    'blog.html': { t: '博客 · ' + S.title, d: '全部 ' + posts.length + ' 篇 AI 应用学习笔记，按时间从新到旧排列。', page: 'blog' },
    'tags.html': { t: '标签 · ' + S.title, d: '按标签浏览 JIE 的 AI 应用学习笔记。', page: 'tags' },
    'archive.html': { t: '归档 · ' + S.title, d: '按年份回顾 JIE 的全部文章。', page: 'archive' },
    'about.html': { t: '关于我 · ' + S.title, d: 'JIE 是谁，为什么记录 AI 应用学习过程。', page: 'about' },
    'projects.html': { t: '项目 · ' + S.title, d: 'JIE 在 GitHub 上的开源项目，从 GitHub 自动同步。', page: 'projects' },
    '404.html': { t: '404 · ' + S.title, d: '页面不存在。', page: '404' }
  };
  for (const [file, m] of Object.entries(pageMeta)) {
    const seo = '  <meta name="description" content="' + m.d + '" />\n'
      + '  <link rel="canonical" href="' + pageUrl(file) + '" />\n'
      + '  <meta property="og:type" content="website" />\n'
      + '  <meta property="og:site_name" content="' + S.title + '" />\n'
      + '  <meta property="og:title" content="' + m.t + '" />\n'
      + '  <meta property="og:description" content="' + m.d + '" />\n'
      + '  <meta property="og:url" content="' + pageUrl(file) + '" />\n'
      + '  <meta name="twitter:card" content="summary" />\n'
      + '  <meta name="theme-color" content="#a8435f" />\n'
      + '  <link rel="icon" href="favicon.svg" type="image/svg+xml" />';
    injectCount += inject(file, { seo, header: headerHtml(m.page), footer: footerHtml() });
  }
} catch (e) { console.error('注入静态内容失败:', e.message); }

/* ---- 7. SEO 静态资源 ---- */
const favicon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#241a3a"/><circle cx="32" cy="32" r="22" fill="none" stroke="#e0839b" stroke-width="3"/><text x="32" y="43" text-anchor="middle" font-family="monospace" font-size="30" font-weight="bold" fill="#fff">J</text></svg>';
write('favicon.svg', favicon);
const urls = ['index.html', 'blog.html', 'projects.html', 'tags.html', 'archive.html', 'about.html'].map(pageUrl)
  .concat(posts.map(p => postUrl(p.slug)));
write('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  + urls.map(u => '  <url><loc>' + u + '</loc></url>').join('\n') + '\n</urlset>\n');
write('robots.txt', 'User-agent: *\nAllow: /\nSitemap: ' + siteUrl + '/sitemap.xml\n');
const rssItems = posts.map(p => '    <item><title>' + p.title + '</title><link>' + postUrl(p.slug) + '</link>'
  + '<guid isPermaLink="true">' + postUrl(p.slug) + '</guid><pubDate>' + new Date(p.date + 'T00:00:00+08:00').toUTCString()
  + '</pubDate><description><![CDATA[' + p.excerpt + ']]></description>' + p.tags.map(t => '<category>' + t + '</category>').join('') + '</item>').join('\n');
write('feed.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>'
  + '<title>' + S.title + '</title><link>' + siteUrl + '/</link><description>' + S.description + '</description>'
  + '<language>zh-CN</language>\n' + rssItems + '\n</channel></rss>\n');

console.log(JSON.stringify({ posts: made, repos: repos.length, repoSource, injectCount, siteJsKB: Math.round(fs.statSync(P('assets/data/site.js')).size / 1024), configKB: Math.round(fs.statSync(P('assets/js/config.js')).size / 1024), sitemap: urls.length }, null, 2));
