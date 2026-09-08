/* ==========================================================================
   31 Capitals — header and navigation
   ========================================================================== */
(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");

  /* ---- Stuck state -------------------------------------------------- */
  if (header) {
    var ticking = false;

    function paint() {
      ticking = false;
      header.classList.toggle("is-stuck", window.scrollY > 12);
    }

    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(paint);
    }, { passive: true });

    paint();
  }

  /* ---- Mobile drawer ------------------------------------------------- */
  if (toggle && nav) {
    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
      document.body.style.overflow = open ? "hidden" : "";
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    window.matchMedia("(min-width: 62rem)").addEventListener("change", function (event) {
      if (event.matches) setOpen(false);
    });
  }

  /* The current page is marked server-side in templates/header.php, which
     knows the script name even behind a clean URL like /clients. Doing it
     again here could only disagree with it. */
})();
