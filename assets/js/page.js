/* ============================================================
 * page.js —— 子页面通用工具
 * 提供页面标题注入、文章列表行渲染等复用函数。
 * ============================================================ */

window.Page = {
  setTitle(title) { document.title = title + ' · ' + window.SITE.title; },

  /* 设置页面头部 kicker + 标题 + 描述 */
  setHead(kicker, title, desc) {
    const k = document.getElementById('page-kicker');
    const t = document.getElementById('page-title');
    const d = document.getElementById('page-desc');
    if (k) k.textContent = kicker;
    if (t) t.textContent = title;
    if (d && desc) d.textContent = desc;
    this.setTitle(title);
  },

  /* 一列文章列表行 */
  listRows(posts) {
    return posts.map(p => `
      <article class="list-row" data-reveal>
        <div class="post-meta">
          <time datetime="${p.date}">${window.Components.formatDate(p.date)}</time>
          <span class="post-cat">${p.category}</span>
          ${p.tags.map(t => `<a class="tag" href="tags.html?tag=${encodeURIComponent(t)}">#${t}</a>`).join('')}
          <span class="reading">${p.reading} min</span>
        </div>
        <h3><a href="posts/${p.slug}.html">${p.title}</a></h3>
        <p>${p.excerpt}</p>
      </article>`).join('');
  },

  sortByDateDesc(posts) {
    return posts.slice().sort((a, b) => b.date.localeCompare(a.date));
  }
};
