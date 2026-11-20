/**
 * The client half of the multi-factor sign-in flow.
 *
 * `mfaSession(challenge)` wraps a sign-in challenge in the requests the MFA
 * screens make, and `finishSignIn` hands the finished sign-in back to the app.
 * Outside the application runtime there is no auth backend, so these requests fail;
 * the screens surface that as an ordinary sign-in error.
 */
import { db } from "@/api/appClient";
import { getAppParams } from "@/lib/app-params";

const appId = () => getAppParams().appId;

async function authPost(suffix, body, token) {
  const response = await fetch(`/api/apps/${appId()}/auth/${suffix}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error?.message || result.detail || "The request could not be completed.");
    error.mustSignInAgain = Boolean(result.must_sign_in_again) || response.status === 410;
    throw error;
  }
  return result;
}

/** The app's name and sign-in settings, as the application's login-info reports them. */
export async function loadSignInOptions() {
  const response = await fetch(`/api/apps/public/login-info/by-id/${appId()}`);
  if (!response.ok) throw new Error("Unable to load sign-in options.");
  return response.json();
}

/** Stores the finished session and returns the visitor to where they were headed. */
export function finishSignIn(accessToken, returnTo) {
  if (accessToken && typeof db?.auth?.setToken === "function") db.auth.setToken(accessToken);
  const target = typeof returnTo === "string" && returnTo.startsWith("/") ? returnTo : "/dashboard";
  if (typeof window !== "undefined") window.location.assign(target);
}

/** Wraps a sign-in challenge in the operations the MFA screens perform. */
export function mfaSession(challenge) {
  const token = challenge?.mfa_session_token ?? challenge?.token ?? null;
  return {
    challenge,
    sendSignInCode: (method) => authPost("mfa/send", { method }, token),
    verify: (code, method, remember) => authPost("mfa/verify", { code, method, remember }, token),
    setupAuthenticator: () => authPost("mfa/totp/setup", {}, token),
    sendPhoneCode: (phone) => authPost("mfa/sms/send", { phone }, token),
    confirmAuthenticator: (code) => authPost("mfa/totp/verify", { code }, token),
    confirmPhone: (code) => authPost("mfa/sms/verify", { code }, token),
  };
}
