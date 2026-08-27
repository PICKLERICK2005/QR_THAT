import { runRulesUpdate } from "./rules-update.js";

export const SETTINGS_STORAGE_KEY = "qrThatSettings";
export const PERIODIC_RULES_ALARM = "clearurls-periodic-update";
export const WEEKLY_INTERVAL_MINUTES = 10080;

export async function getAutomaticRulesUpdates(
  storageArea = globalThis.browser?.storage?.local,
) {
  const stored = await storageArea.get(SETTINGS_STORAGE_KEY);
  return stored[SETTINGS_STORAGE_KEY]?.automaticRulesUpdates === true;
}

export async function reconcileRulesSchedule({
  storageArea = globalThis.browser?.storage?.local,
  alarms = globalThis.browser?.alarms,
} = {}) {
  const enabled = await getAutomaticRulesUpdates(storageArea);
  const alarm = await alarms.get(PERIODIC_RULES_ALARM);

  if (enabled && !alarm) {
    alarms.create(PERIODIC_RULES_ALARM, {
      delayInMinutes: WEEKLY_INTERVAL_MINUTES,
      periodInMinutes: WEEKLY_INTERVAL_MINUTES,
    });
  } else if (!enabled && alarm) {
    await alarms.clear(PERIODIC_RULES_ALARM);
  }

  return enabled;
}

export async function setAutomaticRulesUpdates(
  enabled,
  {
    storageArea = globalThis.browser?.storage?.local,
    alarms = globalThis.browser?.alarms,
  } = {},
) {
  await storageArea.set({
    [SETTINGS_STORAGE_KEY]: { automaticRulesUpdates: enabled === true },
  });
  return reconcileRulesSchedule({ storageArea, alarms });
}

export function handlePeriodicRulesAlarm(alarm, update = runRulesUpdate) {
  if (alarm.name !== PERIODIC_RULES_ALARM) {
    return undefined;
  }

  return update();
}
