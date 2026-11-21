const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const IMAGE_TYPES = Object.freeze({
  "image/jpeg": { extension: "jpg", signature: (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: "png", signature: (bytes) => bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 },
  "image/webp": { extension: "webp", signature: (bytes) => String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP" },
  "image/gif": { extension: "gif", signature: (bytes) => ["GIF87a", "GIF89a"].includes(String.fromCharCode(...bytes.slice(0, 6))) },
});

async function readBoundedBody(request) {
  const declaredSize = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredSize) && declaredSize > MAX_UPLOAD_BYTES) {
    throw Object.assign(new Error("Images must be 8 MB or smaller."), { status: 413 });
  }
  if (!request.body) throw Object.assign(new Error("Choose an image file to upload."), { status: 400 });

  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_UPLOAD_BYTES) {
      await reader.cancel();
      throw Object.assign(new Error("Images must be 8 MB or smaller."), { status: 413 });
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function multipartBody(metadata, contentType, bytes, boundary) {
  const encoder = new TextEncoder();
  const prefix = encoder.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`,
  );
  const suffix = encoder.encode(`\r\n--${boundary}--`);
  const body = new Uint8Array(prefix.byteLength + bytes.byteLength + suffix.byteLength);
  body.set(prefix);
  body.set(bytes, prefix.byteLength);
  body.set(suffix, prefix.byteLength + bytes.byteLength);
  return body;
}

function firebaseUrl(firebase, bucket, path) {
  const host = firebase.emulator
    ? `http://${firebase.storageEmulatorHost}`
    : "https://firebasestorage.googleapis.com";
  return `${host}/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(path)}?alt=media`;
}

export async function uploadMedia(request, context, fetchImpl = fetch) {
  if (!context.user || !context.user.emailVerified) {
    return Response.json({ error: "Sign in with a verified email before uploading." }, { status: 401 });
  }
  if (context.user.role !== "admin") {
    return Response.json({ error: "Administrator access is required." }, { status: 403 });
  }

  const contentType = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  const imageType = IMAGE_TYPES[contentType];
  if (!imageType) {
    return Response.json({ error: "Upload a JPEG, PNG, WebP, or GIF image." }, { status: 415 });
  }

  const bytes = await readBoundedBody(request);
  if (!bytes.length || !imageType.signature(bytes)) {
    return Response.json({ error: "The uploaded file does not match its image type." }, { status: 415 });
  }

  const path = `media/${context.user.id}/${crypto.randomUUID()}.${imageType.extension}`;
  const downloadToken = crypto.randomUUID();
  const boundary = `onioncare-${crypto.randomUUID()}`;
  const metadata = {
    name: path,
    contentType,
    metadata: { firebaseStorageDownloadTokens: downloadToken },
  };
  const host = context.firebase.emulator
    ? `http://${context.firebase.storageEmulatorHost}`
    : "https://firebasestorage.googleapis.com";
  const url = `${host}/v0/b/${encodeURIComponent(context.firebase.storageBucket)}/o?uploadType=multipart&name=${encodeURIComponent(path)}`;
  const token = await context.firebase.getAccessToken("storage");
  const response = await fetchImpl(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
      ...(context.firebase.emulator ? { "X-Goog-Upload-Protocol": "multipart" } : {}),
    },
    body: multipartBody(metadata, contentType, bytes, boundary),
  });
  if (!response.ok) {
    throw Object.assign(new Error("Firebase Storage could not save the image."), { status: 502, code: "FIREBASE_STORAGE_UPLOAD_FAILED" });
  }

  let fileName = request.headers.get("x-file-name") ?? path.split("/").at(-1);
  try {
    fileName = decodeURIComponent(fileName);
  } catch {
    fileName = path.split("/").at(-1);
  }
  fileName = [...fileName]
    .map((character) => {
      const codePoint = character.codePointAt(0);
      return character === "/" || character === "\\" || codePoint < 32 || codePoint === 127 ? "_" : character;
    })
    .join("")
    .slice(0, 240);
  return Response.json({
    fileUrl: `${firebaseUrl(context.firebase, context.firebase.storageBucket, path)}&token=${encodeURIComponent(downloadToken)}`,
    fileName,
    contentType,
    fileSizeBytes: bytes.byteLength,
    storagePath: path,
  });
}
