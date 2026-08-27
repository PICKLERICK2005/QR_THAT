const GRADE_BANDS = [
  { maximumVersion: 5, level: "green", label: "Low density" },
  { maximumVersion: 10, level: "yellow", label: "Moderate density" },
  { maximumVersion: 20, level: "orange", label: "High density" },
  { maximumVersion: 40, level: "red", label: "Very high density" },
];

export function gradeQr(moduleCount) {
  if (!Number.isInteger(moduleCount)) {
    return null;
  }

  const version = (moduleCount - 17) / 4;
  if (!Number.isInteger(version) || version < 1 || version > 40) {
    return null;
  }

  const band = GRADE_BANDS.find(({ maximumVersion }) => version <= maximumVersion);
  return {
    level: band.level,
    label: band.label,
    moduleCount,
    version,
  };
}
