/* global process, console */
import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import admin from "firebase-admin";

const PROJECT_ID = "onioncare-e1e5a";
const DATABASE_URL = "https://onioncare-e1e5a-default-rtdb.firebaseio.com";
const STORAGE_BUCKET = "onioncare-e1e5a.firebasestorage.app";
const OUTPUT_PATH = resolve(dirname(fileURLToPath(import.meta.url)), "..", "LIVE-FIREBASE-INVENTORY.json");

function createReport() {
  return {
    projectId: PROJECT_ID,
    credentialConfigured: Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()),
    status: "running",
    services: {
      adminSdk: "not-tested",
      firestore: "not-tested",
      realtimeDatabase: "not-tested",
      authentication: "not-tested",
      storage: "not-tested",
    },
    firestore: { collections: {} },
    realtimeDatabase: { topLevelNodes: [] },
    authentication: { status: "not-tested", count: null },
    storage: { status: "not-tested", fileCount: null, files: [] },
    errors: {},
    blockers: [],
  };
}

function safeDiagnostic(error) {
  const rawName = String(error?.name ?? "Error");
  const rawCode = String(error?.code ?? "unknown");
  let message = String(error?.message ?? "No diagnostic message was provided.");

  message = message
    .replace(/-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z0-9 ]*PRIVATE KEY-----/gi, "[REDACTED PRIVATE KEY]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [REDACTED]")
    .replace(/(access[_ -]?token|refresh[_ -]?token|id[_ -]?token|private[_ -]?key|client[_ -]?secret|password)\s*[:=]\s*["']?[^,\s"'&}]+/gi, "$1=[REDACTED]")
    .replace(/([?&](?:key|token|credential|signature|sig)=)[^&\s]+/gi, "$1[REDACTED]")
    .replace(/[\r\n\t]+/g, " ")
    .slice(0, 500);

  return {
    name: /^[A-Za-z][A-Za-z0-9_.-]{0,80}$/.test(rawName) ? rawName : "Error",
    code: /^[A-Za-z0-9_.:/-]{1,100}$/.test(rawCode) ? rawCode : "unknown",
    message,
  };
}

function recordFailure(report, service, error) {
  const diagnostic = safeDiagnostic(error);
  report.services[service] = "blocked";
  report.errors[service] = diagnostic;
  report.blockers.push({ service, ...diagnostic });
}

async function writeReport(report) {
  report.generatedAt = new Date().toISOString();
  await writeFile(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

function fieldFingerprint(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (value && typeof value === "object" && typeof value.toDate === "function") return "timestamp";
  return typeof value;
}

function walkFirestoreCollection(collectionRef, report, prefix = "") {
  return collectionRef.get().then(async (snapshot) => {
    const collectionName = `${prefix}${collectionRef.id}`;
    const collectionReport = {
      documentCount: snapshot.size,
      documentIds: [],
      fields: {},
      nestedCollections: [],
    };
    for (const documentSnapshot of snapshot.docs) {
      collectionReport.documentIds.push(documentSnapshot.id);
      const data = documentSnapshot.data() || {};
      for (const [field, value] of Object.entries(data)) {
        if (field.toLowerCase().includes("password")) {
          collectionReport.fields[field] ||= { types: new Set(), count: 0, sensitive: true };
          collectionReport.fields[field].types.add("sensitive-redacted");
          collectionReport.fields[field].count += 1;
          continue;
        }
        const fingerprint = fieldFingerprint(value);
        collectionReport.fields[field] ||= { types: new Set(), count: 0 };
        collectionReport.fields[field].types.add(fingerprint);
        collectionReport.fields[field].count += 1;
      }
      const nestedCollections = await documentSnapshot.ref.listCollections();
      for (const nestedCollection of nestedCollections) {
        collectionReport.nestedCollections.push(`${collectionName}/${documentSnapshot.id}/${nestedCollection.id}`);
        await walkFirestoreCollection(nestedCollection, report, `${collectionName}/${documentSnapshot.id}/`);
      }
    }
    report.firestore.collections[collectionName] = {
      ...collectionReport,
      fields: Object.fromEntries(
        Object.entries(collectionReport.fields).map(([field, details]) => [
          field,
          { types: [...details.types], count: details.count, ...(details.sensitive ? { sensitive: true } : {}) },
        ]),
      ),
    };
  });
}

function countRtdb(node) {
  if (!node || typeof node !== "object") return { nodes: 1, pushIds: 0 };
  let nodes = 1;
  let pushIds = 0;
  for (const [key, value] of Object.entries(node)) {
    if (/^-[A-Za-z0-9_-]{8,}$/.test(key)) pushIds += 1;
    const child = countRtdb(value);
    nodes += child.nodes;
    pushIds += child.pushIds;
  }
  return { nodes, pushIds };
}

async function main(report) {
  if (!report.credentialConfigured) {
    report.status = "blocked";
    report.services.adminSdk = "not-configured";
    report.blocker = "GOOGLE_APPLICATION_CREDENTIALS is not available in this execution environment.";
    report.errors.credentials = {
      name: "ConfigurationError",
      code: "CREDENTIALS_MISSING",
      message: report.blocker,
    };
    report.blockers.push({ service: "credentials", ...report.errors.credentials });
    await writeReport(report);
    process.exitCode = 1;
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: PROJECT_ID,
      databaseURL: DATABASE_URL,
      storageBucket: STORAGE_BUCKET,
    });
  } catch (error) {
    recordFailure(report, "adminSdk", error);
    report.status = "blocked";
    report.blocker = "Firebase Admin SDK initialization failed.";
    await writeReport(report);
    process.exitCode = 1;
    return;
  }

  if (!admin.apps.length) {
    const error = Object.assign(new Error("Firebase Admin SDK did not initialize an app."), {
      code: "INITIALIZATION_FAILED",
    });
    recordFailure(report, "adminSdk", error);
    report.status = "blocked";
    report.blocker = "Firebase Admin SDK initialization failed.";
    await writeReport(report);
    process.exitCode = 1;
    return;
  }
  report.services.adminSdk = "accessible";

  try {
    const collections = await admin.firestore().listCollections();
    for (const collection of collections) {
      await walkFirestoreCollection(collection, report);
    }
    report.services.firestore = "accessible";
  } catch (error) {
    recordFailure(report, "firestore", error);
  }

  try {
    const root = await admin.database().ref("/").get();
    const value = root.val();
    report.realtimeDatabase.topLevelNodes = value && typeof value === "object" ? Object.keys(value) : [];
    report.realtimeDatabase.count = countRtdb(value);
    report.services.realtimeDatabase = "accessible";
  } catch (error) {
    recordFailure(report, "realtimeDatabase", error);
  }

  try {
    let nextPageToken;
    let count = 0;
    do {
      const page = await admin.auth().listUsers(1000, nextPageToken);
      count += page.users.length;
      nextPageToken = page.pageToken;
    } while (nextPageToken);
    report.authentication = { status: "accessible", count };
    report.services.authentication = "accessible";
  } catch (error) {
    report.authentication.status = "blocked";
    recordFailure(report, "authentication", error);
  }

  try {
    const bucket = admin.storage().bucket(STORAGE_BUCKET);
    const [files] = await bucket.getFiles({ maxResults: 1000 });
    report.storage.status = "accessible";
    report.storage.fileCount = files.length;
    report.storage.files = files.map((file) => ({
      name: file.name,
      size: file.metadata.size,
      contentType: file.metadata.contentType,
      updated: file.metadata.updated,
    }));
    report.services.storage = "accessible";
  } catch (error) {
    report.storage.status = "blocked";
    recordFailure(report, "storage", error);
  }

  const hasBlockedService = Object.values(report.services).includes("blocked");
  report.status = hasBlockedService ? "partial" : "complete";
  if (hasBlockedService) {
    report.blocker = "One or more Firebase services could not be accessed.";
  }
  await writeReport(report);
  if (hasBlockedService) process.exitCode = 1;
}

const report = createReport();
main(report).catch(async (error) => {
  const diagnostic = safeDiagnostic(error);
  report.status = "failed";
  report.blocker = "An unexpected error occurred during the Firebase audit.";
  report.errors.audit = diagnostic;
  report.blockers.push({ service: "audit", ...diagnostic });
  try {
    await writeReport(report);
  } catch {
    console.error("Firebase audit failed and its JSON report could not be written.");
  }
  process.exitCode = 1;
});
