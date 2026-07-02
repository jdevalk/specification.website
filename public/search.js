// ⌘K / Ctrl-K global search modal, built on the Pagefind Component UI
// (<pagefind-modal>). Lazy-loads /pagefind/pagefind-component-ui.{css,js} on
// first open so the ~46 kB bundle never lands on visitors who don't search.
// No inline scripts, so the strict CSP stays intact. Falls back to navigating
// to /search/ if the bundle can't load (typically: the dev server, where the
// Pagefind index doesn't exist yet).
(function () {
  var modal = document.querySelector("pagefind-modal");
  if (!modal) return;

  var triggers = document.querySelectorAll("[data-search-trigger]");
  var loading = false;
  var ready = false;

  function loadAssets() {
    return new Promise(function (resolve, reject) {
      if (window.PagefindComponents) return resolve();
      if (!document.querySelector("link[data-pagefind-css]")) {
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "/pagefind/pagefind-component-ui.css";
        link.setAttribute("data-pagefind-css", "");
        document.head.appendChild(link);
      }
      var script = document.createElement("script");
      script.type = "module";
      script.src = "/pagefind/pagefind-component-ui.js";
      // SRI + CORS mode so this injected script satisfies Integrity-Policy
      // (which blocks both un-hashed and no-cors script requests). The hash must
      // match pagefindComponentUiIntegrity in src/lib/integrity.ts; both are
      // verified against the built file by scripts/check-integrity.mjs.
      script.integrity =
        "sha384-sgK6d6muVu9zgs2S4M4GuLq6M9fV5OMX7x2wloOZiDmbOgYhQa+tf8Ukevo/kjeq";
      script.crossOrigin = "anonymous";
      script.onload = function () {
        // The custom elements register asynchronously after the module
        // evaluates; wait for the modal to be defined before opening it.
        customElements.whenDefined("pagefind-modal").then(resolve, reject);
      };
      script.onerror = function () {
        reject(new Error("pagefind-component-ui.js failed to load"));
      };
      document.head.appendChild(script);
    });
  }

  // Report searches to Plausible: the term, the result count, and whether it
  // matched anything. The Component UI exposes a typed event API on the search
  // instance — `search` carries the term, `results` carries the result set —
  // so we read the exact count straight off the instance instead of scraping
  // the rendered DOM. Debounced so we log settled queries, not every keystroke.
  // Production only — window.plausible is undefined on the dev server.
  function wireAnalytics() {
    if (!window.PagefindComponents) return;
    var inst =
      window.PagefindComponents.getInstanceManager().getInstance("default");
    if (!inst || inst.__swAnalytics__) return;
    inst.__swAnalytics__ = true;
    var term = "";
    var timer;
    inst.on("search", function (t) {
      term = (t || "").trim().toLowerCase();
    });
    inst.on("results", function (r) {
      var count =
        r && typeof r.unfilteredResultCount === "number"
          ? r.unfilteredResultCount
          : null;
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (typeof window.plausible !== "function") return;
        if (term.length < 2 || count === null) return;
        window.plausible("Search", {
          props: {
            term: term,
            results: count,
            found: count > 0,
            surface: "overlay",
          },
        });
      }, 800);
    });
  }

  function open(prefill) {
    if (ready) {
      modal.open();
      if (prefill) prefillSearch(prefill);
      return;
    }
    if (loading) return;
    loading = true;
    loadAssets()
      .then(function () {
        ready = true;
        wireAnalytics();
        modal.open();
        if (prefill) prefillSearch(prefill);
      })
      .catch(function () {
        var url = "/search/";
        if (prefill) url += "?q=" + encodeURIComponent(prefill);
        window.location.href = url;
      });
  }

  // The modal renders its <input> into the light DOM, so we can drive it
  // directly — set the value and dispatch a native input event the searchbox
  // already listens for. Used by the WebMCP open_search tool's prefill.
  function prefillSearch(q) {
    requestAnimationFrame(function () {
      var input = modal.querySelector("input");
      if (!input) return;
      input.value = q;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }
  window.__swOpenSearch = open;

  // Trigger: any element with data-search-trigger opens the modal.
  triggers.forEach(function (t) {
    t.addEventListener("click", function (ev) {
      ev.preventDefault();
      open();
    });
  });

  // ⌘K / Ctrl-K toggles from anywhere; "/" opens, GitHub-style. The Component
  // UI only registers shortcuts scoped to the open modal (arrow nav, esc), so
  // these global bindings never collide with it.
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "k" && (ev.metaKey || ev.ctrlKey)) {
      ev.preventDefault();
      if (ready && modal.isOpen) modal.close();
      else open();
      return;
    }
    if (ev.key === "/" && !(ready && modal.isOpen)) {
      var target = ev.target;
      var inField =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (!inField) {
        ev.preventDefault();
        open();
      }
    }
  });
})();
