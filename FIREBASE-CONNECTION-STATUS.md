# Firebase connection status

## Verified locally

- The website initializes Firebase Web Authentication and connects server functions to Firebase REST APIs through Cloudflare Worker bindings.
- Local Firebase Emulator Suite checks passed for email/password account creation, email verification, sign-in, password reset, ID-token verification, and Firestore create/read/query/delete.
- A verified administrator uploaded an image through the website UI; the Storage Emulator stored it with the correct MIME type and download token, and the media review controls updated approval and active status.
- Emulator testing used only the isolated `demo-onioncare` project. No production Firebase setting, record, rule, or deployment was changed.
- The live project remains unverified. A prior read-only Firebase CLI app-list request for `onioncare-e1e5a` returned HTTP 403 (`PERMISSION_DENIED`); no production credentials are available in this environment.

## Live integration requirements

The Android project identifies `onioncare-e1e5a`, but live Web app registration and Firebase Authentication provider settings could not be inspected. Before a live login test:

1. Confirm the project and register a Web app in the owner-controlled Firebase Console.
2. Set its public `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, and `appId` in the ignored local `.env.local` file.
3. Enable Email/Password and Google sign-in; authorize localhost and the intended site domains.
4. Configure the least-privilege service identity for the Cloudflare Worker, storing its private key only in local `.dev.vars` and Worker secrets.
5. Test the production data model and authorization with a backup and dry run before any migration, rule change, write, or deployment.

Never paste private keys or user tokens into chat or source control. The Worker uses short-lived Google OAuth tokens for Firebase REST APIs; those calls bypass Firebase Security Rules, so every server function must enforce identity, ownership, role, and assignment checks.

## Authentication limitations

- Email verification and password reset use Firebase action codes and the site's `/auth/action` route.
- Google sign-in is implemented but requires the Firebase provider and authorized domains to be configured.
- The former Base44-specific MFA screens and endpoints were removed. Firebase MFA is not implemented; accounts requiring MFA cannot currently sign in through this website.
- New accounts receive the farmer role only. Administrator provisioning must be performed through a trusted, owner-controlled process.

## Intended legacy project

- Project ID: `onioncare-e1e5a`
- Realtime Database: `https://onioncare-e1e5a-default-rtdb.firebaseio.com`
- Storage bucket: `onioncare-e1e5a.firebasestorage.app`

The read-only `npm run audit:firebase` remains a Node-side tool requiring owner-authorized Application Default Credentials. Its live inventory has not been run successfully.
