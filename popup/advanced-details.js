function setValue(element, value, fullValue = null) {
  element.textContent = value;
  if (fullValue) {
    element.title = fullValue;
  } else {
    element.removeAttribute("title");
  }
}

function formatRulesStatus(status) {
  if (status.source !== "fetched") {
    return "Bundled";
  }

  const date = new Date(status.fetchedAt);
  return Number.isNaN(date.getTime())
    ? "Fetched"
    : `Fetched · ${date.toLocaleDateString()}`;
}

export function renderAdvancedDetails(elements, metadata) {
  const { grade, originalUrl, payload, rulesStatus, sanitization } = metadata;

  setValue(elements.original, originalUrl, originalUrl);
  setValue(elements.payload, payload, payload);
  setValue(
    elements.qr,
    grade
      ? `Version ${grade.version} · ${grade.moduleCount}×${grade.moduleCount} · ECC M`
      : "Unavailable",
  );
  setValue(elements.density, grade?.label?.replace(/ density$/, "") || "Unavailable");
  setValue(
    elements.sanitization,
    sanitization.enabled
      ? sanitization.changed
        ? "Changed"
        : "Unchanged"
      : "Off",
  );
  setValue(elements.rules, formatRulesStatus(rulesStatus));
}

export function setAdvancedExpanded(button, region, expanded) {
  button.setAttribute("aria-expanded", String(expanded));
  button.setAttribute(
    "aria-label",
    expanded ? "Hide advanced details" : "Show advanced details",
  );
  button.title = expanded ? "Hide advanced details" : "Show advanced details";
  region.hidden = !expanded;
}

export function setupAdvancedDisclosure(button, region) {
  setAdvancedExpanded(button, region, false);
  button.addEventListener("click", () => {
    setAdvancedExpanded(button, region, button.getAttribute("aria-expanded") !== "true");
  });
}
