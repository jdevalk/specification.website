// Trusted Types default policy.
//
// Worked example for /spec/security/trusted-types/. The site's CSP can carry
//   require-trusted-types-for 'script'; trusted-types default dompurify
// and, once enforcing, every string assigned to a DOM injection sink must be a
// trusted typed value or the browser throws.
//
// Our own scripts touch no sinks, but the Pagefind search bundle does, in two ways:
//   - pagefind-ui.js builds its results list with innerHTML (TrustedHTML sink).
//   - pagefind.js loads its own JS/WASM chunks by assigning a script URL
//     (TrustedScriptURL sink).
// A *default* policy is the only thing that can cover Pagefind, because its
// bundled code assigns raw strings/URLs and cannot opt into a named policy itself.
// So the default policy implements both createHTML and createScriptURL.
//
// (DOMPurify registers its own policy named "dompurify"; the trusted-types
// allowlist in _headers names it too.)
(function () {
  if (!window.trustedTypes || !window.trustedTypes.createPolicy) return; // unsupported browser: nothing to enforce
  if (typeof window.DOMPurify === "undefined") {
    // Fail closed and loud rather than registering an unsafe pass-through.
    console.error(
      "[trusted-types] DOMPurify not loaded; default policy not registered.",
    );
    return;
  }
  try {
    window.trustedTypes.createPolicy("default", {
      // HTML sinks (Pagefind results UI): sanitise, keeping its a/p/mark/list markup.
      createHTML: function (input) {
        return window.DOMPurify.sanitize(input);
      },
      // Script-URL sinks (Pagefind loading its own JS/WASM): allow same-origin
      // URLs only. script-src 'self' is the backstop; this just stops a
      // cross-origin URL ever reaching a script-loading sink.
      createScriptURL: function (input) {
        try {
          if (new URL(input, document.baseURI).origin === location.origin) {
            return input;
          }
        } catch {
          /* malformed URL — fall through to the throw below */
        }
        throw new TypeError("[trusted-types] blocked script URL: " + input);
      },
    });
  } catch (e) {
    // createPolicy throws if a "default" policy already exists or the name is
    // not in the trusted-types allowlist. Never break the page over it.
    console.error("[trusted-types] default policy registration failed:", e);
  }
})();
