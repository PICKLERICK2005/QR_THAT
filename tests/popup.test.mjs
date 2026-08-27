import assert from "node:assert/strict";

class FakeElement {
  constructor() {
    this.attributes = {};
    this.checked = false;
    this.className = "";
    this.disabled = false;
    this.hidden = true;
    this.innerHTML = "";
    this.listeners = new Map();
    this.textContent = "";
    this.title = "";
    this.classList = {
      add: (className) => {
        this.className += ` ${className}`;
      },
    };
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  getAttribute(name) {
    return this.attributes[name];
  }

  async dispatch(type) {
    await this.listeners.get(type)?.();
  }

  removeAttribute(name) {
    delete this.attributes[name];
  }

  replaceChildren() {
    this.innerHTML = "";
    this.textContent = "";
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }
}

const elements = new Map(
  [
    "page-url",
    "qr-code",
    "url-kind",
    "sanitize",
    "open-settings",
    "advanced-toggle",
    "advanced-details",
    "advanced-original",
    "advanced-payload",
    "advanced-qr",
    "advanced-density",
    "advanced-sanitization",
    "advanced-rules",
  ].map((id) => [`#${id}`, new FakeElement()]),
);
const sanitize = elements.get("#sanitize");
sanitize.checked = true;

const trackingUrl =
  "https://example.com/article?id=123&" +
  Array.from({ length: 30 }, () => `utm_source=${"x".repeat(20)}`).join("&");

globalThis.document = {
  querySelector(selector) {
    return elements.get(selector);
  },
};
let optionsPageCalls = 0;
let tabQueries = 0;
let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("Unexpected network request");
};
globalThis.browser = {
  runtime: {
    async sendMessage(message) {
      return message === "consume-context-target" ? trackingUrl : null;
    },
    async openOptionsPage() { optionsPageCalls += 1; },
  },
  tabs: {
    async query() {
      tabQueries += 1;
      return [{ url: "https://underlying-page.example/" }];
    },
  },
  storage: {
    local: {
      async get(key) {
        return { [key]: undefined };
      },
    },
  },
};

await import("../popup/popup.js");

const indicator = elements.get("#url-kind");
const advancedButton = elements.get("#advanced-toggle");
const advancedRegion = elements.get("#advanced-details");
assert.match(indicator.className, /url-kind-icon--link/);
assert.match(indicator.className, /qr-grade--green/);
assert.equal(elements.get("#page-url").textContent, "https://example.com/article?id=123");
assert.equal(tabQueries, 0);
assert.equal(advancedButton.getAttribute("aria-expanded"), "false");
assert.equal(advancedRegion.hidden, true);
assert.equal(elements.get("#advanced-original").textContent, trackingUrl);
assert.equal(
  elements.get("#advanced-payload").textContent,
  "https://example.com/article?id=123",
);
assert.equal(elements.get("#advanced-qr").textContent, "Version 3 · 29×29 · ECC M");
assert.equal(elements.get("#advanced-density").textContent, "Low");
assert.equal(elements.get("#advanced-sanitization").textContent, "Changed");
assert.equal(elements.get("#advanced-rules").textContent, "Bundled");

await advancedButton.dispatch("click");
assert.equal(advancedButton.getAttribute("aria-expanded"), "true");
assert.equal(advancedRegion.hidden, false);
assert.equal(fetchCalls, 0);

sanitize.checked = false;
await sanitize.dispatch("change");
assert.match(indicator.className, /url-kind-icon--link/);
assert.match(indicator.className, /qr-grade--red/);
assert.equal(elements.get("#page-url").textContent, trackingUrl);
assert.equal(elements.get("#advanced-original").textContent, trackingUrl);
assert.equal(elements.get("#advanced-payload").textContent, trackingUrl);
assert.match(elements.get("#advanced-qr").textContent, /^Version \d+ · \d+×\d+ · ECC M$/);
assert.equal(elements.get("#advanced-density").textContent, "Very high");
assert.equal(elements.get("#advanced-sanitization").textContent, "Off");

await advancedButton.dispatch("click");
assert.equal(advancedButton.getAttribute("aria-expanded"), "false");
assert.equal(advancedRegion.hidden, true);
assert.equal(fetchCalls, 0);

await elements.get("#open-settings").dispatch("click");
assert.equal(optionsPageCalls, 1);

console.log("Passed 27 popup integration checks.");
