# Firebase security - OnionCare

## Status

No live Firebase Auth settings, Security Rules, or user/database records are verified. No rules,
production data, or deployment settings were changed. The implemented target model is documented
in [FIREBASE-WEBSITE-SCHEMA.md](./FIREBASE-WEBSITE-SCHEMA.md) and must be tested in emulators
before owner review.

## Project identity

- Project ID: `onioncare-e1e5a` (Android configuration only; owner must confirm)
- Realtime Database: `https://onioncare-e1e5a-default-rtdb.firebaseio.com`
- Storage bucket: `onioncare-e1e5a.firebasestorage.app`

## Trust boundaries

- Browser authentication uses Firebase Auth. TanStack server functions receive a Firebase ID token,
  validate it with Firebase Auth, and resolve the trusted account/role record.
- The Worker validates the caller's Firebase ID token, resolves a trusted account/role record, and
  performs privileged Firestore/RTDB/Storage REST calls using a short-lived Google OAuth token
  derived from a Worker-only service-account secret.
- OAuth service-account requests use Google IAM and bypass Firebase Security Rules. Every server
  function must enforce identity, ownership, role, assignment, field allowlists, and state
  transitions before a repository operation. Do not expose a generic database proxy to the browser.
- The service account must have only the data permissions the application needs. Its private key
  belongs in local `.dev.vars` or Cloudflare Worker secrets, never in Vite variables, source
  control, a browser response, or chat. Any separate credential used for an owner-approved audit
  or migration should be read-only where possible.
- The `userAccounts/{uid}` role is trusted only if rules prevent user-controlled creation or changes
  to privileged roles. Registration may create only a farmer account; administrator provisioning
  must be owner-controlled.
- Legacy `password` values must never be fetched into browser code, rendered, cached, logged, copied
  into a report, or used to authenticate website users.
- Unknown, missing, or malformed roles fail closed. No registration form accepts a role.

## Server authorization requirements

- The new website does not make direct Firestore/RTDB/Storage calls from browser code. Do not expose
  a generic database endpoint or service credential to the client.
- Farmers may read/write only their own profile and history; the Worker checks the verified UID.
- A farmer cannot set role, admin flags, review state, counters, assignment, or server timestamps.
- Report creation binds `farmerUid` to the verified UID; status/review fields are admin-only.
- Admin reads/writes require a trusted account record and preserve assignment/ownership checks.
- RTDB conversation access is checked against the assigned farmer and admin in the server. Preserve
  the legacy message path and account for its inconsistent historical flags/counters.
- Storage upload, replacement, and deletion are administrator-only. Public asset reads require an
  active approved record; disease images additionally require human verification.
- Username/phone reservations must be unique and created atomically with profile data.

Existing production Firestore, RTDB, and Storage Rules may also serve the original Android app.
Inspect and test them only after authorized access is available; do not change them until an owner
has approved a verified backup, reviewed dry-run results, and the exact replacement ruleset.

## Emulator authorization tests required before live use

- Anonymous access is denied.
- Farmer A cannot read Farmer B's profile, diagnoses, reports, notifications, or conversation.
- A farmer cannot self-promote, change review/counter/assignment fields, or write an admin record.
- A farmer can create only their own farmer profile/account and submit their own report.
- An assigned admin can access the assigned farmer; an unassigned admin cannot access another
  administrator's conversation.
- Invalid/missing role records fail closed.
- Only an admin can upload, replace, approve, deactivate, or delete an asset.
- Public content/image reads do not expose drafts, pending assets, or unverified disease images.

Production rules must not be changed until the owner has a verified backup, reviewed dry-run results,
and explicitly approved the exact ruleset and rollout. A Worker service credential is not a
substitute for request-level authorization or owner approval.
