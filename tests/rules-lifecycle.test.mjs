import assert from "node:assert/strict";

import {
  getRulesStatus,
  loadRules,
  MANUAL_RULES_UPDATE_MESSAGE,
  RULES_STORAGE_KEY,
} from "../lib/rules.js";
import {
  attemptInitialRulesUpdate,
  createManualRulesUpdateHandler,
  downloadRules,
  fetchRulesCandidate,
  RULE_SOURCES,
  updateRules,
} from "../lib/rules-update.js";

function makeCatalog(label) {
  return {
    providers: Object.fromEntries(
      Array.from({ length: 10 }, (_, index) => [
        `${label}-${index}`,
        {
          urlPattern: `^https://provider-${index}\\.example/`,
          rules: ["tracking"],
        },
      ]),
    ),
  };
}

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function fakeFetch(responses, calls = []) {
  return async (url, options) => {
    calls.push({ url, options });
    const response = responses.get(url);
    if (response instanceof Error) {
      throw response;
    }
    return response || new Response("missing", { status: 404 });
  };
}

async function validResponses(source, catalog) {
  const text = JSON.stringify(catalog);
  const hash = await sha256(text);
  return new Map([
    [source.catalogUrl, new Response(text)],
    [source.hashUrl, new Response(`${hash}\n`)],
  ]);
}

function fakeStorage(initialState) {
  let state = structuredClone(initialState);
  let writes = 0;
  return {
    area: {
      async get() {
        return { [RULES_STORAGE_KEY]: structuredClone(state) };
      },
      async set(value) {
        state = structuredClone(value[RULES_STORAGE_KEY]);
        writes += 1;
      },
    },
    get state() {
      return state;
    },
    get writes() {
      return writes;
    },
  };
}

const primaryCatalog = makeCatalog("primary");
const primaryResponses = await validResponses(RULE_SOURCES[0], primaryCatalog);
const requestCalls = [];
const accepted = await fetchRulesCandidate(RULE_SOURCES[0], {
  fetchImpl: fakeFetch(primaryResponses, requestCalls),
  now: () => new Date("2026-08-27T00:00:00.000Z"),
});
assert.deepEqual(accepted.catalog, primaryCatalog);
assert.equal(accepted.source, "rules2");
assert.equal(accepted.fetchedAt, "2026-08-27T00:00:00.000Z");
assert.ok(
  requestCalls.every(
    ({ options }) =>
      options.credentials === "omit" &&
      options.cache === "no-store" &&
      options.redirect === "error" &&
      options.referrerPolicy === "no-referrer",
  ),
);

const mismatched = await validResponses(RULE_SOURCES[0], primaryCatalog);
mismatched.set(RULE_SOURCES[0].hashUrl, new Response("0".repeat(64)));
await assert.rejects(() =>
  fetchRulesCandidate(RULE_SOURCES[0], { fetchImpl: fakeFetch(mismatched) }),
);

const invalidHash = await validResponses(RULE_SOURCES[0], primaryCatalog);
invalidHash.set(RULE_SOURCES[0].hashUrl, new Response("not-a-hash"));
await assert.rejects(() =>
  fetchRulesCandidate(RULE_SOURCES[0], { fetchImpl: fakeFetch(invalidHash) }),
);

const malformedText = "{not json";
const malformedResponses = new Map([
  [RULE_SOURCES[0].catalogUrl, new Response(malformedText)],
  [RULE_SOURCES[0].hashUrl, new Response(await sha256(malformedText))],
]);
await assert.rejects(() =>
  fetchRulesCandidate(RULE_SOURCES[0], { fetchImpl: fakeFetch(malformedResponses) }),
);

const invalidCatalogText = JSON.stringify({ providers: {} });
const invalidCatalogResponses = new Map([
  [RULE_SOURCES[0].catalogUrl, new Response(invalidCatalogText)],
  [RULE_SOURCES[0].hashUrl, new Response(await sha256(invalidCatalogText))],
]);
await assert.rejects(() =>
  fetchRulesCandidate(RULE_SOURCES[0], {
    fetchImpl: fakeFetch(invalidCatalogResponses),
  }),
);

const primarySuccess = await downloadRules({
  fetchImpl: fakeFetch(await validResponses(RULE_SOURCES[0], primaryCatalog)),
});
assert.equal(primarySuccess.ok, true);
assert.equal(primarySuccess.snapshot.source, "rules2");

const secondaryCatalog = makeCatalog("secondary");
const fallbackResponses = await validResponses(RULE_SOURCES[1], secondaryCatalog);
fallbackResponses.set(RULE_SOURCES[0].catalogUrl, new Response("failed", { status: 500 }));
const secondarySuccess = await downloadRules({
  fetchImpl: fakeFetch(fallbackResponses),
});
assert.equal(secondarySuccess.ok, true);
assert.equal(secondarySuccess.snapshot.source, "rules1");

const bothFailed = await downloadRules({ fetchImpl: async () => { throw new Error("offline"); } });
assert.deepEqual(bothFailed, { ok: false });

const existingSnapshot = {
  initialFetchAttempted: true,
  fetched: { catalog: primaryCatalog, sha256: "a".repeat(64), fetchedAt: "old", source: "rules2" },
};
const retainedStorage = fakeStorage(existingSnapshot);
const failedUpdate = await updateRules({
  storageArea: retainedStorage.area,
  fetchImpl: async () => { throw new Error("offline"); },
});
assert.equal(failedUpdate.ok, false);
assert.deepEqual(retainedStorage.state, existingSnapshot);
assert.equal(retainedStorage.writes, 0);

const replacedStorage = fakeStorage(existingSnapshot);
const successfulUpdate = await updateRules({
  storageArea: replacedStorage.area,
  fetchImpl: fakeFetch(await validResponses(RULE_SOURCES[0], secondaryCatalog)),
});
assert.equal(successfulUpdate.ok, true);
assert.deepEqual(replacedStorage.state.fetched.catalog, secondaryCatalog);
assert.equal(replacedStorage.writes, 1);

assert.deepEqual(await loadRules(replacedStorage.area), secondaryCatalog);
assert.equal(Object.keys((await loadRules(fakeStorage(undefined).area)).providers).length, 206);
assert.equal(
  Object.keys((await loadRules(fakeStorage({ fetched: { catalog: {} } }).area)).providers).length,
  206,
);
assert.equal(
  Object.keys(
    (await loadRules({ async get() { throw new Error("unavailable"); } })).providers,
  ).length,
  206,
);

const initialStorage = fakeStorage(undefined);
let initialUpdates = 0;
const update = async () => {
  initialUpdates += 1;
  return { ok: false };
};
assert.equal(
  (await attemptInitialRulesUpdate({ storageArea: initialStorage.area, update })).attempted,
  true,
);
assert.equal(
  (await attemptInitialRulesUpdate({ storageArea: initialStorage.area, update })).attempted,
  false,
);
assert.equal(initialUpdates, 1);
assert.equal(initialStorage.state.initialFetchAttempted, true);

assert.deepEqual(await getRulesStatus(replacedStorage.area), {
  source: "fetched",
  fetchedAt: replacedStorage.state.fetched.fetchedAt,
  mirror: "rules2",
});
assert.deepEqual(await getRulesStatus(fakeStorage(undefined).area), {
  source: "bundled",
  fetchedAt: null,
});
assert.deepEqual(await getRulesStatus(fakeStorage({ fetched: { catalog: {} } }).area), {
  source: "bundled",
  fetchedAt: null,
});

let manualCalls = 0;
let manualArguments = null;
const handleSuccessfulManualUpdate = createManualRulesUpdateHandler({
  update: async (...args) => {
    manualCalls += 1;
    manualArguments = args;
    return { ok: true, snapshot: accepted };
  },
});
assert.deepEqual(await handleSuccessfulManualUpdate(MANUAL_RULES_UPDATE_MESSAGE), {
  ok: true,
  source: "rules2",
  fetchedAt: "2026-08-27T00:00:00.000Z",
});
assert.equal(manualCalls, 1);
assert.deepEqual(manualArguments, []);
assert.equal(
  handleSuccessfulManualUpdate({
    type: MANUAL_RULES_UPDATE_MESSAGE,
    url: "https://attacker.example/rules.json",
  }),
  undefined,
);

let releaseUpdate;
let simultaneousCalls = 0;
const handleSimultaneousManualUpdate = createManualRulesUpdateHandler({
  update: () => {
    simultaneousCalls += 1;
    return new Promise((resolve) => {
      releaseUpdate = () => resolve({ ok: false });
    });
  },
});
const firstManualUpdate = handleSimultaneousManualUpdate(MANUAL_RULES_UPDATE_MESSAGE);
const secondManualUpdate = handleSimultaneousManualUpdate(MANUAL_RULES_UPDATE_MESSAGE);
await Promise.resolve();
assert.equal(simultaneousCalls, 1);
assert.equal(firstManualUpdate, secondManualUpdate);
releaseUpdate();
assert.deepEqual(await firstManualUpdate, { ok: false });

const manualFailureStorage = fakeStorage(existingSnapshot);
const handleFailedManualUpdate = createManualRulesUpdateHandler({
  update: () =>
    updateRules({
      storageArea: manualFailureStorage.area,
      fetchImpl: async () => {
        throw new Error("offline");
      },
    }),
});
assert.deepEqual(await handleFailedManualUpdate(MANUAL_RULES_UPDATE_MESSAGE), { ok: false });
assert.deepEqual(manualFailureStorage.state, existingSnapshot);
assert.equal(manualFailureStorage.writes, 0);

const bundledFailureStorage = fakeStorage({ initialFetchAttempted: true });
const handleBundledManualUpdate = createManualRulesUpdateHandler({
  update: () =>
    updateRules({
      storageArea: bundledFailureStorage.area,
      fetchImpl: async () => {
        throw new Error("offline");
      },
    }),
});
assert.deepEqual(await handleBundledManualUpdate(MANUAL_RULES_UPDATE_MESSAGE), { ok: false });
assert.deepEqual(bundledFailureStorage.state, { initialFetchAttempted: true });
assert.equal(bundledFailureStorage.writes, 0);

const manualRecoveryStorage = fakeStorage({ initialFetchAttempted: true });
const recoveryResponses = await validResponses(RULE_SOURCES[0], primaryCatalog);
const handleManualRecovery = createManualRulesUpdateHandler({
  update: () =>
    updateRules({
      storageArea: manualRecoveryStorage.area,
      fetchImpl: fakeFetch(recoveryResponses),
    }),
});
assert.equal((await handleManualRecovery(MANUAL_RULES_UPDATE_MESSAGE)).ok, true);
assert.equal(manualRecoveryStorage.state.initialFetchAttempted, true);
assert.equal((await getRulesStatus(manualRecoveryStorage.area)).source, "fetched");

console.log("Passed 24 rules lifecycle checks.");
