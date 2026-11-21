import assert from "node:assert/strict";
import test from "node:test";
import { uploadMedia } from "../src/lib/firebase/media-upload.js";

const user = { id: "admin-uid", emailVerified: true, role: "admin" };
const firebase = {
  emulator: true,
  storageBucket: "demo-onioncare.appspot.com",
  storageEmulatorHost: "127.0.0.1:9199",
  getAccessToken: async () => "owner",
};

test("uploads verified-admin images with the Storage Emulator multipart protocol", async () => {
  let requestUrl;
  let requestOptions;
  const request = new Request("http://localhost/api/media-upload", {
    method: "POST",
    headers: { "content-type": "image/png", "x-file-name": "test%2Fimage.png" },
    body: Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a),
  });

  const response = await uploadMedia(request, { user, firebase }, async (url, options) => {
    requestUrl = String(url);
    requestOptions = options;
    return Response.json({ name: "test-object" });
  });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.match(requestUrl, /uploadType=multipart/);
  assert.equal(requestOptions.headers["X-Goog-Upload-Protocol"], "multipart");
  assert.equal(result.fileName, "test_image.png");
  assert.equal(result.contentType, "image/png");
  assert.equal(result.fileSizeBytes, 8);
  assert.match(result.storagePath, /^media\/admin-uid\/.+\.png$/);
  assert.match(result.fileUrl, /^http:\/\/127\.0\.0\.1:9199\/v0\/b\//);
});

test("rejects images whose bytes do not match their declared type", async () => {
  const request = new Request("http://localhost/api/media-upload", {
    method: "POST",
    headers: { "content-type": "image/png" },
    body: Uint8Array.of(0, 1, 2, 3),
  });
  let fetched = false;

  const response = await uploadMedia(request, { user, firebase }, async () => {
    fetched = true;
    return Response.json({});
  });

  assert.equal(response.status, 415);
  assert.equal(fetched, false);
});

test("rejects uploads from non-administrator accounts", async () => {
  const request = new Request("http://localhost/api/media-upload", {
    method: "POST",
    headers: { "content-type": "image/png" },
    body: Uint8Array.of(0x89, 0x50, 0x4e, 0x47),
  });

  const response = await uploadMedia(request, {
    user: { ...user, role: "farmer" },
    firebase,
  });

  assert.equal(response.status, 403);
});
