import assert from "node:assert/strict";

import { loadRules } from "../lib/rules.js";
import { sanitizeUrl } from "../lib/sanitizer.js";

const rules = loadRules();

const cases = [
  {
    name: "global tracking parameters",
    input: "https://example.com/article?id=123&utm_source=test&utm_medium=email#section",
    expected: "https://example.com/article?id=123#section",
  },
  {
    name: "clean URL",
    input: "https://example.com/article?id=123#section",
    expected: "https://example.com/article?id=123#section",
  },
  {
    name: "referral marketing default",
    input: "https://example.com/article?id=123&ref=partner",
    expected: "https://example.com/article?id=123",
  },
  {
    name: "YouTube sharing parameter",
    input: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&si=tracking",
    expected: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    name: "provider-specific query rule",
    input: "https://www.nytimes.com/article?id=123&smid=tw-share",
    expected: "https://www.nytimes.com/article?id=123",
  },
  {
    name: "provider exception",
    input: "https://www.youtube.com/signin?si=required",
    expected: "https://www.youtube.com/signin?si=required",
  },
  {
    name: "raw rule",
    input: "https://www.amazon.com/dp/example/ref=tracking?keep=1",
    expected: "https://www.amazon.com/dp/example?keep=1",
  },
  {
    name: "redirect wrapper and destination cleaning",
    input:
      "https://www.google.com/url?q=https%3A%2F%2Fexample.com%2Farticle%3Fid%3D123%26utm_source%3Dredirect",
    expected: "https://example.com/article?id=123",
  },
];

for (const testCase of cases) {
  assert.equal(sanitizeUrl(testCase.input, rules).resultUrl, testCase.expected, testCase.name);
}

const blocked = "https://adtech.com/pixel?utm_source=test";
const blockedResult = sanitizeUrl(blocked, rules);
assert.equal(blockedResult.resultUrl, blocked);
assert.equal(blockedResult.completeProvider, true);

const invalid = "not a URL";
assert.deepEqual(sanitizeUrl(invalid, rules), {
  originalUrl: invalid,
  resultUrl: invalid,
  changed: false,
  providers: [],
  completeProvider: false,
});

assert.equal(
  sanitizeUrl("https://example.com/?utm_source=test", {
    providers: { invalid: { urlPattern: "[" } },
  }).resultUrl,
  "https://example.com/?utm_source=test",
);

const doubleEncodedRedirect =
  "https://redirect.test/?target=https%253A%252F%252Fexample.com%252Fdestination";
assert.equal(
  sanitizeUrl(doubleEncodedRedirect, {
    providers: {
      redirect: {
        urlPattern: "^https://redirect\\.test/",
        redirections: ["target=([^&]+)"],
      },
    },
  }).resultUrl,
  doubleEncodedRedirect,
  "a redirection capture is decoded exactly once",
);

console.log(`Passed ${cases.length + 4} sanitizer checks.`);
