import bundledRules from "../rules/bundled/clearurls-data.minify.json" with {
  type: "json",
};
import { validateRulesCatalog } from "./sanitizer.js";

export const RULES_STORAGE_KEY = "clearurlsRules";
export const MANUAL_RULES_UPDATE_MESSAGE = "update-clearurls-rules";

function validateFetchedSnapshot(snapshot) {
  if (
    !snapshot ||
    typeof snapshot.sha256 !== "string" ||
    !/^[a-f0-9]{64}$/.test(snapshot.sha256) ||
    typeof snapshot.fetchedAt !== "string" ||
    (snapshot.source !== "rules1" && snapshot.source !== "rules2")
  ) {
    return null;
  }

  validateRulesCatalog(snapshot.catalog);
  return snapshot;
}

async function readFetchedSnapshot(storageArea) {
  if (!storageArea) {
    return null;
  }

  const stored = await storageArea.get(RULES_STORAGE_KEY);
  return validateFetchedSnapshot(stored[RULES_STORAGE_KEY]?.fetched);
}

export async function getRulesStatus(storageArea = globalThis.browser?.storage?.local) {
  try {
    const snapshot = await readFetchedSnapshot(storageArea);
    if (snapshot) {
      return {
        source: "fetched",
        fetchedAt: snapshot.fetchedAt,
        mirror: snapshot.source,
      };
    }
  } catch {
    // Invalid or unavailable fetched rules mean the bundled snapshot is active.
  }

  return { source: "bundled", fetchedAt: null };
}

export async function loadRules(storageArea = globalThis.browser?.storage?.local) {
  try {
    const snapshot = await readFetchedSnapshot(storageArea);
    if (snapshot) {
      return snapshot.catalog;
    }
  } catch {
    // Packaged rules remain available when storage is unavailable or corrupt.
  }

  return bundledRules;
}
