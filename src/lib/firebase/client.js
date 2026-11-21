import { getApp, getApps, initializeApp } from "@firebase/app";
import { browserLocalPersistence, connectAuthEmulator, getAuth, setPersistence } from "@firebase/auth";
import { authEmulatorHost, requireFirebaseConfig } from "./config";

let firebaseAuth;

export function getFirebaseAuth() {
  if (typeof window === "undefined") {
    throw new Error("Firebase Authentication is available only in the browser.");
  }
  if (firebaseAuth) return firebaseAuth;

  const config = requireFirebaseConfig();
  const app = getApps().length ? getApp() : initializeApp(config);
  firebaseAuth = getAuth(app);

  if (authEmulatorHost) {
    const host = authEmulatorHost.includes("://") ? authEmulatorHost : `http://${authEmulatorHost}`;
    connectAuthEmulator(firebaseAuth, host, { disableWarnings: true });
  }

  return firebaseAuth;
}

export async function ensureFirebasePersistence() {
  const auth = getFirebaseAuth();
  await setPersistence(auth, browserLocalPersistence);
  return auth;
}
