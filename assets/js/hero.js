/* ==========================================================================
   Hero backdrop — light through a cut stone

   Beams refracting from behind the gem, with faint facet geometry across the
   field. Drawn rather than photographed: no stock licence, it sits exactly in
   the brand palette, and it is the mark's own behaviour rather than a generic
   finance image.

   Deterministic. A fixed seed means every visitor and every reload sees the
   same composition — a backdrop that reshuffles on refresh reads as unstable.
   Painted once; no animation loop, so it costs nothing after first paint.
   ========================================================================== */
(function () {
  "use strict";

  var canvas = document.querySelector("[data-hero-art]");
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");

  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function draw() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rect = canvas.getBoundingClientRect();
    var w = Math.max(1, Math.round(rect.width));
    var h = Math.max(1, Math.round(rect.height));
    if (w < 2 || h < 2) return;

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Where the gem sits on the composition, so the light reads as coming
    // through it rather than from an arbitrary point.
    var ox = w * (w > 900 ? 0.70 : 0.5);
    var oy = h * (w > 900 ? 0.46 : 0.38);
    var reach = Math.hypot(w, h);

    var rand = rng(31031);

    // ---- Refracted beams ------------------------------------------------
    ctx.globalCompositeOperation = "lighter";

    var beams = 30;
    for (var i = 0; i < beams; i++) {
      // Clustered around the diagonals, the way a faceted stone throws light,
      // rather than spread evenly like a sunburst.
      var lobe = Math.floor(rand() * 4);
      var angle = (Math.PI / 4) + (lobe * Math.PI / 2)
                + (rand() - 0.5) * 0.95;

      var spread = 0.008 + rand() * 0.05;
      var length = reach * (0.35 + rand() * 0.75);
      var alpha = 0.020 + rand() * 0.075;

      var warm = rand();
      var colour = warm > 0.72 ? "255, 214, 170"
                 : warm > 0.38 ? "255, 138, 61"
                               : "255, 90, 20";

      var grad = ctx.createLinearGradient(ox, oy,
        ox + Math.cos(angle) * length, oy + Math.sin(angle) * length);
      grad.addColorStop(0.00, "rgba(" + colour + ", " + alpha + ")");
      grad.addColorStop(0.45, "rgba(" + colour + ", " + alpha * 0.5 + ")");
      grad.addColorStop(1.00, "rgba(" + colour + ", 0)");

      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.arc(ox, oy, length, angle - spread, angle + spread);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // ---- Core bloom ------------------------------------------------------
    var core = ctx.createRadialGradient(ox, oy, 0, ox, oy, reach * 0.30);
    core.addColorStop(0.00, "rgba(255, 190, 140, 0.15)");
    core.addColorStop(0.35, "rgba(255, 100, 34, 0.08)");
    core.addColorStop(1.00, "rgba(255, 90, 20, 0)");
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, w, h);

    // ---- Facet hairlines -------------------------------------------------
    // The stone's own geometry, faint enough to be felt rather than read.
    ctx.globalCompositeOperation = "source-over";
    ctx.lineWidth = 1;

    var lines = 16;
    for (var j = 0; j < lines; j++) {
      var a = (Math.PI / 4) + (Math.floor(rand() * 4) * Math.PI / 2) + (rand() - 0.5) * 1.1;
      var start = reach * (0.05 + rand() * 0.18);
      var end = reach * (0.4 + rand() * 0.7);

      var lg = ctx.createLinearGradient(
        ox + Math.cos(a) * start, oy + Math.sin(a) * start,
        ox + Math.cos(a) * end, oy + Math.sin(a) * end);
      lg.addColorStop(0, "rgba(255, 178, 106, " + (0.05 + rand() * 0.09) + ")");
      lg.addColorStop(1, "rgba(255, 178, 106, 0)");

      ctx.strokeStyle = lg;
      ctx.beginPath();
      ctx.moveTo(ox + Math.cos(a) * start, oy + Math.sin(a) * start);
      ctx.lineTo(ox + Math.cos(a) * end, oy + Math.sin(a) * end);
      ctx.stroke();
    }

    // ---- Settle the edges ------------------------------------------------
    // Keeps the light off the headline, which has to stay the brightest thing.
    var mask = ctx.createLinearGradient(0, 0, w, 0);
    mask.addColorStop(0.00, "rgba(4, 4, 4, 0.72)");
    mask.addColorStop(0.34, "rgba(4, 4, 4, 0.16)");
    mask.addColorStop(0.62, "rgba(4, 4, 4, 0)");
    ctx.fillStyle = mask;
    ctx.fillRect(0, 0, w, h);
  }

  draw();

  var t = null;
  window.addEventListener("resize", function () {
    window.clearTimeout(t);
    t = window.setTimeout(draw, 200);
  }, { passive: true });
})();
