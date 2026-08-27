export function renderUrlKindIndicator(element, urlKind, grade) {
  const density = grade?.label?.replace(/ density$/, "") || "unavailable";
  const accessibleLabel = `${urlKind.label} — QR density: ${density}`;

  element.className = `url-kind-icon url-kind-icon--${urlKind.icon}`;
  if (grade) {
    element.classList.add(`qr-grade--${grade.level}`);
  }
  element.title = accessibleLabel;
  element.setAttribute("aria-label", accessibleLabel);
  element.hidden = false;
}
