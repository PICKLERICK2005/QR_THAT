# QR THAT!

QR THAT! turns the current Firefox page—or a contextual link or image—into a scannable QR code for quick transfer to another device, with optional local tracking-parameter cleanup.

## Features

- Generate QRs from the toolbar or the page, link, and image context menu.
- Toggle local URL sanitization using community-maintained ClearURLs rules.
- See the URL kind and QR density at a glance, or open Advanced for technical details.
- Use the default `Ctrl+Shift+.` shortcut or reconfigure it through Firefox.
- Keep sanitization rules current with a manual fetch or optional weekly updates.

QR generation and URL processing happen locally. QR THAT! does not send browsing URLs to an external QR service and has no analytics, telemetry, accounts, or QR history. A verified ClearURLs snapshot is bundled; fixed ClearURLs mirrors are contacted only for a best-effort first-install rules fetch, a manual fetch, or optional automatic updates. Those requests do not contain the page or contextual URL being converted.

## Temporary installation

1. Open `about:debugging` in Firefox.
2. Select **This Firefox**.
3. Select **Load Temporary Add-on**.
4. Choose this repository's `manifest.json`.

## Third-party material

- [qrcode-generator 2.0.4](https://github.com/kazuhikoarase/qrcode-generator), MIT License, is vendored in `vendor/qrcode-generator/`.
- [ClearURLs Rules](https://github.com/ClearURLs/Rules), LGPL-3.0, are bundled as data in `rules/bundled/`.
- [Google Material Symbols](https://fonts.google.com/icons), Apache License 2.0, are vendored as SVGs in `icons/Material_Symbols/`.

## License

QR THAT! first-party code and project logo assets are licensed under the [MIT License](LICENSE). Bundled third-party materials retain the licenses included beside them.

“QR Code” is a registered trademark of DENSO WAVE INCORPORATED. QR THAT! is an independent project and is not affiliated with or endorsed by DENSO WAVE INCORPORATED.
