# AMO reviewer notes — QR THAT! 1.0.0

## Purpose and review steps

QR THAT! generates QR codes locally for a selected Firefox page, link, or image. Optional sanitization locally removes parameters described by ClearURLs rule data.

1. Click the toolbar icon; a QR for the current page appears.
2. Toggle **Sanitize** and compare the displayed/encoded URL on a URL containing a known tracking parameter.
3. Right-click a page, link, or image and choose **QR THAT!**.
4. Open **Advanced** to inspect the original URL, payload, QR metadata, density, sanitization state, and rules source.
5. Open Settings with the gear button.
6. Test **Fetch rules** and the opt-in automatic-update toggle if desired.
7. Test the default `Ctrl+Shift+.` shortcut or use Firefox's shortcut configuration page.

No account is required.

## Permissions

- `activeTab`: reads the selected tab URL after the user invokes the toolbar action.
- `menus`: provides the page, link, and image context-menu action.
- `storage`: stores a verified fetched ClearURLs snapshot, first-fetch state, and the automatic-update preference. It does not store browsing URLs or QR history.
- `alarms`: schedules only the opt-in weekly ClearURLs rules update; it performs no browsing monitoring.
- `https://rules1.clearurls.xyz/*` and `https://rules2.clearurls.xyz/*`: retrieve only the fixed ClearURLs catalog and published hash endpoints.

The Gecko ID is `qr-that@picklerick2005.github.io`. `data_collection_permissions.required = ["none"]` matches the extension: selected URLs are processed locally and are neither transmitted nor retained. QR THAT! has no analytics or telemetry.

## Network behavior

The only network-capable code is `lib/rules-update.js`. It requests these fixed endpoints:

- `https://rules2.clearurls.xyz/data.minify.json`
- `https://rules2.clearurls.xyz/rules.minify.hash`
- `https://rules1.clearurls.xyz/data.minify.json`
- `https://rules1.clearurls.xyz/rules.minify.hash`

Requests occur once on first install as a best effort, when the user selects **Fetch rules**, or weekly after the user opts into automatic updates. Requests use `credentials: "omit"`, `referrerPolicy: "no-referrer"`, `cache: "no-store"`, and `redirect: "error"`. They do not contain the page/link/image URL being converted. The catalog's SHA-256 must match the separately downloaded published hash, and the parsed catalog must pass structural validation before replacing stored rules. Downloaded rules remain JSON data and are never executed.

## Third-party material

- **qrcode-generator 2.0.4**, tag `js2.0.4`, MIT License. Unmodified release module and license at `vendor/qrcode-generator/`. Upstream: https://github.com/kazuhikoarase/qrcode-generator
- **ClearURLs Rules snapshot**, retrieved 2026-08-27, SHA-256 `df97eb5c1aeeb9f96d0c28a6a60604f3cb2b1f9e7776eee228258e1b2bae1424`, LGPL-3.0. Unmodified catalog, published hash, license, and provenance at `rules/bundled/`. Upstream: https://github.com/ClearURLs/Rules
- **Google Material Symbols**, Apache License 2.0. Unmodified local SVGs, license, and provenance at `icons/Material_Symbols/`. Official project: https://github.com/google/material-design-icons

Project logo files in `icons/Logo/` are first-party QR THAT! assets under the project's MIT License.

## Source and build

QR THAT!'s first-party production code is plain, human-readable JavaScript, HTML, and CSS. It is not transpiled, bundled, minified, or generated. The submitted files are the extension sources, so no separate first-party source archive appears necessary. `vendor/qrcode-generator/qrcode.mjs` is an unmodified upstream distribution artifact rather than generated first-party code; its exact version, source, and license are documented above.

No executable code, fonts, styles, or images are loaded remotely. ClearURLs downloads are data only. The extension uses the default Manifest V3 content security policy and does not use `eval`, `new Function`, remote imports, or `unsafe-eval`.
