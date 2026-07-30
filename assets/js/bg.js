/* Ambient background. One piece ships: SKETCH — pencil wireframes that
 * resolve into UI where the pointer passes, with the fluid-glass optics for
 * the cards layered in. The exploration alternatives (isobars, marginalia,
 * streamlines) were removed once the choice settled; they live in git
 * history, reachable with `git log -- assets/js/bg.js`.
 */
var ART = (document.getElementById('bg') || {}).dataset
        ? (document.getElementById('bg').dataset.art || 'sketch') : 'sketch';

/* =====================================================================
 * 4 — SKETCH.  Language: the owner's own research.
 *
 * A wall of pencil wireframes is pinned across the viewport. Where the
 * pointer passes, the nearest mockups RESOLVE — wobbly pencil boxes ease
 * into crisp components: a nav bar, inputs with a blinking caret, a bar
 * chart, toggles, buttons — each part arriving in reading order. Walk
 * away and they relax back into sketch.
 *
 * This is sketch-to-UI, which is literally what he researches. No caption
 * needed. It is local and slightly organic (every mockup has its own seed
 * and cascade), but it REVEALS no ink: the sketches are already there at
 * full extent, only their state changes — and the static column mask still
 * keeps the reading measure quiet.
 *
 * Cost model: the pencil jitter is seeded, not animated, so a settled
 * frame is a still image. The loop runs only while some mockup is easing
 * (or a caret is blinking just after a move) and then STOPS — parked
 * cursor means genuinely zero CPU, not "cheap".
 * ===================================================================== */
(function () {
  if (ART !== 'sketch') return;
  var canvas = document.getElementById('bg');
  if (!canvas) return;
  /* Same capability question as everywhere else: is ANY fine pointer
     available? Without one there is nothing to resolve, so nothing runs. */
  if (window.matchMedia('not ((any-hover: hover) and (any-pointer: fine))').matches) return;

  var ctx = canvas.getContext('2d');
  if (!ctx.roundRect) {                       /* tiny fallback for old engines */
    ctx.roundRect = function (x, y, w, h) { this.rect(x, y, w, h); };
  }

  var W = 0, H = 0, DPR = 1;
  var frames = [];
  var ptr = { x: -1e4, y: -1e4, on: false };
  var rafId = 0, lastMove = 0, blinking = false, lastT = 0;
  /* The wall is a vertically tiling pattern (period P) drawn at a parallax
     fraction of the page scroll — pinned-to-glass read as a sticker, and the
     mockups you resolved scrolled away for good. Wrapping brings them back. */
  var SCROLL_FAC = 0.35, P = 0, STRIDE = 0;
  /* Spontaneous life: every few seconds one mockup part-resolves on its own
     and relaxes again, so the wall is generative even with the mouse parked.
     Woken by a timer, so between events the loop still stops completely. */
  var autos = [], autoTimer = 0;
  var INK = [25, 28, 32], ACC = [53, 126, 221];
  var RADIUS = 300;

  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqSlow = window.matchMedia('(update: slow), (update: none)');
  function reduced() { return mqReduce.matches || mqSlow.matches; }
  function hidden() { return getComputedStyle(canvas).display === 'none'; }

  /* Deterministic noise: pencil strokes must not shimmer between frames. */
  function h1(n) { var s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); }
  function h2(n) { return h1(n) * 2 - 1; }
  function mul32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function readTokens() {
    var cs = getComputedStyle(document.documentElement);
    var i = cs.getPropertyValue('--art-ink-rgb').trim().split(/[\s,]+/).map(Number);
    var a = cs.getPropertyValue('--art-accent-rgb').trim().split(/[\s,]+/).map(Number);
    if (i.length === 3 && !i.some(isNaN)) INK = i;
    if (a.length === 3 && !a.some(isNaN)) ACC = a;
  }
  function ink(al) { return 'rgba(' + INK[0] + ',' + INK[1] + ',' + INK[2] + ',' + al + ')'; }
  function acc(al) { return 'rgba(' + ACC[0] + ',' + ACC[1] + ',' + ACC[2] + ',' + al + ')'; }
  function acc2() { return 'rgb(' + ACC[0] + ',' + ACC[1] + ',' + ACC[2] + ')'; }

  /* ---- the mockup templates: each is a small screen with real parts --- */
  var TEMPLATES = [
    function (w, h, parts) {                                     /* feed */
      parts.push({ k: 'bar', x: .06, y: .05, w: .88, h: .055, d: 0 });
      parts.push({ k: 'img', x: .06, y: .14, w: .88, h: .26, d: .10 });
      parts.push({ k: 'text', x: .06, y: .45, w: .88, h: .10, n: 3, d: .22 });
      parts.push({ k: 'card', x: .06, y: .60, w: .41, h: .20, d: .34 });
      parts.push({ k: 'card', x: .53, y: .60, w: .41, h: .20, d: .40 });
      parts.push({ k: 'btn', x: .06, y: .855, w: .34, h: .075, d: .55 });
    },
    function (w, h, parts) {                                     /* form */
      parts.push({ k: 'bar', x: .06, y: .05, w: .88, h: .055, d: 0 });
      parts.push({ k: 'text', x: .06, y: .15, w: .40, h: .035, n: 1, d: .10 });
      parts.push({ k: 'in', x: .06, y: .20, w: .88, h: .075, d: .16 });
      parts.push({ k: 'text', x: .06, y: .31, w: .34, h: .035, n: 1, d: .24 });
      parts.push({ k: 'in', x: .06, y: .36, w: .88, h: .075, d: .30 });
      parts.push({ k: 'text', x: .06, y: .47, w: .46, h: .035, n: 1, d: .38 });
      parts.push({ k: 'in', x: .06, y: .52, w: .88, h: .075, d: .44 });
      parts.push({ k: 'tog', x: .06, y: .65, w: .20, h: .055, d: .54 });
      parts.push({ k: 'btn', x: .06, y: .855, w: .40, h: .075, d: .62 });
    },
    function (w, h, parts) {                                     /* dashboard */
      parts.push({ k: 'bar', x: .06, y: .05, w: .88, h: .055, d: 0 });
      parts.push({ k: 'chart', x: .06, y: .14, w: .88, h: .32, d: .12 });
      parts.push({ k: 'card', x: .06, y: .52, w: .26, h: .16, d: .28 });
      parts.push({ k: 'card', x: .37, y: .52, w: .26, h: .16, d: .34 });
      parts.push({ k: 'card', x: .68, y: .52, w: .26, h: .16, d: .40 });
      parts.push({ k: 'text', x: .06, y: .74, w: .88, h: .10, n: 3, d: .50 });
    },
    function (w, h, parts) {                                     /* list */
      parts.push({ k: 'bar', x: .06, y: .05, w: .88, h: .055, d: 0 });
      parts.push({ k: 'in', x: .06, y: .14, w: .88, h: .065, d: .10 });
      for (var i = 0; i < 4; i++) {
        parts.push({ k: 'row', x: .06, y: .24 + i * .145, w: .88, h: .115, d: .18 + i * .09 });
      }
      parts.push({ k: 'btn', x: .60, y: .855, w: .34, h: .075, d: .60 });
    }
  ];

  function buildLayout() {
    frames = [];
    var rnd = mul32(20260731);
    var fw = W < 620 ? 200 : 268;
    var fh = Math.round(fw * 1.38);
    var gapX = W < 620 ? 40 : 96, gapY = 104;
    var cols = Math.ceil((W + gapX) / (fw + gapX)) + 1;
    var rows = Math.ceil((H + 2 * (fh + gapY)) / (fh + gapY));
    STRIDE = fh + gapY;
    P = rows * STRIDE;
    var ox = (W - (cols * (fw + gapX) - gapX)) / 2;
    var id = 0;
    for (var c = 0; c < cols; c++) {
      var stagger = (rnd() - .5) * fh * 0.55;
      for (var r = 0; r < rows; r++) {
        var x = ox + c * (fw + gapX) + (rnd() - .5) * 10;
        var y = r * STRIDE + stagger + (rnd() - .5) * 10;
        var parts = [];
        TEMPLATES[Math.floor(rnd() * TEMPLATES.length)](fw, fh, parts);
        frames.push({ x: x, y: y, w: fw, h: fh, parts: parts, r: 0, t: 0, seed: id * 97.31 });
        id++;
      }
    }
  }

  /* ---- pencil: rough.js-style strokes, jitter seeded not animated ----- */
  function pLine(x1, y1, x2, y2, s, jit, over) {
    var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    var o1 = over * (0.4 + h1(s) * 0.8), o2 = over * (0.4 + h1(s + 7) * 0.8);
    var sx = x1 - ux * o1, sy = y1 - uy * o1, ex = x2 + ux * o2, ey = y2 + uy * o2;
    var nx = -uy, ny = ux;
    var m1 = h2(s + 1) * jit, m2 = h2(s + 2) * jit;
    ctx.moveTo(sx + nx * h2(s + 3) * jit * .4, sy + ny * h2(s + 3) * jit * .4);
    ctx.bezierCurveTo(sx + dx * .33 + nx * m1, sy + dy * .33 + ny * m1,
      sx + dx * .66 + nx * m2, sy + dy * .66 + ny * m2, ex, ey);
  }
  function pRect(x, y, w, h, s, jit, over, passes) {
    ctx.beginPath();
    for (var p = 0; p < passes; p++) {
      var q = s + p * 13.7;
      pLine(x, y, x + w, y, q, jit, over);
      pLine(x + w, y, x + w, y + h, q + 1.1, jit, over);
      pLine(x + w, y + h, x, y + h, q + 2.2, jit, over);
      pLine(x, y + h, x, y, q + 3.3, jit, over);
    }
    ctx.stroke();
  }
  function pHatch(x, y, w, h, s, jit, step) {
    ctx.beginPath();
    for (var d = -h; d < w; d += step) {
      var x1 = x + d, y1 = y + h, x2 = x + d + h, y2 = y;
      var cx1 = Math.max(x, x1), cx2 = Math.min(x + w, x2);
      if (cx2 <= cx1) continue;
      var t1 = (cx1 - x1) / (x2 - x1), t2 = (cx2 - x1) / (x2 - x1);
      pLine(cx1, y1 + (y2 - y1) * t1, cx2, y1 + (y2 - y1) * t2, s + d, jit * .6, 1.5);
    }
    ctx.stroke();
  }

  function smoothstep(e0, e1, x) { var t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); }

  /* ---- one part, cross-faded from sketch (r=0) to component (r=1) ----- */
  function drawPart(f, p, r) {
    var x = f.x + p.x * f.w, y = f.sy + p.y * f.h, w = p.w * f.w, h = p.h * f.h;
    var s = f.seed + p.x * 31.7 + p.y * 57.3;
    var jit = (1 - r) * 2.6 + 0.15, over = (1 - r) * 5.0;

    if (r < 0.985) {
      ctx.strokeStyle = ink((1 - r) * 0.21);
      ctx.lineWidth = 1;
      if (p.k === 'text') {
        var n = p.n || 3;
        ctx.beginPath();
        for (var i = 0; i < n; i++) {
          var ly = y + (n === 1 ? h / 2 : h * (i + .5) / n);
          var lw = w * (i === n - 1 ? 0.55 : (0.82 + h1(s + i) * 0.18));
          pLine(x, ly, x + lw, ly, s + i * 5.1, jit * .8, over * .5);
        }
        ctx.stroke();
      } else {
        pRect(x, y, w, h, s, jit, over, r < 0.5 ? 2 : 1);
        if (p.k === 'img' || p.k === 'chart') {
          ctx.strokeStyle = ink((1 - r) * 0.11);
          pHatch(x + 2, y + 2, w - 4, h - 4, s + 3, jit, 11);
        }
      }
    }

    if (r > 0.015) {
      var a = r;
      ctx.lineWidth = 1;
      ctx.strokeStyle = ink(0.24 * a);
      ctx.fillStyle = ink(0.035 * a);
      var rr = Math.min(5, h / 2);
      if (p.k === 'text') {
        var n2 = p.n || 3;
        ctx.fillStyle = ink(0.20 * a);
        for (var j = 0; j < n2; j++) {
          var ly2 = y + (n2 === 1 ? h / 2 - 1.5 : h * (j + .35) / n2);
          var lw2 = w * (j === n2 - 1 ? 0.55 : (0.82 + h1(s + j) * 0.18));
          ctx.fillRect(x, ly2, lw2 * a, 2.5);
        }
      } else if (p.k === 'btn') {
        ctx.fillStyle = acc(0.15 * a); ctx.strokeStyle = acc(0.30 * a);
        ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = acc(0.40 * a);
        ctx.fillRect(x + w * .28, y + h / 2 - 1.25, w * .44, 2.5);
      } else if (p.k === 'in') {
        ctx.beginPath(); ctx.roundRect(x, y, w, h, rr); ctx.fill(); ctx.stroke();
        ctx.fillStyle = acc(0.62 * a * (blinking ? 0.55 + 0.45 * Math.sin(f.t * 4) : 1));
        ctx.fillRect(x + 8, y + h * .25, 1.5, h * .5);      /* caret: it is live */
        ctx.fillStyle = ink(0.20 * a);
        ctx.fillRect(x + 14, y + h / 2 - 1, w * .34, 2);
      } else if (p.k === 'tog') {
        ctx.fillStyle = acc(0.16 * a); ctx.strokeStyle = acc(0.30 * a);
        ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = acc(0.45 * a);
        ctx.beginPath(); ctx.arc(x + w - h / 2, y + h / 2, h / 2 - 2.5, 0, 6.2832); ctx.fill();
      } else if (p.k === 'bar') {
        ctx.fillStyle = ink(0.055 * a); ctx.strokeStyle = ink(0.20 * a);
        ctx.beginPath(); ctx.roundRect(x, y, w, h, rr); ctx.fill(); ctx.stroke();
        ctx.fillStyle = ink(0.28 * a);
        for (var d3 = 0; d3 < 3; d3++) ctx.fillRect(x + w - 10 - d3 * 6, y + h / 2 - 1, 3.5, 2);
        ctx.fillRect(x + 8, y + h / 2 - 1.5, w * .30, 3);
      } else if (p.k === 'chart') {
        ctx.beginPath(); ctx.roundRect(x, y, w, h, rr); ctx.fill(); ctx.stroke();
        var bars = 7, bw = (w - 20) / bars;
        for (var b = 0; b < bars; b++) {
          var bh = (h - 18) * (0.25 + h1(s + b * 3.1) * 0.75) * a;
          ctx.fillStyle = acc(0.22 * a);
          ctx.fillRect(x + 10 + b * bw, y + h - 9 - bh, bw * 0.6, bh);
        }
      } else if (p.k === 'row') {
        ctx.beginPath(); ctx.roundRect(x, y, w, h, rr); ctx.fill(); ctx.stroke();
        ctx.fillStyle = ink(0.16 * a);
        ctx.beginPath(); ctx.arc(x + h / 2, y + h / 2, h * 0.28, 0, 6.2832); ctx.fill();
        ctx.fillStyle = ink(0.22 * a);
        ctx.fillRect(x + h + 2, y + h * .30, w * .42, 2.5);
        ctx.fillStyle = ink(0.13 * a);
        ctx.fillRect(x + h + 2, y + h * .58, w * .60, 2.5);
      } else {                                            /* card / img */
        ctx.beginPath(); ctx.roundRect(x, y, w, h, rr); ctx.fill(); ctx.stroke();
        if (p.k === 'img') {
          ctx.strokeStyle = ink(0.18 * a);
          ctx.beginPath();
          ctx.moveTo(x + 6, y + h - 6); ctx.lineTo(x + w * .42, y + h * .42); ctx.lineTo(x + w * .62, y + h - 6);
          ctx.moveTo(x + w * .52, y + h - 6); ctx.lineTo(x + w * .74, y + h * .55); ctx.lineTo(x + w - 6, y + h - 6);
          ctx.stroke();
          ctx.fillStyle = ink(0.16 * a);
          ctx.beginPath(); ctx.arc(x + w * .78, y + h * .26, h * 0.08, 0, 6.2832); ctx.fill();
        } else {
          ctx.fillStyle = ink(0.13 * a);
          ctx.fillRect(x + 7, y + h * .30, w * .62, 2.5);
          ctx.fillRect(x + 7, y + h * .52, w * .40, 2.5);
        }
      }
    }
  }

  function drawFrame(f) {
    var r = f.r;
    if (r < 0.985) {
      ctx.strokeStyle = ink((1 - r) * 0.14); ctx.lineWidth = 1;
      pRect(f.x, f.sy, f.w, f.h, f.seed, (1 - r) * 3.0 + 0.2, (1 - r) * 7, 1);
    }
    if (r > 0.015) {
      ctx.strokeStyle = ink(0.16 * r); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(f.x, f.sy, f.w, f.h, 8); ctx.stroke();
    }
    for (var i = 0; i < f.parts.length; i++) {
      var p = f.parts[i];
      drawPart(f, p, smoothstep(p.d, p.d + 0.42, r));   /* reading order */
    }
  }

  function layoutPositions() {
    var off = reduced() ? 0 : (window.scrollY || 0) * SCROLL_FAC;
    for (var i = 0; i < frames.length; i++) {
      var f = frames[i];
      f.sy = ((f.y - off) % P + P) % P - STRIDE;
    }
  }

  function targetFor(f) {
    if (!ptr.on) return 0;
    var cx = Math.max(f.x, Math.min(ptr.x, f.x + f.w));
    var cy = Math.max(f.sy, Math.min(ptr.y, f.sy + f.h));
    return smoothstep(RADIUS, RADIUS * 0.18, Math.hypot(ptr.x - cx, ptr.y - cy));
  }

  /* Column attenuation, painted into the pixels. Mirrors the retired CSS
     mask (full ink beyond 560px from centre, 30% across the reading column)
     but lives IN the scene: the fluid displaces attenuated content instead
     of sliding underneath a frozen screen-space alpha ramp. */
  var colGrad = null;
  function buildColGrad() {
    var c = W / 2, inn = 430, out = 560, erase = 1 - 0.30;
    colGrad = ctx.createLinearGradient(0, 0, W, 0);
    function st(px, a) { colGrad.addColorStop(Math.min(1, Math.max(0, px / W)), 'rgba(0,0,0,' + a + ')'); }
    st(0, 0); st(c - out, 0); st(c - inn, erase); st(c + inn, erase); st(c + out, 0); st(W, 0);
  }

  function render() {
    layoutPositions();
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < frames.length; i++) {
      var f = frames[i];
      if (f.sy > H + 40 || f.sy + f.h < -40) continue;
      drawFrame(f);
    }
    if (!colGrad) buildColGrad();
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = colGrad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    /* THE GLASS IS THE LENS — permanently, not only under the pointer. For
       every glass element on screen, the scene behind its rounded rect is
       redrawn through a magnifying transform centred on the element: thick
       glass, always bending what passes behind it. Hover deepens the optic
       and the damping animates the change. True vector re-rendering, so it
       is crisp and identical in every browser — the background is ours. */
    return drawGlassLenses();
  }

  var GLASS_SEL = '.cover, #masthead nav > a, #everything-else > a, .social-link, .theme-toggle, .news-pager__btn';
  var glassEls = [];
  function scanGlass() {
    glassEls = Array.prototype.slice.call(document.querySelectorAll(GLASS_SEL));
  }


  /* Flat-scene snapshot for the fluid pass: reading and writing the same
     canvas region in one drawImage is undefined, the copy makes it exact. */
  var snapC = document.createElement('canvas'), snapX = snapC.getContext('2d');

  function paintScene() {
    for (var j = 0; j < frames.length; j++) {
      var f2 = frames[j];
      if (f2.sy > H + 60 || f2.sy + f2.h < -60) continue;
      drawFrame(f2);
    }
  }

  function drawGlassLenses() {
    var busy = false;
    var snapReady = false;
    for (var g = 0; g < glassEls.length; g++) {
      var el = glassEls[g];
      var rc = el.getBoundingClientRect();
      if (rc.bottom < 0 || rc.top > H || rc.right < 0 || rc.left > W || !rc.width) {
        el.__lensM = undefined;
        continue;
      }
      var isCard = el.classList.contains('cover');
      /* Strength eases 0→1 on entry and back on exit. */
      var target = el.matches(':hover') ? 1 : 0;
      if (el.__s === undefined) el.__s = 0;
      el.__s += (target - el.__s) * 0.14;
      if (Math.abs(target - el.__s) > 0.004) busy = true;
      else el.__s = target;
      if (el.__s === 0) { el.__lx = undefined; continue; }   /* flat: no cost */
      if (target === 1) busy = true;                          /* it breathes */

      /* THE COMPOSITE LENS. The circle stays — it is the body of the optic —
         and the depth comes from additive layers inside it:
           1. the bulk: the scene re-rendered through magnification, with a
              slow liquid twist that breathes;
           2. the flank: an annulus at the rim drawn COMPRESSED and
              counter-twisted, the way the side of a real lens squeezes what
              passes through it — it also swallows the doubling where the
              magnified interior used to butt against the flat exterior;
           3. the fringe: two hairline arcs, accent inside and ink outside,
              faint chromatic disagreement at the boundary.
         All vector re-rendering — nothing is sampled, so nothing doubles
         inside — and all clipped to card ∩ circle. */
      if (el.__lx === undefined) { el.__lx = ptr.x; el.__ly = ptr.y; }
      el.__lx += (ptr.x - el.__lx) * 0.30;
      el.__ly += (ptr.y - el.__ly) * 0.30;
      if (el.__seed === undefined) el.__seed = (g * 0.77) % 6.2832;
      var lt = performance.now() * 0.0011 + el.__seed;

      /* THE FLUID IN THE GLASS. The card is a vessel, full. The pointer does
         not carry a lens around: it STIRS. Ripples radiate from wherever the
         hand moves, cross the entire pane, and fade with viscosity; the whole
         body of fluid leans gently toward the stir point. Stirring harder
         (faster pointer) puts more energy in; stillness lets it settle to a
         faint idle shimmer. The whole interior is replaced every frame —
         sampled from the flat scene cell by cell through the fluid's local
         displacement — so nothing static ever shows beneath the optic, and
         the only boundary is the card's own edge, which is exactly where a
         pane of glass ends. */
      var s2 = el.__s;
      var rad = isCard ? 16 : Math.min(rc.width, rc.height) / 2;

      /* stirring energy: fed by pointer speed, drained by viscosity */
      if (el.__pxp === undefined) { el.__pxp = ptr.x; el.__pyp = ptr.y; el.__E = 0; }
      var vx = ptr.x - el.__pxp, vy = ptr.y - el.__pyp;
      el.__pxp = ptr.x; el.__pyp = ptr.y;
      el.__E = Math.min(6, (el.__E || 0) * 0.94 + Math.hypot(vx, vy) * 0.07);
      /* the flow: a slow-memory vector of where you are stirring toward —
         the fluid is dragged along it and relaxes viscously */
      if (el.__fx === undefined) { el.__fx = 0; el.__fy = 0; }
      el.__fx += (vx - el.__fx) * 0.05;
      el.__fy += (vy - el.__fy) * 0.05;
      if (el.__E > 0.03 || Math.abs(el.__fx) > 0.05 || Math.abs(el.__fy) > 0.05) busy = true;

      if (!snapReady) {
        snapC.width = canvas.width; snapC.height = canvas.height;
        snapX.drawImage(canvas, 0, 0);
        snapReady = true;
      }

      /* THE PANE HAS AN UNEVEN THICKNESS. A scalar field Φ — five broad
         lobes on incommensurable directions and wavelengths (240-400px, far
         too low-frequency to read as waves), drifting slowly, their phases
         advected by the stirring flow — plus one wide bump that trails the
         pointer. The distortion is ∇Φ: refraction through irregular glass,
         which is the physics, and it has no circles and no ripples in it.
         Magnification is strongest on the bump (semi-global: the whole pane
         is optically alive, the hand only biases where the glass is thick). */
      if (!el.__cmp) {
        el.__cmp = [];
        for (var ci = 0; ci < 5; ci++) {
          var th = h1(el.__seed + ci * 7.3) * 6.2832;
          var wl = 240 + h1(el.__seed + ci * 3.1) * 160;   /* 240..400px */
          el.__cmp.push({
            kx: Math.cos(th) * 6.2832 / wl,
            ky: Math.sin(th) * 6.2832 / wl,
            A: 0.16 + h1(el.__seed + ci * 11.7) * 0.08,
            p0: h1(el.__seed + ci * 5.9) * 6.2832,
            w: 0.25 + h1(el.__seed + ci * 2.3) * 0.35
          });
        }
      }
      var GAIN = 520 * s2 * (1 + 0.35 * el.__E); /* field-to-pixels          */
      var SIG = (isCard ? 130 : 55);             /* bump breadth             */
      var SIG2 = 2 * SIG * SIG;
      var MBODY = (isCard ? 0.05 : 0.035) * s2;  /* everywhere               */
      var MBUMP = (isCard ? 0.11 : 0.07) * s2;   /* extra on the bump        */
      var EDGE = isCard ? 30 : 12;               /* wall-pinning margin, px  */
      var STRIP = 8, BANDS = isCard ? 8 : 2;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(rc.left, rc.top, rc.width, rc.height, rad);
      ctx.clip();
      /* THE line. The canvas is ink on TRANSPARENCY, and drawImage composites
         source-over: wherever the displaced sample is transparent, the flat
         scene underneath survived — the static layer under the distortion,
         reported three times and misdiagnosed twice. The pane must be emptied
         before the fluid repaints it. */
      ctx.clearRect(rc.left, rc.top, rc.width, rc.height);
      var bandH = rc.height / BANDS;
      for (var b2 = 0; b2 < BANDS; b2++) {
        var by2 = rc.top + b2 * bandH;
        var cyb = by2 + bandH / 2;
        for (var sx0 = rc.left; sx0 < rc.right; sx0 += STRIP) {
          var w2 = Math.min(STRIP, rc.right - sx0);
          var cxb = sx0 + w2 / 2;
          var ddx = cxb - el.__lx, ddy = cyb - el.__ly;
          var dist = Math.hypot(ddx, ddy) || 1;
          /* radial ripple from the stir point, everywhere in the pane */
          /* THE PIN AT THE WALLS — the fix for the "two sheets" feel: every
             optical quantity fades to zero at the card border, so each line
             inside stays CONNECTED to its continuation outside. Nothing
             tears at the edge; the warp lives entirely within the pane, the
             way waves die at the rim of a dish. */
          var de = Math.min(cxb - rc.left, rc.right - cxb, cyb - rc.top, rc.bottom - cyb);
          var env = Math.min(1, Math.max(0, de / EDGE));
          env = env * env * (3 - 2 * env);

          /* Φ and ∇Φ, analytically, plus the trailing bump */
          var Phi = 0, gx2 = 0, gy2 = 0;
          for (var ci2 = 0; ci2 < 5; ci2++) {
            var c2 = el.__cmp[ci2];
            var arg = c2.kx * cxb + c2.ky * cyb + c2.p0 + lt * c2.w
                    + (el.__fx * c2.kx + el.__fy * c2.ky) * 9;
            var sv = Math.sin(arg), cv = Math.cos(arg);
            Phi += c2.A * sv;
            gx2 += c2.A * cv * c2.kx;
            gy2 += c2.A * cv * c2.ky;
          }
          var bump = Math.exp(-(dist * dist) / SIG2);
          gx2 += -(ddx / (SIG2 * 0.5)) * bump * 0.35;
          gy2 += -(ddy / (SIG2 * 0.5)) * bump * 0.35;

          var dxs = (GAIN * gx2 + el.__fx * 0.5) * env;
          var dys = (GAIN * gy2 + el.__fy * 0.5) * env;
          /* thick where Φ is high and on the bump: that is where it magnifies */
          var mL = 1 + (MBODY * (0.5 + 0.5 * (Phi + 1) * 0.5) + MBUMP * bump) * env;
          var sxr = el.__lx + (sx0 - el.__lx) / mL - dxs;
          var syr = el.__ly + (by2 - el.__ly) / mL - dys;
          ctx.drawImage(snapC,
            sxr * DPR, syr * DPR, (w2 / mL) * DPR, (bandH / mL) * DPR,
            sx0, by2, w2, bandH);
        }
      }
      ctx.restore();
    }
    return busy;
  }

  function tick(now) {
    rafId = 0;
    blinking = (performance.now() - lastMove) < 2500;
    var dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0.016; lastT = now;
    layoutPositions();

    /* Autonomous events: a bell of resolution, up and back down. */
    var autoT = {};
    for (var a = autos.length - 1; a >= 0; a--) {
      var ev = autos[a], pr = (now - ev.t0) / ev.dur;
      if (pr >= 1) { autos.splice(a, 1); continue; }
      autoT[ev.i] = Math.max(autoT[ev.i] || 0, Math.sin(Math.PI * pr) * 0.55);
    }

    var busy = autos.length > 0;
    for (var i = 0; i < frames.length; i++) {
      var f = frames[i], tg = Math.max(targetFor(f), autoT[i] || 0);
      f.r += (tg - f.r) * Math.min(1, dt * 9);
      if (Math.abs(tg - f.r) > 0.0025) busy = true;
      else f.r = tg;
      if (f.r > 0.985 && blinking) { f.t += dt; busy = true; }
    }
    if (render()) busy = true;
    if (busy && !reduced()) schedule();
    else lastT = 0;                                     /* settled: 0% CPU */
  }

  function armAuto() {
    clearTimeout(autoTimer);
    autoTimer = setTimeout(function () {
      if (!reduced() && !document.hidden && !hidden() && frames.length) {
        layoutPositions();
        var vis = [];
        for (var i = 0; i < frames.length; i++) {
          if (frames[i].sy > -40 && frames[i].sy + frames[i].h < H + 40) vis.push(i);
        }
        if (vis.length) {
          autos.push({ i: vis[Math.floor(Math.random() * vis.length)],
                       t0: performance.now(), dur: 2600 + Math.random() * 1800 });
          schedule();
        }
      }
      armAuto();
    }, 5000 + Math.random() * 6000);
  }
  function schedule() { if (!rafId && !document.hidden && !hidden()) rafId = requestAnimationFrame(tick); }

  /* Reduced motion: a fixed, deliberate composition — top-left resolved,
     the rest still pencil. Not a blank canvas, not a stopped animation. */
  function renderStatic() {
    layoutPositions();
    for (var i = 0; i < frames.length; i++) {
      var f = frames[i];
      var d = Math.hypot((f.x + f.w / 2) - W * 0.16, (f.sy + f.h / 2) - H * 0.30);
      f.r = smoothstep(Math.max(W, H) * 0.42, 60, d);
      f.t = 0.4;
    }
    render();
  }

  function resize() {
    if (hidden()) { if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } return; }
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    readTokens(); buildLayout();
    colGrad = null;                       /* width changed: rebuild the ramp */
    if (reduced()) renderStatic(); else { render(); schedule(); }
  }

  window.addEventListener('pointermove', function (e) {
    if (reduced()) return;
    ptr.x = e.clientX; ptr.y = e.clientY; ptr.on = true; lastMove = performance.now(); schedule();
  }, { passive: true });
  document.addEventListener('pointerleave', function () { ptr.on = false; schedule(); });
  window.addEventListener('blur', function () { ptr.on = false; schedule(); });
  /* One frame per scroll event: the wall drifts at SCROLL_FAC of the page,
     wrapping on its period, and the loop still stops when the page does. */
  window.addEventListener('scroll', function () { if (!reduced()) schedule(); }, { passive: true });

  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 150); });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } }
    else if (!reduced()) { lastT = 0; schedule(); }
  });
  mqReduce.addEventListener('change', resize);

  /* The site's theme toggle rewrites data-theme; the ink must follow. */
  new MutationObserver(function () {
    readTokens();
    if (reduced()) renderStatic(); else { render(); schedule(); }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  window.__bgPoke = function () { render(); schedule(); };

  resize();
  scanGlass();
  window.addEventListener('resize', function () { setTimeout(scanGlass, 200); });
  armAuto();
})();
