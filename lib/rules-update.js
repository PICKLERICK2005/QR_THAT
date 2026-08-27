import { MANUAL_RULES_UPDATE_MESSAGE, RULES_STORAGE_KEY } from "./rules.js";
import { validateRulesCatalog } from "./sanitizer.js";

export const RULE_SOURCES = [
  {
    id: "rules2",
    catalogUrl: "https://rules2.clearurls.xyz/data.minify.json",
    hashUrl: "https://rules2.clearurls.xyz/rules.minify.hash",
  },
  {
    id: "rules1",
    catalogUrl: "https://rules1.clearurls.xyz/data.minify.json",
    hashUrl: "https://rules1.clearurls.xyz/rules.minify.hash",
  },
];

function bytesToHex(bytes) {
  return [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function fetchRulesCandidate(
  source,
  {
    fetchImpl = fetch,
    digestImpl = (bytes) => crypto.subtle.digest("SHA-256", bytes),
    now = () => new Date(),
  } = {},
) {
  const options = {
    cache: "no-store",
    credentials: "omit",
    redirect: "error",
    referrerPolicy: "no-referrer",
  };
  const catalogResponse = await fetchImpl(source.catalogUrl, options);
  if (!catalogResponse.ok) {
    throw new Error("Rules catalog request failed");
  }

  const hashResponse = await fetchImpl(source.hashUrl, options);
  if (!hashResponse.ok) {
    throw new Error("Rules hash request failed");
  }

  const catalogBytes = await catalogResponse.arrayBuffer();
  const publishedHash = (await hashResponse.text()).trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(publishedHash)) {
    throw new Error("Invalid published rules hash");
  }

  const actualHash = bytesToHex(await digestImpl(catalogBytes));
  if (actualHash !== publishedHash) {
    throw new Error("Rules hash mismatch");
  }

  const catalog = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(catalogBytes));
  validateRulesCatalog(catalog);

  return {
    catalog,
    sha256: actualHash,
    fetchedAt: now().toISOString(),
    source: source.id,
  };
}

export async function downloadRules(options = {}) {
  for (const source of RULE_SOURCES) {
    try {
      const snapshot = await fetchRulesCandidate(source, options);
      return { ok: true, snapshot };
    } catch {
      // Try the next official mirror.
    }
  }

  return { ok: false };
}

export async function updateRules({
  storageArea = globalThis.browser?.storage?.local,
  ...options
} = {}) {
  const candidate = await downloadRules(options);
  if (!candidate.ok) {
    return candidate;
  }

  try {
    const stored = await storageArea.get(RULES_STORAGE_KEY);
    const currentState = stored[RULES_STORAGE_KEY];
    const nextState =
      currentState && typeof currentState === "object" ? { ...currentState } : {};
    nextState.fetched = candidate.snapshot;
    await storageArea.set({ [RULES_STORAGE_KEY]: nextState });
    return candidate;
  } catch {
    return { ok: false };
  }
}

export function createSingleFlightRulesUpdater({ update = updateRules } = {}) {
  let pendingUpdate = null;

  return function runRulesUpdate(options) {
    if (!pendingUpdate) {
      pendingUpdate = Promise.resolve()
        .then(() => update(options))
        .finally(() => {
          pendingUpdate = null;
        });
    }

    return pendingUpdate;
  };
}

export const runRulesUpdate = createSingleFlightRulesUpdater();

export function createManualRulesUpdateHandler({ update = runRulesUpdate } = {}) {
  let pendingResult = null;

  return function handleManualRulesUpdate(message) {
    if (message !== MANUAL_RULES_UPDATE_MESSAGE) {
      return undefined;
    }

    if (!pendingResult) {
      pendingResult = update()
        .then((result) =>
          result.ok
            ? {
                ok: true,
                source: result.snapshot.source,
                fetchedAt: result.snapshot.fetchedAt,
              }
            : { ok: false },
        )
        .catch(() => ({ ok: false }))
        .finally(() => {
          pendingResult = null;
        });
    }

    return pendingResult;
  };
}

export async function attemptInitialRulesUpdate({
  storageArea = globalThis.browser?.storage?.local,
  update = runRulesUpdate,
  ...options
} = {}) {
  try {
    const stored = await storageArea.get(RULES_STORAGE_KEY);
    const currentState = stored[RULES_STORAGE_KEY];
    if (currentState?.initialFetchAttempted === true) {
      return { attempted: false };
    }

    const markedState =
      currentState && typeof currentState === "object" ? { ...currentState } : {};
    markedState.initialFetchAttempted = true;
    await storageArea.set({ [RULES_STORAGE_KEY]: markedState });
  } catch {
    return { attempted: false };
  }

  const result = await update({ storageArea, ...options });
  return { attempted: true, ...result };
}
