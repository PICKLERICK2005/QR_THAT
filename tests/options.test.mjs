import assert from "node:assert/strict";

class FakeElement {
  constructor() {
    this.checked = false;
    this.disabled = false;
    this.hidden = false;
    this.textContent = "";
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  async dispatch(type) {
    await this.listeners.get(type)?.();
  }
}

const elements = new Map(
  [
    "shortcut-value",
    "configure-shortcut",
    "shortcut-error",
    "rules-source",
    "rules-fetched-at",
    "fetch-rules",
    "rules-result",
    "automatic-rules-updates",
    "automatic-updates-error",
  ].map((id) => [`#${id}`, new FakeElement()]),
);

let settings = undefined;
let failSettingsWrite = false;
globalThis.document = {
  querySelector(selector) {
    return elements.get(selector);
  },
};
globalThis.window = { addEventListener() {} };
globalThis.browser = {
  commands: {
    async getAll() {
      return [{ name: "_execute_action", shortcut: "Ctrl+Shift+Period" }];
    },
    async openShortcutSettings() {},
  },
  runtime: { async sendMessage() { return { ok: false }; } },
  storage: {
    local: {
      async get(key) {
        if (key === "qrThatSettings") {
          return { qrThatSettings: structuredClone(settings) };
        }
        return { [key]: undefined };
      },
      async set(value) {
        if (failSettingsWrite) {
          throw new Error("storage unavailable");
        }
        settings = structuredClone(value.qrThatSettings);
      },
    },
  },
  alarms: {
    async get() {
      return undefined;
    },
    create() {},
    async clear() {
      return false;
    },
  },
};

await import("../options/options.js");
await new Promise((resolve) => setTimeout(resolve, 0));

const checkbox = elements.get("#automatic-rules-updates");
const error = elements.get("#automatic-updates-error");
assert.equal(checkbox.checked, false);

checkbox.checked = true;
failSettingsWrite = true;
await checkbox.dispatch("change");
assert.equal(checkbox.checked, false);
assert.equal(checkbox.disabled, false);
assert.equal(error.hidden, false);
assert.equal(error.textContent, "Unable to save automatic update setting.");

console.log("Passed 2 automatic-update options checks.");
