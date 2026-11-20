import { normalizeLocationKey } from "@/lib/domain/catalogue-lookup";

/**
 * Helpers shared by the server functions: the shape of a rejection, the
 * administrator check, the two ways of finding a profile, the location
 * assignment lookup, and the best-effort audit and notification writes.
 */

/** An error a server function rejects with; `status` reaches the client unchanged. */
export function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

/** Only an administrator may continue; the caller's role comes from `auth.me()`. */
export function assertAdmin(user) {
  if (user?.role !== "admin") throw fail("Administrator access is required.", 403);
}

/** The visitor-scoped entity handle. */
function visitorEntities(database) {
  return database?.entities ?? {};
}

/** The service-role entity handle, which skips those rules. */
function serviceEntities(database) {
  return (database?.asServiceRole ?? database)?.entities ?? {};
}

/** `svc(context)` — the service-role handle a handler writes through. */
export function svc(context) {
  const database = context.getDatabase();
  return database?.asServiceRole ?? database;
}

/** The OnionCare profile attached to a application user id, or null. */
export async function getProfileForUser(database, uid) {
  if (!uid) return null;
  const rows = await visitorEntities(database).FarmerProfile.filter({ uid });
  return rows[0] ?? null;
}

/** The signed-in visitor's profile, or a rejection asking them to finish onboarding. */
export async function requireProfile(context) {
  const profile = await getProfileForUser(context.getDatabase(), context.user.id);
  if (!profile) throw fail("Complete your OnionCare profile to continue.", 403);
  return profile;
}

/** The administrator account assigned to a location, or null when nobody is. */
export async function resolveAdminForLocation(database, location) {
  if (!location) return null;
  const rows = await serviceEntities(database).AdminAssignment.filter({
    locationKey: normalizeLocationKey(location),
  });
  const assignment = rows[0];
  if (!assignment || assignment.active === false) return null;
  return assignment;
}

/**
 * Records what a handler did. Audit entries are supporting evidence, never the
 * outcome, so a failed write is logged and then ignored.
 */
export async function writeAudit(database, { actor, action, entityType, entityId, before = null, after = null }) {
  try {
    await serviceEntities(database).AuditLog.create({
      actorUid: actor?.id ?? null,
      actorEmail: actor?.email ?? null,
      actorRole: actor?.role ?? null,
      action,
      entityType: entityType ?? null,
      entityId: entityId ?? null,
      before,
      after,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[audit] could not record", action, error);
  }
}

/**
 * Leaves a notification for somebody else to read. Like an audit entry, it is
 * supporting work: the handler's own result is already settled.
 */
export async function notify(
  database,
  { recipientUid, recipientRole, type, title, body, relatedEntityType, relatedEntityId, linkTo },
) {
  try {
    await serviceEntities(database).Notification.create({
      recipientUid,
      recipientRole: recipientRole ?? null,
      type,
      title,
      body,
      relatedEntityType: relatedEntityType ?? null,
      relatedEntityId: relatedEntityId ?? null,
      linkTo: linkTo ?? null,
      read: false,
      readAt: null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[notify] could not deliver", type, error);
  }
}
