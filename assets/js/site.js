/* L Oliveira Concrete — page behavior.
   Office hours on the phone label, services mega menu and mobile menu, mobile contact bar, the estimate forms
   (finish / size / timing / text-message choice, request summary), craft tape, finishes selector, photo gallery,
   project filter and the scroll motion (reveals, control joints, bays that fill, service radius, the final title that
   fills with concrete). Everything is readable without this file; motion only starts from the final state. */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasIO = 'IntersectionObserver' in window;

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function onView(el, cb, opts) {
    if (!hasIO) { cb(true); return null; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { cb(e.isIntersecting, e); });
    }, opts || { threshold: 0.25 });
    io.observe(el);
    return io;
  }
  function once(el, cb, opts) {
    if (!hasIO) { cb(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); cb(); } });
    }, opts || { threshold: 0.3 });
    io.observe(el);
  }

  root.classList.remove('no-js');
  root.classList.add('js');

  /* ── office hours (America/New_York, Mon–Sat 7am–6pm) ── */
  (function hours() {
    var el = $('[data-hours]');
    if (!el || !window.Intl) return;
    try {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
      var day = '';
      var hour = 0;
      parts.forEach(function (p) {
        if (p.type === 'weekday') day = p.value;
        if (p.type === 'hour') hour = parseInt(p.value, 10) % 24;
      });
      var open = day !== 'Sun' && hour >= 7 && hour < 18;
      el.classList.toggle('is-open', open);
      if (!open) $('[data-hours-text]', el).textContent = 'Text us anytime. We reply Mon–Sat, 7am–6pm.';
    } catch (e) { /* label stays as written */ }
  })();

  /* ── text links carry the page's service in the message body ── */
  (function smsBody() {
    var label = doc.body.getAttribute('data-sms-service') || 'concrete project';
    var body = encodeURIComponent('Hi L Oliveira Concrete, I\'d like an estimate for a ' + label + '.');
    $$('a[data-sms]').forEach(function (a) { a.setAttribute('href', 'sms:+17746355750?&body=' + body); });
  })();

  /* ── services mega menu ── */
  (function mega() {
    var item = $('[data-mega]');
    if (!item) return;
    var btn = $('[data-mega-btn]', item);
    var panel = $('[data-mega-panel]', item);
    var closedByUser = false;
    function set(open, focusBack) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.classList.toggle('is-open', open);
      if (!open && focusBack && panel.contains(doc.activeElement)) btn.focus();
    }
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      closedByUser = !open;
      set(open);
    });
    if (finePointer) {
      item.addEventListener('mouseenter', function () { if (!closedByUser) set(true); });
      item.addEventListener('mouseleave', function () { closedByUser = false; set(false); });
    }
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) {
        closedByUser = true;
        set(false, true);
      }
    });
    doc.addEventListener('click', function (e) {
      if (!item.contains(e.target) && panel.classList.contains('is-open')) set(false);
    });
    item.addEventListener('focusout', function (e) {
      if (e.relatedTarget && !item.contains(e.relatedTarget)) set(false);
    });
  })();

  /* ── mobile menu ── */
  (function menu() {
    var btn = $('[data-menu-btn]');
    var panel = $('[data-menu]');
    if (!btn || !panel) return;
    var label = $('[data-menu-label]', btn);
    var hdr = $('[data-hdr]');
    function isOpen() { return root.classList.contains('menu-open'); }
    function set(open) {
      if (open) root.style.setProperty('--menu-top', Math.max(0, hdr.getBoundingClientRect().bottom) + 'px');
      root.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (label) label.textContent = open ? 'Close menu' : 'Menu';
      if (open) panel.removeAttribute('inert'); else panel.setAttribute('inert', '');
      if (window.__lenis) { if (open) window.__lenis.stop(); else window.__lenis.start(); }
      if (open) { var first = $('a', panel); if (first) first.focus(); } else btn.focus();
    }
    btn.addEventListener('click', function () { set(!isOpen()); });
    doc.addEventListener('keydown', function (e) {
      if (!isOpen()) return;
      if (e.key === 'Escape') { set(false); return; }
      if (e.key === 'Tab') {
        var items = [btn].concat($$('a, button', panel));
        var i = items.indexOf(doc.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
        else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
      }
    });
    panel.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    window.addEventListener('resize', function () { if (isOpen() && window.innerWidth > 1024) set(false); });
  })();

  /* ── links to the estimate form: the hero form if it is still ahead, otherwise the one at the end ── */
  function goToForm(e) {
    var hero = $('[data-hero-form]');
    var final = $('#estimate-final');
    var target = null;
    if (hero && hero.getBoundingClientRect().bottom > 80) target = hero;
    else if (final) target = final;
    else if (hero) target = hero;
    if (!target) return;
    e.preventDefault();
    var top = target.getBoundingClientRect().top + window.pageYOffset - (parseInt(getComputedStyle(root).scrollPaddingTop, 10) || 80);
    if (window.__lenis) window.__lenis.scrollTo(top, { duration: 1.1 });
    else window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
    var field = $('input[name="service"]:checked', target) ? $('input[name="zip"]', target) : $('input[name="service"]', target);
    if (field) setTimeout(function () { field.focus({ preventScroll: true }); }, reduce ? 0 : 700);
  }
  $$('[data-to-form]').forEach(function (a) { a.addEventListener('click', goToForm); });

  /* ── mobile contact bar: only after the hero form is behind, never over a form ── */
  (function mbar() {
    var bar = $('[data-mbar]');
    if (!bar || !hasIO) return;
    var heroForm = $('[data-hero-form]');
    var heroPassed = !heroForm;
    var formsInView = 0;
    var scrolled = false;
    function update() {
      var show = heroPassed && formsInView === 0 && (heroForm || scrolled);
      bar.classList.toggle('is-visible', !!show);
    }
    if (heroForm) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { heroPassed = !e.isIntersecting && e.boundingClientRect.top < 0; });
        update();
      }).observe(heroForm);
    } else {
      window.addEventListener('scroll', function () { scrolled = window.pageYOffset > 320; update(); }, { passive: true });
    }
    var seen = new Set();
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target); });
      formsInView = seen.size;
      update();
    }, { threshold: 0.15 });
    $$('form[data-cs-form]').forEach(function (f) { if (!f.closest('[data-hero-form]')) io.observe(f); });
  })();

  /* ── estimate forms: details step, text-message choice, request summary ── */
  var SERVICES = {
    'pool-deck': ['Pool deck', 'What’s around the pool now, the pool shape, steps or a walkway to add…'],
    'patio': ['Patio', 'Where it goes, what’s there now (grass, old concrete, pavers), steps to the back door…'],
    'driveway': ['Driveway', 'Replacing concrete or asphalt? One or two cars wide? Where the truck can get in…'],
    'walkway-sidewalk': ['Walkway or sidewalk', 'From where to where, about how long, anything to match…'],
    'steps': ['Steps', 'Front door, back door or pool? How many steps? What else we’re pouring…'],
    'basement-garage-floor': ['Basement or garage floor', 'Basement or garage, about how big, is there an old floor to remove…'],
    'slab-foundation': ['Slab or foundation', 'What it’s for (shed, addition, garage), plans or drawings, who’s building it…'],
    'retaining-wall': ['Retaining wall', 'About how long and how tall, what it holds back, what you want on the level ground…'],
    'other': ['Something else', 'Tell us what you have in mind and where…']
  };
  var NO_FINISH = { 'slab-foundation': 1, 'retaining-wall': 1 };

  function checked(form, name) {
    var r = $('input[name="' + name + '"]:checked', form);
    return r ? r.value : '';
  }
  function showErr(form, name, on) {
    var el = $('[data-error-for="' + name + '"]', form);
    if (el) el.hidden = !on;
    $$('input[name="' + name + '"]', form).forEach(function (i) {
      if (on) i.setAttribute('aria-invalid', 'true'); else i.removeAttribute('aria-invalid');
    });
    return on ? name : null;
  }
  function focusGroup(form, name) {
    var f = $('input[name="' + name + '"]', form);
    if (!f) return;
    f.focus({ preventScroll: true });
    (f.closest('fieldset, .field') || f).scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
  }
  // extra choices travel at the start of "details"; the visible note is restored right after the form reads it
  function withDetails(form, prefix) {
    var note = $('[data-note]', form);
    if (!note || !prefix || note.csPending) return;
    var own = note.value;
    note.csPending = true;
    note.value = prefix + (own.trim() ? '\nNotes: ' + own.trim() : '');
    setTimeout(function () { note.value = own; note.csPending = false; }, 0);
  }
  function guard(stepEl, check, onPass) {
    if (!stepEl) return;
    stepEl.addEventListener('click', function (e) {
      var go = e.target.closest('[data-cs-next], button[type="submit"]');
      if (!go) return;
      var bad = check();
      if (bad) { e.preventDefault(); e.stopPropagation(); focusGroup(stepEl.closest('form'), bad); return; }
      if (onPass && go.type === 'submit') onPass();
    }, true);
    stepEl.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON') return;
      var bad = check();
      if (bad) { e.preventDefault(); e.stopPropagation(); focusGroup(stepEl.closest('form'), bad); return; }
      if (onPass && $('button[type="submit"]', stepEl)) onPass();
    }, true);
  }

  $$('form[data-quote]').forEach(function (form) {
    var note = $('[data-note]', form);
    var finish = $('[data-finish-field]', form);
    var stepsNote = $('[data-steps-note]', form);
    var ct = $('[data-zip-ct]', form);
    var zip = $('input[name="zip"]', form);
    var sum = $('[data-request-summary]', form);
    var sumText = $('[data-request-summary-text]', form);

    function summary() {
      var s = SERVICES[checked(form, 'service')];
      var parts = [s ? s[0] : ''];
      if (!finish.hidden) parts.push(checked(form, 'finish'));
      if (zip.value) parts.push('ZIP ' + zip.value);
      parts.push(checked(form, 'size'), checked(form, 'timing'));
      var text = parts.filter(Boolean).join(' · ');
      sumText.textContent = text;
      sum.hidden = !text;
    }
    function sync() {
      var svc = checked(form, 'service');
      if (SERVICES[svc]) note.placeholder = SERVICES[svc][1];
      finish.hidden = !!NO_FINISH[svc];
      if (finish.hidden) showErr(form, 'finish', false);
      stepsNote.hidden = svc !== 'steps';
      summary();
    }
    form.addEventListener('change', function (e) {
      if (e.target.name === 'finish' && checked(form, 'finish')) showErr(form, 'finish', false);
      if (e.target.name === 'timing') showErr(form, 'timing', false);
      if (e.target.name === 'sms_consent') showErr(form, 'sms_consent', false);
      sync();
    });
    zip.addEventListener('input', function () {
      ct.hidden = !/^06\d{3}$/.test(zip.value);
      summary();
    });

    // a link like /estimate/?service=patio arrives with that service marked
    var want = new URLSearchParams(window.location.search).get('service');
    if (want && !checked(form, 'service')) {
      var r = $('input[name="service"][value="' + want.replace(/[^a-z-]/g, '') + '"]', form);
      if (r) r.checked = true;
    }
    sync();

    guard($('[data-cs-step="2"]', form), function () {
      var a = !finish.hidden && !checked(form, 'finish') ? showErr(form, 'finish', true) : showErr(form, 'finish', false);
      var b = !checked(form, 'timing') ? showErr(form, 'timing', true) : showErr(form, 'timing', false);
      summary();
      return a || b;
    });
    guard($('[data-cs-step="3"]', form), function () {
      return !checked(form, 'sms_consent') ? showErr(form, 'sms_consent', true) : showErr(form, 'sms_consent', false);
    }, function () {
      var bits = [];
      if (!finish.hidden && checked(form, 'finish')) bits.push('Finish: ' + checked(form, 'finish'));
      if (checked(form, 'size')) bits.push('Size: ' + checked(form, 'size'));
      if (checked(form, 'timing')) bits.push('Timing: ' + checked(form, 'timing'));
      withDetails(form, bits.join(' · '));
    });

    var edit = $('[data-request-edit]', form);
    if (edit) edit.addEventListener('click', function () {
      var back3 = $('[data-cs-step="3"] [data-cs-back]', form);
      var back2 = $('[data-cs-step="2"] [data-cs-back]', form);
      if (back3) back3.click();
      if (back2) back2.click();
    });
  });

  $$('form[data-gc]').forEach(function (form) {
    var ct = $('[data-zip-ct]', form);
    var zip = $('input[name="zip"]', form);
    var company = $('input[name="company"]', form);
    var size = $('input[name="size_text"]', form);
    zip.addEventListener('input', function () { ct.hidden = !/^06\d{3}$/.test(zip.value); });
    form.addEventListener('change', function (e) {
      if (e.target.name === 'start') showErr(form, 'start', false);
      if (e.target.name === 'sms_consent') showErr(form, 'sms_consent', false);
    });
    company.addEventListener('input', function () { if (company.value.trim().length >= 2) showErr(form, 'company', false); });
    guard($('[data-cs-step="1"]', form), function () {
      var a = company.value.trim().length < 2 ? showErr(form, 'company', true) : showErr(form, 'company', false);
      var b = !checked(form, 'start') ? showErr(form, 'start', true) : showErr(form, 'start', false);
      var c = !checked(form, 'sms_consent') ? showErr(form, 'sms_consent', true) : showErr(form, 'sms_consent', false);
      return a || b || c;
    }, function () {
      var bits = ['Company: ' + company.value.trim()];
      if (checked(form, 'start')) bits.push('Start: ' + checked(form, 'start'));
      if (size.value.trim()) bits.push('Size: ' + size.value.trim());
      withDetails(form, bits.join(' · '));
    });
  });

  /* ── craft tape: pause / play (WCAG 2.2.2); stops when off screen ── */
  $$('[data-tape]').forEach(function (tape) {
    var btn = $('[data-tape-btn]', tape);
    var lbl = $('[data-tape-label]', tape);
    var user = false;
    function set(paused) {
      tape.classList.toggle('is-paused', paused);
      btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      lbl.textContent = paused ? 'Play' : 'Pause';
    }
    btn.addEventListener('click', function () { user = !tape.classList.contains('is-paused'); set(user); });
    onView(tape, function (inView) { if (!user) set(!inView); }, { threshold: 0 });
  });

  /* ── finishes selector: tabs; the drawing's surface changes with the finish ── */
  $$('[data-fin]').forEach(function (box) {
    var tabs = $$('[role="tab"]', box);
    var dwg = $('.dwg[data-finish]', box);
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var p = doc.getElementById(t.getAttribute('aria-controls'));
        if (p) p.hidden = !on;
      });
      if (dwg) dwg.setAttribute('data-finish', tab.getAttribute('data-finish'));
      if (focus) tab.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') n = tabs[0];
        if (e.key === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
    select(tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0]);
  });

  /* ── project filter ── */
  $$('[data-filter]').forEach(function (bar) {
    var grid = doc.getElementById(bar.getAttribute('data-filter'));
    if (!grid) return;
    bar.hidden = false;
    $$('button', bar).forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.getAttribute('data-key');
        $$('button', bar).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        $$('[data-tags]', grid).forEach(function (t) {
          t.hidden = key !== 'all' && (' ' + t.getAttribute('data-tags') + ' ').indexOf(' ' + key + ' ') === -1;
        });
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      });
    });
  });

  /* ── photo gallery: full-screen dialog outside the gallery container ── */
  (function gallery() {
    var groups = $$('[data-gallery]');
    if (!groups.length || typeof HTMLDialogElement === 'undefined') return;
    var dlg = null;
    var img;
    var cap;
    var count;
    var items = [];
    var index = 0;
    var opener = null;
    function largest(set) {
      var best = null;
      (set || '').split(',').forEach(function (c) {
        var m = c.trim().split(/\s+/);
        var w = parseInt(m[1], 10) || 0;
        if (!best || w > best.w) best = { url: m[0], w: w };
      });
      return best ? best.url : '';
    }
    function srcOf(tile) {
      var s = $('source[type="image/webp"]', tile);
      var i = $('img', tile);
      return largest(s ? s.getAttribute('srcset') : i.getAttribute('srcset')) || i.currentSrc || i.src;
    }
    function build() {
      dlg = doc.createElement('dialog');
      dlg.className = 'lb';
      dlg.setAttribute('aria-label', 'Project photos');
      dlg.innerHTML = '<figure class="lb__fig"><img alt=""></figure>' +
        '<div class="lb__bar"><span data-lb-cap></span><span data-lb-count></span></div>' +
        '<button class="lb__btn lb__close" type="button" aria-label="Close"><svg class="ic" aria-hidden="true"><use href="#i-close"></use></svg></button>' +
        '<button class="lb__btn lb__prev" type="button" aria-label="Previous photo"><svg class="ic" aria-hidden="true"><use href="#i-arrow-left"></use></svg></button>' +
        '<button class="lb__btn lb__next" type="button" aria-label="Next photo"><svg class="ic" aria-hidden="true"><use href="#i-arrow-right"></use></svg></button>';
      doc.body.appendChild(dlg);
      img = $('img', dlg);
      cap = $('[data-lb-cap]', dlg);
      count = $('[data-lb-count]', dlg);
      $('.lb__close', dlg).addEventListener('click', function () { dlg.close(); });
      $('.lb__prev', dlg).addEventListener('click', function () { show(index - 1); });
      $('.lb__next', dlg).addEventListener('click', function () { show(index + 1); });
      dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.classList.contains('lb__fig')) dlg.close(); });
      dlg.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
      });
      dlg.addEventListener('close', function () {
        root.classList.remove('lb-open');
        if (window.__lenis) window.__lenis.start();
        if (opener) opener.focus();
      });
      var x0 = null;
      dlg.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
      dlg.addEventListener('pointerup', function (e) {
        if (x0 === null) return;
        var dx = e.clientX - x0;
        x0 = null;
        if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
      });
    }
    function show(i) {
      index = (i + items.length) % items.length;
      var t = items[index];
      var alt = $('img', t).getAttribute('alt') || '';
      img.src = srcOf(t);
      img.alt = alt;
      var c = $('.tile-ph__cap', t);
      cap.textContent = c ? c.textContent : alt;
      count.textContent = (index + 1) + ' / ' + items.length;
    }
    groups.forEach(function (g) {
      g.addEventListener('click', function (e) {
        var t = e.target.closest('.tile-ph');
        if (!t || !g.contains(t)) return;
        if (!dlg) build();
        items = $$('.tile-ph', g).filter(function (x) { return !x.closest('[hidden]'); });
        opener = t;
        root.classList.add('lb-open');
        if (window.__lenis) window.__lenis.stop();
        dlg.showModal();
        show(items.indexOf(t));
        $('.lb__close', dlg).focus();
      });
    });
  })();

  /* ── motion ─────────────────────────────────────────────────────────── */
  if (reduce) return;

  // trust strip: the joints between items are cut top to bottom
  $$('[data-joints]').forEach(function (list) {
    list.classList.add('is-armed');
    once(list, function () { list.classList.add('is-on'); }, { threshold: 0.4 });
  });

  // bays of "how it works": each form fills when the step is reached
  $$('[data-bays]').forEach(function (bays) {
    bays.classList.add('is-armed');
    $$('[data-bay]', bays).forEach(function (bay) {
      onView(bay, function (inView, e) {
        if (inView) bay.classList.add('is-on');
        else if (e && e.boundingClientRect.top > 0) bay.classList.remove('is-on');
      }, { rootMargin: '0px 0px -38% 0px', threshold: 0 });
    });
  });

  // service radius drawn like a tape measure from Webster
  $$('[data-map]').forEach(function (map) {
    var ring = $('.map__ring', map);
    if (ring && ring.getTotalLength) map.style.setProperty('--len', Math.ceil(ring.getTotalLength()) + 1);
    map.classList.add('is-armed');
    once(map, function () { map.classList.add('is-on'); }, { threshold: 0.45 });
  });

  // final title: concrete fills the letters from the bottom
  $$('[data-pour]').forEach(function (el) {
    el.classList.add('is-armed');
    once(el, function () { el.classList.add('is-on'); }, { threshold: 0.6 });
  });

  // the motion libraries load after the page has painted, so they never compete with the photo and the form
  var assetBase = ((doc.currentScript && doc.currentScript.src) || '').replace(/assets\/js\/site\.js.*$/, '') || '/';
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = doc.createElement('script');
      s.src = assetBase + src.replace(/^\//, '');
      s.onload = resolve;
      s.onerror = reject;
      doc.head.appendChild(s);
    });
  }
  function motion() {
    if (typeof window.gsap === 'undefined') return;
    var gsap = window.gsap;
    var ST = typeof window.ScrollTrigger !== 'undefined' ? window.ScrollTrigger : null;
    if (ST) gsap.registerPlugin(ST);

    // smooth scroll only with a fine pointer on wide screens
    if (typeof window.Lenis !== 'undefined' && finePointer && window.innerWidth >= 1024) {
      var lenis = new window.Lenis({ duration: 1.05, smoothWheel: true });
      window.__lenis = lenis;
      if (ST) lenis.on('scroll', ST.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    if (!ST) return;

    // titles and blocks settle in from 48px below, once (content is already in place)
    $$('[data-reveal]').forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
      gsap.from(el, {
        y: 48, opacity: 0, duration: 0.8, ease: 'power3.out', clearProps: 'transform,opacity',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      });
    });
    $$('[data-reveal-group]').forEach(function (group) {
      var kids = Array.prototype.slice.call(group.children);
      if (group.getBoundingClientRect().top < window.innerHeight * 0.92) return;
      gsap.from(kids, {
        y: 40, opacity: 0, duration: 0.75, ease: 'power3.out', stagger: 0.08, clearProps: 'transform,opacity',
        scrollTrigger: { trigger: group, start: 'top 88%', once: true }
      });
    });

    // photos: light parallax, max 8%, desktop only
    ST.matchMedia({
      '(min-width: 1025px)': function () {
        $$('[data-parallax] img').forEach(function (img) {
          gsap.fromTo(img, { yPercent: 0 }, {
            yPercent: -7, ease: 'none',
            scrollTrigger: { trigger: img.closest('[data-parallax]'), start: 'top bottom', end: 'bottom top', scrub: true }
          });
        });
      }
    });

    ST.refresh();
  }
  function boot() {
    loadScript('/assets/vendor/gsap.min.js')
      .then(function () { return loadScript('/assets/vendor/ScrollTrigger.min.js'); })
      .then(function () { return finePointer && window.innerWidth >= 1024 ? loadScript('/assets/vendor/lenis.min.js') : null; })
      .then(motion, function () { /* motion is optional: the page is complete without it */ });
  }
  if (doc.readyState === 'complete') setTimeout(boot, 0);
  else window.addEventListener('load', function () { setTimeout(boot, 0); });
})();

/* Finishes, hero reel and phone menu (runs after the base behavior above).
   2. Finishes: the real photo changes with the tab (it rises like concrete filling a form) and the surface line of
      the section drawing redraws.
   3. Hero reel: every ~6 s the next real job is struck off by the screed; the control-joint bays mark the service.
      Starts only after load, never with reduced motion, Save-Data or 2G; pause button; stops off screen.
   4. Phone menu: Services accordion; focus lands on the first visible item. */
(function () {
  'use strict';
  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  Array.prototype.forEach.call(doc.querySelectorAll('[data-fin]'), function (box) {
    var dwg = box.querySelector('.dwg[data-finish]');
    var photos = box.querySelectorAll('[data-fin-media] [data-for]');
    if (!dwg || !photos.length) return;
    var current = null;
    function show(key, animate) {
      if (key === current) return;
      current = key;
      Array.prototype.forEach.call(photos, function (ph) {
        var on = ph.getAttribute('data-for') === key;
        ph.classList.toggle('is-on', on);
        ph.classList.remove('is-in');
        if (on && animate && !reduce) { void ph.offsetWidth; ph.classList.add('is-in'); }
      });
      if (animate && !reduce) {
        dwg.classList.remove('is-drawing');
        void dwg.getBoundingClientRect();
        dwg.classList.add('is-drawing');
      }
    }
    show(dwg.getAttribute('data-finish'), false);
    new MutationObserver(function () { show(dwg.getAttribute('data-finish'), true); })
      .observe(dwg, { attributes: true, attributeFilter: ['data-finish'] });
  });

  /* ── hero reel ── */
  (function reel() {
    var box = doc.querySelector('[data-reel]');
    var ui = doc.querySelector('[data-reel-ui]');
    if (!box || !ui) return;
    var slides = Array.prototype.slice.call(box.querySelectorAll('.hero2__slide'));
    var conn = navigator.connection || {};
    if (reduce || slides.length < 2 || conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '')) { ui.style.display = 'none'; return; }
    var bays = Array.prototype.slice.call(ui.querySelectorAll('.reel__bays li'));
    var num = ui.querySelector('[data-reel-n]');
    var name = ui.querySelector('[data-reel-name]');
    var btn = ui.querySelector('[data-reel-btn]');
    var label = ui.querySelector('[data-reel-label]');
    var bar = box.querySelector('.hero2__bar');
    var index = 0;
    var paused = false;
    var inView = true;
    var busy = false;
    var timer = null;
    var z = 2;
    function mark(k) {
      bays.forEach(function (b, j) { b.classList.toggle('is-on', j === k); });
      num.textContent = (k < 9 ? '0' : '') + (k + 1);
      name.textContent = slides[k].getAttribute('data-slide');
    }
    // slides after the first are painted on a canvas: the browser never counts them as a new largest paint, so
    // the first photo stays the only image in LCP while the reel runs
    function draw(s) {
      var img = s.__img;
      var cv = s.__cv;
      if (!img || !cv) return;
      var w = box.clientWidth;
      var h = box.clientHeight;
      var scale = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * scale);
      cv.height = Math.round(h * scale);
      var iw = img.naturalWidth;
      var ih = img.naturalHeight;
      var k = Math.max(cv.width / iw, cv.height / ih);
      var dw = iw * k;
      var dh = ih * k;
      var pos = (s.__pos || '50% 50%').split(' ').map(function (v) { return parseFloat(v) / 100; });
      cv.getContext('2d').drawImage(img, (cv.width - dw) * pos[0], (cv.height - dh) * pos[1], dw, dh);
    }
    function prep(k) {
      var s = slides[k];
      if (s.__img || k === 0) return;
      var pic = s.querySelector('picture');
      var src = pic.querySelector('source[type="image/avif"]') || pic.querySelector('source[type="image/webp"]');
      var ref = pic.querySelector('img');
      var img = new Image();
      img.decoding = 'async';
      img.sizes = ref.getAttribute('sizes');
      img.srcset = (src || ref).getAttribute('srcset');
      s.__pos = ref.style.objectPosition;
      s.__img = img;
      img.onload = function () {
        var cv = doc.createElement('canvas');
        cv.className = 'hero2__cv';
        cv.setAttribute('aria-hidden', 'true');
        s.__cv = cv;
        draw(s);
        pic.remove();
        s.appendChild(cv);
        s.classList.add('is-ready');
        s.hidden = false;
        s.__ok = true;
      };
    }
    function loaded(s) { return slides.indexOf(s) === 0 || !!s.__ok; }
    var rz = null;
    window.addEventListener('resize', function () {
      clearTimeout(rz);
      rz = setTimeout(function () { slides.forEach(function (s) { if (s.__ok) draw(s); }); }, 150);
    });
    function schedule(ms) {
      clearTimeout(timer);
      timer = setTimeout(next, ms || 4600);
    }
    function next() {
      if (paused || !inView || doc.hidden || busy) { schedule(1500); return; }
      var k = (index + 1) % slides.length;
      var s = slides[k];
      prep(k);
      if (!loaded(s)) { schedule(800); return; }
      busy = true;
      s.style.zIndex = String(++z);
      s.classList.remove('is-ready');
      s.classList.add('is-in');
      bar.classList.remove('is-run');
      void bar.offsetWidth;
      bar.classList.add('is-run');
      mark(k);
      setTimeout(function () {
        slides[index].classList.remove('is-current');
        s.classList.remove('is-in');
        s.classList.add('is-current');
        index = k;
        busy = false;
        prep((k + 1) % slides.length);
        schedule();
      }, 1450);
    }
    mark(0);
    btn.addEventListener('click', function () {
      paused = !paused;
      ui.classList.toggle('is-paused', paused);
      btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      label.textContent = paused ? 'Play' : 'Pause';
      if (!paused) schedule(1200);
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }, { threshold: 0.35 }).observe(box);
    }
    function start() { setTimeout(function () { prep(1); schedule(4500); }, 1500); }
    if (doc.readyState === 'complete') start(); else window.addEventListener('load', start);
  })();

  /* ── phone menu: Services accordion, focus on the first visible item ── */
  (function menu() {
    var acc = doc.querySelector('[data-menu-acc]');
    var list = acc && doc.getElementById(acc.getAttribute('aria-controls'));
    var toggle = doc.querySelector('[data-menu-btn]');
    if (!acc || !list) return;
    acc.addEventListener('click', function () {
      var open = acc.getAttribute('aria-expanded') !== 'true';
      acc.setAttribute('aria-expanded', open ? 'true' : 'false');
      list.hidden = !open;
    });
    if (toggle) toggle.addEventListener('click', function () {
      if (doc.documentElement.classList.contains('menu-open')) acc.focus();
    });
    // the page keeps its place under the menu: locking the scroll must not send it back to the top
    var keepY = 0;
    var wasOpen = false;
    if (toggle) toggle.addEventListener('click', function () {
      if (!doc.documentElement.classList.contains('menu-open')) keepY = window.pageYOffset;
    }, true);
    new MutationObserver(function () {
      var open = doc.documentElement.classList.contains('menu-open');
      if (!open && wasOpen && Math.abs(window.pageYOffset - keepY) > 2) window.scrollTo(0, keepY);
      wasOpen = open;
    }).observe(doc.documentElement, { attributes: true, attributeFilter: ['class'] });
  })();
})();
