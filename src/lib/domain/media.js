const db = globalThis.__APP_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

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

/**
 * General agricultural imagery. These are decorative or explanatory only —
 * they are never used as disease evidence. Recorded here so the asset
 * inventory, the media library and the delete guard all agree.
 */
export const GENERAL_IMAGES = {
  field: {
    url: "https://media.db.com/images/public/6afff3a90ab09e159ce4e101/2cad3c4cc_illustration.png",
    alt: "Rows of onion plants in a field at golden hour",
    caption: "Onion field at golden hour",
    placement: "About page header",
  },
  care: {
    url: "https://media.db.com/images/public/6afff3a90ab09e159ce4e101/8eee1a7aa_illustration.png",
    alt: "A farmer examining an onion leaf while holding a phone",
    caption: "Checking a crop in the field",
    placement: "Help page banner",
  },
  seedlings: {
    url: "https://media.db.com/images/public/6afff3a90ab09e159ce4e101/6582b4629_illustration.png",
    alt: "Young onion seedlings with morning dew in dark soil",
    caption: "Young onion seedlings",
    placement: "Library banner",
  },
  illustration: {
    url: "https://media.db.com/images/public/6afff3a90ab09e159ce4e101/2b0cbb4a0_illustration.png",
    alt: "Illustration of onion rows, a sun and a watering can",
    caption: "Onion rows illustration",
    placement: "Empty states",
  },
  weeding: {
    url: "https://media.db.com/images/public/6afff3a90ab09e159ce4e101/d2ff176a9_illustration.png",
    alt: "Hands pulling weeds between rows of young onions",
    caption: "Weeding between onion rows",
    placement: "Cropping guidance header",
  },
};

export const GENERAL_IMAGE_LIST = Object.entries(GENERAL_IMAGES).map(([key, value]) => ({ key, ...value }));

export const GENERAL_IMAGE_URLS = new Set(GENERAL_IMAGE_LIST.map((image) => image.url));

/** Assets a farmer may be shown: approved, verified by a person, and active. */
export function isFarmerVisibleAsset(asset) {
  return (
    asset?.category === "disease" &&
    asset?.approvalStatus === "approved" &&
    asset?.verificationStatus === "verified" &&
    asset?.isActive !== false &&
    Boolean(asset?.fileUrl)
  );
}