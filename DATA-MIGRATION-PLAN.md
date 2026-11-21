# Data migration plan - OnionCare

## Default state

No migration or destructive operation is authorized. Existing Firebase data must remain untouched
until backup, dry-run, credential verification and explicit approval are complete.

## Required sequence

1. Verify project `onioncare-e1e5a` against the owner-controlled Firebase console.
2. Supply a private Admin credential with read-only access to Firestore, Realtime Database and
   Storage.
3. Back up/export Firestore, Realtime Database and Storage metadata/files to an access-controlled
   location outside source control.
4. Verify backup readability and record project ID, timestamp and counts.
5. Run a read-only inventory and produce `LEGACY-DATABASE-INVENTORY.md`.
6. Run migrations only in dry-run mode and review:
   - Firebase Auth UID/profile linking, without reading or reusing legacy passwords
   - additive report review fields
   - additive message read fields
   - media metadata
7. Require explicit user approval for each write migration and provide a rollback path.
8. Keep old IDs, push IDs, collections and field values unchanged unless migration is approved.

## Authentication migration

The website authenticates only with Firebase Authentication. It must not read, validate, copy, hash,
or reuse the legacy plaintext password field. Link a legacy profile/history to a Firebase Auth UID
only after an owner-approved verification process that does not disclose the password; otherwise
require Firebase account creation or password reset. Account role is assigned from trusted
owner-controlled data, never from registration input. No UID links or production writes have been
created.
