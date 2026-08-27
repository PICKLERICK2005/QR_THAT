import { qrcode } from "../vendor/qrcode-generator/qrcode.mjs";
import { loadRules } from "../lib/rules.js";
import { sanitizeUrl } from "../lib/sanitizer.js";

const urlDisplay = document.querySelector("#page-url");
const qrDisplay = document.querySelector("#qr-code");
const sanitizeControl = document.querySelector("#sanitize");

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
  const rules = loadRules();

  const render = () => {
    const displayedUrl = sanitizeControl.checked
      ? sanitizeUrl(originalUrl, rules).resultUrl
      : originalUrl;

    urlDisplay.textContent = displayedUrl;
    qrDisplay.replaceChildren();

    try {
      const qr = qrcode(0, "M");
      qr.addData(displayedUrl);
      qr.make();
      qrDisplay.innerHTML = qr.createSvgTag({
        cellSize: 4,
        scalable: true,
        alt: "QR code for the selected URL",
      });
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
