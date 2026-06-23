import js from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";
import globals from "globals";

export default [
  // Ignore generated output and the MCP worker (separate package with its own
  // toolchain — lint it from inside mcp/, not from the repo root). Vendored
  // agent skills (.github/skills, mirrored into the git-ignored .claude/) are
  // owned upstream and not ours to lint — same exclusion as .prettierignore.
  {
    ignores: [
      "dist/",
      ".astro/",
      "node_modules/",
      "public/pagefind/",
      "public/vendor/",
      "mcp/",
      ".github/skills/",
      ".claude/",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,

  // Astro frontmatter + the bundled components run in a Node-ish build context.
  {
    files: ["**/*.{js,ts,astro}"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  // Browser scripts shipped from public/ — no bundler, classic <script> globals.
  {
    files: ["public/**/*.js"],
    languageOptions: {
      sourceType: "script",
      globals: { ...globals.browser, PagefindUI: "readonly" },
    },
  },

  // Build + maintenance scripts run under Node as ES modules. Includes the
  // root-level Astro integration that packages the OKF bundle at build time.
  {
    files: [
      "scripts/**/*.{js,mjs}",
      "*.config.{js,mjs,ts}",
      "astro-okf-tarball.mjs",
    ],
    languageOptions: {
      sourceType: "module",
      globals: globals.node,
    },
  },

  // Cloudflare Pages Functions run on the Workers runtime (fetch, Response,
  // Request, crypto, etc.) — excluded from the root tsconfig.
  {
    files: ["functions/**/*.ts"],
    languageOptions: {
      globals: { ...globals.serviceworker, ...globals.node },
    },
  },

  // The pre-paint theme-init <script is:inline> in BaseLayout.astro is byte-frozen:
  // its sha256 is pinned in the CSP (public/_headers), so it must stay minified
  // exactly as written. Don't lint its legacy var/empty-catch idioms.
  {
    files: [
      "src/layouts/BaseLayout.astro",
      "src/layouts/BaseLayout.astro/*.{js,ts}",
    ],
    rules: {
      "no-var": "off",
      "no-empty": "off",
      "no-unused-vars": ["error", { caughtErrors: "none" }],
      "@typescript-eslint/no-unused-vars": ["error", { caughtErrors: "none" }],
    },
  },
];
