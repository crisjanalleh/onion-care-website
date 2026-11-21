import { importPKCS8, SignJWT } from "jose";

export const FIREBASE_API_SCOPES = Object.freeze({
  firestore: "https://www.googleapis.com/auth/datastore",
  realtimeDatabase: "https://www.googleapis.com/auth/firebase.database",
  storage: "https://www.googleapis.com/auth/devstorage.read_write",
  userInfo: "https://www.googleapis.com/auth/userinfo.email",
});

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GRANT_TYPE = "urn:ietf:params:oauth:grant-type:jwt-bearer";
const ALLOWED_SCOPES = new Set(Object.values(FIREBASE_API_SCOPES));

export class FirebaseServiceCredentialError extends Error {
  constructor(message, status = 503) {
    super(message);
    this.name = "FirebaseServiceCredentialError";
    this.status = status;
    this.code = "FIREBASE_SERVICE_CREDENTIAL_ERROR";
  }
}

function normalizePrivateKey(value) {
  return String(value ?? "").replace(/\\n/g, "\n").trim();
}

export async function createServiceAccountAssertion({ email, privateKey, scopes, now = Date.now() }) {
  if (!email || !privateKey) {
    throw new FirebaseServiceCredentialError(
      "Firebase server credentials are missing. Configure the service-account email and private key as Worker secrets.",
    );
  }
  if (!Array.isArray(scopes) || scopes.length === 0 || scopes.some((scope) => !ALLOWED_SCOPES.has(scope))) {
    throw new FirebaseServiceCredentialError("The Firebase API scope configuration is invalid.", 500);
  }

  const key = await importPKCS8(normalizePrivateKey(privateKey), "RS256");
  const issuedAt = Math.floor(now / 1000);
  return new SignJWT({ scope: [...new Set(scopes)].join(" ") })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(email)
    .setAudience(TOKEN_URL)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + 3600)
    .sign(key);
}

export async function exchangeServiceAccountAssertion({ assertion, fetchImpl = fetch }) {
  const response = await fetchImpl(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: GRANT_TYPE, assertion }),
  });

  const responseText = await response.text();
  let payload;
  try {
    payload = responseText ? JSON.parse(responseText) : null;
  } catch {
    throw new FirebaseServiceCredentialError("Google OAuth returned an invalid response.", 502);
  }

  if (!response.ok || !payload?.access_token) {
    throw new FirebaseServiceCredentialError("Google OAuth could not authorize Firebase data access.", 502);
  }

  return payload.access_token;
}

export async function getFirebaseServiceAccessToken({
  email,
  privateKey,
  scopes,
  fetchImpl = fetch,
  now,
}) {
  const assertion = await createServiceAccountAssertion({ email, privateKey, scopes, now });
  return exchangeServiceAccountAssertion({ assertion, fetchImpl });
}
