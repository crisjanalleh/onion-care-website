# Firebase connection status

## Result

Live Firebase access is **not verified** in this execution environment.

- The dedicated service-account environment variable `GOOGLE_APPLICATION_CREDENTIALS` is absent.
- `GOOGLE_CLOUD_PROJECT` is absent.
- A read-only Firebase CLI app-list request for `onioncare-e1e5a` returned HTTP 403 (`PERMISSION_DENIED`).
- No private key or credential has been requested or stored in the repository.

## Web authentication setup

- The companion Android project has an Android Firebase client configuration for `onioncare-e1e5a`; it does not contain a registered web-app configuration.
- This website has no Firebase client SDK or Firebase web configuration in its environment.
- Firebase Authentication provider settings and authorized domains cannot be inspected or changed with the current Firebase account.
- The website's protected server functions currently authenticate through the injected application database client, not Firebase ID tokens. Switching the browser login alone to Firebase would not authorize those functions or establish an application role/profile.

Do not treat Google sign-in or password recovery as live until the Firebase project owner registers/configures the web app, enables the required providers/domains, and the website's server-side identity mapping is explicitly approved and tested. No Firebase data or authentication settings were changed.

## Intended project

- Project ID: `onioncare-e1e5a`
- Realtime Database: `https://onioncare-e1e5a-default-rtdb.firebaseio.com`
- Storage: `onioncare-e1e5a.firebasestorage.app`

## Service status

| Service | Status |
|---|---|
| Firebase Admin SDK | Not authenticated |
| Firestore | Not inspected |
| Realtime Database | Not inspected |
| Firebase Authentication | Not inspected |
| Firebase Storage | Not inspected |

Run `npm run audit:firebase` only in the configured environment where ADC credentials are available.
