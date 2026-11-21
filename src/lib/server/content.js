import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";
import { ARTICLE_TYPES } from "@/lib/domain/catalogue";
import { MEDIA_CATEGORIES, MEDIA_ORIGINS, VERIFICATION_STATUSES } from "@/lib/domain/media";
import { assertAdmin, fail, svc, toPage, writeAudit } from "./shared";

/**
 * Administration writes for the content workspace: reviewed articles, the pest
 * catalogue entries and the media library. Every one of them is an
 * administrator action, audited, and nothing here is visible to a farmer until
 * its status says so.
 */

const STATUS = z.enum(["draft", "pending_review", "published"]);

export const getAdminContentSummary = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    assertAdmin(context.user);
    const entities = svc(context).entities;
    const [articleCounts, diseases, pests, recommendations, media, pendingArticles] = await Promise.all([
      Promise.all(ARTICLE_TYPES.map(async (type) => [type.id, await entities.ContentArticle.count({ contentType: type.id })])),
      entities.Disease.count({}),
      entities.Pest.count({}),
      entities.TreatmentRecommendation.count({}),
      entities.MediaAsset.count({}),
      entities.ContentArticle.count({ status: "pending_review" }),
    ]);

    return {
      articles: Object.fromEntries(articleCounts),
      diseases,
      pests,
      recommendations,
      media,
      pendingArticles,
    };
  });

export const listArticlesForAdmin = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ contentType: z.string() }))
  .handler(async ({ data, context }) => {
    assertAdmin(context.user);
    const page = await svc(context).entities.ContentArticle.filter(
      { contentType: data.contentType },
      { sort: "-updated_date", limit: 50 },
    );
    return toPage(page);
  });

export const listPestsForAdmin = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    assertAdmin(context.user);
    const page = await svc(context).entities.Pest.filter({}, { sort: "sortOrder", limit: 20 });
    return toPage(page);
  });

export const getPublishedPest = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ pestId: z.string() }))
  .handler(async ({ data, context }) => {
    const rows = await svc(context).entities.Pest.filter({ pestId: data.pestId, contentStatus: "published" }, { limit: 1 });
    return (rows.items ?? rows)[0] ?? null;
  });

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
    const entities = svc(context).entities;
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
    const entities = svc(context).entities;

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
      category: z.enum(MEDIA_CATEGORIES),
      fileUrl: z.string().url().max(2048),
      fileName: z.string().min(1).max(240),
      storagePath: z.string().min(1).max(1024),
      contentType: z.string().max(100).optional(),
      fileSizeBytes: z.number().int().positive().max(8 * 1024 * 1024).optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      relatedDiseaseId: z.string().max(120).optional(),
      relatedPestId: z.string().max(120).optional(),
      altText: z.string().max(500).optional(),
      caption: z.string().max(1000).optional(),
      attribution: z.string().max(300).optional(),
      source: z.string().max(500).optional(),
      license: z.string().max(200).optional(),
      origin: z.enum(MEDIA_ORIGINS.map(({ id }) => id)),
    }),
  )
  .handler(async ({ data, context }) => {
    assertAdmin(context.user);
    const entities = svc(context).entities;
    const firebase = context.firebase;
    const expectedOrigin = firebase.emulator
      ? new URL(`http://${firebase.storageEmulatorHost}`).origin
      : "https://firebasestorage.googleapis.com";
    let fileUrl;
    try {
      fileUrl = new URL(data.fileUrl);
    } catch {
      throw fail("The uploaded image URL is invalid.");
    }
    const expectedPath = `/v0/b/${encodeURIComponent(firebase.storageBucket)}/o/${encodeURIComponent(data.storagePath)}`;
    if (
      !data.storagePath.startsWith(`media/${context.user.id}/`) ||
      fileUrl.origin !== expectedOrigin ||
      fileUrl.pathname !== expectedPath ||
      !fileUrl.searchParams.has("token")
    ) {
      throw fail("The uploaded image does not belong to this Firebase Storage project.");
    }

    const asset = await entities.MediaAsset.create({
      ...data,
      title: data.title.trim(),
      altText: data.altText?.trim() || null,
      caption: data.caption?.trim() || null,
      attribution: data.attribution?.trim() || null,
      source: data.source?.trim() || null,
      license: data.license?.trim() || null,
      approvalStatus: "pending",
      verificationStatus: data.origin === "illustrative" ? "not_applicable" : "needs_review",
      isActive: true,
      diseaseKey: data.relatedDiseaseId ?? null,
      storagePath: data.storagePath,
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

export const listMediaAssets = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    assertAdmin(context.user);
    const page = await svc(context).entities.MediaAsset.filter({}, { sort: "-created_date", limit: 100 });
    return toPage(page);
  });

export const updateMediaAssetReview = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      id: z.string().min(1),
      approvalStatus: z.enum(["pending", "approved", "rejected"]),
      verificationStatus: z.enum(VERIFICATION_STATUSES.map(({ id }) => id)),
      isActive: z.boolean(),
    }),
  )
  .handler(async ({ data, context }) => {
    assertAdmin(context.user);
    const entities = svc(context).entities;
    const existing = await entities.MediaAsset.get(data.id);
    if (!existing) throw fail("That media asset could not be found.", 404);
    if (data.verificationStatus === "verified") {
      if (existing.category !== "disease" || existing.origin === "illustrative") {
        throw fail("Only a sourced disease photograph can be verified.");
      }
      if (!existing.source?.trim() || !existing.license?.trim()) {
        throw fail("Add the image source and licence before verifying it.");
      }
    }

    const verified = data.verificationStatus === "verified";
    const asset = await entities.MediaAsset.update(data.id, {
      approvalStatus: data.approvalStatus,
      verificationStatus: existing.origin === "illustrative" ? "not_applicable" : data.verificationStatus,
      isActive: data.isActive,
      verifiedByUid: verified ? context.user.id : null,
      verifiedAt: verified ? new Date().toISOString() : null,
    });

    await writeAudit(context.getDatabase(), {
      actor: context.user,
      action: "media_asset_reviewed",
      entityType: "MediaAsset",
      entityId: data.id,
      before: {
        approvalStatus: existing.approvalStatus,
        verificationStatus: existing.verificationStatus,
        isActive: existing.isActive,
      },
      after: {
        approvalStatus: asset.approvalStatus,
        verificationStatus: asset.verificationStatus,
        isActive: asset.isActive,
      },
    });

    return { asset };
  });
