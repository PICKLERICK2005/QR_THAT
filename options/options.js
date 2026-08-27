import { getRulesStatus, MANUAL_RULES_UPDATE_MESSAGE } from "../lib/rules.js";

const shortcutValue = document.querySelector("#shortcut-value");
const configureButton = document.querySelector("#configure-shortcut");
const shortcutError = document.querySelector("#shortcut-error");
const rulesSource = document.querySelector("#rules-source");
const rulesFetchedAt = document.querySelector("#rules-fetched-at");
const fetchRulesButton = document.querySelector("#fetch-rules");
const rulesResult = document.querySelector("#rules-result");

async function refreshShortcut() {
  try {
    const commands = await browser.commands.getAll();
    const actionCommand = commands.find(({ name }) => name === "_execute_action");
    shortcutValue.textContent = actionCommand?.shortcut
      ? actionCommand.shortcut.split("+").join(" + ")
      : "Not assigned";
  } catch {
    shortcutValue.textContent = "Unavailable";
  }
}

async function refreshRulesStatus() {
  const status = await getRulesStatus();
  rulesSource.textContent = status.source === "fetched" ? "Fetched rules" : "Bundled rules";
  rulesFetchedAt.textContent = status.fetchedAt
    ? new Date(status.fetchedAt).toLocaleString()
    : "—";
}

configureButton.addEventListener("click", async () => {
  configureButton.disabled = true;
  shortcutError.hidden = true;

  try {
    await browser.commands.openShortcutSettings();
  } catch {
    shortcutError.textContent = "Unable to open Firefox shortcut settings.";
    shortcutError.hidden = false;
  } finally {
    configureButton.disabled = false;
  }
});

fetchRulesButton.addEventListener("click", async () => {
  if (fetchRulesButton.disabled) {
    return;
  }

  fetchRulesButton.disabled = true;
  fetchRulesButton.textContent = "Fetching…";
  rulesResult.hidden = true;

  try {
    const result = await browser.runtime.sendMessage(MANUAL_RULES_UPDATE_MESSAGE);
    if (!result?.ok) {
      throw new Error("Rules update failed");
    }

    await refreshRulesStatus();
    rulesResult.textContent = "Rules updated.";
  } catch {
    rulesResult.textContent = "Couldn't update rules. Existing rules are still in use.";
  } finally {
    rulesResult.hidden = false;
    fetchRulesButton.textContent = "Fetch rules";
    fetchRulesButton.disabled = false;
  }
});

window.addEventListener("focus", refreshShortcut);
refreshShortcut();
refreshRulesStatus();
