const COLLECTIONS = Object.freeze({
  User: "userAccounts",
  UserAccount: "userAccounts",
  FarmerProfile: "farmerProfiles",
  AdminAssignment: "adminAssignments",
  DiagnosisRecord: "diagnosisRecords",
  DiseaseReport: "diseaseReports",
  Disease: "diseases",
  Conversation: "conversations",
  Message: "messages",
  ContentArticle: "contentArticles",
  Pest: "pests",
  TreatmentRecommendation: "treatmentRecommendations",
  MediaAsset: "mediaAssets",
  AuditLog: "auditLogs",
  Notification: "notifications",
});

const DOCUMENT_IDS = Object.freeze({
  User: "id",
  UserAccount: "id",
  FarmerProfile: "uid",
  AdminAssignment: "locationKey",
  Disease: "diseaseId",
  Pest: "pestId",
});

const TIMESTAMP_FIELDS = new Set([
  "createdAt",
  "updatedAt",
  "occurredAt",
  "lastLoginAt",
  "reviewedAt",
  "lastReviewedAt",
  "publishedAt",
  "uploadedAt",
  "lastMessageAt",
  "readAt",
  "timestamp",
]);
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

export class FirebaseDataError extends Error {
  constructor(message, status, code = "FIREBASE_DATA_ERROR") {
    super(message);
    this.name = "FirebaseDataError";
    this.status = status;
    this.code = code;
  }
}

function collectionName(name) {
  if (typeof name !== "string" || !/^[A-Za-z][A-Za-z0-9_]*$/.test(name)) {
    throw new FirebaseDataError("The requested data collection is invalid.", 400);
  }
  return COLLECTIONS[name] ?? name;
}

function decodeValue(value) {
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("nullValue" in value) return null;
  if ("arrayValue" in value) return (value.arrayValue.values ?? []).map(decodeValue);
  if ("mapValue" in value) return decodeFields(value.mapValue.fields ?? {});
  if ("referenceValue" in value) return value.referenceValue;
  return null;
}

function decodeFields(fields) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]));
}

function decodeDocument(document) {
  const id = document.name.split("/").at(-1);
  const fields = decodeFields(document.fields ?? {});
  const createdAt = fields.createdAt ?? fields.created_date;
  const updatedAt = fields.updatedAt ?? fields.updated_date;
  return {
    ...fields,
    id,
    ...(createdAt !== undefined ? { createdAt, created_date: fields.created_date ?? createdAt } : {}),
    ...(updatedAt !== undefined ? { updatedAt, updated_date: fields.updated_date ?? updatedAt } : {}),
  };
}

function encodeValue(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  if (typeof value === "object") return { mapValue: { fields: encodeFields(value) } };
  throw new FirebaseDataError("The requested data contains an unsupported value.", 400);
}

function encodeFields(fields) {
  return Object.fromEntries(
    Object.entries(fields)
      .filter(([key, value]) => key !== "id" && value !== undefined)
      .map(([key, value]) => [
        key,
        typeof value === "string" && TIMESTAMP_FIELDS.has(key) && ISO_TIMESTAMP.test(value)
          ? { timestampValue: value }
          : encodeValue(value),
      ]),
  );
}

function matches(record, query = {}) {
  return Object.entries(query).every(([key, expected]) => {
    if (key === "$or") return Array.isArray(expected) && expected.some((clause) => matches(record, clause));
    const actual = record[key] ?? (
      key === "created_date" ? record.createdAt ?? record.created_date
        : key === "updated_date" ? record.updatedAt ?? record.updated_date
          : undefined
    );
    if (expected && typeof expected === "object" && "$regex" in expected) {
      const value = String(actual ?? "");
      const term = String(expected.$regex ?? "");
      return (expected.$options ?? "").includes("i")
        ? value.toLocaleLowerCase().includes(term.toLocaleLowerCase())
        : value.includes(term);
    }
    return actual === expected;
  });
}

function compareValues(left, right) {
  if (left === right) return 0;
  if (left == null) return -1;
  if (right == null) return 1;
  const leftTime = typeof left === "string" ? Date.parse(left) : NaN;
  const rightTime = typeof right === "string" ? Date.parse(right) : NaN;
  if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) return leftTime - rightTime;
  return left > right ? 1 : -1;
}

function encodeCursor(id) {
  return btoa(JSON.stringify({ id })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeCursor(cursor) {
  try {
    const normalized = cursor.replace(/-/g, "+").replace(/_/g, "/");
    const value = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")));
    if (typeof value.id !== "string") throw new Error();
    return value.id;
  } catch {
    throw new FirebaseDataError("The pagination cursor is invalid.", 400);
  }
}

function errorMessage(status) {
  if (status === 404) return "The requested Firebase record was not found.";
  if (status === 409) return "A Firebase record with that identifier already exists.";
  return "Firebase could not complete the data request.";
}

function createEntityApi(name, firebase, fetchImpl) {
  const collection = collectionName(name);
  const baseUrl = firebase.emulator
    ? `http://${firebase.firestoreEmulatorHost}/v1/projects/${encodeURIComponent(firebase.projectId)}/databases/(default)/documents`
    : `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(firebase.projectId)}/databases/(default)/documents`;
  const headers = async () => ({
    Authorization: `Bearer ${await firebase.getAccessToken("firestore")}`,
    "Content-Type": "application/json",
  });

  async function request(url, options = {}) {
    const response = await fetchImpl(url, { ...options, headers: await headers() });
    const text = await response.text();
    let payload;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      throw new FirebaseDataError("Firebase returned an invalid data response.", 502);
    }
    if (!response.ok) {
      throw new FirebaseDataError(errorMessage(response.status), response.status, payload?.error?.status ?? "FIREBASE_DATA_ERROR");
    }
    return payload;
  }

  function collectionPath() {
    return `${baseUrl}/${encodeURIComponent(collection)}`;
  }

  async function fetchRows(query = {}, options = {}) {
    const hasRegex = Object.values(query).some((value) =>
      value && typeof value === "object" && ("$regex" in value || "$or" in value),
    );
    const sortKey = options.sort?.replace(/^-/, "");
    const requiresLocalSort = ["created_date", "updated_date", "createdAt", "updatedAt"].includes(sortKey);
    const filters = Object.entries(query)
      .filter(([key, value]) => key !== "$or" && (!value || typeof value !== "object"))
      .map(([fieldPath, value]) => ({
        fieldFilter: { field: { fieldPath }, op: "EQUAL", value: encodeValue(value) },
      }));
    const where = filters.length > 1
      ? { compositeFilter: { op: "AND", filters } }
      : filters[0];
    const structuredQuery = { from: [{ collectionId: collection }] };
    if (where) structuredQuery.where = where;

    if (!hasRegex && options.sort && !requiresLocalSort) {
      const descending = options.sort.startsWith("-");
      const fieldPath = descending ? options.sort.slice(1) : options.sort;
      structuredQuery.orderBy = [{
        field: { fieldPath: fieldPath === "created_date" ? "createdAt" : fieldPath === "updated_date" ? "updatedAt" : fieldPath },
        direction: descending ? "DESCENDING" : "ASCENDING",
      }];
    }
    if (!hasRegex && !requiresLocalSort && !options.cursor && Number.isInteger(options.limit) && options.limit > 0) {
      structuredQuery.limit = options.limit + 1;
    }

    const payload = await request(`${baseUrl}:runQuery`, {
      method: "POST",
      body: JSON.stringify({ structuredQuery }),
    });
    let rows = (payload ?? []).map((entry) => entry.document).filter(Boolean).map(decodeDocument);
    rows = rows.filter((record) => matches(record, query));

    if (options.sort) {
      const descending = options.sort.startsWith("-");
      const rawKey = descending ? options.sort.slice(1) : options.sort;
      const key = rawKey === "created_date" ? "createdAt" : rawKey === "updated_date" ? "updatedAt" : rawKey;
      rows.sort((a, b) => compareValues(a[key], b[key]) * (descending ? -1 : 1));
    }

    if (options.cursor) {
      const cursorId = decodeCursor(options.cursor);
      const cursorIndex = rows.findIndex((record) => record.id === cursorId);
      if (cursorIndex < 0) throw new FirebaseDataError("The pagination cursor no longer matches the query.", 400);
      rows = rows.slice(cursorIndex + 1);
    }

    const limit = Number.isInteger(options.limit) && options.limit > 0 ? options.limit : null;
    const hasMore = limit !== null && rows.length > limit;
    const page = limit === null ? rows : rows.slice(0, limit);
    Object.defineProperties(page, {
      items: { value: page, enumerable: false, configurable: true },
      nextCursor: {
        value: hasMore && page.length ? encodeCursor(page[page.length - 1].id) : null,
        enumerable: false,
        configurable: true,
      },
    });
    return page;
  }

  return {
    filter: fetchRows,
    list: (_query, options) => fetchRows({}, options ?? {}),
    async get(id) {
      if (typeof id !== "string" || !id) throw new FirebaseDataError("A Firebase record identifier is required.", 400);
      try {
        const document = await request(`${collectionPath()}/${encodeURIComponent(id)}`);
        return decodeDocument(document);
      } catch (error) {
        if (error.status === 404) return null;
        throw error;
      }
    },
    async create(data) {
      const idField = DOCUMENT_IDS[name];
      const id = data.id ?? (idField ? data[idField] : null) ?? crypto.randomUUID();
      if (typeof id !== "string" || !id) {
        throw new FirebaseDataError("The Firebase record identifier is invalid.", 400);
      }
      const url = `${collectionPath()}?documentId=${encodeURIComponent(id)}`;
      const document = await request(url, {
        method: "POST",
        body: JSON.stringify({
          fields: encodeFields({
            ...data,
            createdAt: data.createdAt ?? data.created_date ?? new Date().toISOString(),
            updatedAt: data.updatedAt ?? data.updated_date ?? new Date().toISOString(),
          }),
        }),
      });
      return decodeDocument(document);
    },
    async update(id, data) {
      if (typeof id !== "string" || !id) throw new FirebaseDataError("A Firebase record identifier is required.", 400);
      const fields = {
        ...data,
        updatedAt: data.updatedAt ?? new Date().toISOString(),
      };
      const mask = Object.keys(fields).filter((key) => key !== "id");
      const query = mask.map((field) => `updateMask.fieldPaths=${encodeURIComponent(field)}`).join("&");
      const document = await request(`${collectionPath()}/${encodeURIComponent(id)}?${query}`, {
        method: "PATCH",
        body: JSON.stringify({ fields: encodeFields(fields) }),
      });
      return decodeDocument(document);
    },
    async delete(id) {
      if (typeof id !== "string" || !id) throw new FirebaseDataError("A Firebase record identifier is required.", 400);
      await request(`${collectionPath()}/${encodeURIComponent(id)}`, { method: "DELETE" });
      return { id };
    },
    async count(query = {}) {
      return (await fetchRows(query)).length;
    },
    async aggregate({ query = {}, groupBy } = {}) {
      const counts = new Map();
      for (const record of await fetchRows(query)) {
        const key = record[groupBy] ?? "";
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      return { rows: [...counts].map(([key, count]) => ({ [groupBy]: key, count })) };
    },
  };
}

async function createWithUniqueKeys(firebase, fetchImpl, { entity, id, data, uniqueKeys }) {
  if (typeof id !== "string" || !id || !data || typeof data !== "object" || !Array.isArray(uniqueKeys)) {
    throw new FirebaseDataError("The Firebase record and unique reservations are invalid.", 400);
  }
  const projectId = encodeURIComponent(firebase.projectId);
  const baseUrl = firebase.emulator
    ? `http://${firebase.firestoreEmulatorHost}/v1/projects/${projectId}/databases/(default)/documents`
    : `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  const documentRoot = `projects/${projectId}/databases/(default)/documents`;
  const now = new Date().toISOString();
  const fields = {
    ...data,
    createdAt: data.createdAt ?? data.created_date ?? now,
    updatedAt: data.updatedAt ?? data.updated_date ?? now,
  };
  const writes = [{
    update: {
      name: `${documentRoot}/${encodeURIComponent(collectionName(entity))}/${encodeURIComponent(id)}`,
      fields: encodeFields(fields),
    },
    currentDocument: { exists: false },
  }];

  for (const uniqueKey of uniqueKeys) {
    if (
      typeof uniqueKey?.collection !== "string" ||
      typeof uniqueKey.id !== "string" ||
      !uniqueKey.id ||
      typeof uniqueKey.field !== "string" ||
      !uniqueKey.field ||
      uniqueKey.value == null
    ) {
      throw new FirebaseDataError("A unique Firebase reservation is invalid.", 400);
    }
    writes.push({
      update: {
        name: `${documentRoot}/${encodeURIComponent(collectionName(uniqueKey.collection))}/${encodeURIComponent(uniqueKey.id)}`,
        fields: encodeFields({
          [uniqueKey.field]: uniqueKey.value,
          uid: id,
          createdAt: now,
          updatedAt: now,
        }),
      },
      currentDocument: { exists: false },
    });
  }

  const response = await fetchImpl(`${baseUrl}:commit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await firebase.getAccessToken("firestore")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ writes }),
  });
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new FirebaseDataError("Firebase returned an invalid data response.", 502);
  }
  if (!response.ok) {
    if (["ALREADY_EXISTS", "FAILED_PRECONDITION"].includes(payload?.error?.status)) {
      throw new FirebaseDataError("A unique Firebase value is already in use.", 409, "UNIQUE_VALUE_CONFLICT");
    }
    throw new FirebaseDataError(errorMessage(response.status), response.status, payload?.error?.status ?? "FIREBASE_DATA_ERROR");
  }

  return {
    ...fields,
    id,
    created_date: fields.createdAt,
    updated_date: fields.updatedAt,
  };
}

export function createFirebaseDatabase(firebase, { fetchImpl = fetch } = {}) {
  if (!firebase?.projectId || typeof firebase.getAccessToken !== "function") {
    throw new FirebaseDataError("Firebase data access is not configured.", 503);
  }

  const cache = new Map();
  const entities = new Proxy({}, {
    get(_target, name) {
      const key = String(name);
      if (!cache.has(key)) cache.set(key, createEntityApi(key, firebase, fetchImpl));
      return cache.get(key);
    },
  });

  return {
    entities,
    createWithUniqueKeys: (options) => createWithUniqueKeys(firebase, fetchImpl, options),
  };
}
