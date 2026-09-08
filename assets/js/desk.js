/* ==========================================================================
   Market desk tabs

   Full ARIA tab pattern including arrow-key navigation — the desk is the
   densest thing on the page and is the part a keyboard user is most likely
   to get stuck in.
   ========================================================================== */
(function () {
  "use strict";

  document.querySelectorAll("[data-desk]").forEach(function (desk) {
    var tabs = Array.prototype.slice.call(desk.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;

    function select(tab, focus) {
      tabs.forEach(function (t) {
        var selected = t === tab;
        t.setAttribute("aria-selected", String(selected));
        t.setAttribute("tabindex", selected ? "0" : "-1");

        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !selected;
      });

      if (focus) tab.focus();
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () { select(tab, false); });

      tab.addEventListener("keydown", function (event) {
        var next = null;

        switch (event.key) {
          case "ArrowRight": next = tabs[(index + 1) % tabs.length]; break;
          case "ArrowLeft":  next = tabs[(index - 1 + tabs.length) % tabs.length]; break;
          case "Home":       next = tabs[0]; break;
          case "End":        next = tabs[tabs.length - 1]; break;
          default: return;
        }

        event.preventDefault();
        select(next, true);
      });
    });
  });
})();
