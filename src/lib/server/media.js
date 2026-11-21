import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";
import { isFarmerVisibleAsset } from "@/lib/domain/media";
import { svc } from "./shared";

/**
 * Farmer-facing reads of the reference-image library.
 *
 * MediaAsset records are administrator-only, so these functions read with the
 * service role and hand back only assets that a person has verified and that
 * are still active. Nothing unverified ever reaches a farmer screen.
 */

function toView(asset) {
  if (!asset) return null;
  return {
    id: asset.id,
    fileUrl: asset.fileUrl,
    altText: asset.altText || asset.title,
    caption: asset.caption || null,
    attribution: asset.attribution || asset.source || null,
    license: asset.license || null,
  };
}

export const getDiseaseImage = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .validator(z.object({ diseaseId: z.string() }))
  .handler(async ({ data, context }) => {
    const page = await svc(context).entities.MediaAsset.filter(
      { category: "disease", relatedDiseaseId: data.diseaseId, approvalStatus: "approved", verificationStatus: "verified" },
      { sort: "-created_date", limit: 12 },
    );
    const asset = (page.items ?? []).find(isFarmerVisibleAsset);
    return toView(asset);
  });

export const listDiseaseImages = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const page = await svc(context).entities.MediaAsset.filter(
      { category: "disease", approvalStatus: "approved", verificationStatus: "verified" },
      { sort: "-created_date", limit: 200 },
    );
    const images = {};
    (page.items ?? []).filter(isFarmerVisibleAsset).forEach((asset) => {
      const key = asset.relatedDiseaseId || asset.diseaseKey;
      if (key && !images[key]) images[key] = toView(asset);
    });
    return images;
  });