import { qrcode } from "../vendor/qrcode-generator/qrcode.mjs";

const urlDisplay = document.querySelector("#page-url");
const qrDisplay = document.querySelector("#qr-code");

try {
  const [activeTab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (activeTab?.url) {
    urlDisplay.textContent = activeTab.url;

    try {
      const qr = qrcode(0, "M");
      qr.addData(activeTab.url);
      qr.make();
      qrDisplay.innerHTML = qr.createSvgTag({
        cellSize: 4,
        scalable: true,
        alt: "QR code for the active tab URL",
      });
    } catch {
      qrDisplay.textContent = "Unable to generate QR code";
    }
  } else {
    urlDisplay.textContent = "Unable to read this page";
  }
} catch {
  urlDisplay.textContent = "Unable to read this page";
}
