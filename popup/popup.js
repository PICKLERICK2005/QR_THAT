import { qrcode } from "../vendor/qrcode-generator/qrcode.mjs";
import { gradeQr } from "../lib/qr-grade.js";
import { getRulesStatus, loadRules } from "../lib/rules.js";
import { sanitizeUrl } from "../lib/sanitizer.js";
import { classifyUrlKind } from "../lib/url-kind.js";
import {
  renderAdvancedDetails,
  setupAdvancedDisclosure,
} from "./advanced-details.js";
import { renderUrlKindIndicator } from "./url-kind-indicator.js";

const urlDisplay = document.querySelector("#page-url");
const qrDisplay = document.querySelector("#qr-code");
const urlKindIndicator = document.querySelector("#url-kind");
const sanitizeControl = document.querySelector("#sanitize");
const settingsButton = document.querySelector("#open-settings");
const advancedButton = document.querySelector("#advanced-toggle");
const advancedRegion = document.querySelector("#advanced-details");
const advancedElements = {
  original: document.querySelector("#advanced-original"),
  payload: document.querySelector("#advanced-payload"),
  qr: document.querySelector("#advanced-qr"),
  density: document.querySelector("#advanced-density"),
  sanitization: document.querySelector("#advanced-sanitization"),
  rules: document.querySelector("#advanced-rules"),
};

setupAdvancedDisclosure(advancedButton, advancedRegion);

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
  const [rules, rulesStatus] = await Promise.all([loadRules(), getRulesStatus()]);

  const render = () => {
    const sanitization = sanitizeControl.checked
      ? sanitizeUrl(originalUrl, rules)
      : { resultUrl: originalUrl, changed: false };
    const displayedUrl = sanitization.resultUrl;

    urlDisplay.textContent = displayedUrl;
    qrDisplay.replaceChildren();
    const urlKind = classifyUrlKind(displayedUrl);
    renderUrlKindIndicator(urlKindIndicator, urlKind, null);
    const metadata = {
      originalUrl,
      payload: displayedUrl,
      grade: null,
      rulesStatus,
      sanitization: {
        enabled: sanitizeControl.checked,
        changed: sanitization.changed,
      },
    };
    renderAdvancedDetails(advancedElements, metadata);

    try {
      const qr = qrcode(0, "M");
      qr.addData(displayedUrl);
      qr.make();
      const grade = gradeQr(qr.getModuleCount());
      const svgText = qr.createSvgTag({
        cellSize: 4,
        scalable: true,
        alt: "QR code for the selected URL",
      });
      const svgDocument = new DOMParser().parseFromString(svgText, "image/svg+xml");
      const svg = svgDocument.documentElement;
      if (
        svg.nodeName.toLowerCase() !== "svg" ||
        svg.namespaceURI !== "http://www.w3.org/2000/svg" ||
        svgDocument.querySelector("parsererror")
      ) {
        throw new Error("Invalid QR SVG");
      }
      qrDisplay.replaceChildren(document.importNode(svg, true));
      renderUrlKindIndicator(urlKindIndicator, urlKind, grade);
      renderAdvancedDetails(advancedElements, { ...metadata, grade });
    } catch {
      qrDisplay.textContent = "Unable to generate QR code";
    }
  };

  sanitizeControl.addEventListener("change", render);
  render();
} else {
  urlDisplay.textContent = "Unable to read this page";
  sanitizeControl.disabled = true;
  advancedButton.disabled = true;
  advancedButton.title = "Advanced details unavailable";
  advancedButton.setAttribute("aria-label", "Advanced details unavailable");
}
