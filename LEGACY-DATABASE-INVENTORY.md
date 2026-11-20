# Legacy database inventory — OnionCare

**Status: PARTIALLY IDENTIFIED, LIVE AUDIT BLOCKED.**

The Android project identifies the Firebase project and instance, but live server-side access and
backups are not yet available. All live counts below remain unknown rather than invented.

## Verified project configuration

| Setting | Value |
|---|---|
| Firebase project ID | `onioncare-e1e5a` |
| Realtime Database URL | `https://onioncare-e1e5a-default-rtdb.firebaseio.com` |
| Storage bucket | `onioncare-e1e5a.firebasestorage.app` |
| Source | Android app `google-services.json` |

This project identity must still be validated against the owner's Firebase console and server-side
access before it is declared the live production database.

## 1. What is missing

The rebuild is still missing the following:

1. A **service-account credential** (or equivalent server-side credential) with read access to Firestore,
   the Realtime Database and Cloud Storage for that project.
2. Confirmation that the owner authorizes read access to the listed Firebase project and environment.

Nothing has been created in Firebase, no substitute project exists, and no record has been seeded to
stand in for legacy data. The current application stores its data in the platform database; it does
not claim to be the legacy Firebase project.

## 2. What will be enumerated once access exists

A read-only pass, run with the Admin SDK from a server context, will produce this document's real
contents.

### Firestore

- Every top-level collection ID and document count.
- `users/{username}` — document IDs, field names and types, `isAdmin` distribution, accounts missing
  required profile fields. **The legacy `password` field is counted only as "present / absent"; its
  value is never read into the report.**
- `history/{username}/diagnoses` — document count per user, timestamp formats found, records with
  missing or unparseable `timestamp`.
- `diseases/{diseaseName}` — presence of each of the 11 exact keys, existing `reportCount` and
  `newReportCount`, and any additional fields.
- `diseases/{diseaseName}/farmerReports` — document count per disease, field presence rates for
  `name`, `number`, `location`, `farmerUsername`, `timestamp`.
- `reports/{diseaseName}/farmerReports` — same, for the older reader path.
- `information/info_section` — which of the 12 documented fields exist, their lengths and types.
- `farmers/{username}` — orphan/stale profile documents, conflicts against `users`.
- Any unlisted collection or nested subcollection, listed with counts only.

### Realtime Database

- Every `messages/{adminUsername}` root, its `newMessageCount`, and the number of farmer children.
- Per conversation: message push ID count, earliest and latest `timestamp`, presence of
  `newMessage`, `newMessageCount`, `hasNewMessage`, `lastReplyTime`.
- Message payloads are counted, not quoted. `senderUsername` values are reduced to
  "admin / farmer / unexpected".
- Wrong-path branches `messages/{farmerUsername}` — presence only.

### Cloud Storage

- Object paths, content types, sizes and metadata for the bucket.
- Any file whose path or name suggests a disease photograph, listed for human review. A file is never
  assigned to a disease from its name alone.

### Reconciliation

- For each of the 11 diseases: stored `reportCount` versus the actual number of documents in its
  `farmerReports` subcollection, with the difference reported rather than corrected.

## 3. Sensitive data handling

The inventory never contains plaintext passwords, full phone numbers, private message text or other
personal values. Field names, counts, types and presence rates only. A separate encrypted export, if
one is ever taken, lives outside source control.

## 4. How to unblock

Provide the Firebase project ID and a read-only service-account credential, and confirm which
environment (production or a copy) may be read. With those, section 2 is produced as a single
read-only run, and the mapping in `LEGACY-DATA-MAPPING.md` is validated field by field against the
live project before any write is attempted.
