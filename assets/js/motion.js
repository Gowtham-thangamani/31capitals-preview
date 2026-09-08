/* ==========================================================================
   31 Capitals — motion engine

   Three mechanisms, no dependencies:
     1. reveal   — IntersectionObserver adds .is-in. No scroll listener.
     2. parallax — one rAF loop, writing --py only to elements in view.
     3. story    — scroll progress written to --progress on a sticky section.

   Everything is transform/opacity only. The loop idles when nothing is
   on screen, and the whole file no-ops under prefers-reduced-motion.
   ========================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var wide = window.matchMedia("(min-width: 62rem)");

  document.documentElement.classList.remove("no-js");

  /* ---------------------------------------------------------------------
     1. Reveal
     --------------------------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    if (reduced.matches || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

    items.forEach(function (el) {
      var delay = el.getAttribute("data-reveal-delay");
      if (delay) el.style.setProperty("--reveal-delay", delay + "ms");
      io.observe(el);
    });

    // Failsafe. An element taller than the viewport can never reach the 15%
    // threshold, and a hidden ancestor can swallow the callback entirely.
    // Nothing on this page may stay invisible because an animation did not run.
    window.setTimeout(function () {
      items.forEach(function (el) {
        if (!el.classList.contains("is-in")) {
          el.style.setProperty("--reveal-delay", "0ms");
          el.classList.add("is-in");
        }
      });
    }, 2500);
  }

  /* ---------------------------------------------------------------------
     2. Parallax
     Only elements currently intersecting are kept in `live`; the rAF loop
     stops entirely when that set empties.
     --------------------------------------------------------------------- */
  function initParallax() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
    if (!nodes.length || reduced.matches || !("IntersectionObserver" in window)) return;

    var live = [];
    var ticking = false;
    var viewportH = window.innerHeight;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var el = entry.target;
        var at = live.indexOf(el);
        if (entry.isIntersecting) {
          if (at === -1) live.push(el);
          el.classList.add("is-tracking");
        } else {
          if (at !== -1) live.splice(at, 1);
          el.classList.remove("is-tracking");
          el.style.setProperty("--py", "0px");
        }
      });
      schedule();
    }, { rootMargin: "20% 0px 20% 0px" });

    nodes.forEach(function (el) { io.observe(el); });

    function apply() {
      ticking = false;
      if (!wide.matches) return;

      var mid = viewportH / 2;
      for (var i = 0; i < live.length; i++) {
        var el = live[i];
        var box = el.getBoundingClientRect();
        var centre = box.top + box.height / 2;
        var speed = parseFloat(el.getAttribute("data-parallax")) || 0;
        var offset = (mid - centre) * speed;
        var cap = parseFloat(el.getAttribute("data-parallax-max")) || 120;
        if (offset > cap) offset = cap;
        if (offset < -cap) offset = -cap;
        el.style.setProperty("--py", offset.toFixed(2) + "px");
      }
    }

    function schedule() {
      if (ticking || !live.length) return;
      ticking = true;
      window.requestAnimationFrame(apply);
    }

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", function () {
      viewportH = window.innerHeight;
      if (!wide.matches) {
        nodes.forEach(function (el) { el.style.setProperty("--py", "0px"); });
      }
      schedule();
    }, { passive: true });

    apply();
  }

  /* ---------------------------------------------------------------------
     3. Story rail
     The track is sized in JS so the number of steps decides its length —
     the markup stays declarative and the CSS stays free of magic numbers.
     --------------------------------------------------------------------- */
  function initStory() {
    var story = document.querySelector("[data-story]");
    if (!story) return;

    var track = story.querySelector(".story-track");
    var stage = story.querySelector(".story-stage");
    var steps = Array.prototype.slice.call(story.querySelectorAll(".story-step"));
    var facets = Array.prototype.slice.call(story.querySelectorAll(".story-gem .gem-facet"));
    if (!track || !stage || !steps.length) return;

    var ticking = false;
    var active = -1;

    function size() {
      if (!wide.matches || reduced.matches) {
        track.style.minHeight = "";
        return;
      }
      /* One viewport of scroll per step, plus one to read the last one. */
      track.style.minHeight = (steps.length + 0.6) * 100 + "vh";
    }

    function paint() {
      ticking = false;

      if (!wide.matches || reduced.matches) {
        story.style.setProperty("--progress", 1);
        steps.forEach(function (s) { s.classList.add("is-active"); });
        facets.forEach(function (f) { f.classList.add("is-lit"); });
        return;
      }

      var box = track.getBoundingClientRect();
      var travel = box.height - stage.offsetHeight;
      if (travel <= 0) return;

      var p = -box.top / travel;
      if (p < 0) p = 0;
      if (p > 1) p = 1;
      story.style.setProperty("--progress", p.toFixed(4));

      var index = Math.min(steps.length - 1, Math.floor(p * steps.length));
      if (index === active) return;
      active = index;

      steps.forEach(function (s, i) { s.classList.toggle("is-active", i === index); });
      facets.forEach(function (f, i) {
        f.classList.toggle("is-lit", i <= Math.round((index + 1) * (facets.length / steps.length)) - 1);
      });
    }

    function schedule() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(paint);
    }

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", function () { size(); active = -1; schedule(); }, { passive: true });

    size();
    paint();
  }

  /* ---------------------------------------------------------------------
     Hero gem — trigger the load sequence once fonts and layout have settled.
     --------------------------------------------------------------------- */
  function initGem() {
    var gem = document.querySelector(".hero .gem");
    if (!gem) return;

    gem.querySelectorAll(".gem-facet").forEach(function (facet, i) {
      facet.style.setProperty("--i", i);
    });

    if (reduced.matches) { gem.classList.add("is-ready"); return; }
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { gem.classList.add("is-ready"); });
    });
  }

  /* ---------------------------------------------------------------------
     Counters
     --------------------------------------------------------------------- */
  function initCounters() {
    var counters = document.querySelectorAll("[data-count]");
    if (!counters.length) return;

    function write(el, value) {
      var decimals = parseInt(el.getAttribute("data-count-decimals") || "0", 10);
      el.textContent =
        (el.getAttribute("data-count-prefix") || "") +
        value.toFixed(decimals) +
        (el.getAttribute("data-count-suffix") || "");
    }

    if (reduced.matches || !("IntersectionObserver" in window)) {
      counters.forEach(function (el) { write(el, parseFloat(el.getAttribute("data-count"))); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);

        var target = parseFloat(el.getAttribute("data-count"));
        var duration = 1100;
        var start = 0;

        function step(now) {
          if (!start) start = now;
          var t = Math.min(1, (now - start) / duration);
          var eased = 1 - Math.pow(1 - t, 3);
          write(el, target * eased);
          if (t < 1) window.requestAnimationFrame(step);
        }

        window.requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) { write(el, 0); io.observe(el); });
  }

  function start() {
    initReveal();
    initParallax();
    initStory();
    initGem();
    initCounters();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
