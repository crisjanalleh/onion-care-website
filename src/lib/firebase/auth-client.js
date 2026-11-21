import {
  applyActionCode,
  browserLocalPersistence,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  verifyPasswordResetCode,
} from "@firebase/auth";
import { getFirebaseAuth } from "./client";

function actionSettings(path) {
  const url = new URL(path, window.location.origin).toString();
  return { url, handleCodeInApp: true };
}

async function persistentAuth() {
  const auth = getFirebaseAuth();
  await setPersistence(auth, browserLocalPersistence);
  return auth;
}

export async function createEmailAccount(email, password) {
  const auth = await persistentAuth();
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  return credential.user;
}

export async function sendVerificationEmail(user) {
  if (!user) throw new Error("Sign in again before requesting an email verification link.");
  await sendEmailVerification(user, actionSettings("/auth/action"));
}

export async function signInEmail(email, password) {
  const auth = await persistentAuth();
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return credential.user;
}

export async function signInGoogle() {
  const auth = await persistentAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    const credential = await signInWithPopup(auth, provider);
    return { user: credential.user, redirecting: false };
  } catch (error) {
    if (["auth/popup-blocked", "auth/operation-not-supported-in-this-environment"].includes(error?.code)) {
      await signInWithRedirect(auth, provider);
      return { user: null, resolver: null, redirecting: true };
    }
    throw error;
  }
}

export async function completeGoogleRedirect() {
  const auth = await persistentAuth();
  const credential = await getRedirectResult(auth);
  return credential?.user ?? null;
}

export async function resendVerificationEmail() {
  const auth = getFirebaseAuth();
  if (!auth.currentUser) throw new Error("Sign in again before requesting an email verification link.");
  await sendEmailVerification(auth.currentUser, actionSettings("/auth/action"));
}

export async function refreshCurrentFirebaseUser() {
  const user = getFirebaseAuth().currentUser;
  if (!user) return null;
  await user.reload();
  return getFirebaseAuth().currentUser;
}

export async function requestPasswordReset(email) {
  const auth = await persistentAuth();
  await sendPasswordResetEmail(auth, email.trim(), actionSettings("/auth/action"));
}

export async function verifyResetCode(oobCode) {
  const auth = getFirebaseAuth();
  return verifyPasswordResetCode(auth, oobCode);
}

export async function resetPassword(oobCode, newPassword) {
  const auth = getFirebaseAuth();
  await confirmPasswordReset(auth, oobCode, newPassword);
}

export async function applyVerificationCode(oobCode) {
  const auth = getFirebaseAuth();
  await applyActionCode(auth, oobCode);
}

export async function signOutFirebaseUser() {
  const auth = getFirebaseAuth();
  await signOut(auth);
}

export function firebaseAuthErrorMessage(error) {
  switch (error?.code) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Email or password is incorrect.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Sign in or reset your password.";
    case "auth/weak-password":
      return "Choose a stronger password with at least 8 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a few minutes and try again.";
    case "auth/unauthorized-domain":
      return "This website domain is not authorized for Firebase sign-in.";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled for the Firebase project.";
    case "auth/multi-factor-auth-required":
      return "This account requires multi-factor authentication, which is not configured for this OnionCare deployment. Contact the administrator.";
    case "auth/network-request-failed":
      return "Unable to reach Firebase. Check your connection and try again.";
    case "FIREBASE_CONFIGURATION_MISSING":
      return error.message;
    default:
      return "Firebase could not complete that request. Please try again.";
  }
}
