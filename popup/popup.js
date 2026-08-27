const urlDisplay = document.querySelector("#page-url");

browser.tabs
  .query({
    active: true,
    currentWindow: true,
  })
  .then(
    ([activeTab]) => {
      urlDisplay.textContent = activeTab?.url || "Unable to read this page";
    },
    () => {
      urlDisplay.textContent = "Unable to read this page";
    },
  );
