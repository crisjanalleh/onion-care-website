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
   - Firebase Auth account mapping
   - legacy credential migration
   - additive report review fields
   - additive message read fields
   - media metadata
7. Require explicit user approval for each write migration and provide a rollback path.
8. Keep old IDs, push IDs, collections and field values unchanged unless migration is approved.

## Authentication migration

The legacy plaintext password field must not be copied into browser code or public storage. A
server-side process should validate a legacy credential, migrate to a strong hash or authoritative
identity workflow, create/resolve Firebase Auth UIDs, and issue custom tokens only after existing
accounts are verified.
