/* global process, console */
import { writeFile } from "node:fs/promises";
import admin from "firebase-admin";

const PROJECT_ID = "onioncare-e1e5a";
const DATABASE_URL = "https://onioncare-e1e5a-default-rtdb.firebaseio.com";
const STORAGE_BUCKET = "onioncare-e1e5a.firebasestorage.app";

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

async function main() {
  const report = {
    projectId: PROJECT_ID,
    credentialConfigured: Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    services: {},
    firestore: { collections: {} },
    realtimeDatabase: { topLevelNodes: [] },
    authentication: { status: "not-tested", count: null },
    storage: { status: "not-tested", fileCount: null, files: [] },
  };

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    report.blocker = "GOOGLE_APPLICATION_CREDENTIALS is not available in this execution environment.";
    await writeFile(
      "LIVE-FIREBASE-INVENTORY.md",
      `# Live Firebase inventory\n\nStatus: BLOCKED.\n\n${report.blocker}\n`,
    );
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
    report.services.adminSdk = `not-authenticated: ${error.code || "unknown"}`;
  }

  if (!admin.apps.length) {
    await writeFile("LIVE-FIREBASE-INVENTORY.md", `# Live Firebase inventory\n\nStatus: BLOCKED.\n\n${report.blocker ?? "Firebase Admin SDK could not initialize."}\n`);
    return;
  }

  try {
    const collections = await admin.firestore().listCollections();
    for (const collection of collections) {
      await walkFirestoreCollection(collection, report);
    }
    report.services.firestore = "accessible";
  } catch (error) {
    report.services.firestore = `blocked: ${error.code || "unknown"} (${error.message || "permission denied"})`;
  }

  try {
    const root = await admin.database().ref("/").get();
    const value = root.val();
    report.realtimeDatabase.topLevelNodes = value && typeof value === "object" ? Object.keys(value) : [];
    report.realtimeDatabase.count = countRtdb(value);
    report.services.realtimeDatabase = "accessible";
  } catch (error) {
    report.services.realtimeDatabase = `blocked: ${error.code || "unknown"} (${error.message || "permission denied"})`;
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
    report.services.authentication = `blocked: ${error.code || "unknown"} (${error.message || "permission denied"})`;
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
    report.services.storage = `blocked: ${error.code || "unknown"} (${error.message || "permission denied"})`;
  }

  const lines = [
    "# Live Firebase inventory",
    "",
    `Project: \`${PROJECT_ID}\``,
    "",
    "| Service | Status |",
    "|---|---|",
    ...Object.entries(report.services).map(([service, status]) => `| ${service} | ${status} |`),
    "",
    "## Firestore",
    "",
  ];
  for (const [collection, details] of Object.entries(report.firestore.collections)) {
    lines.push(`- \`${collection}\`: ${details.documentCount} documents`);
  }
  lines.push("", "## Realtime Database", "", `Top-level nodes: ${(report.realtimeDatabase.topLevelNodes || []).join(", ") || "none"}`);
  lines.push("", "## Authentication", "", `Status: ${report.authentication.status}; count: ${report.authentication.count ?? "unknown"}`);
  lines.push("", "## Storage", "", `Status: ${report.storage.status}; file count: ${report.storage.fileCount ?? "unknown"}`);
  await writeFile("LIVE-FIREBASE-INVENTORY.md", `${lines.join("\n")}\n`);
  await writeFile("LIVE-FIREBASE-INVENTORY.json", `${JSON.stringify(report, null, 2)}\n`);
}

main().catch(() => {
  console.error("Firebase audit failed before a live inventory could be completed.");
  process.exitCode = 1;
});
