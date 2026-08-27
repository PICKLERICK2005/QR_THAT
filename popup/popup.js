import { qrcode } from "../vendor/qrcode-generator/qrcode.mjs";
import { gradeQr } from "../lib/qr-grade.js";
import { loadRules } from "../lib/rules.js";
import { sanitizeUrl } from "../lib/sanitizer.js";
import { classifyUrlKind } from "../lib/url-kind.js";
import { renderUrlKindIndicator } from "./url-kind-indicator.js";

const urlDisplay = document.querySelector("#page-url");
const qrDisplay = document.querySelector("#qr-code");
const urlKindIndicator = document.querySelector("#url-kind");
const sanitizeControl = document.querySelector("#sanitize");
const settingsButton = document.querySelector("#open-settings");

settingsButton.addEventListener("click", async () => {
  try {
    await browser.runtime.openOptionsPage();
  } catch {
    // Firefox owns the settings surface; no popup fallback is needed.
  }
});

let targetUrl = null;

try {
  targetUrl = await browser.runtime.sendMessage("consume-context-target");
} catch {
  // Fall back to the active tab if no contextual target is available.
}

if (!targetUrl) {
  try {
    const [activeTab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    targetUrl = activeTab?.url || null;
  } catch {
    // The fallback below handles tabs without a readable URL.
  }
}

if (targetUrl) {
  const originalUrl = targetUrl;
  const rules = await loadRules();

  const render = () => {
    const displayedUrl = sanitizeControl.checked
      ? sanitizeUrl(originalUrl, rules).resultUrl
      : originalUrl;

    urlDisplay.textContent = displayedUrl;
    qrDisplay.replaceChildren();
    const urlKind = classifyUrlKind(displayedUrl);
    renderUrlKindIndicator(urlKindIndicator, urlKind, null);

    try {
      const qr = qrcode(0, "M");
      qr.addData(displayedUrl);
      qr.make();
      const grade = gradeQr(qr.getModuleCount());
      qrDisplay.innerHTML = qr.createSvgTag({
        cellSize: 4,
        scalable: true,
        alt: "QR code for the selected URL",
      });
      renderUrlKindIndicator(urlKindIndicator, urlKind, grade);
    } catch {
      qrDisplay.textContent = "Unable to generate QR code";
    }
  };

  sanitizeControl.addEventListener("change", render);
  render();
} else {
  urlDisplay.textContent = "Unable to read this page";
  sanitizeControl.disabled = true;
}
