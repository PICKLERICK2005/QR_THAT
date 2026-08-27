const KINDS_BY_PROTOCOL = {
  "http:": { kind: "web", label: "Web URL", icon: "link" },
  "https:": { kind: "web", label: "Web URL", icon: "link" },
  "mailto:": { kind: "email", label: "Email link", icon: "mail" },
  "tel:": { kind: "phone", label: "Phone link", icon: "deskphone" },
  "sms:": { kind: "phone", label: "Phone link", icon: "deskphone" },
  "file:": { kind: "file", label: "File URI", icon: "files" },
  "about:": { kind: "internal", label: "Firefox internal URI", icon: "web" },
  "moz-extension:": {
    kind: "internal",
    label: "Firefox internal URI",
    icon: "web",
  },
};

const APP_KIND = { kind: "app", label: "App/deep link", icon: "link-2" };
const UNKNOWN_KIND = { kind: "unknown", label: "Unknown URI", icon: "link" };

export function classifyUrlKind(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return { ...UNKNOWN_KIND };
  }

  try {
    const { protocol } = new URL(value);
    return { ...(KINDS_BY_PROTOCOL[protocol] || APP_KIND) };
  } catch {
    return { ...UNKNOWN_KIND };
  }
}
