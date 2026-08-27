import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { classifyUrlKind } from "../lib/url-kind.js";
import { renderUrlKindIndicator } from "../popup/url-kind-indicator.js";

const cases = [
  ["https://example.com", "web", "Web URL", "link"],
  ["http://example.com", "web", "Web URL", "link"],
  ["mailto:user@example.com", "email", "Email link", "mail"],
  ["tel:+123456789", "phone", "Phone link", "deskphone"],
  ["sms:+123456789", "phone", "Phone link", "deskphone"],
  ["file:///tmp/example.txt", "file", "File URI", "files"],
  ["about:config", "internal", "Firefox internal URI", "web"],
  ["moz-extension://example/page.html", "internal", "Firefox internal URI", "web"],
  ["spotify:track:123", "app", "App/deep link", "link-2"],
  ["steam://run/123", "app", "App/deep link", "link-2"],
  ["customscheme:value", "app", "App/deep link", "link-2"],
  ["malformed/no-scheme input", "unknown", "Unknown URI", "link"],
  ["https://open.spotify.com/track/123", "web", "Web URL", "link"],
  ["https://youtube.com/watch?v=123", "web", "Web URL", "link"],
];

for (const [value, kind, label, icon] of cases) {
  assert.deepEqual(classifyUrlKind(value), { kind, label, icon });
}

class FakeClassList {
  constructor(element) {
    this.element = element;
  }

  add(className) {
    this.element.className += ` ${className}`;
  }
}

function fakeElement() {
  return {
    className: "",
    classList: null,
    hidden: true,
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    title: "",
  };
}

function render(value, grade) {
  const element = fakeElement();
  element.classList = new FakeClassList(element);
  renderUrlKindIndicator(element, classifyUrlKind(value), grade);
  return element;
}

const greenWeb = render("https://example.com", { level: "green", label: "Low density" });
assert.match(greenWeb.className, /url-kind-icon--link/);
assert.match(greenWeb.className, /qr-grade--green/);
assert.equal(greenWeb.attributes["aria-label"], "Web URL — QR density: Low");

const yellowEmail = render("mailto:user@example.com", {
  level: "yellow",
  label: "Moderate density",
});
assert.match(yellowEmail.className, /url-kind-icon--mail/);
assert.match(yellowEmail.className, /qr-grade--yellow/);

const redApp = render("spotify:track:123", {
  level: "red",
  label: "Very high density",
});
assert.match(redApp.className, /url-kind-icon--link-2/);
assert.match(redApp.className, /qr-grade--red/);

const gradedUnknown = render("not a URI", { level: "orange", label: "High density" });
assert.match(gradedUnknown.className, /url-kind-icon--link/);
assert.match(gradedUnknown.className, /qr-grade--orange/);

const neutralWeb = render("https://example.com", null);
assert.equal(neutralWeb.className, "url-kind-icon url-kind-icon--link");
assert.equal(neutralWeb.title, "Web URL — QR density: unavailable");

renderUrlKindIndicator(
  greenWeb,
  classifyUrlKind("https://example.com"),
  { level: "red", label: "Very high density" },
);
assert.doesNotMatch(greenWeb.className, /qr-grade--green/);
assert.match(greenWeb.className, /qr-grade--red/);

const popupMarkup = await readFile(new URL("../popup/popup.html", import.meta.url), "utf8");
assert.doesNotMatch(popupMarkup, /id="qr-grade"/);
assert.match(popupMarkup, /id="url-kind"/);

console.log("Passed 21 URL-kind indicator checks.");
