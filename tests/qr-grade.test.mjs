import assert from "node:assert/strict";

import { gradeQr } from "../lib/qr-grade.js";

const cases = [
  [21, "green", "Low density", 1],
  [37, "green", "Low density", 5],
  [41, "yellow", "Moderate density", 6],
  [57, "yellow", "Moderate density", 10],
  [61, "orange", "High density", 11],
  [97, "orange", "High density", 20],
  [101, "red", "Very high density", 21],
  [177, "red", "Very high density", 40],
];

for (const [moduleCount, level, label, version] of cases) {
  assert.deepEqual(gradeQr(moduleCount), {
    level,
    label,
    moduleCount,
    version,
  });
}

for (const invalidModuleCount of [undefined, null, 21.5, 38, 17, 181]) {
  assert.equal(gradeQr(invalidModuleCount), null);
}

console.log("Passed 14 QR density grade checks.");
