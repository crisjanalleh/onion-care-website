# Firebase security - OnionCare

## Status

No Firebase rules or live authentication configuration are currently verified. The website must
remain blocked from production authentication and production writes until a live project credential
and reviewed rules are available.

## Project

- Project ID: `onioncare-e1e5a`
- Realtime Database: `https://onioncare-e1e5a-default-rtdb.firebaseio.com`
- Storage: `onioncare-e1e5a.firebasestorage.app`

## Required design

- Server-side identity is authoritative.
- Admin role claims or server role checks come only from trusted account records.
- Browser code never reads legacy `password` fields.
- Farmers may read/write only their own profile and history.
- Reports are created server-side with verified identity and idempotency.
- Admin report, content and media operations require verified server-side admin authorization.
- RTDB reads/writes at `messages/{adminUsername}/farmers/{farmerUsername}` require the assigned
  farmer or assigned admin.
- Storage writes are administrator-only; official asset reads require active publication state.
- Unknown or malformed roles fail closed.

## Required rule tests

- Unauthenticated access denied.
- Farmer cannot read another farmer's profile/history/conversation.
- Farmer cannot invoke admin operations or set role/status/counter fields.
- Assigned admin can access assigned farmers.
- Unassigned admin cannot access another admin's conversation.
- Upload replacement/delete operations are admin-only.
