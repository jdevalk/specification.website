// Generate raster icons + Open Graph images from inline SVGs at build time.
// Output goes into ./public so favicons and OG sit at predictable URLs.
//
// Per-page OG images for spec entries land at /og/spec/<category>/<slug>.png,
// per-category OG images at /og/spec/<category>.png, and the homepage default
// at /og-default.png.
import sharp from "sharp";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const out = join(root, "public");
const ogOut = join(out, "og", "spec");
const contentRoot = join(root, "src/content/spec");
await mkdir(out, { recursive: true });
await mkdir(ogOut, { recursive: true });

const accent = "#15803d"; // green-700 — base
const accentLight = "#f0fdf4"; // green-50  — OG background tint

// Category metadata — kept in sync with src/lib/site.ts. This script is a
// pure node module run before Astro, so we can't import the TS module.
const CATEGORIES = {
  foundations: {
    title: "Foundations",
    summary: "The HTML, head, and document basics every page needs.",
  },
  seo: {
    title: "SEO",
    summary:
      "Search visibility — robots.txt, sitemaps, canonicals, structured data.",
  },
  accessibility: {
    title: "Accessibility",
    summary: "WCAG-aligned rules so people of all abilities can use the site.",
  },
  security: {
    title: "Security",
    summary: "Headers, transport, and policies that keep visitors safe.",
  },
  "well-known": {
    title: "Well-Known URIs",
    summary: "Standard, agreed-upon paths under /.well-known/.",
  },
  "agent-readiness": {
    title: "Agent Readiness",
    summary: "Things that make a site legible to AI agents and crawlers.",
  },
  performance: {
    title: "Performance",
    summary: "Core Web Vitals, caching, images, fonts, network behaviour.",
  },
  privacy: {
    title: "Privacy",
    summary: "Consent, signals, and respecting visitor choice.",
  },
  resilience: {
    title: "Resilience",
    summary: "Graceful failure — error pages, offline, redirects.",
  },
  i18n: {
    title: "Internationalisation",
    summary: "Language, locale, direction, and translated content.",
  },
};

const STATUS_LABEL = {
  required: "Required",
  recommended: "Recommended",
  optional: "Optional",
  avoid: "Avoid",
};
// Pill colours mirror StatusBadge's bg/text/border classes, flattened to hex.
const STATUS_PILL = {
  required: { bg: "#fef2f2", fg: "#991b1b", border: "#fecaca" }, // red-50 / red-800 / red-200
  recommended: { bg: "#f0fdf4", fg: "#166534", border: "#bbf7d0" }, // accent-50 / accent-800 / accent-200
  optional: { bg: "#f1f1f3", fg: "#3f3f48", border: "#d4d4d8" }, // ink-100 / ink-700 / ink-200
  avoid: { bg: "#fffbeb", fg: "#92400e", border: "#fde68a" }, // amber-50 / amber-800 / amber-200
};

// The mark: a W whose final upstroke shoots past cap height to form a
// checkmark tail. Single stroked path, round caps & joins for a clean
// icon read. Path is on a 0..64 grid and scaled per size.
const WCheck = (cx, cy, scale, stroke) => {
  const pt = (x, y) => `${cx + (x - 32) * scale},${cy + (y - 32) * scale}`;
  const d = [
    `M${pt(12, 26)}`,
    `L${pt(22, 46)}`,
    `L${pt(30, 31)}`,
    `L${pt(38, 46)}`,
    `L${pt(52, 18)}`,
  ].join(" ");
  return `<path d="${d}" fill="none" stroke="#ffffff" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"/>`;
};

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img">
  <rect width="512" height="512" rx="96" fill="${accent}"/>
  ${WCheck(256, 256, 7.5, 48)}
</svg>`;

// Maskable: per W3C maskable spec, the mark must fit inside an inscribed
// circle of ~80% diameter, leaving safe zone for launcher masks.
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img">
  <rect width="512" height="512" fill="${accent}"/>
  ${WCheck(256, 256, 5, 36)}
</svg>`;

// ---- Shared OG building blocks (1200×675) ----

const FONT_SANS =
  "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
const FONT_MONO = "ui-monospace, Menlo, Consolas, monospace";

const baseDefs = `
  <defs>
    <linearGradient id="bg" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="${accentLight}"/>
      <stop offset="1" stop-color="#ffffff"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)"/>
  <rect x="0" y="0" width="12" height="675" fill="${accent}"/>
`;

// Brand row: icon + brand name + tagline ("What a good website does.")
const brandHeader = `
  <g transform="translate(80,80)">
    <rect width="88" height="88" rx="14" fill="${accent}"/>
    ${WCheck(44, 44, 1.375, 8)}
  </g>
  <g transform="translate(184,116)" fill="#0e0e13" font-family="${FONT_SANS}">
    <text x="0" y="0" font-size="26" font-weight="700" letter-spacing="-0.5">The Website Specification</text>
    <text x="0" y="28" font-size="18" font-weight="500" fill="#5b5b66">What a good website does.</text>
  </g>
`;

const footer = `
  <g transform="translate(80,615)" font-family="${FONT_MONO}" font-size="22" fill="#5b5b66">
    <text x="0" y="0">specification.website</text>
  </g>
  <g transform="translate(1120,615)" font-family="${FONT_MONO}" font-size="22" fill="#5b5b66" text-anchor="end">
    <text x="0" y="0">MIT · CC BY 4.0</text>
  </g>
`;

// Filled green check pill (or empty box if checked=false) drawn at (cx, cy).
function checkBox(cx, cy, size, checked = true) {
  const x = cx - size / 2;
  const y = cy - size / 2;
  if (!checked) {
    return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="5" fill="#ffffff" stroke="#9ca3af" stroke-width="2"/>`;
  }
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="5" fill="${accent}"/>
          <path d="M ${x + size * 0.22} ${cy} L ${x + size * 0.43} ${y + size * 0.7} L ${x + size * 0.78} ${y + size * 0.28}"
                fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
}

// XML escape for text emitted into SVG <text> nodes.
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Greedy word-wrap. Returns up to maxLines; the last line gets an ellipsis
// when the source text didn't fit. Approximate budget — SVG can't measure
// fonts, so estimates are conservative.
function wrapLines(text, charsPerLine, maxLines) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let curr = "";
  for (const w of words) {
    const next = curr ? `${curr} ${w}` : w;
    if (next.length > charsPerLine && curr) {
      lines.push(curr);
      curr = w;
      if (lines.length === maxLines) break;
    } else {
      curr = next;
    }
  }
  if (lines.length < maxLines && curr) lines.push(curr);
  // Did we drop anything?
  const consumed = lines.join(" ").replace(/\s+/g, " ").trim();
  const original = words.join(" ");
  if (consumed.length < original.length) {
    const last = lines[lines.length - 1] || "";
    lines[lines.length - 1] = last.replace(/[.,;:!?…]?\s*$/, "") + "…";
  }
  return lines;
}

// ---- OG image templates ----

function homepageOgSvg(topicCount) {
  const sample = [
    "HTTPS",
    "CSP",
    "Accessibility",
    "Sitemap",
    "Open Graph",
    "MCP server",
  ];
  const more = Math.max(0, topicCount - sample.length);
  const rowY = (i) => 360 + i * 56;
  const rowItem = (label, i) => {
    const x = (i % 3) * 360;
    return `${checkBox(x + 16, 0, 28, true)}
            <text x="${x + 50}" y="10" font-weight="600" font-size="28" fill="#0e0e13">${esc(label)}</text>`;
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img">
    ${baseDefs}
    ${brandHeader}

    <g transform="translate(80,260)" fill="#0e0e13" font-family="${FONT_SANS}">
      <text x="0" y="0" font-size="48" font-weight="700" letter-spacing="-1.2">The open checklist for the modern web.</text>
    </g>

    <g transform="translate(80,${rowY(0)})" font-family="${FONT_SANS}">
      ${sample
        .slice(0, 3)
        .map((l, i) => rowItem(l, i))
        .join("\n")}
    </g>
    <g transform="translate(80,${rowY(1)})" font-family="${FONT_SANS}">
      ${sample
        .slice(3, 6)
        .map((l, i) => rowItem(l, i))
        .join("\n")}
    </g>
    <g transform="translate(80,${rowY(2)})" font-family="${FONT_SANS}">
      ${checkBox(16, 0, 28, false)}
      <text x="50" y="10" font-weight="500" font-size="28" fill="#5b5b66">… and ${more} more topics on the list.</text>
    </g>

    ${footer}
  </svg>`;
}

// Pill (rounded rect + centred text). Returns SVG fragment plus computed width.
function pill({ x, y, label, fg, bg, border, fontSize = 22 }) {
  const padX = 24;
  // Approx char width for sans bold at given font size. Calibrated for the
  // ALL-CAPS labels we use here — caps-heavy bold text rasterises wider than
  // a mixed-case 0.58 ratio would suggest, and underestimating it leaves the
  // text cramped against the pill edges.
  const charW = fontSize * 0.76;
  const textW = label.length * charW;
  const w = Math.round(textW + padX * 2);
  const h = Math.round(fontSize * 1.8);
  return {
    width: w,
    svg: `<g transform="translate(${x},${y})">
      <rect width="${w}" height="${h}" rx="${h / 2}" fill="${bg}" stroke="${border}" stroke-width="1.5"/>
      <text x="${w / 2}" y="${h / 2 + fontSize * 0.36}" font-family="${FONT_SANS}" font-size="${fontSize}" font-weight="600" fill="${fg}" text-anchor="middle">${esc(label)}</text>
    </g>`,
  };
}

function specPageOgSvg({ title, summary, category, status }) {
  const cat = CATEGORIES[category] || { title: category };
  const stat = STATUS_PILL[status] || STATUS_PILL.recommended;

  // resvg falls back to a default sans (~0.49 width-to-fontSize at bold 800),
  // so calibrate budgets against that, not the font-family hint. Body width
  // is 1040px (80px margin each side).
  const fontSizeBig = title.length > 32 ? 50 : 60;
  const charsBig = fontSizeBig === 60 ? 28 : 34;
  const titleLines = wrapLines(title, charsBig, 3);
  const lineHBig = fontSizeBig * 1.2;

  const summaryLines = wrapLines(summary, 60, 3);

  const pillY = 235;
  const pillH = 33;
  // Title's top of caps sits ~0.75 * fontSize above the baseline, so the
  // first baseline needs that much clearance below the pill bottom.
  const titleStartY = pillY + pillH + 18 + fontSizeBig * 0.75;
  const summaryStartY = titleStartY + (titleLines.length - 1) * lineHBig + 60;

  const catPill = pill({
    x: 80,
    y: pillY,
    label: (cat.title || category).toUpperCase(),
    fg: "#ffffff",
    bg: accent,
    border: accent,
    fontSize: 18,
  });
  const statPill = pill({
    x: 80 + catPill.width + 10,
    y: pillY,
    label: (STATUS_LABEL[status] || status).toUpperCase(),
    fg: stat.fg,
    bg: stat.bg,
    border: stat.border,
    fontSize: 18,
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img">
    ${baseDefs}
    ${brandHeader}

    ${catPill.svg}
    ${statPill.svg}

    <g transform="translate(80,${titleStartY})" fill="#0e0e13" font-family="${FONT_SANS}">
      ${titleLines
        .map(
          (line, i) => `
        <text x="0" y="${i * lineHBig}" font-size="${fontSizeBig}" font-weight="700" letter-spacing="-1.2">${esc(line)}</text>
      `,
        )
        .join("")}
    </g>

    <g transform="translate(80,${summaryStartY})" fill="#3f3f48" font-family="${FONT_SANS}">
      ${summaryLines
        .map(
          (line, i) => `
        <text x="0" y="${i * 38}" font-size="26" font-weight="500">${esc(line)}</text>
      `,
        )
        .join("")}
    </g>

    ${footer}
  </svg>`;
}

// Generic eyebrow-title-subtitle template used by category indexes and the
// standalone marketing pages (about, contribute, mcp, privacy, search, 404).
function eyebrowOgSvg({ eyebrow, title, subtitle, footnote }) {
  const titleSize = title.length > 22 ? 64 : 76;
  const titleChars = titleSize === 76 ? 20 : 26;
  const titleLines = wrapLines(title, titleChars, 2);
  const titleLineH = titleSize * 1.15;
  const subtitleLines = wrapLines(subtitle, 56, 2);

  const eyebrowY = 275;
  const titleStartY = 345;
  const subtitleStartY =
    titleStartY + (titleLines.length - 1) * titleLineH + 56;
  const footnoteY = subtitleStartY + (subtitleLines.length - 1) * 42 + 50;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img">
    ${baseDefs}
    ${brandHeader}

    <g transform="translate(80,${eyebrowY})" fill="#5b5b66" font-family="${FONT_SANS}">
      <text x="0" y="0" font-size="20" font-weight="700" letter-spacing="2">${esc(eyebrow)}</text>
    </g>
    <g transform="translate(80,${titleStartY})" fill="#0e0e13" font-family="${FONT_SANS}">
      ${titleLines
        .map(
          (line, i) => `
        <text x="0" y="${i * titleLineH}" font-size="${titleSize}" font-weight="700" letter-spacing="-2">${esc(line)}</text>
      `,
        )
        .join("")}
    </g>
    <g transform="translate(80,${subtitleStartY})" fill="#3f3f48" font-family="${FONT_SANS}">
      ${subtitleLines
        .map(
          (line, i) => `
        <text x="0" y="${i * 42}" font-size="30" font-weight="500">${esc(line)}</text>
      `,
        )
        .join("")}
    </g>
    ${
      footnote
        ? `<g transform="translate(80,${footnoteY})" font-family="${FONT_SANS}">
      ${checkBox(16, 0, 28, true)}
      <text x="50" y="10" font-weight="600" font-size="26" fill="${accent}">${esc(footnote)}</text>
    </g>`
        : ""
    }

    ${footer}
  </svg>`;
}

function categoryOgSvg({ category, count }) {
  const cat = CATEGORIES[category] || { title: category, summary: "" };
  return eyebrowOgSvg({
    eyebrow: "CATEGORY",
    title: cat.title,
    subtitle: cat.summary,
    footnote: `${count} topic${count === 1 ? "" : "s"} in this category`,
  });
}

// ---- Frontmatter loader ----
// Reads our spec frontmatter shape — single-line string keys (title, slug,
// category, summary, status, draft). We don't need a full YAML parser; the
// schema is enforced by Astro's content config so the inputs are predictable.
function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([a-zA-Z][a-zA-Z0-9_-]*):\s*(.*)$/);
    if (!kv) continue;
    const [, key, rawVal] = kv;
    let val = rawVal.trim();
    if (val.startsWith('"') && val.endsWith('"') && val.length >= 2) {
      try {
        val = JSON.parse(val);
      } catch {
        val = val.slice(1, -1);
      }
    } else if (val.startsWith("'") && val.endsWith("'") && val.length >= 2) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

async function loadAllSpecs() {
  const specs = [];
  let dirs;
  try {
    dirs = await readdir(contentRoot, { withFileTypes: true });
  } catch {
    return specs;
  }
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    const catDir = join(contentRoot, d.name);
    const files = await readdir(catDir);
    for (const file of files) {
      if (!/\.mdx?$/.test(file)) continue;
      const text = await readFile(join(catDir, file), "utf8");
      const fm = parseFrontmatter(text);
      if (!fm) continue;
      if (fm.draft === "true" || fm.draft === true) continue;
      const slug = fm.slug || file.replace(/\.mdx?$/, "");
      specs.push({
        slug,
        category: fm.category || d.name,
        title: fm.title || slug,
        summary: fm.summary || "",
        status: fm.status || "recommended",
      });
    }
  }
  return specs;
}

// ---- Rendering helpers ----

async function png(svg, size, file) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(join(out, file));
  console.log(`  wrote /${file} (${size}×${size})`);
}

async function ogPng(svg, file) {
  await sharp(Buffer.from(svg))
    .resize(1200, 675)
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(join(out, file));
}

// ---- Run ----

console.log("Generating assets…");
await png(iconSvg, 192, "icon-192.png");
await png(iconSvg, 512, "icon-512.png");
await png(maskableSvg, 512, "icon-maskable-512.png");
await png(iconSvg, 180, "apple-touch-icon.png");

// ICO: 16×16 + 32×32 PNGs packed by sharp.
const ico16 = await sharp(Buffer.from(iconSvg)).resize(16, 16).png().toBuffer();
const ico32 = await sharp(Buffer.from(iconSvg)).resize(32, 32).png().toBuffer();
function ico(images) {
  const dir = Buffer.alloc(6 + images.length * 16);
  dir.writeUInt16LE(0, 0);
  dir.writeUInt16LE(1, 2);
  dir.writeUInt16LE(images.length, 4);
  let offset = dir.length;
  images.forEach((buf, i) => {
    const sz = i === 0 ? 16 : 32;
    const off = 6 + i * 16;
    dir.writeUInt8(sz === 256 ? 0 : sz, off + 0);
    dir.writeUInt8(sz === 256 ? 0 : sz, off + 1);
    dir.writeUInt8(0, off + 2);
    dir.writeUInt8(0, off + 3);
    dir.writeUInt16LE(1, off + 4);
    dir.writeUInt16LE(32, off + 6);
    dir.writeUInt32LE(buf.length, off + 8);
    dir.writeUInt32LE(offset, off + 12);
    offset += buf.length;
  });
  return Buffer.concat([dir, ...images]);
}
await writeFile(join(out, "favicon.ico"), ico([ico16, ico32]));
console.log("  wrote /favicon.ico (16+32)");

// OG images
const specs = await loadAllSpecs();
console.log(`  found ${specs.length} spec entries`);

await ogPng(homepageOgSvg(specs.length), "og-default.png");
console.log("  wrote /og-default.png (homepage, 1200×675)");

// Per-category
const byCategory = {};
for (const s of specs) (byCategory[s.category] ||= []).push(s);

for (const cat of Object.keys(CATEGORIES)) {
  const count = (byCategory[cat] || []).length;
  await ogPng(
    categoryOgSvg({ category: cat, count }),
    join("og", "spec", `${cat}.png`),
  );
}
console.log(
  `  wrote ${Object.keys(CATEGORIES).length} category OG images → /og/spec/*.png`,
);

// Per spec page
let written = 0;
for (const s of specs) {
  const dir = join(ogOut, s.category);
  await mkdir(dir, { recursive: true });
  await ogPng(
    specPageOgSvg(s),
    join("og", "spec", s.category, `${s.slug}.png`),
  );
  written++;
}
console.log(
  `  wrote ${written} per-page OG images → /og/spec/<category>/<slug>.png`,
);

// Marketing / standalone pages — each gets a bespoke OG with the same brand
// frame so the set reads as a family on social timelines. Wired up by passing
// `ogImage` to BaseLayout on the matching page.
const marketingPages = [
  {
    slug: "spec",
    eyebrow: "ALL TOPICS",
    title: "Browse the specification.",
    subtitle:
      "Every topic, grouped by category. Required, recommended, optional, avoid.",
    footnote: `${specs.length} topics across ${Object.keys(CATEGORIES).length} categories`,
  },
  {
    slug: "checklist",
    eyebrow: "CHECKLIST",
    title: "The printable checklist.",
    subtitle: "Every topic in one list. Tickable, filterable, print-friendly.",
    footnote: `${specs.length} items to tick off`,
  },
  {
    slug: "about",
    eyebrow: "ABOUT",
    title: "What this site is.",
    subtitle:
      "Platform-agnostic standards. Built in the open. Cited from primary sources.",
  },
  {
    slug: "contribute",
    eyebrow: "CONTRIBUTE",
    title: "Open a pull request.",
    subtitle:
      "Spot a gap, a stale fact, or a missing topic? Sources required, opinions optional.",
  },
  {
    slug: "mcp",
    eyebrow: "MCP SERVER",
    title: "Query the spec.",
    subtitle:
      "Read-only MCP server at mcp.specification.website. No auth, no cookies.",
  },
  {
    slug: "changelog",
    eyebrow: "CHANGELOG",
    title: "What changed, and when.",
    subtitle:
      "New topics, status changes, and honest removals. Newest first, with sources.",
  },
  {
    slug: "privacy",
    eyebrow: "PRIVACY",
    title: "Almost nothing collected.",
    subtitle:
      "Cookieless analytics. No IP storage. No third-party scripts beyond Plausible.",
  },
  {
    slug: "search",
    eyebrow: "SEARCH",
    title: "Search the spec.",
    subtitle:
      "Full-text search over every topic. Powered by Pagefind, in the browser.",
  },
  {
    slug: "404",
    eyebrow: "404",
    title: "Page not found.",
    subtitle:
      "The page you tried to reach does not exist. Try the checklist or the search.",
  },
];

for (const p of marketingPages) {
  await ogPng(eyebrowOgSvg(p), join("og", `${p.slug}.png`));
}
console.log(
  `  wrote ${marketingPages.length} marketing OG images → /og/<slug>.png`,
);

// Vendor third-party runtime libraries we want self-hosted (script-src 'self').
// DOMPurify backs the Trusted Types default policy (see public/trusted-types-policy.js)
// so the strict CSP can require trusted values without pulling in a remote script.
const vendorOut = join(out, "vendor");
await mkdir(vendorOut, { recursive: true });
const dompurifySrc = join(
  root,
  "node_modules",
  "dompurify",
  "dist",
  "purify.min.js",
);
await writeFile(join(vendorOut, "purify.min.js"), await readFile(dompurifySrc));
console.log("  vendored DOMPurify → /vendor/purify.min.js");

console.log("Done.");
