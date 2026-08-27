import {
  attemptInitialRulesUpdate,
  createManualRulesUpdateHandler,
} from "./lib/rules-update.js";

const MENU_ID = "qr-that";
let pendingTarget = null;
const handleManualRulesUpdate = createManualRulesUpdateHandler();

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
  const updateResult = handleManualRulesUpdate(message);
  if (updateResult) {
    return updateResult;
  }

  if (message !== "consume-context-target") {
    return undefined;
  }

  const target = pendingTarget;
  pendingTarget = null;
  return Promise.resolve(target);
});
