import bundledRules from "../rules/bundled/clearurls-data.minify.json" with {
  type: "json",
};
import { validateRulesCatalog } from "./sanitizer.js";

export const RULES_STORAGE_KEY = "clearurlsRules";

export async function loadRules(storageArea = globalThis.browser?.storage?.local) {
  try {
    if (!storageArea) {
      return bundledRules;
    }
    const stored = await storageArea.get(RULES_STORAGE_KEY);
    const snapshot = stored[RULES_STORAGE_KEY]?.fetched;

    if (
      snapshot &&
      typeof snapshot.sha256 === "string" &&
      /^[a-f0-9]{64}$/.test(snapshot.sha256) &&
      typeof snapshot.fetchedAt === "string" &&
      (snapshot.source === "rules1" || snapshot.source === "rules2")
    ) {
      validateRulesCatalog(snapshot.catalog);
      return snapshot.catalog;
    }
  } catch {
    // Packaged rules remain available when storage is unavailable or corrupt.
  }

  return bundledRules;
}
