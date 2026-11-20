const db = globalThis.__APP_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";
import { canonicalLocation, normalizeLocationKey } from "@/lib/domain/catalogue-lookup";
import { legacyTimestamp, normalizePhone, normalizeUsername } from "@/lib/format";
import { assertAdmin, fail, getProfileForUser, requireProfile, resolveAdminForLocation, svc, writeAudit } from "./shared";

const PHONE = /^09\d{9}$/;
const USERNAME = /^[a-z0-9_]{3,24}$/;

export const getMyContext = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const profile = await getProfileForUser(context.getDatabase(), context.user.id);
    return {
      user: {
        id: context.user.id,
        email: context.user.email,
        full_name: context.user.full_name,
        role: context.user.role,
      },
      profile,
    };
  });

export const registerFarmerProfile = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      name: z.string().min(10, "Enter your full name (10 to 50 characters).").max(50, "Full name must be 50 characters or fewer."),
      number: z.string(),
      username: z.string(),
      sex: z.string().optional(),
      location: z.string(),
    }),
  )
  .handler(async ({ data, context }) => {
    const database = context.getDatabase();
    const user = context.user;

    const existing = await getProfileForUser(database, user.id);
    if (existing) return { profile: existing, created: false };

    const name = data.name.trim().replace(/\s+/g, " ");
    if (name.length < 10 || name.length > 50) throw fail("Enter your full name (10 to 50 characters).");

    const number = normalizePhone(data.number);
    if (!PHONE.test(number)) throw fail("Enter a Philippine mobile number that starts with 09 and has 11 digits.");

    const username = normalizeUsername(data.username);
    if (!USERNAME.test(username)) {
      throw fail("Username must be 3 to 24 characters, using lowercase letters, numbers, or underscores.");
    }

    const location = canonicalLocation(data.location);
    if (!location) throw fail("Choose one of the registered service locations.");

    const usernameTaken = await db.asServiceRole.entities.FarmerProfile.filter({ username });
    if (usernameTaken.length > 0) throw fail("That username is already registered. Try another one.");

    const numberTaken = await db.asServiceRole.entities.FarmerProfile.filter({ number });
    if (numberTaken.length > 0) throw fail("That mobile number is already registered. Contact your administrator if this is unexpected.");

    const profile = await db.asServiceRole.entities.FarmerProfile.create({
      username,
      name,
      number,
      sex: data.sex || null,
      location,
      uid: user.id,
      role: "farmer",
      isAdmin: false,
      status: "active",
      credentialVersion: 2,
      profileSchemaVersion: 2,
      lastLoginAt: new Date().toISOString(),
      language: "en",
      legacyPath: `users/${username}`,
    });

    return { profile, created: true };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      name: z.string().min(10, "Enter your full name (10 to 50 characters).").max(50),
      sex: z.string().optional(),
      language: z.string().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const profile = await requireProfile(context);
    const name = data.name.trim().replace(/\s+/g, " ");
    const updated = await svc(context).entities.FarmerProfile.update(profile.id, {
      name,
      sex: data.sex || null,
      language: data.language || "en",
    });
    return { profile: updated };
  });

export const listFarmers = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      search: z.string().optional(),
      location: z.string().optional(),
      status: z.string().optional(),
      limit: z.number().optional(),
      cursor: z.string().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    assertAdmin(context.user);
    const query = { role: "farmer" };
    if (data.location) query.location = data.location;
    if (data.status) query.status = data.status;
    if (data.search) {
      const term = data.search.trim();
      query.$or = [
        { name: { $regex: term, $options: "i" } },
        { username: { $regex: term, $options: "i" } },
        { number: { $regex: term, $options: "i" } },
      ];
    }
    const page = await context.getDatabase().entities.FarmerProfile.filter(query, {
      sort: "-created_date",
      limit: data.limit ?? 25,
      ...(data.cursor ? { cursor: data.cursor } : {}),
    });
    return page;
  });

export const getFarmerDetail = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ username: z.string() }))
  .handler(async ({ data, context }) => {
    assertAdmin(context.user);
    const database = context.getDatabase();
    const rows = await db.asServiceRole.entities.FarmerProfile.filter({ username: data.username });
    const profile = rows[0];
    if (!profile) throw fail("That farmer could not be found.", 404);

    const [diagnoses, reports, assignment] = await Promise.all([
      db.asServiceRole.entities.DiagnosisRecord.filter({ farmerUid: profile.uid }, { sort: "-created_date", limit: 5 }),
      db.asServiceRole.entities.DiseaseReport.filter({ farmerUid: profile.uid }, { sort: "-created_date", limit: 5 }),
      db.asServiceRole.entities.AdminAssignment.filter({ locationKey: normalizeLocationKey(profile.location) }),
    ]);

    return {
      profile,
      recentDiagnoses: diagnoses.items ?? diagnoses,
      recentReports: reports.items ?? reports,
      assignment: assignment[0] ?? null,
    };
  });

export const listAdminAssignments = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    assertAdmin(context.user);
    const database = context.getDatabase();
    const assignments = await db.entities.AdminAssignment.filter({}, { sort: "locationKey", limit: 50 });
    const admins = await db.entities.User.list();
    return {
      assignments: assignments.items ?? assignments,
      admins: admins
        .filter((u) => u.role === "admin")
        .map((u) => ({ id: u.id, email: u.email, full_name: u.full_name })),
    };
  });

export const updateAssignment = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ locationKey: z.string(), adminUid: z.string() }))
  .handler(async ({ data, context }) => {
    assertAdmin(context.user);
    const database = context.getDatabase();
    const rows = await db.entities.AdminAssignment.filter({ locationKey: data.locationKey });
    const assignment = rows[0];
    if (!assignment) throw fail("That location is not in the directory.", 404);

    const admins = await db.entities.User.list();
    const admin = admins.find((u) => u.id === data.adminUid && u.role === "admin");
    if (!admin) throw fail("Choose an existing administrator account.", 400);

    const before = { adminUid: assignment.adminUid, active: assignment.active };
    const updated = await db.entities.AdminAssignment.update(assignment.id, {
      adminUid: admin.id,
      adminUsername: assignment.adminUsername,
      active: true,
      resolutionStatus: "resolved",
      updatedByUid: context.user.id,
    });

    await writeAudit(database, {
      actor: context.user,
      action: "admin_assignment_updated",
      entityType: "AdminAssignment",
      entityId: assignment.id,
      before,
      after: { adminUid: admin.id, active: true },
    });

    return { assignment: updated };
  });

export const resolveMyAdmin = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const profile = await requireProfile(context);
    const resolved = await resolveAdminForLocation(context.getDatabase(), profile.location);
    return { location: profile.location, assignment: resolved };
  });

export const touchLastLogin = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const profile = await getProfileForUser(context.getDatabase(), context.user.id);
    if (!profile) return { ok: false };
    await svc(context).entities.FarmerProfile.update(profile.id, { lastLoginAt: legacyTimestamp() });
    return { ok: true };
  });