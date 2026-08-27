import { qrcode } from "../vendor/qrcode-generator/qrcode.mjs";

const urlDisplay = document.querySelector("#page-url");
const qrDisplay = document.querySelector("#qr-code");

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
  urlDisplay.textContent = targetUrl;

  try {
    const qr = qrcode(0, "M");
    qr.addData(targetUrl);
    qr.make();
    qrDisplay.innerHTML = qr.createSvgTag({
      cellSize: 4,
      scalable: true,
      alt: "QR code for the selected URL",
    });
  } catch {
    qrDisplay.textContent = "Unable to generate QR code";
  }
} else {
  urlDisplay.textContent = "Unable to read this page";
}
