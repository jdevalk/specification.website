// Initialiser for the standalone /search/ page. The Pagefind Component UI
// custom elements (loaded eagerly here) drive the search; this script only
// wires Plausible analytics and the ?q= deep-link. No inline scripts, so the
// strict CSP holds. On the dev server the /pagefind/ bundle doesn't exist, so
// the components never upgrade — we detect that and show a build hint.
(function () {
  var INSTANCE = "page";

  function showBuildHint() {
    var mount = document.getElementById("search");
    if (!mount) return;
    var p = document.createElement("p");
    p.className = "text-sm text-ink-600";
    p.appendChild(document.createTextNode("Search index is built during "));
    var code = document.createElement("code");
    code.textContent = "npm run build";
    p.appendChild(code);
    p.appendChild(
      document.createTextNode(
        ". It is unavailable on the dev server — try the deployed site.",
      ),
    );
    mount.replaceChildren(p);
  }

  // Report searches to Plausible: term, exact result count, and whether it
  // matched. The Component UI exposes a typed event API on the search instance,
  // so we read the count straight off the `results` event. Debounced so we log
  // settled queries. Production only — window.plausible is undefined in dev.
  function wireAnalytics(inst) {
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
            surface: "page",
          },
        });
      }, 800);
    });
  }

  function prefillFromQuery() {
    var q = new URL(window.location.href).searchParams.get("q");
    if (!q) return;
    var input = document.querySelector('pagefind-input[instance="page"] input');
    if (!input) input = document.querySelector("#search input");
    if (input) {
      input.value = q;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  function init() {
    if (!window.PagefindComponents) return showBuildHint();
    var inst =
      window.PagefindComponents.getInstanceManager().getInstance(INSTANCE);
    wireAnalytics(inst);
    prefillFromQuery();
  }

  // Race the module's custom-element registration against a timeout: if the
  // bundle 404s (dev server) the elements never define and we show the hint.
  Promise.race([
    customElements.whenDefined("pagefind-input"),
    new Promise(function (resolve, reject) {
      setTimeout(function () {
        reject(new Error("timeout"));
      }, 4000);
    }),
  ]).then(init, showBuildHint);
})();
