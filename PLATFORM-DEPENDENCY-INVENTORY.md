# Platform dependency inventory

## Current status

The active Base44 runtime coupling has been removed. The website no longer relies on injected database/auth globals, Base44 auth endpoints, Base44 entity APIs, platform MFA or consent services, or Base44-hosted media. The Cloudflare Worker, Vite, TanStack Start, React, and existing feature routes remain in place.

There is no AI provider, model API, agent runtime, or prompt service in the application. No AI integration was added.

## Implemented replacements

| Area | Current implementation |
|---|---|
| Browser identity | Firebase Web SDK email/password and Google sign-in, persistent session, email verification, password reset, and logout. Google requires owner-side Firebase Console configuration. |
| Server identity | Firebase ID-token validation in the Cloudflare Worker, followed by trusted `userAccounts/{uid}` role lookup. Registration creates farmer accounts only. |
| Data access | Cloudflare-compatible Firestore REST adapter with explicit failures, timestamp compatibility, and entity collection mappings. Service-account OAuth remains Worker-only; `firebase-admin` is retained only for the Node audit tool. |
| Media upload | Verified-admin Worker endpoint with image type/signature checks and an 8 MiB limit, writing to Firebase Storage. |
| Local development | Firebase Emulator Suite with demo-only project configuration. Emulator checks have passed for Auth lifecycle and Firestore CRUD/query. |
| Removed runtime | Injected in-memory database, Base44 app parameters/auth/MFA, platform consent UI, Base44 service-role API, and Base44 media URLs. |

## Remaining verification and owner actions

- Live Firebase access and the existence/configuration of a Web app remain unverified; a read-only app-list request returned HTTP 403.
- Google sign-in requires Firebase provider enablement and authorized domains.
- Firebase MFA is not implemented. Accounts requiring MFA cannot currently sign in.
- Storage upload and media review were verified through the application UI against the Storage Emulator; production Storage behavior remains unverified.
- RTDB legacy messaging import/compatibility, production role provisioning, and all application features still require end-to-end testing against emulators before live use.
- No production data was read or written, no rules were changed, and no deployment or migration was performed.

See [FIREBASE-CONNECTION-STATUS.md](./FIREBASE-CONNECTION-STATUS.md), [FIREBASE-SECURITY.md](./FIREBASE-SECURITY.md), and [DATA-MIGRATION-PLAN.md](./DATA-MIGRATION-PLAN.md) for the trust boundary and approval requirements.
