const viteEnv = import.meta.env ?? {};

export const firebaseConfig = Object.freeze({
  apiKey: viteEnv.VITE_FIREBASE_API_KEY ?? "",
  authDomain: viteEnv.VITE_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: viteEnv.VITE_FIREBASE_PROJECT_ID ?? "",
  storageBucket: viteEnv.VITE_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: viteEnv.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: viteEnv.VITE_FIREBASE_APP_ID ?? "",
  databaseURL: viteEnv.VITE_FIREBASE_DATABASE_URL ?? "",
});

export const authEmulatorHost = viteEnv.VITE_FIREBASE_AUTH_EMULATOR_HOST ?? "";

export class FirebaseConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = "FirebaseConfigurationError";
    this.code = "FIREBASE_CONFIGURATION_MISSING";
  }
}

export function requireFirebaseConfig() {
  const required = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"];
  const missing = required.filter((key) => !firebaseConfig[key]);
  if (missing.length) {
    throw new FirebaseConfigurationError(
      `Firebase Web configuration is incomplete (${missing.join(", ")}). Copy .env.example to .env.local and add the Web app values from Firebase Console.`,
    );
  }

  if (!viteEnv.DEV && firebaseConfig.projectId.startsWith("demo-")) {
    throw new FirebaseConfigurationError("A demo Firebase Emulator project cannot be used in a production build.");
  }

  if (authEmulatorHost && (!viteEnv.DEV || !firebaseConfig.projectId.startsWith("demo-"))) {
    throw new FirebaseConfigurationError("Firebase Auth Emulator is allowed only in local development with a demo-* project.");
  }

  return firebaseConfig;
}
