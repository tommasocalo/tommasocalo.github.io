/* Latest News carousel — homepage only.
 *
 * The homepage shows a fixed window of the most recent entries. Winding the
 * wheel over it does not scroll the page: it rotates the window one entry at a
 * time. Scrolling down brings an older entry in at the bottom, the others move
 * up, and the top one leaves. At either end the gesture is handed back to the
 * page, so the carousel is never a trap.
 *
 * This is deliberately NOT the same thing as hijacking a long list. The window
 * is small and bounded, "All news" is a page of its own, and the cost of the
 * mechanic therefore does not grow as the archive does.
 *
 * Progressive enhancement: with this file absent, blocked or erroring, the
 * markup is an ordinary list of entries — the clipping and the transform are
 * only ever applied from here.
 */
(function () {
  'use strict';

  var root = document.querySelector('.news--home');
  if (!root) return;
  // `data-carousel`, not `data-motion`: news-motion.js owns the latter, and two
  // scripts claiming the same wheel events fight — the symptom is a gesture
  // that sometimes moves the carousel, sometimes the page, with no pattern.
  var mode = root.getAttribute('data-carousel') || 'off';
  if (mode === 'off') return;

  var frame = root.querySelector('.news-carousel');
  var list = root.querySelector('.news-timeline');
  if (!frame || !list) return;

  var items = Array.prototype.slice.call(list.children);
  var WINDOW = parseInt(frame.getAttribute('data-window'), 10) || 3;
  if (items.length <= WINDOW) return;             // nothing to wind through

  var reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // `any-hover`/`any-pointer` rather than `hover`/`pointer`: the plain queries
  // describe the *primary* input, so a laptop with a touchscreen — or a tablet
  // with a trackpad attached — reports coarse and loses the wheel even though a
  // mouse is right there. `any-*` asks whether ANY available input is fine,
  // which is the question that actually matters here.
  // (In devtools, switching from a device preset back to a desktop size leaves
  //  touch emulation on, so the page still reports coarse. That is the emulator
  //  telling the truth about what it is emulating, not a bug on this side.)
  var coarse = matchMedia('not ((any-hover: hover) and (any-pointer: fine))');

  // --- physics ------------------------------------------------------------
  // Only the powered phase of a gesture accumulates; the inertia tail after a
  // flick is discarded. That is what makes one hard flick advance exactly one
  // entry instead of six.
  var THRESHOLD = 100;      // accumulator units for one step
  var MAX_PULL = 26;        // px the list can be dragged before it commits
  var STIFFNESS = 62;       // saturation: the last push moves almost nothing
  var PAD_GAIN = 0.30;      // trackpad: ~333px of travel per entry
  var WHEEL_UNIT = 42;      // mouse: ~2.4 notches per entry
  var HOLD = 260;           // ms of static friction before the pull decays.
                            // MUST exceed a mouse's 125-200ms inter-notch gap,
                            // or the accumulator bleeds out between notches and
                            // a wheel can never cross the threshold at all —
                            // a bug a trackpad can never surface.
  var DECAY = 170;
  var GESTURE_GAP = 140;    // silence longer than this ends the gesture
  var COMMIT_LOCK = 240;    // min ms between commits
  var DUR = 380;            // step animation

  var index = 0;            // index of the entry at the top of the window
  var endHolds = 0;         // boundary gestures already absorbed
  var acc = 0;              // accumulated effort toward the next step
  var pull = 0;             // current rubber-band displacement, px
  var owned = false;        // this gesture belongs to the carousel
  var lastEvent = 0, lastCommit = 0, decayTimer = 0, raf = 0;
  var offsets = [], frameH = 0;
  var animating = false;

  function maxIndex() { return Math.max(0, items.length - WINDOW); }

  // --- measurement --------------------------------------------------------
  // Entries are not equal height, so a step translates by the height of the
  // entry that is actually leaving, not by a constant.
  function measure() {
    // offsetTop, not getBoundingClientRect: the reveal animation leaves a
    // translateY on unrevealed entries, and a rect would fold that into the
    // measurement — which put a phantom 6px offset on the very first step.
    var base = items[0].offsetTop;
    offsets = items.map(function (el) { return el.offsetTop - base; });
    // FIXED height: the tallest slice the window will ever show. A frame that
    // breathed per-step moved the page under the reader; this one never moves,
    // and no slice can be truncated because none is taller than it.
    frameH = 0;
    for (var i = 0; i <= maxIndex(); i++) {
      var lastEl = items[Math.min(i + WINDOW - 1, items.length - 1)];
      var h = (lastEl.offsetTop - base) - offsets[i] + lastEl.offsetHeight;
      if (h > frameH) frameH = h;
    }
  }

  function offsetFor(i) { return offsets[Math.min(i, offsets.length - 1)] || 0; }

  function render(withTransition) {
    // Fresh measurements every render — offsets frozen at load drift from
    // reality (late layout shifts, the reveal transform).
    measure();
    frame.style.height = frameH + 'px';
    list.style.transition = withTransition
      ? 'transform ' + DUR + 'ms cubic-bezier(0.22, 0.61, 0.36, 1)'
      : 'none';
    list.style.transform = 'translate3d(0,' + (-offsetFor(index) - pull) + 'px,0)';
    frame.setAttribute('data-at-start', index === 0 ? 'true' : 'false');
    frame.setAttribute('data-at-end', index >= maxIndex() ? 'true' : 'false');
    // Entries scrolled out of the window are removed from the tab order, so a
    // keyboard user is never sent to a link they cannot see.
    items.forEach(function (el, i) {
      var visible = i >= index && i < index + WINDOW;
      el.classList.toggle('is-offstage', !visible);
      el.querySelectorAll('a').forEach(function (a) {
        if (visible) a.removeAttribute('tabindex');
        else a.setAttribute('tabindex', '-1');
      });
    });
  }

  function step(dir) {
    var next = Math.min(maxIndex(), Math.max(0, index + dir));
    if (next === index) return false;
    index = next;
    endHolds = 0;
    acc = 0; pull = 0;
    animating = true;
    render(true);
    window.setTimeout(function () { animating = false; }, DUR);
    lastCommit = performance.now();
    return true;
  }

  // --- touch pager --------------------------------------------------------
  var pager = root.querySelector('.news-pager');
  var pagerBtns = pager ? Array.prototype.slice.call(pager.querySelectorAll('.news-pager__btn')) : [];
  var pagerPos = pager ? pager.querySelector('.news-pager__pos') : null;

  function paintPager() {
    if (!pager || pager.hidden) return;
    // Walking away from the frame forgives the boundary count.
  frame.addEventListener('pointerleave', function () { endHolds = 0; });

  pagerBtns.forEach(function (b) {
      var dir = parseInt(b.getAttribute('data-dir'), 10);
      b.disabled = dir > 0 ? index >= maxIndex() : index <= 0;
    });
    if (pagerPos) {
      var first = index + 1, last = Math.min(items.length, index + WINDOW);
      pagerPos.textContent = first + '–' + last + ' of ' + items.length;
    }
  }

  // Walking away from the frame forgives the boundary count.
  frame.addEventListener('pointerleave', function () { endHolds = 0; });

  pagerBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      // A screenful at a time: on touch you are paging, not winding.
      step(parseInt(b.getAttribute('data-dir'), 10) * WINDOW);
      paintPager();
    });
  });

  // --- rubber band --------------------------------------------------------
  // Saturating, so the first push moves a lot and the last moves almost
  // nothing. That asymmetry is what reads as resistance rather than as lag.
  function pullFor(a) {
    return MAX_PULL * Math.tanh(Math.abs(a) / STIFFNESS) * (a < 0 ? -1 : 1);
  }

  // Stop any spring-back that is currently running. Without this the decay
  // loop keeps overwriting `acc` from its own starting value every frame, so
  // anything pushed while it is running is silently discarded — the symptom
  // was needing ~15 notches for one step instead of ~3.
  function halt() {
    window.clearTimeout(decayTimer);
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  function relax() {
    halt();
    decayTimer = window.setTimeout(function () {
      var t0 = performance.now(), a0 = acc;
      (function decay() {
        var k = Math.exp(-(performance.now() - t0) / DECAY);
        acc = a0 * k;
        pull = pullFor(acc);
        render(false);
        if (Math.abs(acc) > 1) raf = requestAnimationFrame(decay);
        else { acc = 0; pull = 0; render(true); }
      })();
    }, HOLD);
  }

  // --- input --------------------------------------------------------------
  // The capture zone is deliberately asymmetric. Over the date rail and the
  // body of the entries, winding the carousel is what you mean; out on the
  // right, over the ragged tails of the text, you are far from anything that
  // reads as "the timeline" and the page scrolling is the less surprising
  // behaviour. Fraction of the frame width where capture ends:
  var CAPTURE_X = 0.72;

  function onWheel(e) {
    if (reduced.matches || coarse.matches) return;
    if (e.ctrlKey) return;                       // pinch-zoom is not ours
    var fr = frame.getBoundingClientRect();
    if ((e.clientX - fr.left) / fr.width > CAPTURE_X) return;
    var now = performance.now();
    var dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 16;             // Firefox reports lines
    else if (e.deltaMode === 2) dy *= frameH;

    var dir = dy > 0 ? 1 : -1;
    var fresh = now - lastEvent > GESTURE_GAP;
    if (fresh) { acc = 0; owned = false; }       // a new gesture starts unclaimed
    lastEvent = now;

    if ((dir > 0 && index >= maxIndex()) || (dir < 0 && index === 0)) {
      // At an end. Three stages: (1) the tail of the gesture that wound the
      // carousel here is swallowed; (2) the FIRST fresh push against the
      // boundary is held — the list leans on its rubber band and springs
      // back, saying "end of the record"; (3) only an insistent second push
      // releases the page. Deliberate exit, never an accidental one.
      if (fresh) {
        if (endHolds >= 1) { endHolds = 0; return; }   // insisted: the page may go
        endHolds++;
        owned = true;
      }
      if (!owned) return;
      e.preventDefault();
      halt();
      var isW = Math.abs(dy) >= 100 && Math.abs(dy) % 1 === 0;
      acc += (isW ? dir * WHEEL_UNIT : dy * PAD_GAIN) * 0.45;
      acc = Math.max(-90, Math.min(90, acc));
      pull = pullFor(acc);
      render(false);
      relax();
      return;
    }

    e.preventDefault();
    owned = true;
    halt();

    // Mouse wheels arrive as large discrete deltas, trackpads as a fast stream
    // of small ones. Gains differ so both need roughly the same real effort.
    var isWheel = Math.abs(dy) >= 100 && Math.abs(dy) % 1 === 0;
    acc += isWheel ? dir * WHEEL_UNIT : dy * PAD_GAIN;

    // Effort spent while a step is still animating still counts. Dropping it
    // made sustained scrolling feel like it was ignoring you, and made the
    // real cost of winding through the window ~380ms per entry rather than
    // whatever you were actually pushing.
    if (animating) return;

    if (Math.abs(acc) >= THRESHOLD && now - lastCommit > COMMIT_LOCK) {
      step(acc > 0 ? 1 : -1);
      return;
    }
    pull = pullFor(acc);
    render(false);
    relax();
  }

  function onKey(e) {
    if (e.target !== frame) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') { if (step(1)) e.preventDefault(); }
    else if (e.key === 'ArrowUp' || e.key === 'PageUp') { if (step(-1)) e.preventDefault(); }
    else if (e.key === 'Home') { index = 0; render(true); e.preventDefault(); }
    else if (e.key === 'End') { index = maxIndex(); render(true); e.preventDefault(); }
  }

  // --- setup --------------------------------------------------------------
  var wheelBound = false, keysBound = false;

  function enable(paged) {
    frame.classList.add('is-live');
    frame.setAttribute('tabindex', '0');
    frame.setAttribute('role', 'group');
    frame.setAttribute('aria-label', 'Latest news, ' + items.length + ' entries.');
    // Inside a clipped window the entry-reveal stagger is meaningless — and
    // its translateY on never-observed entries skewed the measurements.
    items.forEach(function (el) { el.classList.add('is-seen'); });
    if (pager) pager.hidden = !paged;
    // The wheel mechanic is desktop-only. On touch there is no wheel to lean
    // against and no hover to discover the affordance with, so the pager is
    // the whole interface.
    if (!paged && !wheelBound) {
      frame.addEventListener('wheel', onWheel, { passive: false });
      wheelBound = true;
    } else if (paged && wheelBound) {
      frame.removeEventListener('wheel', onWheel, { passive: false });
      wheelBound = false;
    }
    measure();
    index = Math.min(index, maxIndex());
    render(false);
    paintPager();
    // Once, not on every enable(): sync() runs on each resize, so re-adding
    // here accumulated handlers and the arrow keys started double-stepping.
    if (!keysBound) { frame.addEventListener('keydown', onKey); keysBound = true; }
    // Bringing an off-window entry into focus by any other route pulls it in.
    frame.addEventListener('focusin', function (e) {
      var i = items.indexOf(e.target.closest('.news-timeline__item'));
      if (i < 0) return;
      if (i < index) { index = i; render(true); }
      else if (i >= index + WINDOW) { index = Math.min(maxIndex(), i - WINDOW + 1); render(true); }
    });
  }

  function disable() {
    frame.classList.remove('is-live');
    frame.removeAttribute('style');
    if (pager) pager.hidden = true;
    index = 0;
    list.style.transform = '';
    list.style.transition = '';
    items.forEach(function (el) {
      el.classList.remove('is-offstage');
      el.querySelectorAll('a').forEach(function (a) { a.removeAttribute('tabindex'); });
    });
  }

  function sync() {
    // Reduced motion: no carousel at all, just the most recent entries.
    // Coarse pointer: the window stays, paged with buttons instead of the wheel.
    if (reduced.matches) disable();
    else enable(coarse.matches);
  }

  // Re-run the whole decision on resize, not just re-measure. Dragging a window
  // across the breakpoint used to leave the carousel in whichever state it
  // happened to start in, because only the media-query `change` events were
  // wired and those do not always fire under devtools emulation.
  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(sync, 150);
  });

  reduced.addEventListener('change', sync);
  coarse.addEventListener('change', sync);
  sync();
})();
