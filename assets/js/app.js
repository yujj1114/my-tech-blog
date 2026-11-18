/* ============================================================
 * app.js —— 交互逻辑
 * 主题 / 搜索 / 移动菜单 / 时间线 / 入场动画 / 粒子背景
 * 无第三方依赖，file:// 双击即可运行。
 * ============================================================ */

(function () {
  'use strict';
  const S = window.SITE;
  const C = window.Components;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  void S; // 站点配置在页面内联脚本与各组件中使用

  /* ---- 0. 访问码传播：发布平台用 ?sharecode= 做访问凭证，站内跳转必须原样携带，否则 403 ---- */
  const shareCode = (() => { try { return new URLSearchParams(location.search).get('sharecode') || ''; } catch (e) { return ''; } })();
  function withShare(url) {
    if (!shareCode) return url;
    try {
      const u = new URL(url, location.href);
      if (u.origin === location.origin && !u.searchParams.has('sharecode')) u.searchParams.set('sharecode', shareCode);
      // 尽量保留相对形式，避免 file:// 本地打开时变成绝对路径
      if (!/^[a-z]+:\/\//i.test(url) && url.charAt(0) !== '/') return u.pathname.replace(/^\//, '') + u.search + u.hash;
      return u.pathname + u.search + u.hash;
    } catch (e) { return url; }
  }
  // 给页面中已有的站内相对链接补访问码（组件渲染后调用）
  function decorateLinks(root) {
    if (!shareCode) return;
    (root || document).querySelectorAll('a[href]').forEach(a => {
      const raw = a.getAttribute('href');
      if (!raw || raw.charAt(0) === '#' || /^(mailto|tel|javascript):/i.test(raw) || /^(https?:)?\/\//i.test(raw)) return;
      a.setAttribute('href', withShare(raw));
    });
  }
  window.__withShare = withShare;

  /* ---- 1. 渲染共享组件 ---- */
  C.renderHeader();
  C.renderFooter();
  C.renderSearch();
  decorateLinks(document); // 静态/组件链接补访问码（搜索结果为运行时生成，用 withShare 处理）

  /* ---- 2. 主题切换（存储键 theme-v2，与参考站隔离）---- */
  const THEME_KEY = 'theme-v2';
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
  }
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    });
  });

  /* ---- 3. 移动菜单 ---- */
  const menuBtn = document.querySelector('[data-menu-toggle]');
  const mobileMenu = document.getElementById('mobile-menu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
  }

  /* ---- 4. 搜索弹窗（Ctrl+K / Cmd+K）---- */
  const dialog = document.getElementById('search-dialog');
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');

  const escHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function highlight(text, q) {
    if (!q) return escHtml(text);
    const i = text.toLowerCase().indexOf(q);
    if (i < 0) return escHtml(text);
    return escHtml(text.slice(0, i)) + '<mark>' + escHtml(text.slice(i, i + q.length)) + '</mark>' + escHtml(text.slice(i + q.length));
  }
  let resultList = [];
  let activeIndex = -1;
  function paintActive() {
    const items = results.querySelectorAll('.search-result');
    items.forEach((a, i) => a.classList.toggle('active', i === activeIndex));
    if (activeIndex >= 0 && items[activeIndex]) items[activeIndex].scrollIntoView({ block: 'nearest' });
  }
  function renderResults(query) {
    const q = query.trim().toLowerCase();
    const texts = window.POST_TEXT || {};
    const list = q
      ? S.posts.filter(p => {
          const hay = (p.title + ' ' + p.excerpt + ' ' + p.category + ' ' + p.tags.join(' ') + ' ' + (texts[p.slug] || '')).toLowerCase();
          return hay.includes(q);
        })
      : S.posts;
    resultList = list;
    activeIndex = -1;
    if (!list.length) {
      results.innerHTML = '<div class="search-empty">没有匹配的文章，换个关键词试试</div>';
      return;
    }
    results.innerHTML = list.map(p => {
      const meta = C.formatDate(p.date) + ' · ' + p.category + ' · ' + p.tags.map(t => '#' + t).join(' ');
      let snippet = '';
      if (q && texts[p.slug]) {
        const t = texts[p.slug], at = t.toLowerCase().indexOf(q);
        if (at >= 0) snippet = (at > 24 ? '…' : '') + t.slice(Math.max(0, at - 24), at + q.length + 60).trim() + '…';
      }
      return `
      <a class="search-result" href="${withShare(postHref(p.slug))}">
        <h4>${highlight(p.title, q)}</h4>
        <p>${highlight(meta, q)}</p>
        ${snippet ? '<p class="search-snippet">' + highlight(snippet, q) + '</p>' : ''}
      </a>`;
    }).join('');
  }
  function postHref(slug) {
    const inPosts = /(^|\/)posts\/[^/]*$/i.test(location.pathname);
    const base = inPosts ? location.pathname.replace(/posts\/[^/]*$/, '') : location.pathname.replace(/[^/]*$/, '');
    return base + 'posts/' + slug + '.html';
  }

  function openSearch() {
    if (!dialog) return;
    if (mobileMenu) { mobileMenu.classList.remove('open'); }
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    if (input) { input.value = ''; renderResults(''); input.focus(); }
  }
  function closeSearch() {
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  document.addEventListener('click', e => {
    if (e.target.closest('[data-search-open]')) { e.preventDefault(); openSearch(); }
    if (e.target.closest('[data-search-close]')) { e.preventDefault(); closeSearch(); }
  });
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); }
    if (dialog && dialog.open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      if (!resultList.length) return;
      activeIndex = e.key === 'ArrowDown'
        ? (activeIndex + 1) % resultList.length
        : (activeIndex <= 0 ? resultList.length - 1 : activeIndex - 1);
      paintActive();
    }
    if (dialog && dialog.open && e.key === 'Enter' && activeIndex >= 0 && resultList[activeIndex]) {
      e.preventDefault();
      location.href = withShare(postHref(resultList[activeIndex].slug));
    }
  });
  if (input) input.addEventListener('input', e => renderResults(e.target.value));
  if (dialog) {
    dialog.addEventListener('click', e => { if (e.target === dialog) closeSearch(); });
  }

  /* ---- 5. 时间线折叠 ---- */
  document.querySelectorAll('.tl-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      target.classList.toggle('open', !expanded);
    });
  });

  /* ---- 6. 入场动画由 CSS 自动播放（见 style.css），内容始终可见 ---- */

  /* ---- 7. 粒子背景（低数量 + 失焦暂停 + 减少动效关闭）---- */
  const canvas = document.getElementById('hero-canvas');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, particles = [], raf = null, running = false;
    const accent = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#a8435f';

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(46, Math.round(w * h / 22000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        r: Math.random() * 1.3 + 0.5
      }));
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      const color = accent();
      ctx.fillStyle = color;
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.globalAlpha = 0.28;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
    }
    function loop() { draw(); raf = requestAnimationFrame(loop); }
    function start() { if (!running) { running = true; loop(); } }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    start();
  }

  /* ============================================================
   * 炫酷动效组 —— 仅在精确指针 + 未开启减少动效时启用
   * ① hero 鼠标跟随光晕 ② 磁性按钮 ③ 卡片 3D 倾斜 ④ 数字滚动计数
   * 全部为渐进增强：不启用时页面功能与可读性完全不受影响。
   * ============================================================ */
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const motionOK = !reduceMotion && finePointer;

  if (motionOK) {
    /* ---- ① hero 鼠标跟随光晕 ---- */
    const hero = document.querySelector('.hero');
    if (hero) {
      let hr = null;
      hero.addEventListener('pointermove', (e) => {
        if (hr) return;
        hr = requestAnimationFrame(() => {
          const rect = hero.getBoundingClientRect();
          hero.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
          hero.style.setProperty('--my', (e.clientY - rect.top) + 'px');
          hero.style.setProperty('--glow-op', '1');
          hr = null;
        });
      }, { passive: true });
      hero.addEventListener('pointerleave', () => {
        hero.style.setProperty('--glow-op', '0');
      });
    }

    /* ---- ② 磁性按钮 ---- */
    document.querySelectorAll('.btn').forEach(btn => {
      const strength = 0.28, max = 7;
      btn.addEventListener('pointermove', (e) => {
        const rect = btn.getBoundingClientRect();
        const dx = (e.clientX - rect.left - rect.width / 2) * strength;
        const dy = (e.clientY - rect.top - rect.height / 2) * strength;
        const tx = Math.max(-max, Math.min(max, dx));
        const ty = Math.max(-max, Math.min(max, dy));
        btn.style.transform = `translate(${tx}px, ${ty}px)`;
      }, { passive: true });
      btn.addEventListener('pointerleave', () => {
        btn.style.transform = '';
      });
    });

    /* ---- ③ 卡片 3D 倾斜 ---- */
    document.querySelectorAll('.post-card').forEach(card => {
      let cr = null, last = null;
      card.addEventListener('pointermove', (e) => {
        last = e;
        if (cr) return;
        cr = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const px = (last.clientX - rect.left) / rect.width;
          const py = (last.clientY - rect.top) / rect.height;
          const rx = (0.5 - py) * 9;   // 上下倾斜 ±4.5deg
          const ry = (px - 0.5) * 9;   // 左右倾斜 ±4.5deg
          card.classList.add('is-tilting');
          card.style.transform = `translateY(-4px) rotateX(${rx}deg) rotateY(${ry}deg)`;
          card.style.setProperty('--cx', (px * 100) + '%');
          card.style.setProperty('--cy', (py * 100) + '%');
          cr = null;
        });
      }, { passive: true });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('is-tilting');
        card.style.transform = '';
        card.style.setProperty('--sheen', '');
      });
    });
  }

  /* ---- ④ 数字滚动计数（不依赖指针，仅受减少动效限制）---- */
  if (!reduceMotion) {
    // 年份这类 4 位数字不加千分位，避免 2026 显示成 2,026
    const fmt = n => String(n);
    document.querySelectorAll('.stat-num').forEach(el => {
      const targetText = el.textContent.trim();
      const match = targetText.match(/^(\d+)(.*)$/); // 分离数字与后面的 "+" 等
      if (!match) return;
      const target = Number(match[1]);
      const suffix = match[2] || '';
      if (!Number.isFinite(target)) return;
      const duration = 1100;
      const start = performance.now();
      el.textContent = '0' + suffix;
      function tick(now) {
        const t = Math.min(1, (now - start) / duration);
        const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
        el.textContent = fmt(Math.round(target * ease)) + suffix;
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = fmt(target) + suffix;
      }
      requestAnimationFrame(tick);
    });
  }

  /* ---- ⑤ 打字机标题（仅首页 hero-emphasis，逐字显现 + 光标）---- */
  if (!reduceMotion) {
    const title = document.getElementById('hero-emphasis');
    if (title && title.textContent) {
      const full = title.textContent;
      title.setAttribute('data-full', full);   // 安全副本，异常时可恢复
      title.setAttribute('aria-label', full);  // 读屏读完整文本，不受逐字影响
      try {
        title.textContent = '';
        const caret = document.createElement('span');
        caret.className = 'type-caret';
        caret.setAttribute('aria-hidden', 'true');
        title.appendChild(caret);
        let i = 0;
        (function typeTick() {
          if (i >= full.length) {
            caret.classList.add('done');
            setTimeout(() => caret.remove(), 400);
            return;
          }
          caret.insertAdjacentText('beforebegin', full[i]);
          i++;
          setTimeout(typeTick, 85);
        })();
      } catch (err) {
        title.textContent = full; // 任何异常都恢复完整文本，绝不让标题缺失
      }
    }
  }

  /* ---- ⑥ 点击涟漪（按钮点击反馈，触屏同样生效）---- */
  if (!reduceMotion) {
    document.addEventListener('pointerdown', (e) => {
      const btn = e.target.closest('.btn');
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const r = document.createElement('span');
      r.className = 'ripple';
      r.style.left = (e.clientX - rect.left) + 'px';
      r.style.top = (e.clientY - rect.top) + 'px';
      btn.appendChild(r);
      r.addEventListener('animationend', () => r.remove());
      setTimeout(() => r.remove(), 900); // 兜底清理
    });
  }

  /* ---- ⑦ 滚动进度条（功能指示，reduced-motion 下保留但即时更新）---- */
  (function scrollProgress() {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    document.documentElement.classList.add('has-scroll-progress');
    let ticking = false;
    function update() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, doc.scrollTop / max)) : 0;
      bar.style.transform = 'scaleX(' + p + ')';
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  })();

  /* ---- ⑧ 自定义光标（仅精确指针 + 未开启减少动效）---- */
  if (!reduceMotion && finePointer) {
    (function customCursor() {
      const dot = document.createElement('div');
      dot.className = 'cursor-dot';
      const ring = document.createElement('div');
      ring.className = 'cursor-ring';
      document.body.appendChild(ring);
      document.body.appendChild(dot);
      document.documentElement.classList.add('custom-cursor');

      let tx = -100, ty = -100;   // 目标坐标
      let rx = -100, ry = -100;   // 环当前坐标（缓动追随）
      let visible = false;
      const HOVER_SEL = 'a, button, [role="button"], .tag, .tl-toggle, label';

      window.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        tx = e.clientX; ty = e.clientY;
        if (!visible) {
          visible = true;
          rx = tx; ry = ty;
          dot.style.transform = `translate(${tx}px, ${ty}px)`;
          ring.style.transform = `translate(${rx}px, ${ry}px)`;
        }
        const el = e.target;
        const isText = !!(el && el.closest && el.closest('input, textarea'));
        const isHover = !!(el && el.closest && el.closest(HOVER_SEL));
        ring.classList.toggle('is-text', isText);
        ring.classList.toggle('is-hover', isHover && !isText);
        dot.classList.toggle('is-hover', isHover || isText);
      }, { passive: true });

      document.addEventListener('pointerleave', () => {
        visible = false;
        dot.style.opacity = ''; ring.style.opacity = '';
        document.documentElement.classList.remove('custom-cursor');
      });
      document.addEventListener('pointerenter', () => {
        if (reduceMotion) return;
        visible = true;
        document.documentElement.classList.add('custom-cursor');
      });

      // 环用 rAF 缓动追随点，形成"拖尾"质感
      (function follow() {
        rx += (tx - rx) * 0.18;
        ry += (ty - ry) * 0.18;
        ring.style.transform = `translate(${rx}px, ${ry}px)`;
        dot.style.transform = `translate(${tx}px, ${ty}px)`;
        requestAnimationFrame(follow);
      })();
    })();
  }

  /* ---- ⑨ 文章目录滚动高亮（仅文章页有 h2 时启用）---- */
  (function tocHighlight() {
    const heads = Array.from(document.querySelectorAll('.article-body h2[id^="sec-"]'));
    const links = Array.from(document.querySelectorAll('[data-toc]'));
    if (!heads.length || !links.length) return;
    // 静态页带 <base href="../">，完整 URL 的目录链接会触发重载；改为同页锚点跳转
    links.forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.dataset.toc;
        const target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        // <base href="../"> 下相对 hash 会被解析到根目录，用绝对路径保证落到本文
        try { history.replaceState(null, '', location.pathname + location.search + '#' + id); } catch (err) {}
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      });
    });
    let ticking = false;
    function update() {
      const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 64;
      const line = navH + 72; // 判定线：导航下方一点
      let activeId = heads[0].id;
      for (const h of heads) {
        if (h.getBoundingClientRect().top <= line) activeId = h.id;
        else break;
      }
      // 滚到页面底部时高亮最后一段
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80) {
        activeId = heads[heads.length - 1].id;
      }
      links.forEach(a => a.classList.toggle('active', a.dataset.toc === activeId));
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  })();

  /* ---- ⑪ 阅读进度环 + 返回顶部（文章页）---- */
  (function readProgressFab() {
    const article = document.querySelector('.article-body');
    if (!article) return; // 仅文章页
    const CIRC = 2 * Math.PI * 22;
    const fab = document.createElement('button');
    fab.className = 'read-fab';
    fab.type = 'button';
    fab.setAttribute('aria-label', '返回顶部');
    fab.innerHTML = `
      <svg class="ring" viewBox="0 0 54 54" aria-hidden="true">
        <circle class="ring-track" cx="27" cy="27" r="22"></circle>
        <circle class="ring-fill" cx="27" cy="27" r="22"></circle>
      </svg>
      <span class="fab-label">0%</span>
      <span class="fab-arrow" aria-hidden="true">↑</span>`;
    document.body.appendChild(fab);
    const fill = fab.querySelector('.ring-fill');
    const label = fab.querySelector('.fab-label');

    function update() {
      const rect = article.getBoundingClientRect();
      const total = article.offsetHeight - window.innerHeight + 120;
      let p = 0;
      if (rect.top < 0) p = -rect.top / Math.max(1, total);
      p = Math.min(1, Math.max(0, p));
      const pct = Math.round(p * 100);
      fill.style.strokeDashoffset = String(CIRC * (1 - p));
      label.textContent = pct + '%';
      fab.classList.toggle('show', window.scrollY > 240);
      ticking = false;
    }
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    fab.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    update();
  })();

  /* ---- ⑩ 轻溶解换页转场（站内链接，降低动效时跳过）---- */
  (function pageDissolve() {
    if (reduceMotion) {
      // 降级：清掉可能残留的淡入标记，正常显示
      try { sessionStorage.removeItem('jie-dissolve'); } catch (e) {}
      document.documentElement.classList.remove('pre-dissolve');
      return;
    }
    const KEY = 'jie-dissolve';
    const html = document.documentElement;

    // 新页：head 前置脚本已按标记加上 pre-dissolve（首帧透明）。
    // 双 rAF 等首帧绘制完成后移除，触发 body opacity / #main blur 的淡入过渡。
    if (html.classList.contains('pre-dissolve')) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        html.classList.remove('pre-dissolve');
      }));
    }

    // 拦截站内 .html 链接：先淡出当前页，再跳转
    let navigating = false;
    document.addEventListener('click', (e) => {
      if (navigating || e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest('a[href]');
      if (!a) return;
      if (a.target && a.target !== '_self') return;
      if (a.hasAttribute('download')) return;
      const raw = a.getAttribute('href');
      if (!raw || raw.startsWith('#') || /^(mailto|tel|javascript):/i.test(raw)) return;
      if (/^(https?:)?\/\//i.test(raw)) return; // 外链不拦截
      let url;
      try { url = new URL(raw, location.href); } catch (err) { return; }
      if (url.origin !== location.origin) return;
      if (!/\.html$/i.test(url.pathname)) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // 当前页

      e.preventDefault();
      navigating = true;
      try { sessionStorage.setItem(KEY, '1'); } catch (err) {}
      html.classList.add('page-out'); // body 淡出 + main 轻微模糊

      // 等淡出基本完成（240ms）再跳；异常超时则撤销标记恢复页面
      const fallback = setTimeout(() => {
        html.classList.remove('page-out');
        try { sessionStorage.removeItem(KEY); } catch (err) {}
        navigating = false;
      }, 600);
      setTimeout(() => {
        clearTimeout(fallback);
        location.href = withShare(url.href);
      }, 250);
    });
  })();
})();
