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

  /* The wireframes no longer answer the pointer. Each one resolves on its
     own, on its own schedule — see armAuto(). Hover-driven resolution made
     the wall feel like a cursor toy; cycling on its own makes it a place
     where interfaces are being drawn while you happen to be looking. */

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
    /* Snapshot BEFORE the column is quieted. Behind a glass pane the sketch
       is at full strength — the pane's own tint is what protects the text
       there, so attenuating underneath as well left the lens with almost
       nothing to bend (measured: alpha 0.61/255 under a card). */
    if (flowEnergy > 0.012) {
      if (snapC.width !== canvas.width || snapC.height !== canvas.height) {
        snapC.width = canvas.width; snapC.height = canvas.height;
      }
      snapX.clearRect(0, 0, snapC.width, snapC.height);
      snapX.drawImage(canvas, 0, 0);
      snapFresh = true;
    } else snapFresh = false;

    if (!colGrad) buildColGrad();
    ctx.save();
    /* The column is quieted EXCEPT under the glass panes, punched out as
       even-odd holes. Under a pane the sketch stays at full strength — which
       is also exactly what the warp samples, so a warped patch and the flat
       scene around it can never disagree in brightness. That mismatch, plus
       the warp covering only part of a pane, was the "static UI underneath". */
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    for (var gi = 0; gi < glassEls.length; gi++) {
      var gr = glassEls[gi].getBoundingClientRect();
      if (!gr.width || gr.bottom < 0 || gr.top > H) continue;
      var grad2 = glassEls[gi].classList.contains('cover') ? 16 : Math.min(gr.width, gr.height) / 2;
      ctx.roundRect(gr.left, gr.top, gr.width, gr.height, grad2);
    }
    ctx.clip('evenodd');
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
  var snapFresh = false;

  function paintScene() {
    for (var j = 0; j < frames.length; j++) {
      var f2 = frames[j];
      if (f2.sy > H + 60 || f2.sy + f2.h < -60) continue;
      drawFrame(f2);
    }
  }

  /* ======================================================================
   * FLOWMAP — the mechanism behind DeepSeek's liquid lens, ported to 2D.
   *
   * The distortion is NOT computed from where the pointer is. It is painted
   * into a coarse screen-space field that PERSISTS and decays, so the medium
   * remembers where the hand has been. That memory is the whole difference
   * between "a shape following the cursor" and a wake in liquid.
   *
   *   R  = influence   how disturbed this patch of the field is
   *   VX,VY = the direction the hand was travelling when it passed
   *
   * Every frame the field is scaled by DECAY (0.925 at 30fps ≈ a half-life of
   * a third of a second) and the brush stamps a gaussian at the smoothed
   * pointer. Written with max(), not +=, so repeated passes never blow out —
   * a high-water mark that then evaporates.
   * ====================================================================== */
  var FLOW_CELL = 24;                 /* px per field cell                   */
  var FLOW_DECAY = 0.938;             /* ~0.36s half-life: a thick wake       */
  var FLOW_RADIUS = 72;               /* brush radius, px                     */
  var FLOW_PRESENCE = 0.42;           /* just being there                    */
  var FLOW_VELBONUS = 1.1;            /* moving fast paints more             */
  /* Drag and swirl are PX AT FULL INFLUENCE, never geometric transforms.
     Swirl was an angle applied about the stir point, so displacement grew
     with distance from it: a pixel 200px away, at only 0.4 rad, moved 87px.
     Move fast, influence rises, the far field explodes — the breakage at
     speed. As bounded offsets along unit directions, the worst case is the
     sum of these three, whatever the pointer does. */
  var DISTORT = 11;                   /* px dragged along the remembered flow */
  var SWIRL_PX = 0;                   /* px of tangential shear (the vortex)  */
  /* The lens is a SCALE with a profile, not a pull in px. A displacement
     proportional to influence peaks where influence peaks and collapses just
     outside it — that jump is what tears a line as it crosses. Here the core
     magnifies almost uniformly (a uniform scale does not deform a line at
     all, it only enlarges it) and eases to nothing at the rim, so the mapping
     stays monotone: the line stretches and springs back, it can never break.
     Radius is its own constant, independent of the brush. */
  var LENS_R = 135;                   /* px: how wide the dome is             */
  var LENS_MAG = 0.30;                /* peak magnification, 0.30 = +30%      */
  var fw = 0, fh = 0, fInf = null, fVx = null, fVy = null, fTmp = null, flowEnergy = 0;
  var DIFFUSE = 3;                    /* relaxation passes per frame          */

  /* Two-stage damping, DeepSeek's trick: velocity is read from the GAP
     between the raw pointer and its own smoothed follower, so inertia comes
     for free and no frame-delta timing is needed. */
  var mSm = { x: -1, y: -1, vx: 0, vy: 0 };

  function flowResize() {
    fw = Math.ceil(W / FLOW_CELL) + 1;
    fh = Math.ceil(H / FLOW_CELL) + 1;
    fInf = new Float32Array(fw * fh);
    fVx = new Float32Array(fw * fh);
    fVy = new Float32Array(fw * fh);
    fTmp = new Float32Array(fw * fh);
    flowEnergy = 0;
    mSm.x = -1;
  }

  function flowStep() {
    if (!fInf) return;
    if (mSm.x < 0 && ptr.on) { mSm.x = ptr.x; mSm.y = ptr.y; }
    if (ptr.on) {
      /* Tighter than DeepSeek's 0.10: their field fills the whole viewport,
         so a trailing brush reads as inertia. Ours is a small disturbance
         inside a card, where the same lag just reads as the effect being
         late. The brush now sits almost under the cursor.
         Velocity is still read from the gap between raw and smoothed
         pointer — but that gap is ~3x smaller now, so the factor is scaled
         up to keep the same sense of speed. */
      mSm.x += (ptr.x - mSm.x) * 0.60;
      mSm.y += (ptr.y - mSm.y) * 0.60;
      mSm.vx += ((ptr.x - mSm.x) * 3.2 - mSm.vx) * 0.40;
      mSm.vy += ((ptr.y - mSm.y) * 3.2 - mSm.vy) * 0.40;
    } else {
      mSm.vx *= 0.9; mSm.vy *= 0.9;
    }

    var speed = Math.hypot(mSm.vx, mSm.vy);
    var strength = FLOW_PRESENCE + Math.min(speed * 0.09, 0.7) * FLOW_VELBONUS;
    var nvx = speed > 0.001 ? mSm.vx / speed : 0;
    var nvy = speed > 0.001 ? mSm.vy / speed : 0;
    var r2 = FLOW_RADIUS * FLOW_RADIUS * 0.5;
    var reach = Math.ceil(FLOW_RADIUS * 1.6 / FLOW_CELL);
    var ci = Math.round(mSm.x / FLOW_CELL), cj = Math.round(mSm.y / FLOW_CELL);
    var peak = 0;

    for (var j = 0; j < fh; j++) {
      var rowNear = ptr.on && Math.abs(j - cj) <= reach;
      for (var i = 0; i < fw; i++) {
        var k = j * fw + i;
        var v = fInf[k] * FLOW_DECAY;
        fVx[k] *= FLOW_DECAY;
        fVy[k] *= FLOW_DECAY;
        if (rowNear && Math.abs(i - ci) <= reach) {
          var dx = i * FLOW_CELL - mSm.x, dy = j * FLOW_CELL - mSm.y;
          var infl = Math.exp(-(dx * dx + dy * dy) / r2) - 0.01;
          if (infl > 0) {
            var add = infl * strength;
            if (add > v) v = add;
            var blend = infl * Math.min(strength, 0.5) * 0.35;
            fVx[k] += (nvx - fVx[k]) * blend;
            fVy[k] += (nvy - fVy[k]) * blend;
          }
        }
        fInf[k] = v;
      }
    }

    for (var d = 0; d < DIFFUSE; d++) { relax(fInf); relax(fVx); relax(fVy); }

    for (var m2 = 0; m2 < fInf.length; m2++) if (fInf[m2] > peak) peak = fInf[m2];
    flowEnergy = peak;
  }

  /* Relaxation. A disturbance in water does not stay where it was put: it
     spreads and flattens. One separable 1-2-1 pass per call, run DIFFUSE
     times per frame. This is what makes the effect read as a wave rather
     than a stamp — wider and gentler WITHOUT touching the pointer tracking,
     so nothing lags behind the hand. */
  function relax(a) {
    var i, j, k;
    for (j = 0; j < fh; j++) {
      var row = j * fw;
      for (i = 0; i < fw; i++) {
        k = row + i;
        fTmp[k] = (a[i > 0 ? k - 1 : k] + 2 * a[k] + a[i < fw - 1 ? k + 1 : k]) * 0.25;
      }
    }
    for (j = 0; j < fh; j++) {
      var row2 = j * fw;
      for (i = 0; i < fw; i++) {
        k = row2 + i;
        a[k] = (fTmp[j > 0 ? k - fw : k] + 2 * fTmp[k] + fTmp[j < fh - 1 ? k + fw : k]) * 0.25;
      }
    }
  }

  /* Bilinear read. Returns influence in .i and the remembered direction. */
  var _fs = { i: 0, x: 0, y: 0 };
  function flowAt(px, py) {
    var gx = px / FLOW_CELL, gy = py / FLOW_CELL;
    var i0 = gx | 0, j0 = gy | 0;
    if (i0 < 0 || j0 < 0 || i0 >= fw - 1 || j0 >= fh - 1) { _fs.i = 0; _fs.x = 0; _fs.y = 0; return _fs; }
    var tx = gx - i0, ty = gy - j0;
    var a = j0 * fw + i0, b = a + 1, c = a + fw, d = c + 1;
    var w0 = (1 - tx) * (1 - ty), w1 = tx * (1 - ty), w2 = (1 - tx) * ty, w3 = tx * ty;
    _fs.i = fInf[a] * w0 + fInf[b] * w1 + fInf[c] * w2 + fInf[d] * w3;
    _fs.x = fVx[a] * w0 + fVx[b] * w1 + fVx[c] * w2 + fVx[d] * w3;
    _fs.y = fVy[a] * w0 + fVy[b] * w1 + fVy[c] * w2 + fVy[d] * w3;
    return _fs;
  }

  /* Scratch buffers for the warp. Sized to the disturbed box, reused. */
  var wsC = document.createElement('canvas'), wsX = wsC.getContext('2d', { willReadFrequently: true });
  var wdC = document.createElement('canvas'), wdX = wdC.getContext('2d');

  function drawGlassLenses() {
    if (!snapFresh || flowEnergy < 0.012) return false;

    /* The disturbed region. Outside it displacement is zero, so the flat
       scene already IS the right answer — the optimisation and the reason
       there is never a seam at the boundary of the worked area. */
    var THRESH = 0.012;
    var minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    for (var j = 0; j < fh; j++) {
      for (var i = 0; i < fw; i++) {
        if (fInf[j * fw + i] > THRESH) {
          var px0 = i * FLOW_CELL, py0 = j * FLOW_CELL;
          if (px0 < minX) minX = px0; if (px0 > maxX) maxX = px0;
          if (py0 < minY) minY = py0; if (py0 > maxY) maxY = py0;
        }
      }
    }
    if (maxX < minX) return false;
    minX -= FLOW_CELL; minY -= FLOW_CELL; maxX += FLOW_CELL * 2; maxY += FLOW_CELL * 2;

    var LAT = 8;                       /* displacement lattice spacing, px   */

    for (var g = 0; g < glassEls.length; g++) {
      var el = glassEls[g];
      var rc = el.getBoundingClientRect();
      if (!rc.width || rc.bottom < 0 || rc.top > H || rc.right < 0 || rc.left > W) continue;

      /* Does the field reach this pane at all? */
      if (rc.right < minX || rc.left > maxX || rc.bottom < minY || rc.top > maxY) continue;

      /* Warp the WHOLE pane, not just the disturbed part: a partial warp left
         the rest of the pane showing the untouched scene, which read as a
         second, static layer sitting under the moving one. Where the field is
         quiet the displacement is zero, so those pixels come through
         unchanged — one coherent image, always. */
      var ax = Math.max(rc.left, 0), ay = Math.max(rc.top, 0);
      var bx = Math.min(rc.right, W), by = Math.min(rc.bottom, H);
      var bw = Math.round(bx - ax), bh = Math.round(by - ay);
      if (bw < 4 || bh < 4) continue;
      ax = Math.round(ax); ay = Math.round(ay);

      var isCard = el.classList.contains('cover');
      var amp = isCard ? 1 : 0.5;      /* small chrome bends less            */

      /* --- source, resampled to CSS resolution, WITH A MARGIN ------------
         Near the rim the displacement pulls content from outside the pane. A
         source that stopped at the pane had no data there, so those pixels
         fell back to their undisplaced selves — a static band all round the
         edge exactly as wide as the displacement. The source therefore
         extends PAD px beyond the pane on every side; the output does not. */
      var PAD = Math.ceil(DISTORT * 1.6 + SWIRL_PX + LENS_R * LENS_MAG * 0.5) + 8;
      var sax = Math.max(ax - PAD, 0), say = Math.max(ay - PAD, 0);
      var sw = Math.round(Math.min(ax + bw + PAD, W) - sax);
      var sh = Math.round(Math.min(ay + bh + PAD, H) - say);
      var offX = ax - sax, offY = ay - say;      /* pane origin inside source */

      if (wsC.width !== sw || wsC.height !== sh) { wsC.width = sw; wsC.height = sh; }
      if (wdC.width !== bw || wdC.height !== bh) { wdC.width = bw; wdC.height = bh; }
      wsX.clearRect(0, 0, sw, sh);
      wsX.drawImage(snapC, sax * DPR, say * DPR, sw * DPR, sh * DPR, 0, 0, sw, sh);
      var src = wsX.getImageData(0, 0, sw, sh);
      var sd = src.data;
      var out = wdX.createImageData(bw, bh);
      var od = out.data;

      /* --- displacement on a coarse lattice ------------------------------
         Computed every LAT px and bilinearly interpolated per pixel, so the
         warp is CONTINUOUS by construction. The previous version resampled
         cell by cell, each with its own rigid offset, which tore the image
         at every cell edge — the discontinuities. */
      var lw = Math.ceil(bw / LAT) + 1, lh = Math.ceil(bh / LAT) + 1;
      var dX = new Float32Array(lw * lh), dY = new Float32Array(lw * lh);
      for (var lj = 0; lj < lh; lj++) {
        for (var li = 0; li < lw; li++) {
          var wx = ax + li * LAT, wy = ay + lj * LAT;
          var f = flowAt(wx, wy);
          /* NO wall pinning. Fading the displacement to zero at the rim was
             tried and is worse: the middle moves while the edges sit still,
             which is precisely what reads as a static layer underneath. A
             real lens cuts the image at its own rim — inside is displaced,
             outside is not, and they do not line up. The pane is warped
             edge to edge. */
          /* Amplitudes scale WITH the radius, so shrinking the brush thins
             the effect instead of leaving a small patch bending as hard as a
             big one. 62px was the reference the constants were tuned at. */
          var inf = f.i * amp * (FLOW_RADIUS / 62);
          if (inf > 1) inf = 1;              /* the field cannot overdrive   */
          var ox = 0, oy = 0;
          if (inf > 0.003) {
            /* 1. drag along the direction the hand was travelling */
            ox = -f.x * inf * DISTORT;
            oy = -f.y * inf * DISTORT;
            var rx = wx - mSm.x, ry = wy - mSm.y;
            var rl = Math.sqrt(rx * rx + ry * ry);
            /* 2. tangential shear — the vortex, as a bounded offset */
            if (SWIRL_PX && rl > 0.5) {
              ox += (-ry / rl) * inf * SWIRL_PX;
              oy += (rx / rl) * inf * SWIRL_PX;
            }
            /* 3. the lens. prof is flat at the centre and flat again at the
                  rim — no kink at either end, so nothing is ever pierced. It
                  also vanishes as rl -> 0, which removes the singularity the
                  old radial pull had at the exact centre. */
            if (rl < LENS_R) {
              var t = 1 - (rl * rl) / (LENS_R * LENS_R);
              var prof = t * t;
              var m = 1 + LENS_MAG * inf * prof;
              var pull = rl / m - rl;
              if (rl > 0.001) { ox += pull * rx / rl; oy += pull * ry / rl; }
            }
          }
          dX[lj * lw + li] = ox; dY[lj * lw + li] = oy;
        }
      }

      /* --- per-pixel gather, bilinear in both the field and the source --- */
      for (var y = 0; y < bh; y++) {
        var fy = y / LAT, j0 = fy | 0, ty = fy - j0;
        if (j0 > lh - 2) { j0 = lh - 2; ty = 1; }
        var r0 = j0 * lw, r1 = r0 + lw;
        for (var x = 0; x < bw; x++) {
          var fx = x / LAT, i0 = fx | 0, tx = fx - i0;
          if (i0 > lw - 2) { i0 = lw - 2; tx = 1; }
          var w0 = (1 - tx) * (1 - ty), w1 = tx * (1 - ty), w2 = (1 - tx) * ty, w3 = tx * ty;
          var ox2 = dX[r0 + i0] * w0 + dX[r0 + i0 + 1] * w1 + dX[r1 + i0] * w2 + dX[r1 + i0 + 1] * w3;
          var oy2 = dY[r0 + i0] * w0 + dY[r0 + i0 + 1] * w1 + dY[r1 + i0] * w2 + dY[r1 + i0 + 1] * w3;

          var sx = offX + x + ox2, sy = offY + y + oy2;
          var o = (y * bw + x) * 4;
          /* Undisplaced pixels are the vast majority of a pane: 4 reads
             instead of 16, and bit-exact rather than merely equal. */
          if (ox2 > -0.02 && ox2 < 0.02 && oy2 > -0.02 && oy2 < 0.02) {
            var q = ((offY + y) * sw + (offX + x)) * 4;
            od[o] = sd[q]; od[o + 1] = sd[q + 1]; od[o + 2] = sd[q + 2]; od[o + 3] = sd[q + 3];
            continue;
          }
          if (sx < 0) sx = 0; else if (sx > sw - 1.001) sx = sw - 1.001;
          if (sy < 0) sy = 0; else if (sy > sh - 1.001) sy = sh - 1.001;
          var sxi = sx | 0, syi = sy | 0, ux = sx - sxi, uy = sy - syi;
          var p00 = (syi * sw + sxi) * 4, p10 = p00 + 4, p01 = p00 + sw * 4, p11 = p01 + 4;
          var b0 = (1 - ux) * (1 - uy), b1 = ux * (1 - uy), b2 = (1 - ux) * uy, b3 = ux * uy;
          od[o]     = sd[p00]     * b0 + sd[p10]     * b1 + sd[p01]     * b2 + sd[p11]     * b3;
          od[o + 1] = sd[p00 + 1] * b0 + sd[p10 + 1] * b1 + sd[p01 + 1] * b2 + sd[p11 + 1] * b3;
          od[o + 2] = sd[p00 + 2] * b0 + sd[p10 + 2] * b1 + sd[p01 + 2] * b2 + sd[p11 + 2] * b3;
          od[o + 3] = sd[p00 + 3] * b0 + sd[p10 + 3] * b1 + sd[p01 + 3] * b2 + sd[p11 + 3] * b3;
        }
      }

      wdX.putImageData(out, 0, 0);

      var rad = isCard ? 16 : Math.min(rc.width, rc.height) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(rc.left, rc.top, rc.width, rc.height, rad);
      ctx.clip();
      /* Clear first: the canvas is ink on transparency, so compositing the
         warped result source-over would leave the flat scene underneath. */
      ctx.clearRect(ax, ay, bw, bh);
      ctx.drawImage(wdC, ax, ay);
      ctx.restore();
    }
    return true;
  }

  var lastFrameAt = 0, FRAME_MS = 1000 / 30;   /* DeepSeek's cap, same reason */
  function tick(now) {
    rafId = 0;
    if (now - lastFrameAt < FRAME_MS) { schedule(); return; }
    lastFrameAt = now;
    blinking = (performance.now() - lastMove) < 2500;
    var dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0.016; lastT = now;
    layoutPositions();
    flowStep();

    /* Autonomous events: a bell of resolution, up and back down. */
    var autoT = {};
    for (var a = autos.length - 1; a >= 0; a--) {
      var ev = autos[a], pr = (now - ev.t0) / ev.dur;
      if (pr >= 1) { autos.splice(a, 1); continue; }
      /* Trapezoid, not a sine: rise, HOLD fully resolved, fall. The hold is
         what lets you actually read the interface that just assembled. */
      var env = pr < 0.20 ? pr / 0.20
              : pr < 0.62 ? 1
              : 1 - (pr - 0.62) / 0.38;
      autoT[ev.i] = Math.max(autoT[ev.i] || 0, env * env * (3 - 2 * env));
    }

    var busy = autos.length > 0 || flowEnergy > 0.012;
    for (var i = 0; i < frames.length; i++) {
      var f = frames[i], tg = autoT[i] || 0;
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
        /* Never re-trigger one that is already mid-cycle, and keep a few
           running at once so the wall is always quietly working. */
        var busyIdx = {};
        for (var q = 0; q < autos.length; q++) busyIdx[autos[q].i] = 1;
        var free = vis.filter(function (n) { return !busyIdx[n]; });
        if (free.length && autos.length < 5) {
          autos.push({ i: free[Math.floor(Math.random() * free.length)],
                       t0: performance.now(), dur: 3200 + Math.random() * 2600 });
          schedule();
        }
      }
      armAuto();
    }, 600 + Math.random() * 1500);
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
    readTokens(); buildLayout(); flowResize();
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
