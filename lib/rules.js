import bundledRules from "../rules/bundled/clearurls-data.minify.json" with {
  type: "json",
};

export function loadRules() {
  return bundledRules;
}
