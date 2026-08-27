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
  ["page-url", "qr-code", "url-kind", "sanitize", "open-settings"].map((id) => [
    `#${id}`,
    new FakeElement(),
  ]),
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
globalThis.browser = {
  runtime: {
    async sendMessage() { return null; },
    async openOptionsPage() { optionsPageCalls += 1; },
  },
  tabs: { async query() { return [{ url: trackingUrl }]; } },
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
assert.match(indicator.className, /url-kind-icon--link/);
assert.match(indicator.className, /qr-grade--green/);
assert.equal(elements.get("#page-url").textContent, "https://example.com/article?id=123");

sanitize.checked = false;
sanitize.dispatch("change");
assert.match(indicator.className, /url-kind-icon--link/);
assert.match(indicator.className, /qr-grade--red/);
assert.equal(elements.get("#page-url").textContent, trackingUrl);

await elements.get("#open-settings").dispatch("click");
assert.equal(optionsPageCalls, 1);

console.log("Passed 7 popup integration checks.");
