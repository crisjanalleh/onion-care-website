# Legacy data mapping - OnionCare

## Firebase identity

- Project: `onioncare-e1e5a`
- Realtime Database: `https://onioncare-e1e5a-default-rtdb.firebaseio.com`
- Storage: `onioncare-e1e5a.firebasestorage.app`
- Live values remain unverified until server-side read access is available.

## Repository mapping

| Legacy source | Repository/adapter | Normalized model |
|---|---|---|
| `users/{username}` | `UserRepository` | `user.displayName`, `username`, `phoneNumber`, `sex`, `location`, `role` |
| `history/{username}/diagnoses/{id}` | `DiagnosisHistoryRepository` | diagnosis disease name, raw legacy timestamp, document ID, source path |
| `diseases/{exactLegacyName}` | `DiseaseRepository` | 11 stable disease keys, display labels, counters |
| `diseases/{exactLegacyName}/farmerReports/{id}` | `FarmerReportRepository` | report union, current source path, legacy fields, status |
| `reports/{exactLegacyName}/farmerReports/{id}` | `FarmerReportRepository` | report union, legacy source path, profile fallback |
| `information/info_section` | `AgriculturalInformationRepository` | fertilizer and herbicide fields, raw text |
| `messages/{admin}/farmers/{farmer}/messages/{pushId}` | `ConversationRepository` | message text, sender context, millisecond timestamp, legacy flags |
| `mediaAssets/{assetId}` | `MediaAssetRepository` | storage path, metadata, verification, disease key |

## Stable disease keys

The exact Firestore document keys are: `Anthracnose caused by bacteria`,
`Anthracnose caused by fungi`, `Bacterial Soft Rot`, `Basal Plate Rot`, `Black Mold`, `Neck Rot`,
`Pink Root`, `Purple Blotch`, `Root Knot`, `Seedling Damping Off`, and `White Rot`.

Display labels may change, but these keys and parent paths must remain unchanged.

## Secret and privacy constraints

`users/{username}.password` and `farmers/{username}.password` must never be fetched by browser code,
rendered, cached or logged. The current implementation must not validate credentials directly in
Firestore. Website sign-in uses Firebase Authentication, not the legacy Firestore password field.
Legacy accounts can be linked only after an owner-approved identity verification process; otherwise
the user must create/reset credentials through Firebase Authentication. Never import or reuse the
legacy plaintext password.

## Website data model

The implemented target website collections, timestamp convention, account-role boundary, and safe compatibility
rules are defined in [FIREBASE-WEBSITE-SCHEMA.md](./FIREBASE-WEBSITE-SCHEMA.md). Legacy paths remain
read-only until a backup, dry run, and explicit owner approval are complete. Live presence and field
shapes remain unverified.
