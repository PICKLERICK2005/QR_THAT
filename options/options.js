const shortcutValue = document.querySelector("#shortcut-value");
const configureButton = document.querySelector("#configure-shortcut");
const shortcutError = document.querySelector("#shortcut-error");

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

window.addEventListener("focus", refreshShortcut);
refreshShortcut();
