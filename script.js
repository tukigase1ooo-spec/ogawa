'use strict';
/* ===================================================
   OGAWA — script.js
   ・インクスプラッターエフェクト（クリック）
   ・スクロールプログレスバー
   ・パララックス（ヒーローイラスト・テキスト）
   ・スクロールリビール（ワイプ・文字送り）
   ・カウンターアニメーション（スタッツ）
   ・WORKSフィルター
   ・ハンバーガーメニュー
   ・フォームバリデーション
=================================================== */

/* ─────────────────────────────────────────
   1. INK SPLATTER（油絵インク飛散）
───────────────────────────────────────── */
class InkSplatter {
  constructor() {
    this.canvas = document.createElement('canvas');
    Object.assign(this.canvas.style, {
      position: 'fixed',
      inset: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '9995',
    });
    document.body.appendChild(this.canvas);
    this.ctx   = this.canvas.getContext('2d');
    this.drops = [];
    this._resize();
    window.addEventListener('resize', () => this._resize());
    document.addEventListener('click', (e) => this._splat(e.clientX, e.clientY));
    this._loop();
  }

  _resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /* クリック位置にインクを生成 */
  _splat(ox, oy) {
    const COLORS = ['#ff1f6a', '#ff3375', '#cc0050', '#ff6699', '#ff0044', '#ffffff'];
    const count  = 12 + Math.floor(Math.random() * 8);

    /* ──── 放射状ブロブ ──── */
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i / count) + (Math.random() - 0.5) * 0.7;
      const speed = 1.5 + Math.random() * 8;
      const col   = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.drops.push({
        type:       'blob',
        x: ox, y: oy,
        vx:         Math.cos(angle) * speed,
        vy:         Math.sin(angle) * speed - Math.random() * 1.5,
        size:       2 + Math.random() * 10,
        maxSize:    8 + Math.random() * 28,
        color:      col,
        alpha:      0.75 + Math.random() * 0.25,
        life:       1,
        decay:      0.012 + Math.random() * 0.016,
        wobble:     Math.random() * Math.PI * 2,
        wobbleSpd:  0.04 + Math.random() * 0.08,
        pts:        this._blobPts(7 + Math.floor(Math.random() * 5)),
      });
    }

    /* ──── ドリップ（重力で垂れ落ちる） ──── */
    for (let i = 0; i < 5; i++) {
      const col = COLORS[Math.floor(Math.random() * 3)];
      this.drops.push({
        type:    'drip',
        x:       ox + (Math.random() - 0.5) * 40,
        y:       oy,
        vx:      (Math.random() - 0.5) * 1.8,
        vy:      Math.random() * 1.5,
        size:    2 + Math.random() * 5,
        maxSize: 3 + Math.random() * 7,
        color:   col,
        alpha:   0.85,
        life:    1,
        decay:   0.006 + Math.random() * 0.01,
        gravity: 0.07 + Math.random() * 0.05,
        trail:   [],
      });
    }

    /* ──── センター大ブロブ ──── */
    this.drops.push({
      type:      'blob',
      x: ox, y: oy,
      vx: 0, vy: 0,
      size:      0,
      maxSize:   20 + Math.random() * 18,
      color:     '#ff1f6a',
      alpha:     0.45,
      life:      1,
      decay:     0.008,
      wobble:    0,
      wobbleSpd: 0.02,
      pts:       this._blobPts(10),
    });

    /* ──── 細かいスパーク ──── */
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 12;
      this.drops.push({
        type:    'spark',
        x: ox, y: oy,
        vx:      Math.cos(angle) * speed,
        vy:      Math.sin(angle) * speed,
        len:     6 + Math.random() * 14,
        color:   '#ff6699',
        alpha:   0.9,
        life:    1,
        decay:   0.04 + Math.random() * 0.03,
      });
    }
  }

  /* 不規則なブロブ頂点生成 */
  _blobPts(n) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 / n) * i;
      pts.push({ a, r: 0.55 + Math.random() * 0.65 });
    }
    return pts;
  }

  /* ブロブ描画 */
  _drawBlob(d) {
    const { ctx }    = this;
    const fade       = Math.max(0, d.life);
    ctx.save();
    ctx.globalAlpha  = d.alpha * fade * fade;
    ctx.fillStyle    = d.color;
    ctx.shadowColor  = d.color;
    ctx.shadowBlur   = d.size * 0.4;
    ctx.beginPath();
    d.pts.forEach((p, i) => {
      const r  = d.size * p.r;
      const px = d.x + Math.cos(p.a + d.wobble) * r;
      const py = d.y + Math.sin(p.a + d.wobble) * r;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* ドリップ描画 */
  _drawDrip(d) {
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha = d.alpha * d.life;
    /* トレイル */
    if (d.trail.length > 1) {
      ctx.strokeStyle = d.color;
      ctx.lineWidth   = d.size * 0.55;
      ctx.lineCap     = 'round';
      ctx.beginPath();
      ctx.moveTo(d.trail[0].x, d.trail[0].y);
      d.trail.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    }
    /* ヘッド */
    ctx.fillStyle = d.color;
    ctx.shadowColor = d.color;
    ctx.shadowBlur  = d.size;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.size * 0.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* スパーク描画 */
  _drawSpark(d) {
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha  = d.alpha * d.life;
    ctx.strokeStyle  = d.color;
    ctx.lineWidth    = 1;
    ctx.lineCap      = 'round';
    ctx.shadowColor  = d.color;
    ctx.shadowBlur   = 3;
    const nx = d.x - d.vx * 0.5;
    const ny = d.y - d.vy * 0.5;
    ctx.beginPath();
    ctx.moveTo(nx, ny);
    ctx.lineTo(d.x, d.y);
    ctx.stroke();
    ctx.restore();
  }

  /* アニメーションループ */
  _loop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drops = this.drops.filter(d => d.life > 0);

    for (const d of this.drops) {
      /* 物理 */
      d.x += d.vx;
      d.y += d.vy;
      d.vx *= 0.88;

      if (d.type === 'drip') {
        d.vy += d.gravity;
        d.vy *= 0.995;
        d.trail.push({ x: d.x, y: d.y });
        if (d.trail.length > 14) d.trail.shift();
      } else if (d.type === 'spark') {
        d.vy += 0.15; // 重力
        d.vx *= 0.92;
        d.vy *= 0.92;
      } else {
        d.vy *= 0.87;
      }

      /* サイズ成長 */
      if (d.maxSize !== undefined && d.size < d.maxSize) {
        d.size += (d.maxSize - d.size) * (d.type === 'blob' ? 0.18 : 0.22);
      }

      /* ウォブル */
      if (d.wobble !== undefined) d.wobble += d.wobbleSpd;

      d.life -= d.decay;

      if (d.type === 'drip')  this._drawDrip(d);
      else if (d.type === 'spark') this._drawSpark(d);
      else                     this._drawBlob(d);
    }

    requestAnimationFrame(() => this._loop());
  }
}

/* ─────────────────────────────────────────
   2. スクロールプログレスバー
───────────────────────────────────────── */
function initProgress() {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    bar.style.transform = `scaleX(${Math.min(pct, 1)})`;
  }, { passive: true });
}

/* ─────────────────────────────────────────
   3. カーソルグロー
───────────────────────────────────────── */
function initCursor() {
  const el = document.getElementById('cursorGlow');
  if (!el || window.matchMedia('(pointer:coarse)').matches) {
    if (el) el.style.display = 'none';
    return;
  }
  let tx = 0, ty = 0, cx = 0, cy = 0;
  document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
  function tick() {
    cx += (tx - cx) * 0.08;
    cy += (ty - cy) * 0.08;
    el.style.left = cx + 'px';
    el.style.top  = cy + 'px';
    requestAnimationFrame(tick);
  }
  tick();
}

/* ─────────────────────────────────────────
   4. パララックス（ヒーロー）
───────────────────────────────────────── */
function initParallax() {
  const heroLeft  = document.querySelector('.hero-left');
  const heroWrap  = document.querySelector('.hero-illust-wrap');
  if (!heroLeft && !heroWrap) return;

  /* RAF でスロット処理してジャンク削減 */
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (heroLeft)  heroLeft.style.transform  = `translateY(${y * 0.05}px)`;
        if (heroWrap)  heroWrap.style.transform  = `translateY(${y * -0.10}px)`;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ─────────────────────────────────────────
   5. ハンバーガーメニュー
───────────────────────────────────────── */
function initHamburger() {
  const btn = document.getElementById('hamburger');
  const nav = document.getElementById('mobileNav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => {
    const open = btn.classList.toggle('open');
    nav.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    nav.setAttribute('aria-hidden',  !open);
  });
  nav.querySelectorAll('.mobile-nav-link').forEach(l => {
    l.addEventListener('click', () => {
      btn.classList.remove('open');
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      nav.setAttribute('aria-hidden', 'true');
    });
  });
}

/* ─────────────────────────────────────────
   6. NAVアクティブ + スクロールで背景強化
───────────────────────────────────────── */
function initNavScroll() {
  const header   = document.getElementById('header');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    header.style.background = window.scrollY > 20
      ? 'rgba(7,7,13,0.98)'
      : 'rgba(7,7,13,0.92)';

    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 180) current = s.id;
    });
    navLinks.forEach(l => {
      l.classList.toggle('active', l.getAttribute('href') === `#${current}`);
    });
  }, { passive: true });
}

/* ─────────────────────────────────────────
   7. スクロールリビール（フェード / ワイプ / 文字送り）
───────────────────────────────────────── */
function initReveal() {
  /* 通常リビール */
  const stdTargets = document.querySelectorAll('.reveal, .reveal-left, .reveal-wipe');
  const stdObs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (!e.isIntersecting) return;
      const delay = parseInt(e.target.dataset.delay || 0, 10);
      setTimeout(() => e.target.classList.add('visible'), delay);
      stdObs.unobserve(e.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });

  stdTargets.forEach((el, i) => {
    if (!el.dataset.delay) {
      const siblings = [...(el.parentElement?.querySelectorAll('.reveal,.reveal-left,.reveal-wipe') || [])];
      const idx = siblings.indexOf(el);
      if (idx > 0) el.dataset.delay = idx * 90;
    }
    stdObs.observe(el);
  });

  /* セクションタイトル文字送り */
  document.querySelectorAll('.sec-title').forEach(el => {
    const text = el.textContent.trim();
    el.innerHTML = [...text].map(ch =>
      `<span class="char-wrap"><span class="char">${ch === ' ' ? '&nbsp;' : ch}</span></span>`
    ).join('');

    const chars = el.querySelectorAll('.char');
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      chars.forEach((c, i) => {
        setTimeout(() => c.classList.add('visible'), i * 55);
      });
      obs.unobserve(el);
    }, { threshold: 0.4 });
    obs.observe(el);
  });
}

/* ─────────────────────────────────────────
   8. カウンターアニメーション（ABOUTスタッツ）
───────────────────────────────────────── */
function initCounters() {
  const statNums = document.querySelectorAll('.stat-num');
  if (!statNums.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.dataset.count || el.textContent, 10);
      if (isNaN(target)) return;

      const unit   = el.querySelector('.stat-unit')?.textContent || '';
      let   start  = 0;
      const step   = target / 50;
      const timer  = setInterval(() => {
        start += step;
        if (start >= target) {
          el.innerHTML = `${target}<span class="stat-unit">${unit}</span>`;
          clearInterval(timer);
        } else {
          el.innerHTML = `${Math.floor(start)}<span class="stat-unit">${unit}</span>`;
        }
      }, 20);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });

  statNums.forEach(el => {
    /* data-count を自動設定（初回のみ） */
    const raw = parseInt(el.textContent, 10);
    if (!isNaN(raw)) el.dataset.count = raw;
    obs.observe(el);
  });
}

/* ─────────────────────────────────────────
   9. WORKSフィルター
───────────────────────────────────────── */
function initFilter() {
  const btns  = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.work-card');
  if (!btns.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-selected','true');
      const f = btn.dataset.filter;
      cards.forEach(c => {
        const match = f === 'all' || c.dataset.category === f;
        /* フィルター中はスライドクラスを上書きしてフェード演出 */
        c.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
        if (match) {
          c.style.display   = '';
          c.style.opacity   = '0';
          c.style.transform = 'translateY(10px)';
          requestAnimationFrame(() => {
            c.style.opacity   = '1';
            c.style.transform = 'none';
          });
        } else {
          c.style.opacity = '0';
          c.style.transform = 'translateY(10px)';
          setTimeout(() => { if (btn.dataset.filter === f) c.style.display = 'none'; }, 240);
        }
      });
    });
  });
}

/* ─────────────────────────────────────────
   10. コンタクトフォーム（クライアントバリデーション）
───────────────────────────────────────── */
function initForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name    = form.querySelector('#fname')?.value.trim();
    const email   = form.querySelector('#femail')?.value.trim();
    const message = form.querySelector('#fmessage')?.value.trim();
    if (!name || !email || !message) {
      showMsg(form, '必須項目を入力してください。', 'error'); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMsg(form, 'メールアドレスの形式が正しくありません。', 'error'); return;
    }
    showMsg(form, '送信ありがとうございます！近日中にご連絡します。', 'success');
    form.reset();
  });

  function showMsg(f, text, type) {
    let el = f.querySelector('.form-msg');
    if (!el) {
      el = document.createElement('p');
      el.className = 'form-msg';
      el.style.cssText = [
        'font-family:var(--f-mono)', 'font-size:0.73rem', 'letter-spacing:0.08em',
        'padding:11px 14px', 'border:1px solid', 'margin-top:6px', 'transition:opacity 0.3s',
      ].join(';');
      f.appendChild(el);
    }
    const ok = type === 'success';
    el.textContent      = text;
    el.style.color      = ok ? 'var(--green)' : 'var(--pink)';
    el.style.borderColor = ok ? 'var(--green)' : 'var(--pink)';
    el.style.background  = ok ? 'rgba(0,255,170,0.05)' : 'rgba(255,31,106,0.05)';
    el.style.opacity     = '1';
    if (ok) setTimeout(() => { el.style.opacity = '0'; }, 5000);
  }
}

/* ─────────────────────────────────────────
   11. フッター著作権年
───────────────────────────────────────── */
function initYear() {
  const el = document.getElementById('footerYear');
  if (el) el.textContent = new Date().getFullYear();
}

/* ─────────────────────────────────────────
   12. セクション区切りのパーティクルライン
       （スクロールでピンクの水平線がパルス）
───────────────────────────────────────── */
function initSectionLines() {
  const lines = document.querySelectorAll('.sec-rule');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.animation = 'none';
        e.target.offsetWidth; // reflow
        e.target.style.animation = 'rule-pulse 0.8s var(--ease) forwards';
      }
    });
  }, { threshold: 0.5 });
  lines.forEach(l => obs.observe(l));

  /* キーフレームを動的挿入 */
  const style = document.createElement('style');
  style.textContent = `
    @keyframes rule-pulse {
      from { background: linear-gradient(90deg, rgba(255,31,106,0.8), transparent); }
      to   { background: linear-gradient(90deg, rgba(255,31,106,0.35), transparent); }
    }
  `;
  document.head.appendChild(style);
}

/* ─────────────────────────────────────────
   13. PICKUP スライダー
───────────────────────────────────────── */
function initSlider() {
  const track        = document.getElementById('sliderTrack');
  const prevBtn      = document.getElementById('sliderPrev');
  const nextBtn      = document.getElementById('sliderNext');
  const dotsWrap     = document.getElementById('sliderDots');
  const currentNumEl = document.getElementById('slideCurrentNum');
  const totalNumEl   = document.getElementById('slideTotalNum');
  const progressFill = document.getElementById('sliderProgressFill');
  if (!track) return;

  const slides = track.querySelectorAll('.slide');
  const total  = slides.length;
  let current  = 0;
  let autoTimer = null;
  let touchStartX = 0;

  if (totalNumEl) totalNumEl.textContent = String(total).padStart(2, '0');

  /* ドット生成 */
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `スライド ${i + 1}`);
    dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    dot.addEventListener('click', () => goTo(i));
    if (dotsWrap) dotsWrap.appendChild(dot);
  });

  function goTo(idx, resetTimer = true) {
    current = ((idx % total) + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;

    dotsWrap?.querySelectorAll('.slider-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
      d.setAttribute('aria-selected', String(i === current));
    });

    if (currentNumEl) currentNumEl.textContent = String(current + 1).padStart(2, '0');
    if (progressFill) progressFill.style.width = ((current + 1) / total * 100) + '%';

    if (resetTimer) resetAuto();
  }

  function resetAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current + 1, false), 5000);
  }

  prevBtn?.addEventListener('click', () => goTo(current - 1));
  nextBtn?.addEventListener('click', () => goTo(current + 1));

  /* キーボード操作 */
  document.addEventListener('keydown', e => {
    const wrap = track.closest('.pickup-slider-wrap');
    if (!wrap?.matches(':hover')) return;
    if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(current - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
  });

  /* タッチスワイプ */
  const sliderEl = document.getElementById('pickupSlider');
  sliderEl?.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  sliderEl?.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) dx > 0 ? goTo(current - 1) : goTo(current + 1);
  }, { passive: true });

  /* ホバー中は自動再生停止 */
  const wrap = track.closest('.pickup-slider-wrap');
  wrap?.addEventListener('mouseenter', () => clearInterval(autoTimer));
  wrap?.addEventListener('mouseleave', () => resetAuto());

  goTo(0);
}

/* ─────────────────────────────────────────
   14. WORKSカード 横スライドイン
───────────────────────────────────────── */
function initWorksSlide() {
  const grid = document.getElementById('worksGrid');
  if (!grid) return;
  const cards = [...grid.querySelectorAll('.work-card')];
  if (!cards.length) return;

  /* グリッドの列数を測定（CSS gridの実列数） */
  const firstRect  = cards[0].getBoundingClientRect();
  const gridWidth  = grid.getBoundingClientRect().width;
  const colCount   = Math.max(1, Math.round(gridWidth / firstRect.width));

  /* 列インデックスで入場方向を決める */
  cards.forEach((card, i) => {
    const col = i % colCount;
    if (col === 0)             card.classList.add('slide-from-left');
    else if (col === colCount - 1) card.classList.add('slide-from-right');
    else                       card.classList.add('slide-from-bottom');
  });

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const card = entry.target;
      const col  = cards.indexOf(card) % colCount;
      setTimeout(() => card.classList.add('visible'), col * 110);
      obs.unobserve(card);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  cards.forEach(c => obs.observe(c));
}

/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  new InkSplatter();
  initProgress();
  initCursor();
  initParallax();
  initHamburger();
  initNavScroll();
  initReveal();
  initCounters();
  initFilter();
  initForm();
  initYear();
  initSectionLines();
  initSlider();
  initWorksSlide();
});
