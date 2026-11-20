/**
 * Local application database globals.
 *
 * The application injects `__APP_DB__`, `createClientFromRequest` and
 * `getAccessToken` into every app at runtime, and the app's middleware and data
 * helpers are written against them. Outside the application — under `npm run dev` —
 * those globals do not exist, so this module installs an in-memory equivalent:
 * one signed-in local visitor, their profile and the location assignment that
 * points at them. A read that finds nothing returns an empty value rather than
 * throwing, so every screen still renders.
 *
 * On a configured application runtime, injected globals take precedence and this local fallback is
 * not used.
 */
import { LOCATIONS } from "@/lib/domain/catalogue";
import { normalizeLocationKey } from "@/lib/format";

const ROLE_KEY = "onioncare:local-role";
const SIGNED_OUT_KEY = "onioncare:local-signed-out";
const TOKEN_KEY = "onioncare_access_token";

const LOCAL_UID = "local-user";
const LOCAL_PROFILE_ID = "local-profile";
const LOCAL_ASSIGNMENT_ID = "local-assignment";

function readStorage(key) {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  if (typeof window === "undefined") return;
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // A browser that refuses storage still gets a working app.
  }
}

/** "farmer" or "admin" — which half of the app the local visitor belongs to. */
export function localRole() {
  return readStorage(ROLE_KEY) === "admin" ? "admin" : "farmer";
}

export function setLocalRole(role) {
  writeStorage(ROLE_KEY, role === "admin" ? "admin" : "farmer");
}

function buildUser(role) {
  const admin = role === "admin";
  return {
    id: LOCAL_UID,
    email: admin ? "admin@onioncare.local" : "farmer@onioncare.local",
    full_name: admin ? "Local Administrator" : "Local Farmer",
    role,
  };
}

function buildProfile(role) {
  const admin = role === "admin";
  const username = admin ? "localadmin" : "localfarmer";
  return {
    id: LOCAL_PROFILE_ID,
    uid: LOCAL_UID,
    username,
    name: admin ? "Local Administrator" : "Local Farmer",
    number: "09171234567",
    sex: null,
    location: LOCATIONS[0].location,
    role,
    isAdmin: admin,
    status: "active",
    credentialVersion: 2,
    profileSchemaVersion: 2,
    language: "en",
    legacyPath: `users/${username}`,
  };
}

function buildAssignment() {
  return {
    id: LOCAL_ASSIGNMENT_ID,
    location: LOCATIONS[0].location,
    locationKey: normalizeLocationKey(LOCATIONS[0].location),
    adminUid: LOCAL_UID,
    adminUsername: "localadmin",
    active: true,
    resolutionStatus: "resolved",
  };
}

// --- a tiny in-memory table store, enough for the local user to be present ---

const tables = new Map();
let sequence = 0;

function table(name) {
  if (!tables.has(name)) tables.set(name, new Map());
  return tables.get(name);
}

function matches(record, query) {
  return Object.entries(query ?? {}).every(([key, expected]) => {
    if (key === "$or") return Array.isArray(expected) && expected.some((clause) => matches(record, clause));
    const actual = record[key];
    if (expected && typeof expected === "object" && "$regex" in expected) {
      return new RegExp(expected.$regex, expected.$options ?? "").test(String(actual ?? ""));
    }
    return actual === expected;
  });
}

/**
 * The application's read helpers are used both as a bare array and through a
 * `{ items }` page, depending on the call site. Returning an array that also
 * exposes itself as `items` satisfies both without hiding records.
 */
function asPage(rows) {
  Object.defineProperty(rows, "items", { value: rows, enumerable: false, configurable: true });
  return rows;
}

function makeEntityApi(name) {
  const rows = () => [...table(name).values()];
  const api = {
    async filter(query = {}, options = {}) {
      let found = rows().filter((record) => matches(record, query));
      if (options.sort) {
        const descending = options.sort.startsWith("-");
        const key = descending ? options.sort.slice(1) : options.sort;
        found = [...found].sort((a, b) => {
          if (a[key] === b[key]) return 0;
          return (a[key] > b[key] ? 1 : -1) * (descending ? -1 : 1);
        });
      }
      return asPage(options.limit ? found.slice(0, options.limit) : found);
    },
    async list(_query, options) {
      return api.filter({}, options ?? {});
    },
    async get(id) {
      return table(name).get(id) ?? null;
    },
    async create(data) {
      sequence += 1;
      const now = new Date().toISOString();
      const record = { id: `${name.toLowerCase()}-${sequence}`, created_date: now, updated_date: now, ...data };
      table(name).set(record.id, record);
      return record;
    },
    async update(id, data) {
      const existing = table(name).get(id);
      if (!existing) return null;
      const record = { ...existing, ...data, id, updated_date: new Date().toISOString() };
      table(name).set(id, record);
      return record;
    },
    async delete(id) {
      table(name).delete(id);
      return {};
    },
    async count(query = {}) {
      return (await api.filter(query)).length;
    },
    async aggregate() {
      return { rows: [] };
    },
  };
  return api;
}

/** Makes sure the signed-in local visitor exists in the store before it is read. */
function seedLocalRecords() {
  const role = localRole();
  if (!table("User").has(LOCAL_UID)) table("User").set(LOCAL_UID, buildUser(role));
  if (!table("FarmerProfile").has(LOCAL_PROFILE_ID)) table("FarmerProfile").set(LOCAL_PROFILE_ID, buildProfile(role));
  if (!table("AdminAssignment").has(LOCAL_ASSIGNMENT_ID)) {
    table("AdminAssignment").set(LOCAL_ASSIGNMENT_ID, buildAssignment());
  }
}

const entityCache = new Map();

function entityFor(name) {
  if (!entityCache.has(name)) entityCache.set(name, makeEntityApi(name));
  return entityCache.get(name);
}

const localEntities = new Proxy(
  {},
  {
    get: (_target, name) => entityFor(String(name)),
  },
);

const serviceEntities = new Proxy(
  {},
  {
    get: (_target, name) => {
      seedLocalRecords();
      return entityFor(String(name));
    },
  },
);

function isSignedOut() {
  return readStorage(SIGNED_OUT_KEY) === "1";
}

const localDb = {
  auth: {
    async isAuthenticated() {
      return !isSignedOut();
    },
    async me() {
      return isSignedOut() ? null : buildUser(localRole());
    },
    async logout() {
      writeStorage(SIGNED_OUT_KEY, "1");
      writeStorage(TOKEN_KEY, null);
    },
    setToken(token) {
      writeStorage(TOKEN_KEY, token);
    },
    loginWithProvider() {
      writeStorage(SIGNED_OUT_KEY, null);
      return { ok: true };
    },
    async loginViaEmailPassword() {
      writeStorage(SIGNED_OUT_KEY, null);
      return { access_token: "local-token" };
    },
    async register() {
      return { ok: true };
    },
    async verifyOtp() {
      writeStorage(SIGNED_OUT_KEY, null);
      return { access_token: "local-token" };
    },
    async resendOtp() {
      return { ok: true };
    },
  },
  entities: localEntities,
  asServiceRole: { entities: serviceEntities },
  integrations: {
    Core: {
      async UploadFile() {
        return { file_url: "" };
      },
      async UploadPublicFile() {
        return { file_url: "" };
      },
    },
  },
};

const g = globalThis;

if (typeof g.__APP_DB__ === "undefined") g.__APP_DB__ = localDb;

if (typeof g.createClientFromRequest === "undefined") {
  g.createClientFromRequest = () => g.__APP_DB__ ?? localDb;
}

if (typeof g.getAccessToken === "undefined") {
  g.getAccessToken = () => readStorage(TOKEN_KEY);
}

/** The database handle: the application's when present, the inert local one otherwise. */
export function getDb() {
  return globalThis.__APP_DB__ ?? localDb;
}

export const localDatabase = localDb;
export default localDb;
