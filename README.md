# OnionCare

OnionCare is a web platform for onion growers and agricultural administrators. It brings together symptom-based diagnosis, crop and pest references, farmer profiles, disease reports, and administrator review tools.

## Project at a glance

- **Frontend and server:** React, Vite, TanStack Start, and a Cloudflare Worker.
- **Authentication and data:** Firebase Authentication, Firestore REST, and Firebase Storage. Server-side Firebase access runs in the Worker.
- **Local development:** Firebase Emulator Suite on the isolated `demo-onioncare` project.
- **Hosting:** Cloudflare Workers.
- **AI integrations:** None.

Firebase Auth supports email/password registration and login, email verification, password recovery, and Google sign-in when the Firebase project is configured. Firebase MFA is not implemented. Live Firebase access and deployment have not been verified.

## Requirements

- Node.js 24.15 or newer in the 24.x line, or 26.0 or newer. The repository pins Node 24.16.0 in `.nvmrc`.
- npm
- Java installed for the Firebase emulators

## Local setup

1. Install dependencies:

   ```sh
   npm ci
   ```

2. Copy the local emulator configuration files.

   **PowerShell:**
   ```powershell
   Copy-Item .env.example .env.local
   Copy-Item .dev.vars.example .dev.vars
   ```

   **macOS/Linux:**
   ```sh
   cp .env.example .env.local
   cp .dev.vars.example .dev.vars
   ```

   These examples use demo-only Firebase values. Do not replace the demo project with production settings when running the emulator.

3. Start the Firebase emulators in one terminal:

   ```sh
   npm run emulators
   ```

4. Start the website in a second terminal:

   ```sh
   npm run dev
   ```

   Open the local URL printed by Vite (normally `http://localhost:5173`).

## Useful commands

| Command | Purpose |
|---|---|
| `npm test` | Run unit tests |
| `npm run lint` | Run ESLint |
| `npm run build` | Build the application and Worker |
| `npm run preview` | Preview a local production build |
| `npm run emulators` | Start local Auth, Firestore, Realtime Database, and Storage emulators |

## Firebase and deployment notes

- The checked-in `.firebaserc` defaults to `demo-onioncare`; local emulator data is not production data.
- For a real Firebase project, configure its Web app values in the ignored `.env.local` file and Worker-only service-account credentials in `.dev.vars` for local work. For Cloudflare, store private credentials as Worker secrets with Wrangler; never put private keys in Vite variables or source control.
- Google sign-in requires the provider and authorized domains to be configured in Firebase Console.
- Do not deploy, migrate data, or change production Firebase rules without verifying project access, backups, and owner approval.

## License

Released under the [MIT License](./LICENSE). Copyright © 2026 Crisjan Alleh Prado.
