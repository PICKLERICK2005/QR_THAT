import assert from "node:assert/strict";

import { MANUAL_RULES_UPDATE_MESSAGE, RULES_STORAGE_KEY } from "../lib/rules.js";
import {
  createManualRulesUpdateHandler,
  createSingleFlightRulesUpdater,
  updateRules,
} from "../lib/rules-update.js";
import {
  getAutomaticRulesUpdates,
  handlePeriodicRulesAlarm,
  PERIODIC_RULES_ALARM,
  reconcileRulesSchedule,
  setAutomaticRulesUpdates,
  SETTINGS_STORAGE_KEY,
  WEEKLY_INTERVAL_MINUTES,
} from "../lib/rules-schedule.js";

function fakeStorage(initial = {}) {
  let state = structuredClone(initial);
  return {
    area: {
      async get(key) {
        return { [key]: structuredClone(state[key]) };
      },
      async set(values) {
        state = { ...state, ...structuredClone(values) };
      },
    },
    get state() {
      return state;
    },
  };
}

function fakeAlarms(initialAlarm = null) {
  let alarm = initialAlarm;
  const creates = [];
  const clears = [];
  return {
    api: {
      async get(name) {
        return alarm?.name === name ? structuredClone(alarm) : undefined;
      },
      create(name, details) {
        creates.push({ name, details });
        alarm = { name, ...details };
      },
      async clear(name) {
        clears.push(name);
        if (alarm?.name === name) {
          alarm = null;
          return true;
        }
        return false;
      },
    },
    get alarm() {
      return alarm;
    },
    creates,
    clears,
  };
}

const absentStorage = fakeStorage();
assert.equal(await getAutomaticRulesUpdates(absentStorage.area), false);

const offAlarms = fakeAlarms();
assert.equal(
  await reconcileRulesSchedule({ storageArea: absentStorage.area, alarms: offAlarms.api }),
  false,
);
assert.equal(offAlarms.alarm, null);

const onStorage = fakeStorage({
  [SETTINGS_STORAGE_KEY]: { automaticRulesUpdates: true },
});
const onAlarms = fakeAlarms();
let updateCalls = 0;
await reconcileRulesSchedule({ storageArea: onStorage.area, alarms: onAlarms.api });
assert.deepEqual(onAlarms.alarm, {
  name: PERIODIC_RULES_ALARM,
  delayInMinutes: WEEKLY_INTERVAL_MINUTES,
  periodInMinutes: WEEKLY_INTERVAL_MINUTES,
});
assert.equal(updateCalls, 0);

await reconcileRulesSchedule({ storageArea: onStorage.area, alarms: onAlarms.api });
assert.equal(onAlarms.creates.length, 1);

const toggleStorage = fakeStorage();
const toggleAlarms = fakeAlarms();
await setAutomaticRulesUpdates(true, {
  storageArea: toggleStorage.area,
  alarms: toggleAlarms.api,
});
assert.equal(toggleStorage.state[SETTINGS_STORAGE_KEY].automaticRulesUpdates, true);
assert.equal(toggleAlarms.creates.length, 1);
assert.equal(updateCalls, 0);

await setAutomaticRulesUpdates(false, {
  storageArea: toggleStorage.area,
  alarms: toggleAlarms.api,
});
assert.equal(toggleStorage.state[SETTINGS_STORAGE_KEY].automaticRulesUpdates, false);
assert.deepEqual(toggleAlarms.clears, [PERIODIC_RULES_ALARM]);
assert.equal(toggleAlarms.alarm, null);

const orphanedAlarm = fakeAlarms({ name: PERIODIC_RULES_ALARM });
await reconcileRulesSchedule({ storageArea: absentStorage.area, alarms: orphanedAlarm.api });
assert.equal(orphanedAlarm.alarm, null);

const alarmUpdate = async () => {
  updateCalls += 1;
  return { ok: false };
};
assert.deepEqual(
  await handlePeriodicRulesAlarm({ name: PERIODIC_RULES_ALARM }, alarmUpdate),
  { ok: false },
);
assert.equal(updateCalls, 1);
assert.equal(handlePeriodicRulesAlarm({ name: "unrelated" }, alarmUpdate), undefined);
assert.equal(updateCalls, 1);

let releaseUpdate;
let underlyingUpdates = 0;
const sharedUpdate = createSingleFlightRulesUpdater({
  update: () => {
    underlyingUpdates += 1;
    return new Promise((resolve) => {
      releaseUpdate = () => resolve({ ok: false });
    });
  },
});
const handleManualUpdate = createManualRulesUpdateHandler({ update: sharedUpdate });
const manualResult = handleManualUpdate(MANUAL_RULES_UPDATE_MESSAGE);
const periodicResult = handlePeriodicRulesAlarm(
  { name: PERIODIC_RULES_ALARM },
  sharedUpdate,
);
await Promise.resolve();
assert.equal(underlyingUpdates, 1);
releaseUpdate();
assert.deepEqual(await manualResult, { ok: false });
assert.deepEqual(await periodicResult, { ok: false });

const existingRules = {
  initialFetchAttempted: true,
  fetched: {
    catalog: { providers: {} },
    sha256: "a".repeat(64),
    fetchedAt: "old",
    source: "rules2",
  },
};
const failureStorage = fakeStorage({ [RULES_STORAGE_KEY]: existingRules });
const failedPeriodicResult = await handlePeriodicRulesAlarm(
  { name: PERIODIC_RULES_ALARM },
  () =>
    updateRules({
      storageArea: failureStorage.area,
      fetchImpl: async () => {
        throw new Error("offline");
      },
    }),
);
assert.deepEqual(failedPeriodicResult, { ok: false });
assert.deepEqual(failureStorage.state[RULES_STORAGE_KEY], existingRules);

const failingAlarms = {
  async get() {
    throw new Error("alarms unavailable");
  },
};
await assert.rejects(() =>
  setAutomaticRulesUpdates(true, {
    storageArea: fakeStorage().area,
    alarms: failingAlarms,
  }),
);

console.log("Passed 16 periodic rules update checks.");
