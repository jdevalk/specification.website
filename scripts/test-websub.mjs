// Assertions for the WebSub hub's security-relevant pure logic.
//
// Run with: npm run test:websub
//
// The hub in functions/websub.ts is the only code in this repo that makes
// outbound requests to URLs supplied by strangers, so the callback guard is
// worth pinning down with a table of cases rather than trusting a read-through.
// Deliberately plain node + node:assert — this repo has no test framework and
// does not need one for four pure functions.
//
// Only the pure helpers are covered. Subscribe/verify/distribute all need a
// D1 binding and a live callback, so they are exercised against the deployed
// hub (see the PR's verification steps), not here.

import assert from "node:assert/strict";
import {
  isSafeCallback,
  clampLease,
  timingSafeEqual,
  signPayload,
} from "../functions/websub.ts";

let failures = 0;

function check(label, actual, expected) {
  try {
    assert.deepStrictEqual(actual, expected);
    console.log(`  ok    ${label}`);
  } catch {
    failures++;
    console.log(`  FAIL  ${label} — got ${actual}, wanted ${expected}`);
  }
}

console.log("\nisSafeCallback — accepts ordinary subscriber callbacks");
for (const url of [
  "https://reader.example.com/websub/cb",
  "https://feeds.example.co.uk/cb?id=42",
  "https://a.b.c.example.org/x",
  "https://example.com:443/cb",
]) {
  check(url, isSafeCallback(url), true);
}

console.log("\nisSafeCallback — refuses everything that could reach inside");
for (const url of [
  "http://reader.example.com/cb", // not https
  "https://127.0.0.1/cb", // loopback literal
  "https://10.0.0.5/cb", // RFC 1918
  "https://192.168.1.1/cb", // RFC 1918
  "https://169.254.169.254/latest/meta-data/", // cloud metadata endpoint
  "https://2130706433/cb", // 127.0.0.1 as a decimal integer
  "https://[::1]/cb", // IPv6 loopback
  "https://localhost/cb", // single-label name
  "https://metadata/cb", // single-label name
  "https://db.internal/cb", // .internal
  "https://printer.local/cb", // mDNS
  "https://router.home.arpa/cb", // home network
  "https://example.com:8080/cb", // non-443 port
  "https://user:pw@example.com/cb", // embedded credentials
  "ftp://example.com/cb", // wrong scheme
  "javascript:alert(1)", // not a fetchable scheme
  "not a url",
  "",
]) {
  check(url || "(empty string)", isSafeCallback(url), false);
}

console.log("\nclampLease — WebSub forbids perpetual leases");
check("null → default", clampLease(null), 864000);
check("non-numeric → default", clampLease("abc"), 864000);
check("zero → default", clampLease("0"), 864000);
check("negative → default", clampLease("-5"), 864000);
check("below floor → floor", clampLease("60"), 3600);
check("above ceiling → ceiling", clampLease("99999999"), 2592000);
check("in range → unchanged", clampLease("86400"), 86400);

console.log("\ntimingSafeEqual — publish token comparison");
check("identical", timingSafeEqual("s3cret", "s3cret"), true);
check("last byte differs", timingSafeEqual("s3cret", "s3creT"), false);
check("offered is a prefix", timingSafeEqual("s3c", "s3cret"), false);
check("offered is longer", timingSafeEqual("s3cretXX", "s3cret"), false);
check("both empty", timingSafeEqual("", ""), true);
check("one empty", timingSafeEqual("", "x"), false);

console.log("\nsignPayload — HMAC-SHA256, RFC 4231 test case 2");
check(
  'key "Jefe"',
  await signPayload(
    "Jefe",
    new TextEncoder().encode("what do ya want for nothing?").buffer,
  ),
  "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843",
);

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed.`);
  process.exit(1);
}
console.log("\nAll WebSub hub assertions passed.\n");
