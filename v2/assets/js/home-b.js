/* L Oliveira Concrete — home, proposal B (runs after site.js).
   1. "The slab builds": the stage follows the text being read (call, visit, estimate, forms, reinforcement, pour,
      finish, control joints, finishes); each stage lights its layer of the drawing and shows its real photo.
   2. Control joints between chapters: the cut runs once when the joint enters the screen.
   3. Header progress rule with a joint at each chapter.
   Reduced motion: the scene and the joints stay in their final state; the progress rule still follows the scroll. */
(function () {
  'use strict';

  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }

  /* ── 1. the slab builds ── */
  (function scene() {
    var box = doc.querySelector('[data-slabx]');
    if (!box || reduce || !hasIO) return;
    var ORDER = ['call', 'visit', 'estimate', 'forms', 'rebar', 'pour', 'finish', 'joint', 'fin'];
    var items = $$('[data-stage]', box);
    var steps = $$('.slabx__step', box);
    var phases = $$('.slabx__ph', box);
    var big = box.querySelector('[data-bign]');
    var view = box.querySelector('.slabx__view');
    var wipe = box.querySelector('.slabx__wipe');
    var stage = box.querySelector('.slabx__stage');
    var SHOTS = { forms: 1, rebar: 1, pour: 1, finish: 1 };
    var cur = -1;
    var live = false;
    var ticking = false;

    box.classList.add('is-armed');

    function set(k) {
      if (k === cur) return;
      var prev = cur;
      cur = k;
      ORDER.forEach(function (name, i) { box.classList.toggle('at-' + name, i <= k); });
      var now = ORDER[k];
      if (big && k < 3) big.textContent = '0' + (k + 1);
      steps.forEach(function (s) { s.classList.remove('is-lit'); });
      phases.forEach(function (p) { p.classList.toggle('is-lit', p.getAttribute('data-stage') === now); });
      var item = items.filter(function (it) { return it.getAttribute('data-stage') === now; })[0];
      var step = item && item.closest('.slabx__step');
      if (step) step.classList.add('is-lit');
      // a new photo comes in behind the screed bar, only when the photo changes and the stage is visible
      if (wipe && view && view.offsetWidth && prev !== -1 && SHOTS[now] && k > prev) {
        view.style.setProperty('--vw', view.offsetWidth + 'px');
        wipe.classList.remove('is-run');
        void wipe.offsetWidth;
        wipe.classList.add('is-run');
      }
    }

    // the stage is the last item whose top passed the reading line (under the held drawing on phones)
    function pick() {
      ticking = false;
      var line = window.innerHeight * 0.55;
      if (stage && getComputedStyle(stage).order === '-1') line = Math.max(line, stage.getBoundingClientRect().bottom + 48);
      var k = 0;
      items.forEach(function (it) {
        if (it.getBoundingClientRect().top < line) k = Math.max(k, ORDER.indexOf(it.getAttribute('data-stage')));
      });
      set(k);
    }
    function onScroll() {
      if (!live || ticking) return;
      ticking = true;
      window.requestAnimationFrame(pick);
    }
    new IntersectionObserver(function (es) {
      live = es[0].isIntersecting;
      if (live) pick();
    }, { threshold: 0 }).observe(box);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    set(0);
    pick();
  })();

  /* ── 2. control joints between chapters ── */
  $$('[data-cut]').forEach(function (cut) {
    if (reduce || !hasIO) return;
    if (cut.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    cut.classList.add('is-armed');
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { io.disconnect(); cut.classList.add('is-on'); }
    }, { rootMargin: '0px 0px -18% 0px', threshold: 0 });
    io.observe(cut);
  });

  /* ── 3. header progress rule: a joint at each chapter ── */
  (function progress() {
    var hdr = doc.querySelector('[data-hdr]');
    if (!hdr) return;
    var bar = doc.createElement('div');
    bar.className = 'prog';
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = '<span class="prog__fill"></span>';
    hdr.appendChild(bar);
    var fill = bar.firstChild;
    var cuts = $$('[data-cut]');
    var ticking = false;
    function joints() {
      $$('.prog__j', bar).forEach(function (j) { j.remove(); });
      var max = doc.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      cuts.forEach(function (c) {
        var y = c.getBoundingClientRect().top + window.pageYOffset - window.innerHeight * 0.5;
        var j = doc.createElement('span');
        j.className = 'prog__j';
        j.style.left = Math.min(100, Math.max(0, y / max * 100)).toFixed(2) + '%';
        bar.appendChild(j);
      });
    }
    function paint() {
      ticking = false;
      var max = doc.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, window.pageYOffset / max)) : 0;
      fill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(paint);
    }, { passive: true });
    var rz = null;
    window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { joints(); paint(); }, 150); });
    if (doc.readyState === 'complete') { joints(); paint(); }
    else window.addEventListener('load', function () { joints(); paint(); });
    paint();
  })();
})();
