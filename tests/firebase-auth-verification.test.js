import assert from "node:assert/strict";
import test from "node:test";
import {
  FirebaseAuthVerificationError,
  verifyFirebaseIdToken,
} from "../src/lib/firebase/auth-verification.js";

test("validates the Firebase token through accounts:lookup and returns only identity fields", async () => {
  let requestUrl;
  let requestBody;
  const user = await verifyFirebaseIdToken({
    token: "id-token",
    apiKey: "public-test-key",
    fetchImpl: async (url, options) => {
      requestUrl = url;
      requestBody = JSON.parse(options.body);
      return Response.json({
        users: [{ localId: "uid-1", email: "farmer@example.test", displayName: "Farmer", emailVerified: true }],
      });
    },
  });

  assert.equal(new URL(requestUrl).pathname, "/v1/accounts:lookup");
  assert.deepEqual(requestBody, { idToken: "id-token" });
  assert.deepEqual(user, {
    id: "uid-1",
    email: "farmer@example.test",
    full_name: "Farmer",
    emailVerified: true,
  });
});

test("rejects invalid and disabled Firebase identities without disclosing token details", async () => {
  const invalid = await verifyFirebaseIdToken({
    token: "bad-token",
    apiKey: "public-test-key",
    fetchImpl: async () => Response.json(
      { error: { message: "INVALID_ID_TOKEN" } },
      { status: 400 },
    ),
  });
  const disabled = await verifyFirebaseIdToken({
    token: "disabled-token",
    apiKey: "public-test-key",
    fetchImpl: async () => Response.json({ users: [{ localId: "uid-2", disabled: true }] }),
  });

  assert.equal(invalid, null);
  assert.equal(disabled, null);
});

test("surfaces Firebase service failures without exposing provider response text", async () => {
  await assert.rejects(
    verifyFirebaseIdToken({
      token: "id-token",
      apiKey: "public-test-key",
      fetchImpl: async () => Response.json(
        { error: { message: "INTERNAL_ERROR private details" } },
        { status: 500 },
      ),
    }),
    (error) => {
      assert.ok(error instanceof FirebaseAuthVerificationError);
      assert.equal(error.message, "Firebase Auth could not verify the sign-in request.");
      return true;
    },
  );
});

test("does not make a network request for an absent token", async () => {
  let called = false;
  const user = await verifyFirebaseIdToken({
    token: null,
    apiKey: "public-test-key",
    fetchImpl: async () => {
      called = true;
      return Response.json({});
    },
  });

  assert.equal(user, null);
  assert.equal(called, false);
});
