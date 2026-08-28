# Privacy

QR THAT! processes selected page, link, and image URLs locally. QR images are generated locally, and optional URL sanitization also runs locally. Browsing URLs, generated QR payloads, and QR history are not persisted.

The extension stores only:

- a verified fetched ClearURLs rules snapshot and first-fetch state;
- the user's automatic rules-update preference.

A bundled rules snapshot is always available. QR THAT! may retrieve the ClearURLs catalog and its published SHA-256 hash from the fixed `rules1.clearurls.xyz` and `rules2.clearurls.xyz` mirrors after first installation, when the user selects **Fetch rules**, or weekly when the user opts into automatic updates. These requests do not include the URL being converted into a QR code. Downloaded catalogs are validated data, not executable code.

QR THAT! does not use analytics, telemetry, accounts, cloud synchronization, or remote QR-generation services.
