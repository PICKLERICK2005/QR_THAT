import assert from "node:assert/strict";

import {
  renderAdvancedDetails,
  setupAdvancedDisclosure,
} from "../popup/advanced-details.js";

class FakeElement {
  constructor() {
    this.attributes = {};
    this.hidden = false;
    this.listeners = new Map();
    this.textContent = "";
    this.title = "";
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  click() {
    this.listeners.get("click")?.();
  }

  getAttribute(name) {
    return this.attributes[name];
  }

  removeAttribute(name) {
    delete this.attributes[name];
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }
}

const button = new FakeElement();
const region = new FakeElement();
setupAdvancedDisclosure(button, region);
assert.equal(button.getAttribute("aria-expanded"), "false");
assert.equal(button.getAttribute("aria-label"), "Show advanced details");
assert.equal(region.hidden, true);

button.click();
assert.equal(button.getAttribute("aria-expanded"), "true");
assert.equal(button.title, "Hide advanced details");
assert.equal(region.hidden, false);

button.click();
assert.equal(button.getAttribute("aria-expanded"), "false");
assert.equal(region.hidden, true);

const elements = Object.fromEntries(
  ["original", "payload", "qr", "density", "sanitization", "rules"].map((name) => [
    name,
    new FakeElement(),
  ]),
);
const originalUrl = "https://example.com/?utm_source=test";
const payload = "https://example.com/";
renderAdvancedDetails(elements, {
  originalUrl,
  payload,
  grade: { level: "yellow", label: "Moderate density", moduleCount: 41, version: 6 },
  rulesStatus: { source: "bundled", fetchedAt: null },
  sanitization: { enabled: true, changed: true },
});
assert.equal(elements.original.textContent, originalUrl);
assert.equal(elements.original.title, originalUrl);
assert.equal(elements.payload.textContent, payload);
assert.equal(elements.payload.title, payload);
assert.equal(elements.qr.textContent, "Version 6 · 41×41 · ECC M");
assert.equal(elements.density.textContent, "Moderate");
assert.equal(elements.sanitization.textContent, "Changed");
assert.equal(elements.rules.textContent, "Bundled");

renderAdvancedDetails(elements, {
  originalUrl,
  payload: originalUrl,
  grade: null,
  rulesStatus: { source: "bundled", fetchedAt: null },
  sanitization: { enabled: false, changed: false },
});
assert.equal(elements.qr.textContent, "Unavailable");
assert.equal(elements.density.textContent, "Unavailable");
assert.equal(elements.sanitization.textContent, "Off");

renderAdvancedDetails(elements, {
  originalUrl: payload,
  payload,
  grade: { level: "green", label: "Low density", moduleCount: 29, version: 3 },
  rulesStatus: { source: "fetched", fetchedAt: "2026-08-27T00:00:00.000Z" },
  sanitization: { enabled: true, changed: false },
});
assert.equal(elements.sanitization.textContent, "Unchanged");
assert.match(elements.rules.textContent, /^Fetched · /);

console.log("Passed 21 advanced-details checks.");
