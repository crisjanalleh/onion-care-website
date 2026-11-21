import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";
import { assertAdmin, fail, resolveAdminForLocation, requireProfile, svc, writeAudit } from "./shared";

/**
 * The farmer ↔ administrator thread. There is one thread per farmer, addressed
 * by the administrator assigned to the farmer's location; a farmer who has no
 * assigned administrator still gets a thread, marked as a support fallback.
 */

const now = () => new Date().toISOString();

async function findOrCreateThread(context, profile) {
  const entities = svc(context).entities;
  const existing = await entities.Conversation.filter({ farmerUid: profile.uid });
  if (existing[0]) return existing[0];

  const assignment = await resolveAdminForLocation(context.getDatabase(), profile.location);
  return entities.Conversation.create({
    farmerUid: profile.uid,
    farmerUsername: profile.username,
    farmerName: profile.name,
    location: profile.location,
    adminUid: assignment?.adminUid ?? null,
    adminUsername: assignment?.adminUsername ?? null,
    status: "open",
    assignmentSource: assignment ? "location_assignment" : "support_fallback",
    lastMessageAt: null,
    lastMessagePreview: null,
    unreadCountForFarmer: 0,
    unreadCountForAdmin: 0,
    newMessageCount: 0,
    hasNewMessage: false,
    schemaVersion: 2,
    legacyPath: `messages/${assignment?.adminUsername ?? "support"}/farmers/${profile.username}/meta`,
  });
}

/** The badge count for the farmer shell: unread administrator replies. */
export const myThreadSummary = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const threads = await svc(context).entities.Conversation.filter({ farmerUid: context.user.id });
    const unread = threads.reduce((total, thread) => total + (thread.unreadCountForFarmer ?? 0), 0);
    return { unread };
  });

/** The farmer's own thread, created on first visit. */
export const myConversation = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const profile = await requireProfile(context);
    const conversation = await findOrCreateThread(context, profile);

    const admin = conversation.adminUid
      ? (await svc(context).entities.FarmerProfile.filter({ uid: conversation.adminUid }))[0] ?? null
      : null;

    return { conversation, admin };
  });

/** Every thread, for the administrator inbox. */
export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    assertAdmin(context.user);
    const threads = await svc(context).entities.Conversation.filter(
      { adminUid: context.user.id },
      { sort: "-lastMessageAt", limit: 100 },
    );
    return { conversations: threads };
  });

export const getConversation = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ conversationId: z.string() }))
  .handler(async ({ data, context }) => {
    const conversation = await svc(context).entities.Conversation.get(data.conversationId);
    if (!conversation) throw fail("That conversation could not be found.", 404);

    const isMember = conversation.farmerUid === context.user.id ||
      (context.user.role === "admin" && conversation.adminUid === context.user.id);
    if (!isMember) throw fail("You do not have access to this conversation.", 403);

    return { conversation };
  });

export const startConversationWithFarmer = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ farmerUsername: z.string() }))
  .handler(async ({ data, context }) => {
    assertAdmin(context.user);
    const entities = svc(context).entities;

    const farmer = (await entities.FarmerProfile.filter({ username: data.farmerUsername }))[0];
    if (!farmer) throw fail("That farmer could not be found.", 404);

    const existing = await entities.Conversation.filter({ farmerUsername: farmer.username });
    if (existing[0]) {
      if (!existing[0].adminUid) {
        const assigned = await entities.Conversation.update(existing[0].id, {
          adminUid: context.user.id,
          adminUsername: context.user.email,
          assignmentSource: "manual_assignment",
        });
        await writeAudit(context.getDatabase(), {
          actor: context.user,
          action: "conversation_assigned",
          entityType: "Conversation",
          entityId: existing[0].id,
          after: { adminUid: context.user.id },
        });
        return { conversation: assigned };
      }
      if (existing[0].adminUid !== context.user.id) {
        throw fail("That conversation is assigned to another administrator.", 403);
      }
      return { conversation: existing[0] };
    }

    const conversation = await entities.Conversation.create({
      farmerUid: farmer.uid,
      farmerUsername: farmer.username,
      farmerName: farmer.name,
      location: farmer.location,
      adminUid: context.user.id,
      adminUsername: context.user.email,
      status: "open",
      assignmentSource: "location_assignment",
      lastMessageAt: null,
      lastMessagePreview: null,
      unreadCountForFarmer: 0,
      unreadCountForAdmin: 0,
      newMessageCount: 0,
      hasNewMessage: false,
      schemaVersion: 2,
      legacyPath: `messages/${context.user.email}/farmers/${farmer.username}/meta`,
    });

    await writeAudit(context.getDatabase(), {
      actor: context.user,
      action: "conversation_started",
      entityType: "Conversation",
      entityId: conversation.id,
      after: { farmerUsername: farmer.username },
    });

    return { conversation };
  });

export const listMessages = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ conversationId: z.string() }))
  .handler(async ({ data, context }) => {
    const entities = svc(context).entities;
    const conversation = await entities.Conversation.get(data.conversationId);
    if (!conversation) throw fail("That conversation could not be found.", 404);

    const isMember = conversation.farmerUid === context.user.id ||
      (context.user.role === "admin" && conversation.adminUid === context.user.id);
    if (!isMember) throw fail("You do not have access to this conversation.", 403);

    const messages = await entities.Message.filter(
      { conversationId: data.conversationId },
      { sort: "createdAt", limit: 200 },
    );

    return { conversation, messages };
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ conversationId: z.string(), body: z.string().min(1).max(4000) }))
  .handler(async ({ data, context }) => {
    const entities = svc(context).entities;
    const conversation = await entities.Conversation.get(data.conversationId);
    if (!conversation) throw fail("That conversation could not be found.", 404);

    const asAdmin = context.user.role === "admin" && conversation.adminUid === context.user.id;
    const isFarmer = conversation.farmerUid === context.user.id;
    if (!asAdmin && !isFarmer) throw fail("You do not have access to this conversation.", 403);

    const body = data.body.trim();
    const timestamp = now();

    const message = await entities.Message.create({
      conversationId: conversation.id,
      senderUid: context.user.id,
      senderRole: asAdmin ? "admin" : "farmer",
      senderName: asAdmin ? context.user.full_name || context.user.email : conversation.farmerName,
      body,
      createdAt: timestamp,
      legacyPath: `${conversation.legacyPath}/messages/${timestamp}`,
    });

    await entities.Conversation.update(conversation.id, {
      lastMessageAt: timestamp,
      lastReplyTime: Date.now(),
      lastMessagePreview: body.slice(0, 140),
      unreadCountForFarmer: asAdmin ? (conversation.unreadCountForFarmer ?? 0) + 1 : 0,
      unreadCountForAdmin: asAdmin ? 0 : (conversation.unreadCountForAdmin ?? 0) + 1,
      newMessageCount: asAdmin ? (conversation.newMessageCount ?? 0) + 1 : 0,
      hasNewMessage: asAdmin,
    });

    return { message };
  });

export const markConversationRead = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ conversationId: z.string() }))
  .handler(async ({ data, context }) => {
    const entities = svc(context).entities;
    const conversation = await entities.Conversation.get(data.conversationId);
    if (!conversation) throw fail("That conversation could not be found.", 404);

    const asAdmin = context.user.role === "admin" && conversation.adminUid === context.user.id;
    const isFarmer = conversation.farmerUid === context.user.id;
    if (!asAdmin && !isFarmer) throw fail("You do not have access to this conversation.", 403);
    const updated = await entities.Conversation.update(conversation.id, {
      ...(asAdmin
        ? { unreadCountForAdmin: 0, newMessageCount: 0, hasNewMessage: false }
        : { unreadCountForFarmer: 0 }),
    });

    return { conversation: updated };
  });
