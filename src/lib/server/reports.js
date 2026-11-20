const db = globalThis.__APP_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";
import { DISEASE_BY_ID, REPORT_STATUS_LABEL, REPORT_TRANSITIONS } from "@/lib/domain/catalogue";
import { legacyTimestamp } from "@/lib/format";
import { assertAdmin, fail, notify, requireProfile, resolveAdminForLocation, writeAudit } from "./shared";

export const submitDiseaseReport = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      diseaseId: z.string(),
      diagnosisId: z.string().optional(),
      description: z.string().max(1000).optional(),
      idempotencyKey: z.string().min(8),
    }),
  )
  .handler(async ({ data, context }) => {
    const database = context.getDatabase();
    const profile = await requireProfile(context);
    const disease = DISEASE_BY_ID[data.diseaseId];
    const diseaseName = disease?.legacyLabel ?? "Needs classification";

    const existing = await db.asServiceRole.entities.DiseaseReport.filter({
      farmerUid: profile.uid,
      idempotencyKey: data.idempotencyKey,
    });
    if (existing.length > 0) {
      return { report: existing[0], duplicate: true };
    }

    const timestamp = legacyTimestamp();
    const report = await db.asServiceRole.entities.DiseaseReport.create({
      name: profile.name,
      diseaseName,
      diseaseId: disease?.id ?? null,
      farmerUsername: profile.username,
      farmerUid: profile.uid,
      timestamp,
      number: profile.number,
      location: profile.location,
      status: "new",
      idempotencyKey: data.idempotencyKey,
      diagnosisId: data.diagnosisId || null,
      description: data.description?.trim() || null,
      needsClassification: !disease,
      schemaVersion: 2,
      legacyPath: `diseases/${diseaseName}/farmerReports/${data.idempotencyKey}`,
    });

    await db.asServiceRole.entities.DiseaseReport.update(report.id, {
      legacyPath: `diseases/${diseaseName}/farmerReports/${report.id}`,
    });

    if (disease) {
      const rows = await db.asServiceRole.entities.Disease.filter({ diseaseId: disease.id });
      const record = rows[0];
      if (record) {
        await db.asServiceRole.entities.Disease.update(record.id, {
          reportCount: (record.reportCount ?? 0) + 1,
          newReportCount: (record.newReportCount ?? 0) + 1,
        });
      }
    }

    const resolved = await resolveAdminForLocation(database, profile.location);
    if (resolved) {
      await notify(database, {
        recipientUid: resolved.adminUid,
        recipientRole: "admin",
        type: "report_status",
        title: `New disease report: ${diseaseName}`,
        body: `${profile.name} (${profile.location}) submitted a report.`,
        relatedEntityType: "DiseaseReport",
        relatedEntityId: report.id,
        linkTo: "/admin/reports",
      });
    }

    await writeAudit(database, {
      actor: context.user,
      action: "report_submitted",
      entityType: "DiseaseReport",
      entityId: report.id,
      after: { diseaseName, location: profile.location },
    });

    return { report: { ...report, legacyPath: `diseases/${diseaseName}/farmerReports/${report.id}` }, duplicate: false };
  });

export const updateReportStatus = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      reportId: z.string(),
      status: z.enum(["viewed", "in_progress", "resolved", "dismissed", "reopened"]),
      notes: z.string().max(1000).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    assertAdmin(context.user);
    const database = context.getDatabase();
    const report = await db.asServiceRole.entities.DiseaseReport.get(data.reportId).catch(() => null);
    if (!report) throw fail("That report could not be found.", 404);

    const allowed = REPORT_TRANSITIONS[report.status] ?? [];
    if (!allowed.includes(data.status)) {
      throw fail(
        `A report that is "${REPORT_STATUS_LABEL[report.status] ?? report.status}" cannot move to "${REPORT_STATUS_LABEL[data.status]}".`,
      );
    }

    const updated = await db.asServiceRole.entities.DiseaseReport.update(report.id, {
      status: data.status,
      reviewedAt: new Date().toISOString(),
      reviewedByUid: context.user.id,
      resolutionNotes: data.notes?.trim() || report.resolutionNotes || null,
    });

    if (report.status === "new") {
      const rows = await db.asServiceRole.entities.Disease.filter({ diseaseId: report.diseaseId });
      const record = rows[0];
      if (record) {
        await db.asServiceRole.entities.Disease.update(record.id, {
          newReportCount: Math.max(0, (record.newReportCount ?? 0) - 1),
        });
      }
    }

    await notify(database, {
      recipientUid: report.farmerUid,
      recipientRole: "farmer",
      type: "report_status",
      title: `Report update: ${REPORT_STATUS_LABEL[data.status]}`,
      body: `Your report for ${report.diseaseName} is now marked "${REPORT_STATUS_LABEL[data.status]}".`,
      relatedEntityType: "DiseaseReport",
      relatedEntityId: report.id,
      linkTo: "/reports",
    });

    await writeAudit(database, {
      actor: context.user,
      action: "report_status_changed",
      entityType: "DiseaseReport",
      entityId: report.id,
      before: { status: report.status },
      after: { status: data.status, notes: data.notes ?? null },
    });

    return { report: updated };
  });

export const listReports = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      status: z.string().optional(),
      diseaseId: z.string().optional(),
      location: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().optional(),
      cursor: z.string().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    assertAdmin(context.user);
    const query = {};
    if (data.status) query.status = data.status;
    if (data.diseaseId) query.diseaseId = data.diseaseId;
    if (data.location) query.location = data.location;
    if (data.search) {
      const term = data.search.trim();
      query.$or = [
        { name: { $regex: term, $options: "i" } },
        { farmerUsername: { $regex: term, $options: "i" } },
        { diseaseName: { $regex: term, $options: "i" } },
        { location: { $regex: term, $options: "i" } },
      ];
    }
    return context.getDatabase().entities.DiseaseReport.filter(query, {
      sort: "-created_date",
      limit: data.limit ?? 25,
      ...(data.cursor ? { cursor: data.cursor } : {}),
    });
  });

export const getReportDetail = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ reportId: z.string() }))
  .handler(async ({ data, context }) => {
    const database = context.getDatabase();
    const report = await db.asServiceRole.entities.DiseaseReport.get(data.reportId).catch(() => null);
    if (!report) throw fail("That report could not be found.", 404);

    const isOwner = report.farmerUid === context.user.id;
    if (!isOwner && context.user.role !== "admin") throw fail("You do not have access to this report.", 403);

    const farmer = report.farmerUid
      ? (await db.asServiceRole.entities.FarmerProfile.filter({ uid: report.farmerUid }))[0] ?? null
      : null;

    return { report, farmer };
  });

export const myReports = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ status: z.string().optional(), limit: z.number().optional(), cursor: z.string().optional() }))
  .handler(async ({ data, context }) => {
    const profile = await requireProfile(context);
    const query = { farmerUid: profile.uid };
    if (data.status) query.status = data.status;
    return context.getDatabase().entities.DiseaseReport.filter(query, {
      sort: "-created_date",
      limit: data.limit ?? 25,
      ...(data.cursor ? { cursor: data.cursor } : {}),
    });
  });