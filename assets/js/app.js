/* ===========================================================
   UI —— 全站公共组件：顶栏、印章水印、书封、模态、轻提示、当赏动画
   =========================================================== */
(function () {
  const S = window.Store;
  // 子目录页面（如 tools/cost.html）用 <body data-base="../"> 指定前缀
  const BASE = (document.body && document.body.dataset && document.body.dataset.base) || '';

  const NAV = [
    { key: 'tavern', href: 'tavern.html', label: '酒肆', icon: 'bamboo.png', title: '看看别人写了什么' },
    { key: 'shelf', href: 'shelf.html', label: '我的酒架', text: true },
    { key: 'isbn', href: 'isbn.html', label: '寻书', text: true },
    { key: 'settings', href: 'settings.html', label: '设置', text: true },
    { key: 'admin', href: 'admin.html', label: '后台', text: true },
    { key: 'post', href: '#', label: '驿站', icon: 'post.png', title: '给馆主提建议', action: 'feedback' },
  ];

  function header(active) {
    const u = S.currentUser();
    const host = document.getElementById('app-header');
    if (!host) return;
    const shown = active === 'login' ? [] : NAV.filter((n) => n.key !== 'admin' || (u && (u.role === 'owner' || u.role === 'admin')));
    const itemHtml = (n) => {
      const isText = !n.icon;
      const cls = 'nav-item' + (isText ? ' nav-text' : '') + (active === n.key ? ' active' : '');
      const inner = n.icon
        ? `<img src="${BASE}assets/img/${n.icon}" alt="">`
        : `<span>${n.label}</span>`;
      const label = n.label + (n.title ? '：' + n.title : '');
      const cur = active === n.key ? ' aria-current="page"' : '';
      if (n.action === 'feedback') {
        return `<a class="${cls} post-nav" href="#" data-feedback title="${n.title || ''}" aria-label="${label}">${inner}</a>`;
      }
      return `<a class="${cls}" href="${BASE}${n.href}" title="${n.title || n.label}" aria-label="${label}"${cur}>${inner}</a>`;
    };
    const post = shown.find((n) => n.action === 'feedback');
    const navHtml = shown.filter((n) => n.action !== 'feedback').map(itemHtml).join('');

    const meHtml = u
      ? `<a class="nav-item" href="${BASE}me.html" title="${S.escapeHtml(u.username)}" aria-label="个人中心：${S.escapeHtml(u.username)}">
           <span class="nav-avatar" aria-hidden="true">${S.escapeHtml(u.username.slice(0, 1))}</span>
         </a>`
      : `<a class="nav-item nav-text" href="${BASE}index.html">登录</a>`;

    const main = document.querySelector('main');
    if (main && !main.id) main.id = 'main';
    host.outerHTML = `
      <a class="skip-link" href="#main">跳到正文</a>
      <header class="site-header">
        <a class="brand" href="${BASE}${u ? 'shelf.html' : 'index.html'}" aria-label="四夕酒馆">
          <span class="brand-halo"><img src="${BASE}assets/img/seal1.png" alt=""></span>
          <img class="brand-title" src="${BASE}assets/img/title.png" alt="四夕酒馆">
        </a>
        <p class="header-line" aria-hidden="true">他在荒芜的阳光下聚沙成塔，<br>远处的堤岸是无法回望的家</p>
        <nav class="nav" aria-label="主导航">
          ${navHtml}
          ${meHtml}
          ${post ? itemHtml(post) : ''}
        </nav>
      </header>`;
    document.querySelectorAll('[data-feedback]').forEach((el) => {
      el.addEventListener('click', (e) => { e.preventDefault(); feedbackModal(); });
    });
    watermark();
    footerLinks();
  }

  function footerLinks() {
    const f = document.querySelector('.site-foot');
    if (!f || f.dataset.rich) return;
    f.dataset.rich = '1';
    const origin = f.innerHTML;
    f.innerHTML = `<div class="foot-links">
        <a href="${BASE}about.html">关于酒馆</a><span>·</span>
        <a href="${BASE}privacy.html">隐私政策</a><span>·</span>
        <a href="${BASE}terms.html">用户协议</a><span>·</span>
        <a href="#" data-feedback>联系馆主</a>
      </div>
      <div class="foot-copy">${origin}</div>`;
    f.querySelectorAll('[data-feedback]').forEach((el) => {
      el.addEventListener('click', (e) => { e.preventDefault(); feedbackModal(); });
    });
  }

  function watermark() {
    if (document.querySelector('.watermark')) return;
    const d = document.createElement('div');
    d.className = 'watermark';
    d.innerHTML = '<img src="' + BASE + 'assets/img/seal2.png" alt="">';
    document.body.appendChild(d);
  }

  /* ---------- 书封 ---------- */
  function coverHTML(book, opts) {
    opts = opts || {};
    const [c1, c2] = S.colorPair(book.color || 0);
    if (book.cover) {
      return `<div class="cover ${opts.cls || ''}"><img src="${book.cover}" alt="${S.escapeHtml(book.title)}封面"></div>`;
    }
    const raw = String(book.title || '无题');
    const label = S.escapeHtml(raw.length > 14 ? raw.slice(0, 14) : raw);
    const fs = raw.length <= 4 ? 1.05 : raw.length <= 6 ? 0.95 : raw.length <= 9 ? 0.84 : 0.74;
    return `<div class="cover cover-cloth ${opts.cls || ''}" style="--c1:${c1};--c2:${c2}">
        <div class="cover-thread"><i></i><i></i><i></i><i></i></div>
        <div class="cover-label"><span style="font-size:calc(var(--cover-fs,19px) * ${fs})">${label}</span></div>
        ${opts.badge ? `<div class="cover-badge">${opts.badge}</div>` : ''}
      </div>`;
  }

  /* ---------- 生日选择器（年 / 月 / 日） ---------- */
  function birthPicker(prefix, initial) {
    const y = document.getElementById(prefix + 'Y');
    const m = document.getElementById(prefix + 'M');
    const d = document.getElementById(prefix + 'D');
    if (!y || !m || !d) return () => '';

    const thisYear = new Date().getFullYear();
    let html = '<option value="">年</option>';
    for (let i = thisYear; i >= 1930; i--) html += `<option value="${i}">${i}</option>`;
    y.innerHTML = html;

    html = '<option value="">月</option>';
    for (let i = 1; i <= 12; i++) html += `<option value="${i}">${i}</option>`;
    m.innerHTML = html;

    function fillDays() {
      const yy = Number(y.value);
      const mm = Number(m.value);
      const max = yy && mm ? new Date(yy, mm, 0).getDate() : 31;
      const keep = Number(d.value);
      let h = '<option value="">日</option>';
      for (let i = 1; i <= max; i++) h += `<option value="${i}">${i}</option>`;
      d.innerHTML = h;
      if (keep && keep <= max) d.value = String(keep);
    }
    fillDays();

    if (initial && /^\d{4}-\d{2}-\d{2}$/.test(initial)) {
      const [yy, mm, dd] = initial.split('-');
      y.value = yy; m.value = String(Number(mm)); fillDays(); d.value = String(Number(dd));
    }

    y.addEventListener('change', fillDays);
    m.addEventListener('change', fillDays);
    d.addEventListener('change', () => {});

    return function value() {
      if (!y.value || !m.value || !d.value) return '';
      return y.value + '-' + String(m.value).padStart(2, '0') + '-' + String(d.value).padStart(2, '0');
    };
  }

  /* ---------- 轻提示 ---------- */
  function toast(msg, ms) {
    let wrap = document.querySelector('.toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => {
      t.style.transition = 'opacity .3s, transform .3s';
      t.style.opacity = '0';
      t.style.transform = 'translateY(6px)';
      setTimeout(() => t.remove(), 320);
    }, ms || 2400);
  }

  /* ---------- 模态 ---------- */
  let maskEl = null;
  function modal(html, opts) {
    opts = opts || {};
    closeModal();
    maskEl = document.createElement('div');
    maskEl.className = 'modal-mask';
    maskEl.innerHTML = `<div class="modal ${opts.wide ? 'wide' : ''}">${html}</div>`;
    document.body.appendChild(maskEl);
    requestAnimationFrame(() => maskEl.classList.add('on'));
    maskEl.addEventListener('click', (e) => { if (e.target === maskEl) closeModal(); });
    document.addEventListener('keydown', escClose);
    return maskEl.querySelector('.modal');
  }
  function escClose(e) { if (e.key === 'Escape') closeModal(); }
  function closeModal() {
    if (!maskEl) return;
    maskEl.classList.remove('on');
    const el = maskEl; maskEl = null;
    document.removeEventListener('keydown', escClose);
    setTimeout(() => el.remove(), 260);
  }

  /* ---------- 登录保护 ---------- */
  function requireAuth() {
    const u = S.currentUser();
    if (u) return u;
    const next = encodeURIComponent(location.pathname.split('/').pop() + location.search);
    location.replace('index.html?next=' + next);
    return null;
  }

  function avatar(name, cls) {
    return `<span class="ava ${cls || ''}">${S.escapeHtml((name || '客').slice(0, 1))}</span>`;
  }

  /* ---------- 当赏动画 ---------- */
  const TIP_SVG = `
  <div class="tip-float">谢君一盏</div>
  <svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="wineG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f2cd82"/>
        <stop offset="55%" stop-color="#d29a3c"/>
        <stop offset="100%" stop-color="#a9701f"/>
      </linearGradient>
      <linearGradient id="jarG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#a4693c"/>
        <stop offset="50%" stop-color="#7a4526"/>
        <stop offset="100%" stop-color="#4a2814"/>
      </linearGradient>
      <linearGradient id="celadonG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#e9f0e8"/>
        <stop offset="100%" stop-color="#b6c9ba"/>
      </linearGradient>
      <radialGradient id="bowlWine" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#cf9546"/>
        <stop offset="100%" stop-color="#87531c"/>
      </radialGradient>
    </defs>

    <!-- 碗：青瓷，圈足 + 莲瓣 -->
    <g class="bowl">
      <path d="M24 149 h108 c0 18 -24 31 -54 31 s-54 -13 -54 -31 z" fill="url(#celadonG)" stroke="#94a99a" stroke-width="1.4"/>
      <ellipse cx="78" cy="149" rx="54" ry="10.5" fill="#eff5ef" stroke="#94a99a" stroke-width="1.4"/>
      <ellipse cx="78" cy="150" rx="45" ry="7.8" fill="url(#bowlWine)" opacity=".85"/>
      <path d="M50 179 h56 l-5 7 h-46 z" fill="#c9d8cb" stroke="#94a99a" stroke-width="1.2"/>
      <path d="M36 160 q9 8 22 11 M120 160 q-9 8 -22 11" fill="none" stroke="#a8bcac" stroke-width="1.1"/>
      <ellipse cx="78" cy="150" rx="28" ry="4" fill="#e7b96a" opacity=".25"/>
    </g>

    <!-- 坛盖（打开后放在一旁） -->
    <g class="lid" opacity=".95">
      <ellipse cx="206" cy="176" rx="17" ry="6" fill="#6b3d20" stroke="#43250f" stroke-width="1.2"/>
      <path d="M189 176 q17 -12 34 0" fill="#7a4526" stroke="#43250f" stroke-width="1.2"/>
      <circle cx="206" cy="166" r="4" fill="#5a3418"/>
    </g>

    <!-- 酒坛：开盖，坛口朝下倾 -->
    <g class="jar" style="transform-origin:166px 92px">
      <g transform="translate(166 92) rotate(-142)">
        <ellipse cx="0" cy="0" rx="16" ry="6" fill="#2a1508"/>
        <ellipse cx="0" cy="0" rx="16" ry="6" fill="none" stroke="#5a3418" stroke-width="2"/>
        <ellipse cx="0" cy="1.4" rx="11.6" ry="4" fill="#c98f3f" opacity=".5"/>
        <path d="M-14 3 q-2 9 1 12 h26 q3 -3 1 -12 z" fill="url(#jarG)" stroke="#43250f" stroke-width="1.2"/>
        <path d="M-26 14 C-38 24 -40 44 -35 58 C-30 72 -16 78 0 78 C16 78 30 72 35 58 C40 44 38 24 26 14 z"
              fill="url(#jarG)" stroke="#43250f" stroke-width="1.4"/>
        <path d="M-24 30 q24 9 48 0" stroke="rgba(245,226,196,.26)" stroke-width="2" fill="none"/>
        <path d="M-29 46 q29 11 58 0" stroke="rgba(245,226,196,.16)" stroke-width="1.6" fill="none"/>
        <text x="0" y="60" text-anchor="middle" font-size="15" fill="rgba(246,232,208,.6)"
              font-family="serif" letter-spacing="1">酒</text>
        <path d="M-17 20 q-4 15 0 28" stroke="rgba(255,240,220,.16)" stroke-width="3" fill="none"/>
      </g>
    </g>

    <!-- 酒液：有粗细变化的柱状流，末端断开 -->
    <g class="stream" style="transform-origin:160px 96px">
      <path d="M157 95 C 150 114 134 131 116 145 L100 139 C 121 125 139 109 147 90 Z"
            fill="url(#wineG)" opacity=".97"/>
      <path d="M152 104 C 146 120 134 134 122 143" stroke="rgba(255,238,200,.5)" stroke-width="1.6" fill="none"/>
      <ellipse cx="140" cy="118" rx="7.2" ry="10" fill="url(#wineG)" opacity=".92"/>
      <ellipse cx="126" cy="133" rx="5.2" ry="8" fill="url(#wineG)" opacity=".9"/>
    </g>

    <!-- 断开的酒滴 -->
    <g class="drops">
      <circle class="drop d1" cx="108" cy="146" r="3.6" fill="#d29a3c"/>
      <circle class="drop d2" cx="102" cy="141" r="2.4" fill="#e0ae55"/>
      <circle class="drop d3" cx="116" cy="150" r="2" fill="#c98f3f"/>
    </g>

    <!-- 落点酒花 -->
    <g class="splash">
      <ellipse class="ring" cx="80" cy="150" rx="13" ry="3.8" fill="none" stroke="#f0c979" stroke-width="1.6"/>
      <circle class="sp s1" cx="68" cy="146" r="2.6" fill="#e7b96a"/>
      <circle class="sp s2" cx="92" cy="144" r="2" fill="#f0c979"/>
      <circle class="sp s3" cx="84" cy="141" r="1.8" fill="#d29a3c"/>
    </g>
  </svg>`;

  function playTip(btn) {
    if (!btn) return;
    let stage = btn.querySelector('.tip-stage');
    if (!stage) {
      stage = document.createElement('div');
      stage.className = 'tip-stage';
      stage.innerHTML = TIP_SVG;
      btn.appendChild(stage);
    }
    stage.classList.remove('show');
    void stage.offsetWidth;
    stage.classList.add('show');
    btn.classList.add('tipped');
    clearTimeout(btn._tipTimer);
    btn._tipTimer = setTimeout(() => stage.classList.remove('show'), 2400);
  }

  /* ---------- 广告位 ---------- */
  function renderAds() {
    let slots = [];
    try { slots = (S.load().adSlots) || []; } catch (e) { slots = []; }
    const me = S.currentUser();
    const isOwner = me && (me.role === 'owner' || me.role === 'admin');

    document.querySelectorAll('[data-ad-slot]').forEach((el) => {
      const id = el.getAttribute('data-ad-slot');
      const cfg = slots.find((x) => x.id === id);
      if (!cfg || !cfg.enabled) { el.style.display = 'none'; return; }

      const code = (cfg.code || '').trim();
      if (!code) {
        // 没填代码：只给馆主看占位，普通访客直接隐藏
        el.style.display = isOwner ? '' : 'none';
        return;
      }

      el.style.display = '';
      el.classList.add('ad-filled');
      el.innerHTML = code;
      // 允许广告联盟的 <script> 真正执行
      el.querySelectorAll('script').forEach((old) => {
        const sc = document.createElement('script');
        Array.from(old.attributes).forEach((a) => sc.setAttribute(a.name, a.value));
        sc.textContent = old.textContent;
        old.replaceWith(sc);
      });
    });
  }

  /* ---------- 驿站 ---------- */
  function feedbackModal() {
    const has = document.querySelector('.modal-mask');
    if (has) closeModal();
    const m = modal(`
      <h3>驿站 · 给馆主递一张纸条</h3>
      <p class="sub">功能建议、内容举报、合作洽谈，都可以从这里寄出。</p>
      <div class="field">
        <label>纸条类型</label>
        <select class="select" id="fbType">
          <option value="建议">功能建议</option>
          <option value="举报">内容举报</option>
          <option value="问题">使用问题</option>
          <option value="合作">合作洽谈</option>
        </select>
      </div>
      <div class="field">
        <label>写点什么</label>
        <textarea class="textarea" id="fbText" placeholder="越具体，越容易被看见。"></textarea>
      </div>
      <div class="modal-foot">
        <button class="btn" data-close>再想想</button>
        <button class="btn btn-primary" id="fbSend">寄出</button>
      </div>`);
    m.querySelector('[data-close]').onclick = closeModal;
    m.querySelector('#fbSend').onclick = () => {
      const txt = m.querySelector('#fbText').value.trim();
      if (txt.length < 4) { toast('多写几个字吧'); return; }
      S.addFeedback(m.querySelector('#fbType').value, txt);
      closeModal();
      toast('纸条已送到驿站，谢过');
    };
  }

  /* ---------- 其它 ---------- */
  function param(name) {
    return new URLSearchParams(location.search).get(name);
  }
  function visibilityLabel(v) {
    return { public: '所有人可见', followers: '关注者可见', private: '仅自己可见' }[v] || '仅自己可见';
  }
  function statusBadge(status) {
    if (status === 'published') return '';
    if (status === 'pending') return '<span class="badge badge-pending">审核中</span>';
    if (status === 'rejected') return '<span class="badge badge-rejected">未通过</span>';
    if (status === 'draft') return '<span class="badge badge-private">草稿</span>';
    return '';
  }

  /* ---------- PWA：离线缓存 ---------- */
  function initPWA() {
    try {
      if (!document.querySelector('link[rel="manifest"]')) {
        const l = document.createElement('link');
        l.rel = 'manifest'; l.href = 'manifest.webmanifest';
        document.head.appendChild(l);
      }
      const meta = document.createElement('meta');
      meta.name = 'theme-color'; meta.content = '#f6f1e6';
      document.head.appendChild(meta);
      if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('sw.js').catch(() => {});
        });
      }
    } catch (e) {}
  }
  initPWA();

  window.UI = {
    header, watermark, coverHTML, toast, modal, closeModal, requireAuth, birthPicker,
    avatar, playTip, renderAds, attachTip: (btn) => { btn.addEventListener('click', (e) => { e.preventDefault(); playTip(btn); }); },
    feedbackModal, param, visibilityLabel, statusBadge,
  };
})();
