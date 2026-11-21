const INVALID_TOKEN_CODES = new Set(["INVALID_ID_TOKEN", "TOKEN_EXPIRED", "USER_DISABLED", "USER_NOT_FOUND"]);

export class FirebaseAuthVerificationError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = "FirebaseAuthVerificationError";
    this.status = status;
    this.code = "FIREBASE_AUTH_VERIFICATION_FAILED";
  }
}

function authLookupUrl(apiKey, emulatorHost) {
  if (!apiKey) throw new FirebaseAuthVerificationError("Firebase Auth server configuration is incomplete.", 503);
  if (emulatorHost) {
    const host = emulatorHost.includes("://") ? emulatorHost : `http://${emulatorHost}`;
    return `${host.replace(/\/$/, "")}/identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`;
  }
  return `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`;
}

export async function verifyFirebaseIdToken({ token, apiKey, emulatorHost = "", fetchImpl = fetch }) {
  if (!token || typeof token !== "string") return null;

  const response = await fetchImpl(authLookupUrl(apiKey, emulatorHost), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: token }),
  });

  const responseText = await response.text();
  let payload;
  try {
    payload = responseText ? JSON.parse(responseText) : null;
  } catch {
    throw new FirebaseAuthVerificationError("Firebase Auth returned an invalid response.", 502);
  }

  if (!response.ok) {
    const code = payload?.error?.message;
    if (INVALID_TOKEN_CODES.has(code)) return null;
    throw new FirebaseAuthVerificationError("Firebase Auth could not verify the sign-in request.", 502);
  }

  const user = payload?.users?.[0];
  if (!user?.localId || user.disabled === true) return null;

  return {
    id: user.localId,
    email: user.email ?? null,
    full_name: user.displayName ?? null,
    emailVerified: user.emailVerified === true,
  };
}
