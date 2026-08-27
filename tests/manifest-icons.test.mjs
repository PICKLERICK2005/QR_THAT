import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile(new URL("../manifest.json", import.meta.url), "utf8"));

assert.deepEqual(manifest.permissions, ["activeTab", "menus", "storage", "alarms"]);
assert.deepEqual(manifest.host_permissions, [
  "https://rules1.clearurls.xyz/*",
  "https://rules2.clearurls.xyz/*",
]);

const iconPaths = [...Object.values(manifest.icons), ...Object.values(manifest.action.default_icon)];
assert.equal(new Set(iconPaths).size, 6);

for (const path of iconPaths) {
  await access(new URL(`../${path}`, import.meta.url));
}

await access(
  new URL(
    "../icons/Material_Symbols/settings_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg",
    import.meta.url,
  ),
);
await access(
  new URL(
    "../icons/Material_Symbols/check_box_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg",
    import.meta.url,
  ),
);
await access(
  new URL(
    "../icons/Material_Symbols/check_box_outline_blank_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg",
    import.meta.url,
  ),
);
await access(
  new URL(
    "../icons/Material_Symbols/arrow_drop_down_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg",
    import.meta.url,
  ),
);
await access(
  new URL(
    "../icons/Material_Symbols/arrow_drop_up_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg",
    import.meta.url,
  ),
);

console.log("Passed 17 interface asset checks.");
