/**
 * OnionCare media domain constants.
 * Pure data only — no React, no SDK imports, so server code can import it too.
 *
 * Disease reference photographs are decision-support content. An image is only
 * ever shown beside a disease once a person has marked it verified, with a
 * source and a licence recorded. Everything else falls back to a neutral
 * placeholder that names the disease.
 */

export const MEDIA_CATEGORIES = ["brand", "symptom", "disease", "pest", "guide", "tutorial", "report"];

export const MEDIA_ORIGINS = [
  { id: "illustrative", label: "Illustration (general use only)" },
  { id: "legacy", label: "Reused from the original app" },
  { id: "external_source", label: "External source" },
  { id: "admin_upload", label: "Admin upload" },
];

export const VERIFICATION_STATUSES = [
  { id: "verified", label: "Verified" },
  { id: "needs_review", label: "Needs review" },
  { id: "not_applicable", label: "Not applicable" },
];

export const ORIGIN_LABEL = Object.fromEntries(MEDIA_ORIGINS.map((item) => [item.id, item.label]));

/** Copy shown wherever a disease has no verified photograph yet. */
export const DISEASE_IMAGE_PLACEHOLDER = {
  title: "Verified reference image not available yet",
  body: "No photograph has been verified for this disease. A neutral placeholder is shown rather than a picture of a different problem.",
};

/** Assets a farmer may be shown: approved, verified by a person, and active. */
export function isFarmerVisibleAsset(asset) {
  return (
    asset?.category === "disease" &&
    asset?.approvalStatus === "approved" &&
    asset?.verificationStatus === "verified" &&
    asset?.isActive !== false &&
    Boolean(asset?.source && asset?.license) &&
    Boolean(asset?.fileUrl)
  );
}