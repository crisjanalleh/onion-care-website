import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";
import { getDb } from "@/lib/appDatabase";
import { assertAdmin, fail, writeAudit } from "./shared";

/**
 * Administration writes for the content workspace: reviewed articles, the pest
 * catalogue entries and the media library. Every one of them is an
 * administrator action, audited, and nothing here is visible to a farmer until
 * its status says so.
 */

const serviceEntities = () => getDb().asServiceRole?.entities ?? getDb().entities;

const STATUS = z.enum(["draft", "pending_review", "published"]);

export const saveArticle = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      id: z.string().optional(),
      contentType: z.string(),
      title: z.string().min(3, "A title needs at least 3 characters.").max(160),
      summary: z.string().max(400).optional(),
      body: z.string().max(20000).optional(),
      sourceReference: z.string().max(300).optional(),
      status: STATUS,
    }),
  )
  .handler(async ({ data, context }) => {
    assertAdmin(context.user);
    const entities = serviceEntities();
    const now = new Date().toISOString();
    const publishing = data.status === "published";

    const fields = {
      contentType: data.contentType,
      title: data.title.trim(),
      summary: data.summary?.trim() || null,
      body: data.body?.trim() || null,
      sourceReference: data.sourceReference?.trim() || null,
      status: data.status,
      updatedByUid: context.user.id,
    };

    if (data.id) {
      const existing = await entities.ContentArticle.get(data.id);
      if (!existing) throw fail("That article could not be found.", 404);

      const article = await entities.ContentArticle.update(data.id, {
        ...fields,
        version: (existing.version ?? 1) + 1,
        ...(publishing ? { lastReviewedAt: now, publishedAt: existing.publishedAt ?? now } : {}),
      });

      await writeAudit(context.getDatabase(), {
        actor: context.user,
        action: publishing ? "article_published" : "article_saved",
        entityType: "ContentArticle",
        entityId: data.id,
        before: { status: existing.status, version: existing.version },
        after: { status: article.status, version: article.version },
      });

      return { article };
    }

    const article = await entities.ContentArticle.create({
      ...fields,
      version: 1,
      createdByUid: context.user.id,
      ...(publishing ? { lastReviewedAt: now, publishedAt: now } : {}),
    });

    await writeAudit(context.getDatabase(), {
      actor: context.user,
      action: publishing ? "article_published" : "article_created",
      entityType: "ContentArticle",
      entityId: article.id,
      after: { contentType: article.contentType, status: article.status },
    });

    return { article };
  });

export const savePestContent = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      id: z.string(),
      summary: z.string().max(2000).optional(),
      managementNotes: z.string().max(20000).optional(),
      contentStatus: STATUS,
      sourceReference: z.string().max(300).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    assertAdmin(context.user);
    const entities = serviceEntities();

    const existing = await entities.Pest.get(data.id);
    if (!existing) throw fail("That pest record could not be found.", 404);

    const publishing = data.contentStatus === "published";
    const pest = await entities.Pest.update(data.id, {
      summary: data.summary?.trim() || null,
      managementNotes: data.managementNotes?.trim() || null,
      contentStatus: data.contentStatus,
      sourceReference: data.sourceReference?.trim() || null,
      lastReviewedAt: publishing ? new Date().toISOString() : existing.lastReviewedAt ?? null,
      updatedByUid: context.user.id,
    });

    await writeAudit(context.getDatabase(), {
      actor: context.user,
      action: publishing ? "pest_published" : "pest_saved",
      entityType: "Pest",
      entityId: data.id,
      before: { contentStatus: existing.contentStatus },
      after: { contentStatus: pest.contentStatus },
    });

    return { pest };
  });

export const saveMediaAsset = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      title: z.string().min(1, "Give the image a title.").max(200),
      category: z.string(),
      fileUrl: z.string(),
      fileName: z.string(),
      contentType: z.string().optional(),
      fileSizeBytes: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      relatedDiseaseId: z.string().optional(),
      relatedPestId: z.string().optional(),
      altText: z.string().optional(),
      caption: z.string().optional(),
      attribution: z.string().optional(),
      source: z.string().optional(),
      license: z.string().optional(),
      origin: z.string(),
      approvalStatus: z.string(),
      verificationStatus: z.string(),
      isActive: z.boolean(),
    }),
  )
  .handler(async ({ data, context }) => {
    assertAdmin(context.user);

    const asset = await serviceEntities().MediaAsset.create({
      ...data,
      title: data.title.trim(),
      altText: data.altText?.trim() || null,
      caption: data.caption?.trim() || null,
      attribution: data.attribution?.trim() || null,
      source: data.source?.trim() || null,
      license: data.license?.trim() || null,
      // A illustration is an illustration, never a verified disease reference.
      verificationStatus: data.origin === "illustrative" ? "not_applicable" : data.verificationStatus,
      diseaseKey: data.relatedDiseaseId ?? null,
      storagePath: data.fileName,
      uploadedByUid: context.user.id,
      uploadedAt: new Date().toISOString(),
    });

    await writeAudit(context.getDatabase(), {
      actor: context.user,
      action: "media_asset_uploaded",
      entityType: "MediaAsset",
      entityId: asset.id,
      after: { category: asset.category, origin: asset.origin },
    });

    return { asset };
  });
