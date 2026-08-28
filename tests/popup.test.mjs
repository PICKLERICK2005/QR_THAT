import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

class FakeElement {
  constructor() {
    this.attributes = {};
    this.checked = false;
    this.className = "";
    this.disabled = false;
    this.hidden = true;
    this.innerHTML = "";
    this.children = [];
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

  replaceChildren(...children) {
    this.children = children;
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
  importNode(node, deep) {
    assert.equal(deep, true);
    return { ...node, imported: true };
  },
  querySelector(selector) {
    return elements.get(selector);
  },
};
let svgParseCalls = 0;
let failSvgParsing = false;
globalThis.DOMParser = class {
  parseFromString(svgText, type) {
    svgParseCalls += 1;
    assert.equal(type, "image/svg+xml");
    assert.match(svgText, /^<svg\b/);
    const svg = failSvgParsing
      ? { nodeName: "parsererror", namespaceURI: null }
      : {
          nodeName: "svg",
          namespaceURI: "http://www.w3.org/2000/svg",
          source: svgText,
        };
    return {
      documentElement: svg,
      querySelector(selector) {
        assert.equal(selector, "parsererror");
        return failSvgParsing ? {} : null;
      },
    };
  }
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
assert.equal(elements.get("#qr-code").children.length, 1);
assert.equal(elements.get("#qr-code").children[0].nodeName, "svg");
assert.equal(elements.get("#qr-code").children[0].imported, true);

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
assert.equal(svgParseCalls, 2);

await advancedButton.dispatch("click");
assert.equal(advancedButton.getAttribute("aria-expanded"), "false");
assert.equal(advancedRegion.hidden, true);
assert.equal(fetchCalls, 0);

await elements.get("#open-settings").dispatch("click");
assert.equal(optionsPageCalls, 1);

failSvgParsing = true;
sanitize.checked = true;
await sanitize.dispatch("change");
assert.equal(elements.get("#qr-code").textContent, "Unable to generate QR code");

const popupSource = await readFile(new URL("../popup/popup.js", import.meta.url), "utf8");
assert.doesNotMatch(popupSource, /\.innerHTML\s*=/);
assert.equal(popupSource.match(/qrcode\(0, "M"\)/g)?.length, 1);
assert.match(popupSource, /gradeQr\(qr\.getModuleCount\(\)\)/);

console.log("Passed 35 popup integration checks.");
