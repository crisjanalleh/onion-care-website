import assert from "node:assert/strict";
import test from "node:test";
import {
  createFirebaseDatabase,
  FirebaseDataError,
} from "../src/lib/firebase/firestore-rest.js";

const firebase = {
  projectId: "demo-onioncare",
  emulator: true,
  firestoreEmulatorHost: "127.0.0.1:8080",
  getAccessToken: async () => "owner",
};

function document(collection, id, fields) {
  return {
    name: `projects/demo-onioncare/databases/(default)/documents/${collection}/${id}`,
    fields: Object.fromEntries(
      Object.entries(fields).map(([key, value]) => [
        key,
        typeof value === "number" ? { integerValue: String(value) } : { stringValue: value },
      ]),
    ),
  };
}

test("maps the User entity to server-managed userAccounts records", async () => {
  let calledUrl;
  const database = createFirebaseDatabase(firebase, {
    fetchImpl: async (url) => {
      calledUrl = String(url);
      return Response.json(document("userAccounts", "uid-1", { role: "admin", email: "admin@example.test" }));
    },
  });

  assert.equal("asServiceRole" in database, false);
  const account = await database.entities.User.get("uid-1");

  assert.match(calledUrl, /documents\/userAccounts\/uid-1$/);
  assert.deepEqual(account, { id: "uid-1", role: "admin", email: "admin@example.test" });
});

test("uses Firebase Auth UID document IDs and returns canonical timestamp aliases", async () => {
  let calledUrl;
  const database = createFirebaseDatabase(firebase, {
    fetchImpl: async (url, options) => {
      calledUrl = String(url);
      assert.equal(options.method, "POST");
      const request = JSON.parse(options.body);
      assert.ok(request.fields.createdAt.timestampValue);
      assert.ok(request.fields.updatedAt.timestampValue);
      return Response.json(document("farmerProfiles", "uid-1", {
        uid: "uid-1",
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-02T00:00:00.000Z",
      }));
    },
  });

  const profile = await database.entities.FarmerProfile.create({ uid: "uid-1", name: "Farmer" });

  assert.match(calledUrl, /documents\/farmerProfiles\?documentId=uid-1$/);
  assert.equal(profile.id, "uid-1");
  assert.equal(profile.created_date, "2025-01-01T00:00:00.000Z");
  assert.equal(profile.updated_date, "2025-01-02T00:00:00.000Z");
});

test("filters and sorts query results while supporting literal case-insensitive search", async () => {
  let requestBody;
  const database = createFirebaseDatabase(firebase, {
    fetchImpl: async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return Response.json([
        { document: document("FarmerProfile", "farmer-2", { role: "farmer", name: "Onion Farm 2", createdAt: "2025-02-01T00:00:00.000Z" }) },
        { document: document("FarmerProfile", "farmer-1", { role: "farmer", name: "Onion Farm 1", createdAt: "2025-01-01T00:00:00.000Z" }) },
        { document: document("FarmerProfile", "admin-1", { role: "admin", name: "Onion Admin", createdAt: "2025-03-01T00:00:00.000Z" }) },
      ]);
    },
  });

  const page = await database.entities.FarmerProfile.filter(
    { role: "farmer", $or: [{ name: { $regex: "FARM 1", $options: "i" } }] },
    { sort: "-created_date", limit: 5 },
  );

  assert.equal(requestBody.structuredQuery.where.fieldFilter.field.fieldPath, "role");
  assert.deepEqual(page.map(({ id }) => id), ["farmer-1"]);
  assert.equal(page.items, page);
});

test("reports Firebase data failures instead of returning an empty success-shaped result", async () => {
  const database = createFirebaseDatabase(firebase, {
    fetchImpl: async () => Response.json(
      { error: { status: "PERMISSION_DENIED" } },
      { status: 403 },
    ),
  });

  await assert.rejects(database.entities.Disease.filter({}), (error) => {
    assert.ok(error instanceof FirebaseDataError);
    assert.equal(error.status, 403);
    return true;
  });
});

test("commits unique reservations atomically with the farmer profile", async () => {
  let calledUrl;
  let requestBody;
  const database = createFirebaseDatabase(firebase, {
    fetchImpl: async (url, options) => {
      calledUrl = String(url);
      requestBody = JSON.parse(options.body);
      return Response.json({ writeResults: [{}, {}, {}] });
    },
  });

  const profile = await database.createWithUniqueKeys({
    entity: "FarmerProfile",
    id: "uid-1",
    data: { uid: "uid-1", username: "onion_grower", number: "09123456789" },
    uniqueKeys: [
      { collection: "usernameReservations", id: "onion_grower", field: "username", value: "onion_grower" },
      { collection: "phoneReservations", id: "09123456789", field: "number", value: "09123456789" },
    ],
  });

  assert.match(calledUrl, /documents:commit$/);
  assert.equal(requestBody.writes.length, 3);
  assert.ok(requestBody.writes.every((write) => write.currentDocument.exists === false));
  assert.match(requestBody.writes[0].update.name, /farmerProfiles\/uid-1$/);
  assert.match(requestBody.writes[1].update.name, /usernameReservations\/onion_grower$/);
  assert.match(requestBody.writes[2].update.name, /phoneReservations\/09123456789$/);
  assert.equal(profile.id, "uid-1");
});

test("maps reservation conflicts to a specific unique-value error", async () => {
  const database = createFirebaseDatabase(firebase, {
    fetchImpl: async () => Response.json(
      { error: { status: "FAILED_PRECONDITION" } },
      { status: 400 },
    ),
  });

  await assert.rejects(
    database.createWithUniqueKeys({
      entity: "FarmerProfile",
      id: "uid-2",
      data: { uid: "uid-2" },
      uniqueKeys: [{ collection: "usernameReservations", id: "taken", field: "username", value: "taken" }],
    }),
    (error) => error.code === "UNIQUE_VALUE_CONFLICT" && error.status === 409,
  );
});
