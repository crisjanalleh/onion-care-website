# OnionCare website Firebase schema

Status: implemented as the website's target schema and adapters, but not validated against live Firebase data, deployed, or used for production writes.

## Runtime and trust boundaries

- Firebase Authentication is the identity provider. The browser uses the modular Firebase Web SDK for email/password, Google sign-in, email verification, and password reset. MFA is not implemented; accounts requiring it cannot currently sign in through this website.
- TanStack server functions receive the caller's Firebase ID token in an `Authorization: Bearer` header. The Worker validates it through Firebase Auth's `accounts:lookup` REST endpoint and resolves the caller's account record. Tokens are never logged or returned in errors.
- Server functions call Firestore, Realtime Database, and Storage REST APIs with short-lived Google OAuth access tokens minted from a Worker-only service-account secret. IAM grants the service account only the permissions the app needs. These requests bypass Firebase Security Rules, so each server function must verify identity, role, ownership, assignment, field allowlists, and state transitions before repository access.
- Browser code never reads legacy `password` fields and never supplies an administrator role.
- Browser code never calls Firestore, RTDB, or privileged Storage APIs directly. The Worker handles Storage uploads and media reads after explicit authorization and publication checks.
- `firebase-admin` remains a Node-only dependency for the read-only audit tool. It is not bundled into the Cloudflare Worker.
- Local development and automated tests use Firebase emulators, not live production data.

## Canonical collections and document IDs

New website records use separate collections and do not overwrite the original Android paths.

| Collection | Document ID | Purpose |
|---|---|---|
| `userAccounts` | Firebase Auth `uid` | Trusted email/display-name/role/status mapping. `role` is `farmer` by default; only an owner-controlled administrative process can promote an account. |
| `farmerProfiles` | Firebase Auth `uid` | OnionCare farmer profile and onboarding data. |
| `usernameReservations` | Normalized username | Atomic uniqueness reservation for farmer usernames. |
| `phoneReservations` | Normalized phone number | Atomic uniqueness reservation for farmer phone numbers. |
| `adminAssignments` | Normalized location key | Active location-to-admin mapping. The referenced admin UID and legacy username are provisioned by a trusted administrator. |
| `diagnosisRecords` | Firestore-generated ID | Versioned symptom assessment and area calculation. |
| `diseaseReports` | Firestore-generated ID | Farmer submission and administrator review workflow. |
| `diseases` | Stable website disease ID | Disease catalogue, reviewed content, and counters. Legacy labels remain exact in `legacyLabel`. |
| `conversations` | Firestore-generated ID | Website thread ownership, assignment, status, previews, and unread counters. |
| `messages` | Firestore-generated ID | Website conversation messages. |
| `contentArticles` | Firestore-generated ID | Published and draft agricultural information. |
| `pests` | Stable pest ID | Pest catalogue and reviewed management content. |
| `mediaAssets` | Firestore-generated ID | Asset metadata and review state. Binary objects live in Firebase Storage. |
| `auditLogs` | Firestore-generated ID | Successful administrative actions and their safe before/after summaries. |
| `notifications` | Firestore-generated ID | Recipient-scoped notification records. |
| `treatmentRecommendations` | Not defined | The current application only counts records with `approvalStatus: "pending_review"`; it has no verified write contract. Do not invent fields or seed sample records. |

### `UserAccount`

`uid`, `email`, `fullName`, `role`, `status`, `createdAt`, `updatedAt`, optional `username`, `profileSchemaVersion`, `legacyPath`, and approved account-link metadata.

`role` is server-/owner-managed. Registration creates only a farmer account. The browser cannot choose `admin`, change its own role, or write privileged account fields. An admin account is usable only after its UID is provisioned and reviewed.

### `FarmerProfile`

`uid`, `username`, `name`, `number`, `sex`, `location`, `role`, `isAdmin`, `status`, `credentialVersion`, `profileSchemaVersion`, `lastLoginAt`, `language`, `createdAt`, `updatedAt`, `legacyPath`, and preserved non-sensitive legacy fields when applicable.

`uid` is the authoritative account link. Username and phone uniqueness reservations are committed atomically with initial profile creation. Normalized values are only for uniqueness lookup; display values are retained. Profile renames require an equivalent atomic reservation update before they are enabled.

### `AdminAssignment`

`location`, `locationKey`, `adminUid`, `adminUsername`, `active`, `resolutionStatus`, `updatedByUid`, `createdAt`, `updatedAt`.

The admin UID and username are trusted configuration, not browser input. Do not infer an email address is a valid Realtime Database key or legacy administrator username.

### `DiagnosisRecord`

`farmerUid`, `farmerUsername`, `name`, `location`, `symptomCategory`, `selectedSymptoms`, `resultType`, `candidateDiseaseIds`, `diseaseId`, `diseaseName`, `matchedRuleId`, `rulesetVersion`, `areaFormulaVersion`, `lotArea`, `lotAreaUnit`, `affectedAreaPercent`, `occurredAt`, `schemaVersion`, `createdAt`, `legacyPath`.

Preserve `RULESET_VERSION = "legacy-rules-v1-compatible"` and `AREA_FORMULA_VERSION = "legacy-area-formula-v1"` and the calculation behavior in [catalogue.js](./src/lib/domain/catalogue.js) and [diagnosis.js](./src/lib/domain/diagnosis.js). The current diagnosis source itself states that the original rules table is unavailable and the website scoring is a transparent stand-in; do not claim live legacy-rule equivalence or alter results during backend work.

### `DiseaseReport`

`name`, `diseaseName`, `diseaseId`, `farmerUsername`, `farmerUid`, `timestamp`, `number`, `location`, `status`, `idempotencyKey`, `diagnosisId`, `description`, `needsClassification`, `schemaVersion`, `legacyPath`, `reviewedAt`, `reviewedByUid`, `resolutionNotes`, `createdAt`, `updatedAt`.

Keep the existing allowed report transitions from [catalogue.js](./src/lib/domain/catalogue.js); status changes require trusted administrator authorization.

### `Disease`

`diseaseId`, `legacyLabel`, `summary`, `culturalGuidance`, `culturalGuidanceStatus`, `contentStatus`, `sortOrder`, `reportCount`, `newReportCount`, `createdAt`, `updatedAt`, and review metadata.

The eleven exact legacy labels are `Anthracnose caused by bacteria`, `Anthracnose caused by fungi`, `Bacterial Soft Rot`, `Basal Plate Rot`, `Black Mold`, `Neck Rot`, `Pink Root`, `Purple Blotch`, `Root Knot`, `Seedling Damping Off`, and `White Rot`. Stable website IDs and labels are defined in [catalogue.js](./src/lib/domain/catalogue.js); do not change either set as part of storage work.

### `Conversation` and `Message`

`Conversation`: `farmerUid`, `farmerUsername`, `farmerName`, `location`, `adminUid`, `adminUsername`, `status`, `assignmentSource`, `lastMessageAt`, `lastMessagePreview`, `unreadCountForFarmer`, `unreadCountForAdmin`, `newMessageCount`, `hasNewMessage`, `schemaVersion`, `legacyPath`, `createdAt`, `updatedAt`.

`Message`: `conversationId`, `senderUid`, `senderRole`, `senderName`, `body`, `createdAt`, `legacyPath`, and an idempotency key for new website messages.

The old RTDB messages remain at `messages/{adminUsername}/farmers/{farmerUsername}/messages/{pushId}`. Legacy message fields observed in the Android source are `messageText`, `senderUsername`, millisecond `timestamp`, `isRead`, and `hasNewMessage`; parent counters/flags vary by sender and code path. Read adapters must preserve the raw legacy values and map them without treating inconsistent counters as authoritative. No production message import or dual-write is authorized yet.

### `ContentArticle` and `Pest`

`ContentArticle`: `contentType`, `title`, `summary`, `body`, `sourceReference`, `status`, `updatedByUid`, `version`, `lastReviewedAt`, `publishedAt`, `createdByUid`, `createdAt`, `updatedAt`.

`Pest`: stable `pestId`, catalogue display data, `summary`, `managementNotes`, `contentStatus`, `sourceReference`, `lastReviewedAt`, `updatedByUid`, `createdAt`, `updatedAt`.

No sample agricultural facts or unreviewed recommendations may be inserted as part of schema setup.

### `MediaAsset`

Persist `title`, `category`, `fileName`, `contentType`, `fileSizeBytes`, `width`, `height`, `relatedDiseaseId`, `relatedPestId`, `altText`, `caption`, `attribution`, `source`, `license`, `origin`, `approvalStatus`, `verificationStatus`, `isActive`, `diseaseKey`, `storagePath`, `uploadedByUid`, `uploadedAt`, `createdAt`, `updatedAt`, optional `checksum`, `verifiedByUid`, and `verifiedAt`.

`storagePath` is canonical. A legacy `downloadURL` or the current website `fileUrl` is an adapter value, not evidence of ownership, license, or publication approval. Public image responses must be limited to active, approved assets; disease images additionally require `verificationStatus: "verified"`.

### `AuditLog` and `Notification`

`AuditLog`: `actorUid`, `actorEmail`, `actorRole`, `action`, `entityType`, `entityId`, `before`, `after`, `timestamp`, `createdAt`.

`Notification`: `recipientUid`, `recipientRole`, `type`, `title`, `body`, `relatedEntityType`, `relatedEntityId`, `linkTo`, `read`, `readAt`, `timestamp`, `createdAt`.

Audit before/after values must exclude credentials, ID/refresh tokens, plaintext legacy passwords, and unnecessary personal data.

## Timestamp compatibility

- New canonical timestamps (`createdAt`, `updatedAt`, `occurredAt`, `reviewedAt`, `publishedAt`, `uploadedAt`, `lastMessageAt`) are Firestore `Timestamp` values.
- Existing legacy timestamps remain unchanged at their source. A compatibility adapter may expose a parsed value when valid and must retain the original value alongside it; invalid or unknown formats are not silently replaced with the current time.
- Read-only compatibility aliases for old `created_date`/`updated_date` callers may be provided during migration. New writes use the canonical camelCase timestamp fields.
- RTDB legacy message timestamps are Unix milliseconds and must be converted only in the normalized DTO, with the original integer retained.

## Implementation references

- [Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/) officially supports Vite-based TanStack Start applications and the Workers runtime.
- [Cloudflare Worker bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/) document per-request bindings and the `cloudflare:workers` `env` module.
- [Firestore REST API authentication](https://firebase.google.com/docs/firestore/use-rest-api#authentication_and_authorization) supports Google OAuth tokens from a service account; those requests use IAM instead of Firestore Security Rules.
- [Realtime Database REST authentication](https://firebase.google.com/docs/database/rest/auth) supports service-account OAuth access tokens for server-side access.
- [Cloudflare Worker bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/) document Worker secrets and the per-request `env` module.
- Firebase MFA is outside the current implementation. Do not describe it as available until the full sign-in, enrollment, recovery, and emulator test flows are implemented and Firebase Console configuration is verified.
- [Firebase ID-token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens) describes the custom-backend trust boundary. The Worker implementation will use Firebase Auth's token-backed account lookup, not `firebase-admin`.

## Legacy sources and safe compatibility

Documented sources are `users/{username}`, `farmers/{username}`, `history/{username}/diagnoses/{documentId}`, `diseases/{diseaseName}`, both documented disease-report paths, `information/info_section`, and the RTDB message path above. Their live presence, fields, counts, and permissions remain unknown; see [LEGACY-DATABASE-INVENTORY.md](./LEGACY-DATABASE-INVENTORY.md) and [FIREBASE-CONNECTION-STATUS.md](./FIREBASE-CONNECTION-STATUS.md).

Compatibility readers preserve IDs, source paths, raw timestamps, and non-sensitive unknown fields. They explicitly drop password values. No legacy record is copied, rewritten, or linked to a Firebase Auth UID until an owner-approved backup, dry run, and identity-linking plan exist.

## Known source discrepancy

The master implementation brief describes 13 original location/admin assignment entries, while the current website catalogue contains 14. Preserve the current source unchanged and reconcile this discrepancy against the owner-approved original data before importing or editing assignments.
