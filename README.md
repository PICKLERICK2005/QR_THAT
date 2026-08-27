# QR THAT!

QR THAT! is a Firefox extension that turns the current page, a link or an image URL within the webpage you're currently viewing, into a standard QR code for quick transfer to a mobile device rather than having to rely on the native firefox "Send to Mobile" feature, quickshare, or desktop versions of chat apps to simply open the link on your other devices.

The popup can optionally remove known tracking information locally using community-maintained [ClearURLs rules](https://github.com/ClearURLs/Rules). A verified rules snapshot is bundled with the extension so sanitization remains available offline. On first installation, QR THAT! makes one best-effort attempt to fetch a newer verified snapshot from the official ClearURLs mirrors and permanently falls back to the bundled copy if that fails. This isn't only a privacy feature, it also makes the qr codes simpler to read!

The project is currently still in development.

## Features

- Generate a QR code for the active Firefox tab.
- Generate contextual QR codes for pages, links, and images and links embedded in elements.
- Toggle local URL sanitization without changing the original URL.
- Operates entirely without telemetry or transmitting browsing URLs.

QR generation uses the bundled [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) 2.0.4 library. Rules fetching is separate from QR generation and never includes page or contextual URLs.

## Temporary installation in Firefox

1. Open `about:debugging` in Firefox.
2. Select **This Firefox**.
3. Select **Load Temporary Add-on**.
4. Choose this project's `manifest.json` file.

## Checks

The focused checks require a current Node.js release and no installed dependencies:

```sh
node tests/sanitizer.test.mjs
node tests/rules-lifecycle.test.mjs
```

## License

QR THAT! is licensed under the [MIT License](LICENSE). Bundled third-party materials retain their respective licenses in `vendor/` and `rules/bundled/`.

>“QR Code” is a registered trademark of DENSO WAVE INCORPORATED. QR THAT! is an independent project and is not affiliated with or endorsed by DENSO WAVE INCORPORATED.