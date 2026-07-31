-- WebSub hub — subscription store for functions/websub.ts.
--
-- Apply with:
--   npx wrangler d1 migrations apply specification-website-websub --remote
--
-- One row per (topic, callback) pair. The pair is the identity WebSub keys
-- subscriptions on: the same subscriber may hold subscriptions to several
-- topics, and several subscribers may share a topic, but a given callback has
-- at most one subscription per topic. Re-subscribing overrides the previous
-- state for that pair (WebSub §5.1), which is what the primary key gives us
-- for free via INSERT ... ON CONFLICT.
--
-- `secret` is the subscriber-supplied hub.secret used to HMAC each delivery.
-- It is optional, and it is *their* secret, not ours — we store it only because
-- the protocol requires signing with it. Never logged, never returned.
--
-- `lease_expires_at` and `created_at` are unix epoch seconds. Leases are
-- enforced lazily: expired rows are deleted at distribution time rather than
-- by a scheduled sweep, so the hub needs no cron trigger. WebSub forbids
-- perpetual leases, so there is no null/sentinel "never expires" value.

CREATE TABLE IF NOT EXISTS subscriptions (
  topic            TEXT    NOT NULL,
  callback         TEXT    NOT NULL,
  secret           TEXT,
  lease_expires_at INTEGER NOT NULL,
  created_at       INTEGER NOT NULL,
  PRIMARY KEY (topic, callback)
);

-- Distribution reads active subscribers for one topic; expiry deletes by
-- lease. Both are covered by this composite index.
CREATE INDEX IF NOT EXISTS idx_subscriptions_topic_lease
  ON subscriptions (topic, lease_expires_at);
