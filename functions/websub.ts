/**
 * WebSub hub — the push side of /spec/foundations/websub/.
 *
 * A *self-hub*: it distributes this site's own two feeds and nothing else.
 * `hub.topic` is checked against ALLOWED_TOPICS below, so the endpoint cannot
 * be used to fetch arbitrary URLs or to relay someone else's content. That
 * single constraint is what makes running a hub on a static site reasonable —
 * an open hub is a public service with a very different risk profile.
 *
 * Implements WebSub (W3C Recommendation, 2 June 2026):
 *   - §5.1 subscribe / unsubscribe  → POST hub.mode=subscribe|unsubscribe
 *   - §5.3 verification of intent   → async GET to hub.callback, echo challenge
 *   - §5.4 content distribution     → POST body + Link rel=hub/self + signature
 *
 * Publishing is deliberately *not* part of WebSub: §4 leaves "how the publisher
 * notifies the hub" out of scope. We accept the de-facto PubSubHubbub 0.4
 * convention (`hub.mode=publish`), gated behind a bearer token, because only
 * this site's own deploy may trigger a fan-out. The GitHub Action in
 * .github/workflows/websub-ping.yml is the only caller.
 *
 * Outbound-request safety. This is the only code in the repo that makes
 * requests to URLs supplied by strangers, so:
 *   - callbacks must be https, with a real hostname (never an IP literal, never
 *     a single-label or .internal/.local name) — see isSafeCallback;
 *   - nothing is ever delivered to a callback that has not completed the
 *     challenge handshake, which is the protocol's own anti-amplification
 *     measure;
 *   - subscriber count per topic and lease length are both capped;
 *   - distribution only fires on a real publish (a few times a week), never on
 *     demand from an unauthenticated caller.
 *
 * Degrades to 503 when the D1 binding is absent, so the site deploys and
 * behaves normally before the database has been provisioned. Like the rest of
 * functions/, it never throws out of the handler.
 */

type Env = {
  ASSETS: Fetcher;
  /** D1 binding. Absent until the database is provisioned — see wrangler.toml. */
  WEBSUB_DB?: D1Database;
  /** Bearer token authorising hub.mode=publish. Pages secret. */
  WEBSUB_PUBLISH_SECRET?: string;
};

interface Subscription {
  callback: string;
  secret: string | null;
}

const HUB_URL = "https://specification.website/websub";

/**
 * The only topics this hub will serve. Absolute, canonical, and matching the
 * `rel="self"` we advertise on each feed — subscribers key their subscription
 * on this exact string, so it must not drift from public/_headers or from the
 * `atom:link rel="self"` inside each feed.
 */
const ALLOWED_TOPICS: Record<string, string> = {
  "https://specification.website/rss.xml": "/rss.xml",
  "https://specification.website/changelog/rss.xml": "/changelog/rss.xml",
};

const DEFAULT_LEASE_SECONDS = 864000; // 10 days — comfortably longer than our publish cadence
const MIN_LEASE_SECONDS = 3600;
const MAX_LEASE_SECONDS = 2592000; // 30 days
const MAX_SECRET_BYTES = 200; // WebSub §5.1: MUST be less than 200 bytes
const MAX_SUBSCRIBERS_PER_TOPIC = 500;
const VERIFY_TIMEOUT_MS = 10_000;
const DELIVER_TIMEOUT_MS = 15_000;
const DELIVER_CONCURRENCY = 10;

// ---------------------------------------------------------------- helpers

function text(body: string, status: number, extra?: HeadersInit): Response {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", ...extra },
  });
}

function now(): number {
  return Math.floor(Date.now() / 1000);
}

function hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Constant-time string comparison for the publish token. `===` on secrets leaks
 * a prefix-length oracle through timing; this always inspects every byte of the
 * longer input.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  let diff = ab.length ^ bb.length;
  const len = Math.max(ab.length, bb.length);
  for (let i = 0; i < len; i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

/** HMAC per WebSub §5.4. sha256 is the floor; sha1 is legacy and never emitted. */
export async function signPayload(
  secret: string,
  body: ArrayBuffer,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return hex(await crypto.subtle.sign("HMAC", key, body));
}

/**
 * Is this callback URL safe to send requests to?
 *
 * Rejecting every IP literal (rather than enumerating RFC 1918, loopback,
 * link-local, CGNAT, and their IPv6 equivalents) kills the whole SSRF class in
 * one rule and costs legitimate subscribers nothing — a feed reader always has
 * a hostname. Single-label names and .internal/.local are refused for the same
 * reason. Non-443 ports are refused so the hub cannot be pointed at an
 * arbitrary service on a host that happens to resolve publicly.
 */
export function isSafeCallback(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  if (url.username || url.password) return false;
  if (url.port && url.port !== "443") return false;

  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host) return false;
  // IPv6 literals arrive bracketed; URL strips the brackets but keeps the colons.
  if (host.includes(":")) return false;
  // IPv4 literal, in whole or in part (also catches 0x7f.1, 2130706433, …).
  if (/^[\d.]+$/.test(host)) return false;
  // Needs a real public-looking name: at least one dot, no internal suffixes.
  if (!host.includes(".")) return false;
  if (/\.(internal|local|localhost|home\.arpa)$/.test(host)) return false;
  return true;
}

export function clampLease(raw: string | null): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LEASE_SECONDS;
  return Math.min(Math.max(n, MIN_LEASE_SECONDS), MAX_LEASE_SECONDS);
}

// ------------------------------------------------- verification of intent

/**
 * WebSub §5.3. GET the callback with the challenge and confirm the subscriber
 * echoes it back with a 2xx. Only then does the subscription take effect, which
 * is what stops anyone subscribing a callback they do not control.
 *
 * Runs in waitUntil() after the 202 has already been sent, so it must swallow
 * every failure: a rejected or unreachable callback simply means no
 * subscription, which is the correct outcome.
 */
async function verifyAndApply(
  db: D1Database,
  mode: "subscribe" | "unsubscribe",
  topic: string,
  callback: string,
  secret: string | null,
  leaseSeconds: number,
): Promise<void> {
  try {
    const challenge = crypto.randomUUID();
    const probe = new URL(callback);
    probe.searchParams.set("hub.mode", mode);
    probe.searchParams.set("hub.topic", topic);
    probe.searchParams.set("hub.challenge", challenge);
    if (mode === "subscribe") {
      probe.searchParams.set("hub.lease_seconds", String(leaseSeconds));
    }

    const res = await fetch(probe.toString(), {
      method: "GET",
      redirect: "error", // a redirected challenge is not a confirmation
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
      headers: { "User-Agent": "specification.website-websub-hub/1.0" },
    });
    if (!res.ok) return;
    // Compare trimmed: the spec wants the body *equal* to the challenge, but
    // trailing newlines from naive handlers are near-universal and harmless.
    if ((await res.text()).trim() !== challenge) return;

    if (mode === "subscribe") {
      await db
        .prepare(
          `INSERT INTO subscriptions (topic, callback, secret, lease_expires_at, created_at)
           VALUES (?1, ?2, ?3, ?4, ?5)
           ON CONFLICT (topic, callback) DO UPDATE SET
             secret = excluded.secret,
             lease_expires_at = excluded.lease_expires_at`,
        )
        .bind(topic, callback, secret, now() + leaseSeconds, now())
        .run();
    } else {
      await db
        .prepare(`DELETE FROM subscriptions WHERE topic = ?1 AND callback = ?2`)
        .bind(topic, callback)
        .run();
    }
  } catch {
    // Unreachable callback, DNS failure, timeout, D1 hiccup — all mean
    // "no change", and there is nobody left to report it to.
  }
}

// ---------------------------------------------------- content distribution

/**
 * WebSub §5.4. POST the full topic content to one subscriber, with the two
 * required Link relations and — when the subscriber supplied a secret — an
 * HMAC over exactly the bytes being sent.
 */
async function deliver(
  sub: Subscription,
  topic: string,
  body: ArrayBuffer,
  contentType: string,
): Promise<void> {
  try {
    const headers = new Headers({
      "Content-Type": contentType,
      "User-Agent": "specification.website-websub-hub/1.0",
    });
    headers.append("Link", `<${HUB_URL}>; rel="hub"`);
    headers.append("Link", `<${topic}>; rel="self"`);
    if (sub.secret) {
      headers.set(
        "X-Hub-Signature",
        `sha256=${await signPayload(sub.secret, body)}`,
      );
    }
    await fetch(sub.callback, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(DELIVER_TIMEOUT_MS),
    });
  } catch {
    // A subscriber that is down misses this notification. WebSub allows a hub
    // to retry; we deliberately do not, because the next publish carries the
    // full current feed anyway and a retry queue would need durable state.
  }
}

/** Fan out in bounded batches so a large subscriber list cannot exhaust subrequests. */
async function deliverAll(
  subs: Subscription[],
  topic: string,
  body: ArrayBuffer,
  contentType: string,
): Promise<void> {
  for (let i = 0; i < subs.length; i += DELIVER_CONCURRENCY) {
    await Promise.allSettled(
      subs
        .slice(i, i + DELIVER_CONCURRENCY)
        .map((s) => deliver(s, topic, body, contentType)),
    );
  }
}

// ------------------------------------------------------------- handlers

/**
 * `rel="hub"` should be dereferenceable — a bare 405 on GET tells a curious
 * subscriber nothing. Describes the endpoint and names the topics it serves.
 */
export const onRequestGet: PagesFunction<Env> = async () => {
  const body =
    "WebSub hub for specification.website\n" +
    "====================================\n\n" +
    "This is a self-hub: it distributes only this site's own feeds.\n\n" +
    "Spec:   https://www.w3.org/TR/websub/\n" +
    "Docs:   https://specification.website/spec/foundations/websub/\n\n" +
    "Topics served:\n" +
    Object.keys(ALLOWED_TOPICS)
      .map((t) => `  ${t}\n`)
      .join("") +
    "\nTo subscribe, POST application/x-www-form-urlencoded to this URL with\n" +
    "hub.mode=subscribe, hub.topic (one of the above), hub.callback, and\n" +
    "optionally hub.secret and hub.lease_seconds. You will receive a 202, then\n" +
    "a GET to your callback carrying hub.challenge, which you must echo.\n\n" +
    `Leases: default ${DEFAULT_LEASE_SECONDS}s, maximum ${MAX_LEASE_SECONDS}s. Re-subscribe to renew.\n` +
    "Callbacks must be https with a resolvable hostname.\n";
  return text(body, 200, { "Cache-Control": "public, max-age=3600" });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env, waitUntil } = context;

  const db = env.WEBSUB_DB;
  if (!db) {
    return text(
      "WebSub hub is not provisioned yet (no database binding).\n",
      503,
      { "Retry-After": "3600" },
    );
  }

  let form: URLSearchParams;
  try {
    form = new URLSearchParams(await request.text());
  } catch {
    return text("Malformed request body.\n", 400);
  }

  const mode = (form.get("hub.mode") ?? "").toLowerCase();
  // PubSubHubbub 0.4 publishers send the topic as hub.url; accept both.
  const topic = form.get("hub.topic") ?? form.get("hub.url") ?? "";

  if (!Object.prototype.hasOwnProperty.call(ALLOWED_TOPICS, topic)) {
    return text(
      "Unknown hub.topic. This hub serves only:\n" +
        Object.keys(ALLOWED_TOPICS)
          .map((t) => `  ${t}\n`)
          .join(""),
      404,
    );
  }

  if (mode === "publish") return handlePublish(context, db, topic);
  if (mode !== "subscribe" && mode !== "unsubscribe") {
    return text("hub.mode must be subscribe, unsubscribe, or publish.\n", 400);
  }

  const callback = form.get("hub.callback") ?? "";
  if (!isSafeCallback(callback)) {
    return text(
      "hub.callback must be an https URL with a resolvable public hostname " +
        "(no IP literals, no non-443 ports, no credentials).\n",
      400,
    );
  }

  const secret = form.get("hub.secret");
  if (secret !== null) {
    if (new TextEncoder().encode(secret).length >= MAX_SECRET_BYTES) {
      return text("hub.secret must be less than 200 bytes.\n", 400);
    }
    if (secret.length === 0) {
      return text("hub.secret, if given, must not be empty.\n", 400);
    }
  }

  const leaseSeconds = clampLease(form.get("hub.lease_seconds"));

  // Cap the subscriber list. Checked before the handshake so an attacker cannot
  // spend our subrequest budget once the table is full. An existing subscriber
  // renewing is always allowed through, since that is an update, not growth.
  if (mode === "subscribe") {
    try {
      const existing = await db
        .prepare(
          `SELECT 1 AS hit FROM subscriptions WHERE topic = ?1 AND callback = ?2`,
        )
        .bind(topic, callback)
        .first<{ hit: number }>();
      if (!existing) {
        const count = await db
          .prepare(
            `SELECT COUNT(*) AS n FROM subscriptions
             WHERE topic = ?1 AND lease_expires_at > ?2`,
          )
          .bind(topic, now())
          .first<{ n: number }>();
        if ((count?.n ?? 0) >= MAX_SUBSCRIBERS_PER_TOPIC) {
          return text(
            "This hub is at its subscriber limit for that topic.\n",
            503,
            { "Retry-After": "86400" },
          );
        }
      }
    } catch {
      return text("Subscription store unavailable.\n", 503, {
        "Retry-After": "300",
      });
    }
  }

  // WebSub §5.1: acknowledge with 202 and verify out of band.
  waitUntil(verifyAndApply(db, mode, topic, callback, secret, leaseSeconds));
  return text(
    `Accepted. Awaiting verification of intent at your callback.\n`,
    202,
  );
};

/**
 * Trigger a fan-out for one topic. Authenticated: only this site's deploy may
 * cause the hub to make outbound requests on demand.
 */
async function handlePublish(
  context: Parameters<PagesFunction<Env>>[0],
  db: D1Database,
  topic: string,
): Promise<Response> {
  const { request, env, waitUntil } = context;

  const expected = env.WEBSUB_PUBLISH_SECRET;
  if (!expected) {
    return text("Publishing is not configured on this hub.\n", 503);
  }
  const offered = (request.headers.get("authorization") ?? "").replace(
    /^Bearer\s+/i,
    "",
  );
  if (!offered || !timingSafeEqual(offered, expected)) {
    return text("Unauthorised.\n", 401, {
      "WWW-Authenticate": 'Bearer realm="websub-publish"',
    });
  }

  try {
    // Lazy lease enforcement — no cron trigger needed.
    await db
      .prepare(`DELETE FROM subscriptions WHERE lease_expires_at <= ?1`)
      .bind(now())
      .run();

    const { results } = await db
      .prepare(
        `SELECT callback, secret FROM subscriptions
         WHERE topic = ?1 AND lease_expires_at > ?2`,
      )
      .bind(topic, now())
      .all<Subscription>();
    const subs = results ?? [];

    if (subs.length === 0) {
      return text("No active subscribers for that topic.\n", 202);
    }

    // Read the topic through the asset binding rather than over the network:
    // both feeds are static files in dist, so this is a local read and cannot
    // loop back through the edge.
    const path = ALLOWED_TOPICS[topic];
    const upstream = await env.ASSETS.fetch(
      new URL(path, request.url).toString(),
    );
    if (!upstream.ok) {
      return text(`Could not read topic ${path}.\n`, 502);
    }
    const body = await upstream.arrayBuffer();
    const contentType =
      upstream.headers.get("content-type") ?? "application/rss+xml";

    waitUntil(deliverAll(subs, topic, body, contentType));
    return text(`Distributing to ${subs.length} subscriber(s).\n`, 202);
  } catch {
    return text("Subscription store unavailable.\n", 503, {
      "Retry-After": "300",
    });
  }
}
