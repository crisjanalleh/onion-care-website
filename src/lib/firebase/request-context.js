import { env } from "cloudflare:workers";
import { firebaseConfig } from "./config";
import { FIREBASE_API_SCOPES, getFirebaseServiceAccessToken } from "./oauth";

const EMULATOR_BINDINGS = [
  "FIREBASE_AUTH_EMULATOR_HOST",
  "FIREBASE_FIRESTORE_EMULATOR_HOST",
  "FIREBASE_DATABASE_EMULATOR_HOST",
  "FIREBASE_STORAGE_EMULATOR_HOST",
];

export function createFirebaseRequestContext() {
  const isEmulator = env.FIREBASE_EMULATOR_MODE === "true";
  if (isEmulator) {
    const missing = EMULATOR_BINDINGS.filter((key) => !env[key]);
    if (!firebaseConfig.projectId.startsWith("demo-") || missing.length) {
      throw new Error(`Firebase Emulator configuration is invalid; missing bindings: ${missing.join(", ") || "demo project ID"}.`);
    }
  }

  const tokenPromises = new Map();
  return {
    apiKey: firebaseConfig.apiKey,
    projectId: firebaseConfig.projectId,
    databaseURL: firebaseConfig.databaseURL,
    storageBucket: firebaseConfig.storageBucket,
    emulator: isEmulator,
    authEmulatorHost: isEmulator ? env.FIREBASE_AUTH_EMULATOR_HOST : "",
    firestoreEmulatorHost: isEmulator ? env.FIREBASE_FIRESTORE_EMULATOR_HOST : "",
    databaseEmulatorHost: isEmulator ? env.FIREBASE_DATABASE_EMULATOR_HOST : "",
    storageEmulatorHost: isEmulator ? env.FIREBASE_STORAGE_EMULATOR_HOST : "",
    getAccessToken(service) {
      if (!Object.hasOwn(FIREBASE_API_SCOPES, service)) {
        throw new Error(`Unsupported Firebase service: ${service}`);
      }
      if (isEmulator) return Promise.resolve("owner");

      const promiseKey = service;
      if (!tokenPromises.has(promiseKey)) {
        const scopes = service === "realtimeDatabase"
          ? [FIREBASE_API_SCOPES.realtimeDatabase, FIREBASE_API_SCOPES.userInfo]
          : [FIREBASE_API_SCOPES[service]];
        tokenPromises.set(
          promiseKey,
          getFirebaseServiceAccessToken({
            email: env.FIREBASE_SERVICE_ACCOUNT_EMAIL,
            privateKey: env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY,
            scopes,
          }),
        );
      }
      return tokenPromises.get(promiseKey);
    },
  };
}
