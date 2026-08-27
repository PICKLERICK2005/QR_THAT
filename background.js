import { attemptInitialRulesUpdate } from "./lib/rules-update.js";

const MENU_ID = "qr-that";
let pendingTarget = null;

browser.runtime.onInstalled.addListener(async (details) => {
  browser.menus.create({
    id: MENU_ID,
    title: "QR THAT!",
    contexts: ["page", "link", "image"],
  });

  if (details.reason === "install") {
    await attemptInitialRulesUpdate();
  }
});

browser.menus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== MENU_ID) {
    return;
  }

  pendingTarget = info.linkUrl || info.srcUrl || info.pageUrl || null;

  try {
    await browser.action.openPopup();
  } catch {
    pendingTarget = null;
  }
});

browser.runtime.onMessage.addListener((message) => {
  if (message !== "consume-context-target") {
    return undefined;
  }

  const target = pendingTarget;
  pendingTarget = null;
  return Promise.resolve(target);
});
