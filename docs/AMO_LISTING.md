# AMO listing copy

## Name

QR THAT!

## Summary

Turn Firefox pages and links into local, sanitized QR codes for quick transfer to another device.

## Description

QR THAT! creates a QR code for the current page from the toolbar, or for a page, link, or image from Firefox's context menu. QR generation happens locally—browsing URLs are not sent to an external QR service.

Enable **Sanitize** to clean known tracking parameters locally with ClearURLs rules. A bundled rules snapshot is always available; newer snapshots can be fetched manually or through optional weekly updates. The URL-kind icon also indicates QR density, and the compact Advanced section shows the original URL, encoded payload, QR metadata, sanitization result, and active rules source.

Open Settings to manage rules updates and Firefox's shortcut configuration. The default shortcut is `Ctrl+Shift+.`.

No accounts, analytics, telemetry, or QR history.

## Privacy summary

QR generation and URL processing are local. Network access is limited to fixed ClearURLs rule-catalog and hash downloads; the URL being converted is never included in those requests.

## Suggested categories

For manual selection in AMO, consider **Other** or the closest current category related to tabs/tools. Confirm the available AMO category names during submission.

## Support and source

- Source and issue tracker: https://github.com/PICKLERICK2005/QR_THAT
- License: MIT for QR THAT! first-party code; bundled third-party components retain their own licenses.

## Version 1.0.0 release notes

Initial public release with toolbar and context-menu QR generation, optional local URL sanitization, QR density and URL-kind indicators, Advanced details, configurable keyboard shortcut, and verified ClearURLs rules updates.
