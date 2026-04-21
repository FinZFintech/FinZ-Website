// FinZ Finance — site interactions
// Minimal, dependency-free JS. Keep this file lean.

(function () {
  'use strict';

  // Mobile nav toggle
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Expandable submenus (mobile)
  document.querySelectorAll('.nav-links .has-menu > a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (window.matchMedia('(min-width: 960px)').matches) return;
      e.preventDefault();
      a.parentElement.classList.toggle('open');
    });
  });

  // Close mobile menu when a link is clicked
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    a.addEventListener('click', function () {
      if (window.matchMedia('(max-width: 959px)').matches) {
        if (!a.parentElement.classList.contains('has-menu')) {
          links && links.classList.remove('open');
        }
      }
    });
  });

  // Highlight current page in nav
  const currentPath = window.location.pathname.replace(/\/index\.html$/, '/');
  document.querySelectorAll('.nav-links a[href]').forEach(function (a) {
    const hrefPath = new URL(a.href, window.location.origin).pathname.replace(/\/index\.html$/, '/');
    if (hrefPath === currentPath) a.classList.add('is-active');
  });

  // EMI calculator on product pages. Output nodes live *outside* the
  // <form> element, so scope the lookup to the nearest enclosing section
  // (or document as a fallback). Also: clamp inputs to their min/max,
  // reset outputs to em-dash on invalid input, and recompute on change.
  const emiForm = document.querySelector('[data-emi-form]');
  if (emiForm) {
    const scope = emiForm.closest('section') || document;
    const principal = emiForm.querySelector('[name="principal"]');
    const rate = emiForm.querySelector('[name="rate"]');
    const tenure = emiForm.querySelector('[name="tenure"]');
    const emiOut = scope.querySelector('[data-emi-output]');
    const intOut = scope.querySelector('[data-interest-output]');
    const totOut = scope.querySelector('[data-total-output]');
    const DASH = '—';

    function fmt(n) {
      if (!isFinite(n) || n <= 0) return DASH;
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
    }
    function clamp(el) {
      const v = parseFloat(el.value);
      const min = el.min !== '' ? parseFloat(el.min) : -Infinity;
      const max = el.max !== '' ? parseFloat(el.max) : Infinity;
      if (!isFinite(v)) return NaN;
      return Math.min(Math.max(v, min), max);
    }
    function setAll(emi, interest, total) {
      if (emiOut) emiOut.textContent = fmt(emi);
      if (intOut) intOut.textContent = fmt(interest);
      if (totOut) totOut.textContent = fmt(total);
    }
    function recalc() {
      const P = clamp(principal);
      const R = clamp(rate);
      const N = clamp(tenure);
      if (!(P > 0) || !(R > 0) || !(N > 0)) { setAll(NaN, NaN, NaN); return; }
      const r = R / 12 / 100;
      const pow = Math.pow(1 + r, N);
      const emi = (P * r * pow) / (pow - 1);
      const total = emi * N;
      const interest = total - P;
      setAll(emi, interest, total);
    }

    emiForm.addEventListener('input', recalc);
    emiForm.addEventListener('change', recalc);
    // Prevent accidental submission (it's a pure calculator, no backend)
    emiForm.addEventListener('submit', function (e) { e.preventDefault(); });
    recalc();
  }

  // Year in footer
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // Mobile compliance-ribbon marquee: wrap content in a track and clone it
  // once so the CSS animation loops seamlessly. Runs only below 720px.
  (function setupComplianceMarquee() {
    const ribbon = document.querySelector('.compliance-ribbon .container');
    if (!ribbon) return;
    const MOBILE = '(max-width: 720px)';
    let wrapped = false;
    let originalHTML = ribbon.innerHTML;

    function wrap() {
      if (wrapped) return;
      const track = document.createElement('div');
      track.className = 'compliance-track';
      // Original content + a cloned copy → seamless 50% translate loop
      track.innerHTML = originalHTML + originalHTML;
      ribbon.innerHTML = '';
      ribbon.appendChild(track);
      wrapped = true;
    }
    function unwrap() {
      if (!wrapped) return;
      ribbon.innerHTML = originalHTML;
      wrapped = false;
    }

    const mql = window.matchMedia(MOBILE);
    (mql.matches ? wrap : unwrap)();
    // Modern and legacy listener signatures
    if (mql.addEventListener) {
      mql.addEventListener('change', e => (e.matches ? wrap : unwrap)());
    } else if (mql.addListener) {
      mql.addListener(e => (e.matches ? wrap : unwrap)());
    }
  })();
})();
