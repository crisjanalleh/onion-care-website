import "@/lib/appDatabase";

/**
 * The Application database handle: the application's in production, the in-memory local
 * one under `npm run dev` (installed by `@/lib/appDatabase`).
 */
export const db = globalThis.__APP_DB__;
export default db;
