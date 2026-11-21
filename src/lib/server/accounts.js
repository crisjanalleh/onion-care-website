import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";
import { canonicalLocation, normalizeLocationKey } from "@/lib/domain/catalogue-lookup";
import { normalizePhone, normalizeUsername } from "@/lib/format";
import { assertAdmin, fail, getProfileForUser, requireProfile, resolveAdminForLocation, svc, toPage, writeAudit } from "./shared";

const PHONE = /^09\d{9}$/;
const USERNAME = /^[a-z0-9_]{3,24}$/;

export const getMyContext = createServerFn({ method: "GET" })
  .handler(async ({ context }) => {
    if (!context.user) return { user: null, profile: null };
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
    if (user.role !== "farmer") throw fail("Administrator accounts do not use farmer registration.", 403);

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

    const entities = svc(context).entities;
    const [usernameTaken, usernameReservation, numberTaken, numberReservation] = await Promise.all([
      entities.FarmerProfile.filter({ username }),
      database.entities.usernameReservations.get(username),
      entities.FarmerProfile.filter({ number }),
      database.entities.phoneReservations.get(number),
    ]);
    if (usernameTaken.length > 0) throw fail("That username is already registered. Try another one.");
    if (numberTaken.length > 0) throw fail("That mobile number is already registered. Contact your administrator if this is unexpected.");
    if (usernameReservation) throw fail("That username is already registered. Try another one.");
    if (numberReservation) throw fail("That mobile number is already registered. Contact your administrator if this is unexpected.");

    const existingAccount = await entities.User.get(user.id);
    if (existingAccount?.role === "admin") throw fail("Administrator accounts do not use farmer registration.", 403);
    if (!existingAccount) {
      await entities.User.create({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: "farmer",
        status: "active",
      });
    }

    let profile;
    try {
      profile = await database.createWithUniqueKeys({
        entity: "FarmerProfile",
        id: user.id,
        data: {
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
        },
        uniqueKeys: [
          { collection: "usernameReservations", id: username, field: "username", value: username },
          { collection: "phoneReservations", id: number, field: "number", value: number },
        ],
      });
    } catch (error) {
      if (error?.code === "UNIQUE_VALUE_CONFLICT") {
        throw fail("That username or mobile number was just registered. Check the details and try again.", 409);
      }
      throw error;
    }

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
    const page = await svc(context).entities.FarmerProfile.filter(query, {
      sort: "-created_date",
      limit: data.limit ?? 25,
      ...(data.cursor ? { cursor: data.cursor } : {}),
    });
    return toPage(page);
  });

export const getFarmerDetail = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ username: z.string() }))
  .handler(async ({ data, context }) => {
    assertAdmin(context.user);
    const entities = svc(context).entities;
    const rows = await entities.FarmerProfile.filter({ username: data.username });
    const profile = rows[0];
    if (!profile) throw fail("That farmer could not be found.", 404);

    const [diagnoses, reports, assignment] = await Promise.all([
      entities.DiagnosisRecord.filter({ farmerUid: profile.uid }, { sort: "-created_date", limit: 5 }),
      entities.DiseaseReport.filter({ farmerUid: profile.uid }, { sort: "-created_date", limit: 5 }),
      entities.AdminAssignment.filter({ locationKey: normalizeLocationKey(profile.location) }),
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
    const entities = svc(context).entities;
    const assignments = await entities.AdminAssignment.filter({}, { sort: "locationKey", limit: 50 });
    const admins = await entities.User.list();
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
    const entities = svc(context).entities;
    const rows = await entities.AdminAssignment.filter({ locationKey: data.locationKey });
    const assignment = rows[0];
    if (!assignment) throw fail("That location is not in the directory.", 404);

    const admins = await entities.User.list();
    const admin = admins.find((u) => u.id === data.adminUid && u.role === "admin");
    if (!admin) throw fail("Choose an existing administrator account.", 400);

    const before = { adminUid: assignment.adminUid, active: assignment.active };
    const updated = await entities.AdminAssignment.update(assignment.id, {
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
    await svc(context).entities.FarmerProfile.update(profile.id, { lastLoginAt: new Date().toISOString() });
    return { ok: true };
  });