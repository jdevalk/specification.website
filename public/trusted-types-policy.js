// Trusted Types default policy.
//
// Worked example for /spec/security/trusted-types/. The site's CSP can carry
//   require-trusted-types-for 'script'; trusted-types default
// and, once enforcing, every string assigned to a DOM injection sink (innerHTML,
// outerHTML, document.write, …) must be a TrustedHTML value or the browser throws.
//
// Our own scripts never touch those sinks, but the Pagefind search UI
// (/pagefind/pagefind-ui.js) builds its entire results list with innerHTML — 11
// assignments — so without a policy, enforcing Trusted Types would break search.
// A *default* policy is the only thing that can cover Pagefind, because its
// bundled code assigns raw strings and cannot opt into a named policy itself.
//
// The policy runs every such string through DOMPurify, which strips scripts and
// event handlers while preserving the structural markup Pagefind emits
// (<a>, <p>, <mark> highlights, lists). Loaded before any other script in
// <head> so the policy exists before Pagefind mounts.
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
      createHTML: function (input) {
        return window.DOMPurify.sanitize(input);
      },
    });
  } catch (e) {
    // createPolicy throws if a "default" policy already exists or the name is
    // not in the trusted-types allowlist. Never break the page over it.
    console.error("[trusted-types] default policy registration failed:", e);
  }
})();
