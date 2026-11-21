import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import test from "node:test";
import { importSPKI, jwtVerify } from "jose";
import {
  createServiceAccountAssertion,
  exchangeServiceAccountAssertion,
  FIREBASE_API_SCOPES,
  FirebaseServiceCredentialError,
} from "../src/lib/firebase/oauth.js";

globalThis.crypto ??= webcrypto;

async function createTestKeyPair() {
  const pair = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  );
  const privateBytes = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
  const publicBytes = new Uint8Array(await crypto.subtle.exportKey("spki", pair.publicKey));
  const toBase64 = (bytes) => Buffer.from(bytes).toString("base64").match(/.{1,64}/g).join("\n");
  return {
    privateKey: `-----BEGIN PRIVATE KEY-----\n${toBase64(privateBytes)}\n-----END PRIVATE KEY-----`,
    publicKey: `-----BEGIN PUBLIC KEY-----\n${toBase64(publicBytes)}\n-----END PUBLIC KEY-----`,
  };
}

test("creates a short-lived RS256 assertion with only approved Firebase scopes", async () => {
  const pair = await createTestKeyPair();
  const assertion = await createServiceAccountAssertion({
    email: "worker@example.test",
    privateKey: pair.privateKey,
    scopes: [FIREBASE_API_SCOPES.firestore],
    now: 1_700_000_000_000,
  });
  const publicKey = await importSPKI(pair.publicKey, "RS256");
  const { payload, protectedHeader } = await jwtVerify(assertion, publicKey, {
    audience: "https://oauth2.googleapis.com/token",
    issuer: "worker@example.test",
    currentDate: new Date(1_700_000_000_000),
  });

  assert.equal(protectedHeader.alg, "RS256");
  assert.equal(payload.scope, FIREBASE_API_SCOPES.firestore);
  assert.equal(payload.exp - payload.iat, 3600);
});

test("rejects missing credentials and unapproved OAuth scopes", async () => {
  await assert.rejects(
    createServiceAccountAssertion({ email: "", privateKey: "", scopes: [FIREBASE_API_SCOPES.firestore] }),
    FirebaseServiceCredentialError,
  );
  await assert.rejects(
    createServiceAccountAssertion({
      email: "worker@example.test",
      privateKey: "not-used",
      scopes: ["https://example.invalid/admin"],
    }),
    /scope configuration is invalid/,
  );
});

test("exchanges the assertion and returns only the access token", async () => {
  let request;
  const token = await exchangeServiceAccountAssertion({
    assertion: "signed-assertion",
    fetchImpl: async (url, options) => {
      request = { url, options };
      return Response.json({ access_token: "short-lived-token", expires_in: 3600 });
    },
  });

  assert.equal(request.url, "https://oauth2.googleapis.com/token");
  assert.equal(request.options.method, "POST");
  assert.equal(new URLSearchParams(request.options.body).get("assertion"), "signed-assertion");
  assert.equal(token, "short-lived-token");
});
