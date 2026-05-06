/* ==============================================
   PRODAL — JavaScript principal
   ============================================== */

(function () {
  'use strict';

  const SUPPORTED = ['fr', 'lu', 'de'];
  const DEFAULT_LANG = 'fr';
  const STORAGE_KEY = 'prodal_lang';

  const FLAG_SVG = {
    fr: '<svg viewBox="0 0 3 2"><rect width="1" height="2" fill="#0055A4"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#EF4135"/></svg>',
    lu: '<svg viewBox="0 0 5 3"><rect width="5" height="1" fill="#ED2939"/><rect y="1" width="5" height="1" fill="#fff"/><rect y="2" width="5" height="1" fill="#00A1DE"/></svg>',
    de: '<svg viewBox="0 0 5 3"><rect width="5" height="1" fill="#000"/><rect y="1" width="5" height="1" fill="#DD0000"/><rect y="2" width="5" height="1" fill="#FFCE00"/></svg>'
  };

  // ---------- Language detection ----------
  function detectLanguage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;

    const nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
    // Luxembourgish detection
    if (nav.startsWith('lb') || nav.startsWith('lu')) return 'lu';
    if (nav.startsWith('de')) return 'de';
    if (nav.startsWith('fr')) return 'fr';
    return DEFAULT_LANG;
  }

  function setLanguage(lang) {
    if (!SUPPORTED.includes(lang)) lang = DEFAULT_LANG;
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    applyTranslations(lang);
    updateLangSwitcher(lang);
  }

  function applyTranslations(lang) {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS[DEFAULT_LANG];
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) {
        el.innerHTML = dict[key];
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key] !== undefined) el.placeholder = dict[key];
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (dict[key] !== undefined) el.title = dict[key];
    });
    // Update <title>
    const titleEl = document.querySelector('title[data-i18n]');
    if (titleEl) {
      const key = titleEl.getAttribute('data-i18n');
      if (dict[key]) document.title = dict[key].replace(/<[^>]+>/g, '') + ' — Prodal';
    }
  }

  // ---------- Language switcher UI ----------
  function buildLangSwitcher() {
    const switcher = document.querySelector('.lang-switcher');
    if (!switcher) return;
    const current = detectLanguage();

    switcher.innerHTML = `
      <button class="lang-toggle" type="button" aria-label="Language">
        <span class="lang-flag">${FLAG_SVG[current]}</span>
        <span class="lang-current">${current.toUpperCase()}</span>
        <span class="arrow">▾</span>
      </button>
      <ul class="lang-menu" role="menu">
        ${SUPPORTED.map(l => `
          <li>
            <button type="button" data-lang="${l}" class="${l === current ? 'active' : ''}">
              <span class="lang-flag">${FLAG_SVG[l]}</span>
              <span data-i18n="lang.${l}">${l}</span>
            </button>
          </li>
        `).join('')}
      </ul>
    `;

    const toggle = switcher.querySelector('.lang-toggle');
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      switcher.classList.toggle('open');
    });

    switcher.querySelectorAll('.lang-menu button').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        setLanguage(lang);
        switcher.classList.remove('open');
      });
    });

    document.addEventListener('click', (e) => {
      if (!switcher.contains(e.target)) switcher.classList.remove('open');
    });
  }

  function updateLangSwitcher(lang) {
    const switcher = document.querySelector('.lang-switcher');
    if (!switcher) return;
    const current = switcher.querySelector('.lang-current');
    const flag = switcher.querySelector('.lang-toggle .lang-flag');
    if (current) current.textContent = lang.toUpperCase();
    if (flag) flag.innerHTML = FLAG_SVG[lang];
    switcher.querySelectorAll('.lang-menu button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  // ---------- Mobile menu ----------
  function initMobileMenu() {
    const toggle = document.querySelector('.menu-toggle');
    const list = document.querySelector('.nav-list');
    if (!toggle || !list) return;
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      list.classList.toggle('open');
    });
    list.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        toggle.classList.remove('open');
        list.classList.remove('open');
      });
    });
  }

  // ---------- Lightbox ----------
  function initLightbox() {
    const items = document.querySelectorAll('.gallery-item');
    if (!items.length) return;

    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
      <button class="lightbox-close" aria-label="Close">×</button>
      <img alt="" />
    `;
    document.body.appendChild(lightbox);

    const img = lightbox.querySelector('img');
    const closeBtn = lightbox.querySelector('.lightbox-close');

    items.forEach(item => {
      item.addEventListener('click', () => {
        const fullSrc = item.querySelector('img').src;
        img.src = fullSrc;
        lightbox.classList.add('open');
      });
    });

    closeBtn.addEventListener('click', () => lightbox.classList.remove('open'));
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) lightbox.classList.remove('open');
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') lightbox.classList.remove('open');
    });
  }

  // ---------- Scroll reveal ----------
  function initScrollReveal() {
    const elements = document.querySelectorAll('.fade-in');
    if (!elements.length || !('IntersectionObserver' in window)) {
      elements.forEach(el => el.classList.add('visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    elements.forEach(el => observer.observe(el));
  }

  // ---------- Active nav ----------
  function initActiveNav() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-list a').forEach(a => {
      const href = a.getAttribute('href');
      if (href === path) a.classList.add('active');
    });
  }

  // ---------- Contact form ----------
  function initContactForm() {
    const form = document.querySelector('.contact-form form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const success = form.querySelector('.form-success');
      if (success) success.classList.add('show');
      form.reset();
      setTimeout(() => {
        if (success) success.classList.remove('show');
      }, 6000);
    });
  }

  // ---------- Stat counter (simple) ----------
  function initStatCounter() {
    const counters = document.querySelectorAll('.stat-number[data-target]');
    if (!counters.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.target, 10);
          let current = 0;
          const increment = Math.max(1, Math.ceil(target / 60));
          const tick = () => {
            current += increment;
            if (current >= target) {
              el.textContent = target + (el.dataset.suffix || '');
            } else {
              el.textContent = current + (el.dataset.suffix || '');
              requestAnimationFrame(tick);
            }
          };
          tick();
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => observer.observe(c));
  }

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', () => {
    buildLangSwitcher();
    setLanguage(detectLanguage());
    initMobileMenu();
    initActiveNav();
    initLightbox();
    initScrollReveal();
    initContactForm();
    initStatCounter();
  });

})();
