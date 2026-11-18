/* ============================================================
 * components.js —— 共享组件渲染
 * 从 window.SITE 读取配置，生成导航、页脚、搜索弹窗。
 * 所有页面只写一次，改配置即可全站生效。
 * ============================================================ */

(function () {
'use strict';
const S = window.SITE;
const iconSearch = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>';
const iconSun = '<svg data-icon="sun" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const iconMoon = '<svg data-icon="moon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/></svg>';
const iconMenu = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';

function renderHeader() {
  const el = document.getElementById('site-header');
  if (!el) return;
  const current = document.body.dataset.page || '';
  const links = S.nav.map(n => {
    const active = n.href.replace('.html','') === current ? ' aria-current="page"' : '';
    return `<a href="${n.href}"${active}>${n.label}</a>`;
  }).join('');
  el.innerHTML = `
    <header class="site-header">
      <div class="container nav-inner">
        <a href="index.html" class="brand" aria-label="${S.title} 首页">
          <span class="brand-full">${S.title}</span>
          <span class="brand-short">${S.shortName}</span>
        </a>
        <nav class="nav-links" aria-label="主导航">${links}</nav>
        <div class="nav-actions">
          <button type="button" class="icon-btn search-trigger" data-search-open aria-label="搜索文章" title="搜索 (Ctrl+K)">${iconSearch}</button>
          <button type="button" class="icon-btn theme-trigger" data-theme-toggle aria-label="切换深浅主题">${iconSun}${iconMoon}</button>
          <button type="button" class="icon-btn menu-trigger" data-menu-toggle aria-label="打开菜单" aria-expanded="false">${iconMenu}</button>
        </div>
      </div>
      <div class="mobile-menu" id="mobile-menu">
        <div class="container" style="padding-bottom:16px">
          ${S.nav.map(n => {
            const active = n.href.replace('.html','') === current ? ' aria-current="page"' : '';
            return `<a href="${n.href}"${active}>${n.label}</a>`;
          }).join('')}
          <a href="#" data-search-open>搜索文章</a>
          <a href="#" data-theme-toggle>切换深浅主题</a>
        </div>
      </div>
    </header>`;
}

function renderFooter() {
  const el = document.getElementById('site-footer');
  if (!el) return;
  const links = S.nav.filter(n => n.href !== 'index.html')
    .map(n => `<a href="${n.href}">${n.label}</a>`).join('');
  el.innerHTML = `
    <footer class="site-footer">
      <div class="container footer-inner">
        <p>© ${S.since} ${S.name} · 由原生 HTML/CSS/JS 强力驱动</p>
        <div class="footer-links">
          ${links}
          <a href="${S.github}" target="_blank" rel="noopener">GitHub</a>
          <button type="button" data-search-open>搜索</button>
        </div>
      </div>
    </footer>`;
}

function renderSearch() {
  const el = document.getElementById('search-root');
  if (!el) return;
  el.innerHTML = `
    <dialog class="search-dialog" id="search-dialog" aria-label="搜索文章">
      <div class="search-head">
        <span>搜索文章</span>
        <button type="button" class="icon-btn" data-search-close aria-label="关闭搜索"><span class="esc-key">ESC</span></button>
      </div>
      <div class="search-input-wrap">
        <input class="search-input" id="search-input" type="search" placeholder="输入标题、标签或关键词…" autocomplete="off" />
      </div>
      <div class="search-results" id="search-results"></div>
    </dialog>`;
}

/* ---- 文章卡片 ---- */
function postCard(post) {
  const tags = post.tags.map(t => `<a class="tag" href="tags.html?tag=${encodeURIComponent(t)}">#${t}</a>`).join('');
  return `
    <article class="post-card" data-reveal>
      <a class="card-link" href="posts/${post.slug}.html" aria-label="${post.title}"></a>
      <div class="post-meta">
        <time datetime="${post.date}">${formatDate(post.date)}</time>
        <span class="post-cat">${post.category}</span>
        ${tags}
        <span class="reading">${post.reading} min</span>
      </div>
      <h3><a href="posts/${post.slug}.html">${post.title}</a></h3>
      <p>${post.excerpt}</p>
      <span class="card-underline" aria-hidden="true"></span>
    </article>`;
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${y}年${Number(m)}月${Number(d)}日`;
}

window.Components = { renderHeader, renderFooter, renderSearch, postCard, formatDate };
})();
