# Release package contents

The release archive is built from an explicit allowlist. `manifest.json` must be at the archive root.

## Include

- `manifest.json`
- `background.js`
- `popup/`
- `options/`
- `lib/`
- `rules/bundled/clearurls-data.minify.json`
- `rules/bundled/clearurls-rules.minify.hash`
- `rules/bundled/LICENSE`
- `rules/bundled/README.md`
- `vendor/qrcode-generator/qrcode.mjs`
- `vendor/qrcode-generator/LICENSE`
- `vendor/qrcode-generator/README.md`
- runtime PNGs from `icons/Logo/`
- runtime SVGs from `icons/Material_Symbols/`
- `icons/Material_Symbols/LICENSE`
- `icons/Material_Symbols/README.md`
- root `LICENSE`
- `PRIVACY.md`

## Repository-only; exclude

- `.git/` and `.gitignore`
- `tests/`
- `docs/`
- `CHANGELOG.md` and `README.md`
- `logo_stuff/`
- `icons/Logo/logo.svg` (editable source artwork; runtime uses PNGs)
- build artifacts, editor settings, caches, and OS metadata

## Runtime reference map

- The manifest loads `background.js`, `popup/popup.html`, `options/options.html`, and the PNG project icons.
- Popup and Options HTML load their adjacent CSS and JavaScript files.
- Production modules import files in `lib/` and the local `vendor/qrcode-generator/qrcode.mjs` module.
- `lib/rules.js` imports the bundled ClearURLs JSON catalog.
- Popup CSS masks reference the ten Material Symbols SVGs shipped in the icon directory.
- ClearURLs and qrcode-generator provenance/license files are shipped beside their third-party content.
