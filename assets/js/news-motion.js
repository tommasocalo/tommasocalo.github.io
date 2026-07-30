/* news-motion.js — behaviour for the news timeline.
 * ---------------------------------------------------------------------------
 * Everything here is enhancement. The complete list ships in HTML and is fully
 * usable if this file never loads: nothing is hidden until the script itself
 * has added `.js-news` to <html>, and no navigation depends on JavaScript.
 *
 * Four things, in order of how much they matter:
 *
 *   1. reveal-on-first-entry   (all modes)  — one 300ms fade per entry, once.
 *   2. year scrollspy + spine progress (all modes) — orientation at 50 entries.
 *   3. boundary rubber band    (snap, friction) — the list has ends, and you
 *      can feel them. Two positions in the page, not fifty.
 *   4. friction / carousel     (friction only) — wheel effort against a
 *      saturating spring; cross the threshold and exactly one entry commits.
 *
 * Mode comes from `data-motion` on `.news`, which the Liquid include fills
 * from `site.news_motion`. Set it in _config.yml, or per-include.
 *
 * The friction NEVER touches: touch scrolling (no wheel events fire), the
 * keyboard, the scrollbar, find-in-page, or anyone with
 * prefers-reduced-motion: reduce. It also stands down for ctrl+wheel, which
 * is how trackpad pinch-zoom arrives.
 */
(function () {
  'use strict';

  var root = document.querySelector('.news');
  if (!root) return;

  var wrap = root.querySelector('.news-timeline-wrapper');
  var items = [].slice.call(root.querySelectorAll('.news-timeline__item'));
  if (!wrap || !items.length) return;

  var prog = root.querySelector('.news-spine__prog');
  var pullEl = root.querySelector('.news-spine__pull');
  var chips = [].slice.call(root.querySelectorAll('.news-years__chip'));
  var docEl = document.documentElement;
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ===================================================================== */
  /*  CONSTANTS                                                            */
  /*  Carried over from the physics bench; every one of them was arrived at */
  /*  by instrumenting a real wheel and a real trackpad, not by taste.      */
  /* ===================================================================== */
  var CFG = {
    THRESHOLD: 100,     // effort units needed to commit one entry
    MAX_PULL: 28,       // px — hard ceiling on how far the band can stretch
    STIFFNESS: 62,      // pull = MAX_PULL * tanh(acc / STIFFNESS)
    PAD_GAIN: 0.30,     // effort units per px of trackpad delta
    WHEEL_UNIT: 42,     // effort units per 100px mouse notch -> 2.4 notches/entry
    GESTURE_GAP: 140,   // ms of silence that ends a gesture
    COMMIT_LOCK: 240,   // ms after a commit during which input is swallowed
    HOLD: 260,          // ms of static friction before the accumulator bleeds.
                        // MUST exceed the 125-200ms gap between mouse-wheel
                        // notches or a mouse can never reach THRESHOLD. This is
                        // invisible on a trackpad and fatal on a mouse.
    DECAY: 170,         // ms time constant of the spring-back
    DUR: 360,           // ms of the commit animation (quintOut)
    INTERRUPT: 0.72,    // an interrupting commit retargets at this fraction
    LINE: 0.30,         // reading line as a fraction of viewport height
    LINE_MIN: 130,
    LINE_MAX: 320,
    BAND_THRESHOLD: 58, // the band is deliberately cheaper than an entry commit
    BAND_MAX: 22,
    BAND_STIFF: 44,
    BAND_COOLDOWN: 900, // ms before the same edge may grab you again
    TAIL_GUARD: 420,    // ms after a commit during which we refuse to release
    MOM_FALL: 3,        // consecutive decaying events before we call it inertia
    MOM_RATIO: 0.55
  };

  var LAST = items.length - 1;
  var mode = root.getAttribute('data-motion') || 'off';
  var bandEnabled = root.getAttribute('data-band') !== 'off';
  var snapStrict = false;

  var reduced = function () { return reduceMQ.matches; };
  var clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  var quintOut = function (t) { return 1 - Math.pow(1 - t, 5); };
  var scrollY = function () { return window.pageYOffset || docEl.scrollTop || 0; };
  var maxScroll = function () { return Math.max(0, docEl.scrollHeight - window.innerHeight); };
  var readLine = function () {
    return clamp(window.innerHeight * CFG.LINE, CFG.LINE_MIN, CFG.LINE_MAX);
  };
  var absTop = function (el) { return el.getBoundingClientRect().top + scrollY(); };
  var targetOf = function (i) { return clamp(absTop(items[i]) - readLine(), 0, maxScroll()); };

  /* ===================================================================== */
  /*  1. REVEAL ON FIRST ENTRY                                             */
  /*  Deliberately IntersectionObserver and not a load-time stagger: a      */
  /*  stagger's length is a function of how many entries exist, so it gets  */
  /*  slower every year. Deliberately not animation-timeline: view() either */
  /*  — a view timeline is scrubbed, so scrolling back up would play the    */
  /*  fade in reverse and make text vanish under the reader.                */
  /* ===================================================================== */
  (function reveal() {
    if (!('IntersectionObserver' in window) || reduced()) return;
    docEl.classList.add('js-news');
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add('is-seen');
          io.unobserve(entries[i].target);
        }
      }
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });
    items.forEach(function (el) { io.observe(el); });

    // If the observer never fires (broken polyfill, odd embedding), do not
    // leave the archive invisible.
    window.setTimeout(function () {
      if (!root.querySelector('.news-timeline__item.is-seen')) {
        items.forEach(function (el) { el.classList.add('is-seen'); });
      }
    }, 1200);
  }());

  /* ===================================================================== */
  /*  2. ORIENTATION — year scrollspy + spine progress                      */
  /* ===================================================================== */
  var sections = chips.map(function (c) {
    try { return root.querySelector(c.getAttribute('href')); } catch (e) { return null; }
  }).filter(Boolean);

  function markYear() {
    if (!sections.length) return;
    var line = readLine() * 0.6;
    var cur = 0;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= line) cur = i;
    }
    // The last chapters can sit below the line forever because the document
    // simply runs out of runway; at the bottom, the last one is current.
    // Guarded on the page being scrollable at all: without that, a short
    // archive that fits on one screen is permanently "at the bottom" and the
    // oldest year lights up on load. Found on the built site with nine posts.
    if (maxScroll() > 4 && Math.ceil(scrollY() + window.innerHeight) >= docEl.scrollHeight - 2) {
      cur = sections.length - 1;
    }
    for (var j = 0; j < chips.length; j++) {
      chips[j].setAttribute('aria-current', j === cur ? 'true' : 'false');
    }
  }

  function paintProgress() {
    if (!prog) return;
    var r = wrap.getBoundingClientRect();
    var p = (readLine() - r.top) / Math.max(1, r.height);
    prog.style.transform = 'scaleY(' + clamp(p, 0, 1).toFixed(4) + ')';
  }

  /* ===================================================================== */
  /*  3. INPUT NORMALISATION                                               */
  /*  There is no platform API that tells you wheel from trackpad, so this  */
  /*  is a heuristic stack ordered by how much it can be trusted. Getting   */
  /*  it wrong costs half a notch, because the two gains are tuned to       */
  /*  converge: a 100px event is 42 units as a wheel, 30 as a trackpad.     */
  /* ===================================================================== */
  var device = 'unknown';
  var evtTimes = [];

  function normalise(e) {
    var px = e.deltaY;
    if (e.deltaMode === 1) px *= 16;                      // LINE -> px
    else if (e.deltaMode === 2) px *= window.innerHeight;  // PAGE -> px
    return px;
  }
  function recentHz() {
    if (evtTimes.length < 6) return 0;
    var s = evtTimes.slice(-10);
    var span = s[s.length - 1] - s[0];
    return span > 0 ? 1000 * (s.length - 1) / span : 0;
  }
  function classify(e) {
    if (e.deltaMode !== 0) return 'wheel';   // Firefox reports LINE for mice
    if (e.deltaX !== 0) return 'trackpad';   // notched wheels have no X axis
    if (recentHz() > 25) return 'trackpad';  // wheels cannot emit that fast
    var a = Math.abs(e.deltaY);
    if (a > 0 && a < 20) return 'trackpad';
    if (a >= 100 && a === Math.round(a)) return 'wheel';
    return null;                             // ambiguous: keep the last verdict
  }
  function unitsFor(px) {
    return device === 'wheel' ? (px / 100) * CFG.WHEEL_UNIT : px * CFG.PAD_GAIN;
  }

  /* Once the compositor has latched a scroll, later events in the sequence
     arrive with cancelable === false and preventDefault() only logs a warning. */
  var uncancelable = 0;
  function stop(e) {
    if (e.cancelable !== false) { e.preventDefault(); return true; }
    uncancelable++;
    return false;
  }

  /* ===================================================================== */
  /*  4. STATE                                                             */
  /* ===================================================================== */
  var idx = 0, acc = 0, dirSign = 0;
  var lastEvt = -1e9, lastPush = -1e9, committedAt = -1e9;
  var peak = 0, falling = 0;
  var anim = null, tensioning = false, anchor = 0;
  var bandOn = false, bandEdge = 0, bandReleasedAt = -1e9;
  var phase = 'idle', commits = 0;
  var telemetryFn = null;

  var frictionOn = function () {
    return mode === 'friction' && !reduced();
  };
  // The list must actually be under the reading line, or we are hijacking the
  // header and the footer too.
  function listCoversLine() {
    var r = wrap.getBoundingClientRect();
    var line = readLine();
    return r.top <= line && r.bottom >= line;
  }

  function syncIdx() {
    var line = scrollY() + readLine() + 2;
    var cur = 0;
    for (var i = 0; i < items.length; i++) {
      if (absTop(items[i]) <= line) cur = i;
    }
    idx = cur;
  }

  /* ===================================================================== */
  /*  5. BOUNDARY RUBBER BAND                                              */
  /*  The one piece of resistance that scales: it lives at two positions in */
  /*  the page rather than between every pair of entries, and its job is to */
  /*  say "this list has an end", which is information. It translates the   */
  /*  TIMELINE, not the page — the header and footer stay put, so what      */
  /*  stretches is visibly the list itself.                                 */
  /* ===================================================================== */
  function topEdge() {
    return mode === 'friction' ? targetOf(0) : clamp(absTop(wrap) - readLine(), 0, maxScroll());
  }
  function bottomEdge() {
    if (mode === 'friction') return targetOf(LAST);
    var r = wrap.getBoundingClientRect();
    return clamp(r.bottom + scrollY() - window.innerHeight + 16, 0, maxScroll());
  }

  function endBand(released) {
    if (!bandOn) return;
    bandOn = false;
    bandEdge = 0;
    root.classList.remove('is-banding');
    wrap.style.transform = '';
    if (released) bandReleasedAt = performance.now();
  }

  function tryBand(e, dir, px, now, coasting) {
    if (!bandEnabled || mode === 'off' || reduced()) return false;
    if (now - bandReleasedAt < CFG.BAND_COOLDOWN) return false;
    if (now - committedAt < CFG.TAIL_GUARD) return false;

    var y = scrollY();
    var edge = 0;
    if (dir < 0 && y <= topEdge() + 2) edge = -1;
    else if (dir > 0 && y >= bottomEdge() - 2) edge = 1;

    if (!edge || coasting) { endBand(false); return false; }
    if (bandOn && edge !== bandEdge) { endBand(false); }
    if (!bandOn) { acc = 0; bandOn = true; bandEdge = edge; root.classList.add('is-banding'); }

    if (!stop(e)) { endBand(false); return false; }

    acc += unitsFor(px);
    lastPush = now;
    dirSign = edge;
    phase = 'band';

    if (Math.abs(acc) >= CFG.BAND_THRESHOLD) {
      acc = 0;
      endBand(true);          // let go: the page takes the rest of the gesture
      return false;
    }
    var stretch = -edge * CFG.BAND_MAX * Math.tanh(Math.abs(acc) / CFG.BAND_STIFF);
    wrap.style.transform = 'translate3d(0,' + stretch.toFixed(2) + 'px,0)';
    return true;
  }

  /* ===================================================================== */
  /*  6. THE WHEEL HANDLER                                                 */
  /* ===================================================================== */
  function onWheel(e) {
    if (e.ctrlKey) return;                 // trackpad pinch = browser zoom
    if (reduced()) return;
    if (mode === 'off' && !bandEnabled) return;

    var now = performance.now();
    if (now - lastEvt > CFG.GESTURE_GAP) {
      peak = 0; falling = 0;
      if (!anim) tensioning = false;
      endBand(false);
    }
    lastEvt = now;
    evtTimes.push(now);
    if (evtTimes.length > 40) evtTimes.shift();

    var c = classify(e);
    if (c) device = c;
    var px = normalise(e);
    var a = Math.abs(px);
    if (!a) return;

    /* Momentum detection. During the powered phase deltas rise or hold;
       during the macOS inertia tail they decay monotonically. Only the
       powered phase accumulates, which is what makes a hard flick advance one
       entry rather than six. Effort maps to entries; velocity does not. */
    if (a > peak) { peak = a; falling = 0; }
    else if (a < peak * 0.9) { falling++; }
    var coasting = falling >= CFG.MOM_FALL && a < peak * CFG.MOM_RATIO;

    var dir = px < 0 ? -1 : 1;

    if (tryBand(e, dir, px, now, coasting)) return;

    if (!frictionOn()) return;
    // Only while the pointer is genuinely over the timeline. `e.target` is the
    // element under the cursor, which is more reliable than tracking mousemove.
    if (!wrap.contains(e.target)) return;
    if (!listCoversLine()) return;

    if (!anim && !tensioning) syncIdx();

    var atEdge = (idx === 0 && dir < 0) || (idx === LAST && dir > 0);
    if (atEdge) { acc = 0; tensioning = false; phase = 'released'; return; }

    if (!stop(e)) { phase = 'uncancelable'; return; }

    if (coasting) { phase = 'coasting'; return; }
    if (now - committedAt < CFG.COMMIT_LOCK) { acc = 0; phase = 'locked'; return; }

    var u = unitsFor(px);
    if (dirSign !== 0 && (u < 0) !== (dirSign < 0)) acc = 0;   // reversal resets
    dirSign = u < 0 ? -1 : 1;
    acc += u;
    lastPush = now;
    phase = 'pushing';

    if (!tensioning) { anchor = scrollY(); tensioning = true; }
    if (Math.abs(acc) >= CFG.THRESHOLD) commit(dirSign);
  }

  function commit(dir) {
    var next = clamp(idx + dir, 0, LAST);
    if (next === idx) { acc = 0; return; }
    var interrupting = !!anim;
    idx = next;
    acc = 0;
    commits++;
    committedAt = performance.now();
    tensioning = false;
    anim = {
      from: scrollY(),
      to: targetOf(idx),
      t0: performance.now(),
      dur: CFG.DUR * (interrupting ? CFG.INTERRUPT : 1)
    };
  }

  function step(delta) {
    syncIdx();
    var next = clamp(idx + delta, 0, LAST);
    if (next === idx && delta !== 0) return;
    idx = next;
    acc = 0;
    committedAt = performance.now();
    anim = { from: scrollY(), to: targetOf(idx), t0: performance.now(), dur: CFG.DUR };
  }

  /* ===================================================================== */
  /*  7. FRAME LOOP                                                        */
  /* ===================================================================== */
  var running = false;
  function ensureLoop() {
    if (running) return;
    running = true;
    requestAnimationFrame(tick);
  }

  function tick(now) {
    // Static friction, then bleed. See the note on CFG.HOLD.
    if (acc !== 0 && now - lastPush > CFG.HOLD) {
      acc *= Math.exp(-16.7 / CFG.DECAY);
      if (Math.abs(acc) < 0.6) { acc = 0; if (bandOn) endBand(false); }
    }

    if (anim) {
      var p = Math.min(1, (now - anim.t0) / anim.dur);
      window.scrollTo(0, anim.from + (anim.to - anim.from) * quintOut(p));
      if (p >= 1) { anim = null; phase = 'idle'; }
    } else if (tensioning && frictionOn()) {
      // Rubber band. Displacement saturates, so pushing harder buys almost
      // nothing — that saturation IS the resistance.
      var pull = CFG.MAX_PULL * Math.tanh(acc / CFG.STIFFNESS);
      window.scrollTo(0, clamp(anchor + pull, 0, maxScroll()));
      if (acc === 0) { tensioning = false; phase = 'idle'; }
    } else if (bandOn && acc === 0) {
      endBand(false);
    }

    paintTension();
    if (telemetryFn) telemetryFn(readTelemetry());
    requestAnimationFrame(tick);
  }

  /* The resistance, drawn on his own timeline: the dot you are pulling
     towards swells, and a short accent segment of spine grows out of the dot
     you are leaving. No HUD, no ring, no chrome that only exists to explain
     a mechanism. */
  var lastPullEl = null;
  function paintTension() {
    var t = frictionOn() && !bandOn ? Math.min(1, Math.abs(acc) / CFG.THRESHOLD) : 0;
    var nextI = clamp(idx + (dirSign || 1), 0, LAST);

    if (lastPullEl && (t <= 0.02 || lastPullEl !== items[nextI])) {
      lastPullEl.classList.remove('is-pull');
      lastPullEl.style.removeProperty('--news-tension');
      lastPullEl = null;
    }
    if (t > 0.02) {
      items[nextI].classList.add('is-pull');
      items[nextI].style.setProperty('--news-tension', t.toFixed(3));
      lastPullEl = items[nextI];
    }

    if (!pullEl) return;
    if (t > 0.02 && nextI !== idx) {
      var wrapTop = absTop(wrap);
      var a0 = absTop(items[idx]) - wrapTop + 11;      // dot centre, roughly
      var a1 = absTop(items[nextI]) - wrapTop + 11;
      var len = Math.abs(a1 - a0) * t * 0.62;
      pullEl.style.opacity = (0.25 + t * 0.75).toFixed(2);
      pullEl.style.height = len.toFixed(1) + 'px';
      pullEl.style.top = (a1 < a0 ? a0 - len : a0) + 'px';
    } else {
      pullEl.style.opacity = 0;
      pullEl.style.height = '0px';
    }
  }

  function readTelemetry() {
    var stale = performance.now() - lastEvt > 300;
    return {
      device: device,
      mode: mode,
      acc: acc,
      threshold: CFG.THRESHOLD,
      tension: Math.min(1, Math.abs(acc) / CFG.THRESHOLD),
      pull: CFG.MAX_PULL * Math.tanh(acc / CFG.STIFFNESS),
      index: idx,
      count: items.length,
      commits: commits,
      phase: stale && !anim ? 'idle' : phase,
      band: bandOn,
      uncancelable: uncancelable,
      notchesPerEntry: CFG.THRESHOLD / CFG.WHEEL_UNIT,
      padPxPerEntry: CFG.THRESHOLD / CFG.PAD_GAIN,
      gesturesForList: items.length
    };
  }

  /* ===================================================================== */
  /*  8. SNAP MODE                                                         */
  /*  No JavaScript in the event path at all — three CSS declarations. The  */
  /*  only script involvement is marking entries too tall to be safe snap   */
  /*  targets, which is a layout question CSS cannot ask.                   */
  /* ===================================================================== */
  function measureTall() {
    var lim = window.innerHeight * 0.7;
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('is-tall', items[i].offsetHeight > lim);
    }
  }

  function applyMode() {
    root.setAttribute('data-motion', mode);
    docEl.classList.toggle('news-snap', mode === 'snap' && !snapStrict && !reduced());
    docEl.classList.toggle('news-snap-mandatory', mode === 'snap' && snapStrict && !reduced());
    // window.scrollTo cannot fight a smooth scroller.
    docEl.style.scrollBehavior = mode === 'friction' ? 'auto' : '';
    if (mode !== 'friction') { tensioning = false; anim = null; acc = 0; }
    endBand(false);
    paintTension();
    measureTall();
  }

  /* ===================================================================== */
  /*  9. BOOT                                                              */
  /* ===================================================================== */
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      markYear();
      paintProgress();
    });
  }, { passive: true });

  window.addEventListener('resize', function () {
    markYear();
    paintProgress();
    measureTall();
  });

  window.addEventListener('wheel', onWheel, { passive: false });

  /* j / k already move the page on this site. In friction mode they move one
     entry, which gives the carousel a keyboard equivalent without stealing the
     arrow keys — hijacking those would be genuinely hostile. Outside friction
     they keep their old meaning. This used to live inline in news.md; it moved
     here so that the two handlers cannot both fire on the same keystroke. */
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest && e.target.closest('input, textarea, [contenteditable]')) return;
    if (e.key !== 'j' && e.key !== 'k') return;
    var d = e.key === 'j' ? 1 : -1;
    if (mode === 'friction' && !reduced()) { e.preventDefault(); step(d); }
    else window.scrollBy({ top: d * 240, behavior: reduced() ? 'auto' : 'smooth' });
  });

  /* The floating jump-to-oldest button, if the page has one. */
  (function jump() {
    var btn = document.querySelector('.news-jump');
    if (!btn) return;
    function update() {
      var y = scrollY();
      var near = y > maxScroll() - 240;
      btn.classList.toggle('is-visible', y > 180);
      btn.dataset.state = near ? 'up' : 'down';
      btn.setAttribute('aria-label', near ? 'Jump to latest' : 'Jump to oldest');
    }
    btn.addEventListener('click', function () {
      window.scrollTo({
        top: btn.dataset.state === 'up' ? 0 : docEl.scrollHeight,
        behavior: reduced() ? 'auto' : 'smooth'
      });
    });
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }());

  reduceMQ.addEventListener('change', applyMode);

  applyMode();
  markYear();
  paintProgress();
  ensureLoop();

  /* Small surface so the prototype can drive this exact file. Harmless on the
     live site; nothing depends on it. */
  window.NewsMotion = {
    cfg: CFG,
    setMode: function (m) { mode = m; applyMode(); },
    getMode: function () { return mode; },
    setBand: function (on) { bandEnabled = !!on; endBand(false); },
    setSnapStrict: function (on) { snapStrict = !!on; applyMode(); },
    onTelemetry: function (fn) { telemetryFn = fn; },
    rebuild: function () {
      items = [].slice.call(root.querySelectorAll('.news-timeline__item'));
      LAST = items.length - 1;
      chips = [].slice.call(root.querySelectorAll('.news-years__chip'));
      sections = chips.map(function (c) {
        try { return root.querySelector(c.getAttribute('href')); } catch (e) { return null; }
      }).filter(Boolean);
      items.forEach(function (el) { el.classList.add('is-seen'); });
      idx = 0; acc = 0; anim = null; tensioning = false;
      applyMode();
      markYear();
      paintProgress();
    }
  };
}());
