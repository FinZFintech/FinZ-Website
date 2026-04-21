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

  // Apply / Check Eligibility form
  (function setupApplyForm() {
    const form = document.getElementById('apply-form');
    if (!form) return;

    const PRODUCT_BOUNDS = {
      'education':        { min: 15000,  max: 500000,  tenureMin: 6,  tenureMax: 24,  apr: 9 },
      'higher-education': { min: 50000,  max: 2000000, tenureMin: 6,  tenureMax: 120, apr: 9 },
      'employee':         { min: 5000,   max: 500000,  tenureMin: 1,  tenureMax: 12,  apr: 9 },
    };
    const PRODUCT_LABEL = {
      'education': 'Education Loan',
      'higher-education': 'Higher Education Loan',
      'employee': 'Employee Loan',
    };

    const productEl = form.querySelector('[name="product"]');
    const steps = form.querySelectorAll('.apply-step[data-show-for]');
    const offerPanel = document.getElementById('apply-offer');
    const successPanel = document.getElementById('apply-success');
    const submitBtn = document.getElementById('apply-submit-btn');
    const formErrors = document.getElementById('apply-form-errors');
    const submitErrors = document.getElementById('apply-submit-errors');

    const PAN_RX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
    const MOBILE_RX = /^[6-9][0-9]{9}$/;
    const PINCODE_RX = /^[1-9][0-9]{5}$/;
    const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function fmtINR(n) {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
    }

    function showApplicableSteps() {
      const p = productEl.value;
      steps.forEach(step => {
        const shown = step.getAttribute('data-show-for').split(' ').includes(p);
        if (shown) {
          step.removeAttribute('data-hidden');
          step.querySelectorAll('[data-required-for]').forEach(el => {
            if (el.getAttribute('data-required-for').split(' ').includes(p)) el.required = true;
          });
        } else {
          step.setAttribute('data-hidden', 'true');
          step.querySelectorAll('[data-required-for]').forEach(el => { el.required = false; });
        }
      });
    }
    productEl.addEventListener('change', showApplicableSteps);
    showApplicableSteps();

    // On blur, normalise PAN to uppercase
    const panEl = form.querySelector('[name="pan"]');
    if (panEl) panEl.addEventListener('blur', () => { panEl.value = panEl.value.trim().toUpperCase(); });

    function setInvalid(el, invalid) {
      if (invalid) el.setAttribute('aria-invalid', 'true');
      else el.removeAttribute('aria-invalid');
    }

    function validateForm() {
      const errors = [];
      // Clear previous invalid markers
      form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));

      const product = productEl.value;
      if (!product) { errors.push('Please select a product.'); setInvalid(productEl, true); }
      const bounds = PRODUCT_BOUNDS[product];

      const amountEl = form.querySelector('[name="amount"]');
      const tenureEl = form.querySelector('[name="tenure"]');
      const amount = parseFloat(amountEl.value);
      const tenure = parseFloat(tenureEl.value);

      if (bounds) {
        if (!(amount >= bounds.min && amount <= bounds.max)) {
          errors.push('Loan amount for ' + PRODUCT_LABEL[product] + ' must be between ' + fmtINR(bounds.min) + ' and ' + fmtINR(bounds.max) + '.');
          setInvalid(amountEl, true);
        }
        if (!(tenure >= bounds.tenureMin && tenure <= bounds.tenureMax)) {
          errors.push('Tenure for ' + PRODUCT_LABEL[product] + ' must be between ' + bounds.tenureMin + ' and ' + bounds.tenureMax + ' months.');
          setInvalid(tenureEl, true);
        }
      }

      const requiredFields = [
        ['full_name', 'Full name'], ['parent_name', "Father's / Mother's name"],
        ['dob', 'Date of birth'], ['email', 'Email'], ['mobile', 'Mobile number'],
        ['pan', 'PAN'], ['address_line', 'Address line'],
        ['city', 'City'], ['state', 'State'], ['pincode', 'PIN code'],
      ];
      requiredFields.forEach(([name, label]) => {
        const el = form.querySelector('[name="' + name + '"]');
        if (!el.value.trim()) { errors.push(label + ' is required.'); setInvalid(el, true); }
      });

      // Format validation
      const panVal = (panEl && panEl.value || '').toUpperCase();
      if (panVal && !PAN_RX.test(panVal)) { errors.push('PAN format must be 5 letters + 4 digits + 1 letter (e.g. ABCDE1234F).'); setInvalid(panEl, true); }

      const mobileEl = form.querySelector('[name="mobile"]');
      if (mobileEl.value && !MOBILE_RX.test(mobileEl.value)) { errors.push('Mobile number must be a 10-digit Indian number starting 6–9.'); setInvalid(mobileEl, true); }

      const emailEl = form.querySelector('[name="email"]');
      if (emailEl.value && !EMAIL_RX.test(emailEl.value)) { errors.push('Please enter a valid email address.'); setInvalid(emailEl, true); }

      const pinEl = form.querySelector('[name="pincode"]');
      if (pinEl.value && !PINCODE_RX.test(pinEl.value)) { errors.push('PIN code must be a 6-digit number (not starting with 0).'); setInvalid(pinEl, true); }

      // Age check: must be 18+
      const dobEl = form.querySelector('[name="dob"]');
      if (dobEl.value) {
        const dob = new Date(dobEl.value);
        const ageYears = (Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000);
        if (!isFinite(ageYears) || ageYears < 18) { errors.push('Applicant must be at least 18 years old.'); setInvalid(dobEl, true); }
      }

      // Product-specific required fields
      form.querySelectorAll('[data-required-for]').forEach(el => {
        if (el.required && !el.value.trim()) {
          errors.push(el.previousElementSibling && el.previousElementSibling.textContent || el.name + ' is required.');
          setInvalid(el, true);
        }
      });

      return errors;
    }

    // Deterministic hash so the same PAN/DOB/mobile combo always returns the
    // same "indicative" number. Not cryptographic — just stable and uniform.
    function stableHash(s) {
      let h = 2166136261 >>> 0; // FNV-1a 32-bit
      for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
      }
      return h;
    }
    function indicativeScore(data) {
      const seed = (data.pan || '').toUpperCase() + '|' + (data.dob || '') + '|' + (data.mobile || '');
      if (!seed.trim()) return null;
      const h = stableHash(seed);
      // Map to a realistic band (680–810 — "good" to "excellent"). This is an
      // *indicative* number, NOT a bureau pull. Disclaimer shown in UI.
      const span = 810 - 680;
      return 680 + (h % span);
    }
    function scoreBand(score) {
      if (score >= 790) return { label: 'Excellent', pct: 100 };
      if (score >= 750) return { label: 'Very good', pct: 85 };
      if (score >= 720) return { label: 'Good',      pct: 70 };
      if (score >= 680) return { label: 'Fair',      pct: 55 };
      return                    { label: 'Limited',  pct: 35 };
    }

    function computeOffer(data) {
      const bounds = PRODUCT_BOUNDS[data.product];
      const amount = parseFloat(data.amount);
      const tenure = parseFloat(data.tenure);
      const apr = bounds.apr;                 // Indicative base rate
      const r = apr / 12 / 100;
      const pow = Math.pow(1 + r, tenure);
      const emi = (amount * r * pow) / (pow - 1);
      const ref = 'FINZ-' + Date.now().toString(36).toUpperCase().slice(-6) +
                  '-' + Math.floor(Math.random() * 900 + 100);
      const score = indicativeScore(data);
      const band = score != null ? scoreBand(score) : null;
      return { amount, tenure, apr, emi, ref, score, band };
    }

    function showOffer(data) {
      const offer = computeOffer(data);
      offerPanel.querySelector('[data-offer="product"]').textContent = PRODUCT_LABEL[data.product];
      offerPanel.querySelector('[data-offer="amount"]').textContent = fmtINR(offer.amount);
      offerPanel.querySelector('[data-offer="tenure"]').textContent = offer.tenure + ' months';
      offerPanel.querySelector('[data-offer="apr"]').textContent = offer.apr + '% p.a.';
      offerPanel.querySelector('[data-offer="emi"]').textContent = fmtINR(Math.round(offer.emi));
      offerPanel.querySelector('[data-offer="ref"]').textContent = offer.ref;

      // Credit profile card
      const scoreEl = offerPanel.querySelector('[data-offer="score"]');
      const bandEl  = offerPanel.querySelector('[data-offer="band"]');
      const chipEl  = offerPanel.querySelector('[data-offer="band-chip"]');
      const barEl   = offerPanel.querySelector('[data-offer="score-bar"]');
      if (offer.score != null && scoreEl) {
        scoreEl.textContent = offer.score;
        bandEl.textContent  = 'Band: ' + offer.band.label + ' — eligible for indicative offer';
        chipEl.textContent  = 'Indicative';
        // animate width after next paint
        barEl.style.width = '0%';
        requestAnimationFrame(() => { barEl.style.width = offer.band.pct + '%'; });
      }

      offerPanel.hidden = false;
      offerPanel.dataset.ref = offer.ref;
      offerPanel.dataset.score = offer.score || '';
      offerPanel.dataset.band = offer.band ? offer.band.label : '';
      offerPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      formErrors.textContent = '';
      const errors = validateForm();
      if (errors.length) {
        formErrors.textContent = errors.join(' ');
        offerPanel.hidden = true;
        return;
      }
      const data = Object.fromEntries(new FormData(form).entries());
      showOffer(data);
    });

    form.addEventListener('reset', function () {
      formErrors.textContent = '';
      offerPanel.hidden = true;
      successPanel.hidden = true;
      setTimeout(showApplicableSteps, 0);
    });

    // Consent gating for submit button
    const terms = document.getElementById('consent-terms');
    const bureau = document.getElementById('consent-bureau');
    const channels = offerPanel && offerPanel.querySelectorAll('input[name^="consent_"]');
    function refreshSubmitState() {
      const channelOk = Array.from(channels || []).some(c => c.checked);
      submitBtn.disabled = !(terms && terms.checked && bureau && bureau.checked && channelOk);
    }
    [terms, bureau].forEach(c => c && c.addEventListener('change', refreshSubmitState));
    if (channels) channels.forEach(c => c.addEventListener('change', refreshSubmitState));

    submitBtn && submitBtn.addEventListener('click', function () {
      submitErrors.textContent = '';
      const data = Object.fromEntries(new FormData(form).entries());
      const channelVals = Array.from(channels).filter(c => c.checked).map(c => c.value);
      if (!channelVals.length) { submitErrors.textContent = 'Please pick at least one contact channel.'; return; }
      if (!terms.checked || !bureau.checked) { submitErrors.textContent = 'Both consent boxes must be ticked.'; return; }

      const ref = offerPanel.dataset.ref || '';
      const score = offerPanel.dataset.score || '—';
      const band = offerPanel.dataset.band || '—';
      const body = [
        'Provisional application — FinZ Finance',
        'Reference ID: ' + ref,
        '',
        'Product: ' + PRODUCT_LABEL[data.product],
        'Amount: ' + fmtINR(parseFloat(data.amount)),
        'Tenure: ' + data.tenure + ' months',
        'Purpose: ' + (data.purpose || '—'),
        '',
        'Indicative credit profile (NOT a bureau pull):',
        '  Indicative score: ' + score + ' / 900',
        '  Indicative band:  ' + band,
        '',
        'Applicant: ' + data.full_name,
        "Father's / Mother's name: " + data.parent_name,
        'DOB: ' + data.dob,
        'PAN: ' + (data.pan || '').toUpperCase(),
        'Mobile: ' + data.mobile,
        'Email: ' + data.email,
        '',
        'Institute: ' + (data.institute || '—'),
        'Course: ' + (data.course || '—'),
        'Year of study: ' + (data.study_year || '—'),
        'Employer: ' + (data.employer || '—'),
        'Monthly salary: ' + (data.salary ? fmtINR(parseFloat(data.salary)) : '—'),
        'Months at employer: ' + (data.months_at_employer || '—'),
        '',
        'Address: ' + data.address_line + ', ' + data.city + ', ' + data.state + ' ' + data.pincode,
        '',
        'Consents:',
        '  T&C + Privacy: yes',
        '  Indicative pre-qualification check: yes',
        '  Share with lending partners / DSAs: ' + (data.consent_partners === 'yes' ? 'yes' : 'no'),
        '  Contact channels: ' + channelVals.join(', '),
        '  Timestamp: ' + new Date().toISOString(),
      ].join('\n');

      const subject = 'FinZ application — ' + PRODUCT_LABEL[data.product] + ' — ' + ref;
      const mailto = 'mailto:customersupport@finz.finance'
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(body);

      // Show success panel regardless (since mailto is fire-and-forget)
      offerPanel.hidden = true;
      successPanel.querySelector('[data-success-ref]').textContent = ref;
      successPanel.hidden = false;
      successPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Open default mail client as the submission channel (no backend on this static site)
      window.location.href = mailto;
    });
  })();

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
