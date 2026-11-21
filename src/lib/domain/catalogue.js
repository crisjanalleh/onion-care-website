/**
 * OnionCare domain catalogue.
 * Pure data + pure helpers only: no React, no SDK imports.
 * Legacy labels are preserved exactly so that existing records stay readable.
 */

export const RULESET_VERSION = "unreleased-rules-v1";
export const AREA_FORMULA_VERSION = "affected-area-estimate-v1";

export const SYMPTOM_GROUPS = [
  {
    id: "yellow_leaves",
    label: "Yellow Leaves",
    summary: "Leaves have turned yellow, and the plant may look weak or collapse.",
    guidance: "Look at the whole plant: the leaves, the bulb, and the base where the roots meet the bulb.",
    symptoms: [
      { id: "curled", label: "Leaves are curled", help: "Leaves curl inward or twist along their length." },
      { id: "rotten", label: "Bulb is rotten", help: "The bulb feels soft, mushy, or decayed." },
      { id: "withered", label: "Leaves are withered", help: "Leaves look dried out and shrunken." },
      { id: "necrosis", label: "Dead, brown tissue", help: "Patches of tissue have died and turned brown." },
      { id: "dark_brown", label: "Dark brown discolouration", help: "Deep brown patches on leaves or bulb." },
      { id: "dropping", label: "Leaves dropping", help: "Leaves fall over and lie on the soil." },
      { id: "dying", label: "Plants are dying", help: "Plants are collapsing and will not recover." },
      { id: "poor_root", label: "Poor root system", help: "Few roots, or roots that pull away easily." },
      { id: "white_mold", label: "White mould at the base", help: "White, cottony growth near the roots or bulb base." },
      { id: "wilted", label: "Leaves wilted", help: "Leaves droop and lose firmness." },
      { id: "dark_red", label: "Dark red roots", help: "Roots are darker and reddish instead of pale." },
      { id: "water_soaked", label: "Water-soaked tissue", help: "Tissue looks wet and translucent." },
      { id: "twisted", label: "Leaves twisted", help: "Leaves are bent or spiralled." },
      { id: "white_oval", label: "White oval spots", help: "Small white oval patches on the leaves." },
      { id: "black_orange", label: "Black or orange patches", help: "Dark or orange coloured patches on the bulb." },
    ],
  },
  {
    id: "wilted_leaves",
    label: "Wilted Leaves",
    summary: "Leaves droop and will not stand up again after watering.",
    guidance: "Check the roots and the bulb, not only the leaves — wilting usually starts below the soil.",
    symptoms: [
      { id: "yellow", label: "Leaves turning yellow", help: "Yellowing starts at the tips or outer leaves." },
      { id: "knotting", label: "Knots or galls on roots", help: "Round swellings on the roots." },
      { id: "water_soaked_bulb", label: "Bulb is water-soaked", help: "The bulb looks wet and translucent." },
      { id: "slimy", label: "Slimy tissue", help: "A slippery, wet film on the bulb or leaves." },
      { id: "smelly", label: "Foul smell", help: "A strong bad smell around the affected plants." },
      { id: "water_soaked_lesions", label: "Water-soaked lesions on leaves", help: "Wet-looking patches on the leaf surface." },
      { id: "deep_pink", label: "Deep pink roots", help: "Roots have a pink or reddish colour." },
      { id: "poor_root", label: "Poor root system", help: "Few roots, or roots that break off easily." },
    ],
  },
  {
    id: "poor_root_system",
    label: "Poor Root System",
    summary: "Roots are weak, few, or damaged when a plant is lifted.",
    guidance: "Lift one affected plant with a fork so the roots come out whole, then compare with a healthy plant.",
    symptoms: [
      { id: "yellow", label: "Leaves turning yellow" },
      { id: "wilted", label: "Leaves wilted" },
      { id: "dying", label: "Plants are dying" },
      { id: "curling", label: "Leaves curling" },
      { id: "dark_brown", label: "Dark brown discolouration" },
      { id: "dropping", label: "Leaves dropping" },
      { id: "white_mold", label: "White mould at the base" },
    ],
  },
  {
    id: "water_soaked_bulb",
    label: "Water-Soaked Bulb",
    summary: "The bulb itself looks wet, soft, discoloured, or mouldy.",
    guidance: "Cut one bulb in half and look at the tissue and the neck before answering.",
    symptoms: [
      { id: "rotten", label: "Bulb is rotten" },
      { id: "white_purple", label: "White or purple discolouration" },
      { id: "white_lesions", label: "White lesions" },
      { id: "soft", label: "Soft tissue" },
      { id: "brown", label: "Brown tissue" },
      { id: "grey_mold", label: "Grey mould" },
      { id: "spongy", label: "Spongy texture" },
      { id: "black_spores", label: "Black spores" },
      { id: "dry", label: "Dry rot" },
      { id: "black", label: "Black discolouration" },
      { id: "yellow", label: "Leaves turning yellow" },
      { id: "slimy", label: "Slimy tissue" },
      { id: "smelly_liquid", label: "Smelly liquid" },
      { id: "wilted", label: "Leaves wilted" },
    ],
  },
];

export const SYMPTOM_GROUP_BY_ID = Object.fromEntries(SYMPTOM_GROUPS.map((g) => [g.id, g]));

/**
 * The eleven catalogue entries. `summary`, `keySigns` and the draft cultural
 * guidance come from the legacy system's own content; nothing here is a new
 * agronomic claim, and chemical guidance is intentionally absent.
 */
export const DISEASES = [
  {
    id: "anthracnose_bacterial",
    legacyLabel: "Anthracnose caused by bacteria",
    symptomGroups: ["yellow_leaves"],
    summary:
      "The legacy catalogue keeps bacterial anthracnose separate from the fungal form. The symptom rules associate it with twisted leaves, white oval spots, and a rotten bulb.",
    keySigns: ["Twisted or bent leaves", "Small white oval spots", "Rotting bulb"],
    culturalGuidance:
      "Avoid excessive nitrogen. Destroy crop debris after harvest. This summary comes from the legacy application and has not yet been reviewed against a current source.",
  },
  {
    id: "anthracnose_fungal",
    legacyLabel: "Anthracnose caused by fungi",
    symptomGroups: ["yellow_leaves"],
    summary:
      "The fungal form is a separate catalogue entry. The symptom rules associate it with black or orange patches together with a rotten bulb.",
    keySigns: ["Black or orange patches", "Rotting bulb"],
    culturalGuidance:
      "Avoid excessive nitrogen. Destroy crop debris after harvest. This summary comes from the legacy application and has not yet been reviewed against a current source.",
  },
  {
    id: "bacterial_soft_rot",
    legacyLabel: "Bacterial Soft Rot",
    symptomGroups: ["wilted_leaves", "water_soaked_bulb"],
    summary:
      "The symptom rules associate soft rot with yellowing leaves together with a water-soaked bulb, slimy tissue, or a foul smell — and, on the bulb, with slimy or smelly liquid and wilted leaves.",
    keySigns: ["Slimy tissue", "Foul smell", "Water-soaked bulb"],
    culturalGuidance:
      "Use furrow irrigation. Store bulbs under controlled cool temperature, humidity, and ventilation. This summary comes from the legacy application and has not yet been reviewed against a current source.",
  },
  {
    id: "basal_plate_rot",
    legacyLabel: "Basal Plate Rot",
    symptomGroups: ["yellow_leaves", "poor_root_system"],
    summary:
      "The symptom rules associate basal plate rot with curled, withered, and rotten tissue with dark brown discolouration, and with yellowing, wilting, dying plants whose leaves curl.",
    keySigns: ["Curled and withered leaves", "Dark brown base", "Rotting bulb"],
    culturalGuidance:
      "Tillage and rotation, or solarisation. Dip seedlings in a protectant fungicide before transplanting where that is approved locally. This summary comes from the legacy application and has not yet been reviewed against a current source.",
  },
  {
    id: "black_mold",
    legacyLabel: "Black Mold",
    symptomGroups: ["water_soaked_bulb"],
    summary:
      "The symptom rules associate black mould with black spores, dry rot, or black discolouration of the bulb.",
    keySigns: ["Black spores", "Dry rot", "Black discolouration"],
    culturalGuidance:
      "Store in cool, dry, ventilated conditions. Harvest at maturity and cure properly. This summary comes from the legacy application and has not yet been reviewed against a current source.",
  },
  {
    id: "neck_rot",
    legacyLabel: "Neck Rot",
    symptomGroups: ["water_soaked_bulb"],
    summary:
      "The symptom rules associate neck rot with soft, brown, or spongy tissue, or with grey mould on the bulb.",
    keySigns: ["Soft or spongy tissue", "Grey mould", "Brown tissue"],
    culturalGuidance:
      "Sort bulbs before storage, avoid moisture, and follow validated storage conditions. This summary comes from the legacy application and has not yet been reviewed against a current source.",
  },
  {
    id: "pink_root",
    legacyLabel: "Pink Root",
    symptomGroups: ["yellow_leaves", "wilted_leaves", "poor_root_system"],
    summary:
      "The symptom rules associate pink root with deep pink roots together with a poor root system or yellowing leaves, and with yellowing and wilting together on a weak root system.",
    keySigns: ["Deep pink roots", "Yellowing leaves", "Weak root system"],
    culturalGuidance:
      "Rotation and solarisation, and adjusting the irrigation interval as described in the legacy guidance. This summary comes from the legacy application and has not yet been reviewed against a current source.",
  },
  {
    id: "purple_blotch",
    legacyLabel: "Purple Blotch",
    symptomGroups: ["water_soaked_bulb"],
    summary:
      "The symptom rules associate purple blotch with a rotten bulb, white or purple discolouration, or white lesions.",
    keySigns: ["White or purple discolouration", "White lesions", "Rotting bulb"],
    culturalGuidance:
      "Use a long rotation with unrelated crops, and a sticker or spreader with any approved application. This summary comes from the legacy application and has not yet been reviewed against a current source.",
  },
  {
    id: "root_knot",
    legacyLabel: "Root Knot",
    symptomGroups: ["wilted_leaves"],
    summary: "The symptom rules associate root knot with yellowing leaves together with knots or galls on the roots.",
    keySigns: ["Knots or galls on roots", "Yellowing leaves"],
    culturalGuidance:
      "Soil sterilisation is described in the legacy guidance for heavy infestation, along with furrow irrigation. This summary comes from the legacy application and has not yet been reviewed against a current source.",
  },
  {
    id: "seedling_damping_off",
    legacyLabel: "Seedling Damping Off",
    symptomGroups: ["yellow_leaves", "wilted_leaves"],
    summary:
      "The symptom rules associate damping off with wilting and water-soaked tissue, and with water-soaked lesions together with deep pink roots or yellowing leaves.",
    keySigns: ["Wilting with water-soaked tissue", "Water-soaked leaf lesions"],
    culturalGuidance:
      "Rotation and solarisation, and fungicide-treated seed where that is approved locally. This summary comes from the legacy application and has not yet been reviewed against a current source.",
  },
  {
    id: "white_rot",
    legacyLabel: "White Rot",
    symptomGroups: ["yellow_leaves", "poor_root_system"],
    summary:
      "The symptom rules associate white rot with leaves dropping or plants dying together with a poor root system or white mould at the base.",
    keySigns: ["Leaves dropping", "White mould at the base", "Poor root system"],
    culturalGuidance:
      "Leave the affected area unplanted for at least one growing season, or solarise for one to two months, and use fungicide-treated seed where that is approved locally. This summary comes from the legacy application and has not yet been reviewed against a current source.",
  },
];

export const DISEASE_BY_ID = Object.fromEntries(DISEASES.map((d) => [d.id, d]));

export const PESTS = [
  { id: "armyworm", name: "Armyworm", summary: "A chewing caterpillar that feeds on onion leaves, often in groups." },
  { id: "leafminer", name: "Leafminer", summary: "Small larvae that tunnel inside leaves, leaving pale winding trails." },
  { id: "thrips", name: "Thrips", summary: "Very small insects that feed on leaf surfaces, causing silvery streaks." },
];

/** The exact legacy location labels and their administrator routing. */
export const PEST_BY_ID = Object.fromEntries(PESTS.map((p) => [p.id, p]));

export const LOCATIONS = [
  { location: "Bagong Sikat", adminUsername: "hvcdp" },
  { location: "Batasan", adminUsername: "hvcdp1" },
  { location: "Bayotbot", adminUsername: "hvcdp2" },
  { location: "Camburay", adminUsername: "hvcdp3" },
  { location: "Central", adminUsername: "hvcdp4" },
  { location: "Labangan", adminUsername: "hvcdp5" },
  { location: "La Curva", adminUsername: "hvcdp6" },
  { location: "Mabini", adminUsername: "hvcdp7" },
  { location: "Mangarin", adminUsername: "hvcdp8" },
  { location: "Mapaya", adminUsername: "hvcdp9" },
  { location: "Naibuan", adminUsername: "hvcdp10" },
  { location: "San Agustin", adminUsername: "hvcdp11" },
  { location: "San Isidro", adminUsername: "hvcdp12" },
  { location: "Island Barangays", adminUsername: "hvcdp13" },
];

export const LOCATION_LABELS = LOCATIONS.map((l) => l.location);

/** The ten legacy control-option calculator groups. */
export const PLANNER_CATEGORIES = [
  { id: "anthracnose", label: "Anthracnose", diseaseIds: ["anthracnose_bacterial", "anthracnose_fungal"] },
  { id: "pink_root", label: "Pink Root", diseaseIds: ["pink_root"] },
  { id: "white_rot", label: "White Rot", diseaseIds: ["white_rot"] },
  { id: "basal_plate_rot", label: "Basal Plate Rot", diseaseIds: ["basal_plate_rot"] },
  { id: "bacterial_soft_rot", label: "Basal Soft Rot", diseaseIds: ["bacterial_soft_rot"] },
  { id: "purple_blotch", label: "Purple Blotch", diseaseIds: ["purple_blotch"] },
  { id: "seedling_damping_off", label: "Seedling Damping Off", diseaseIds: ["seedling_damping_off"] },
  { id: "black_mold", label: "Black Mold", diseaseIds: ["black_mold"] },
  { id: "root_knot", label: "Root Knot", diseaseIds: ["root_knot"] },
  { id: "neck_rot", label: "Neck Rot", diseaseIds: ["neck_rot"] },
];

export const ARTICLE_TYPES = [
  { id: "fertilizer", label: "Fertilizer", description: "Nutrient sources and the legacy nutrient topics." },
  { id: "herbicide", label: "Herbicides", description: "Weed control topics from the legacy library." },
  { id: "fungicide", label: "Fungicides", description: "Fungal disease control topics." },
  { id: "insecticide", label: "Insecticides", description: "Insect control topics." },
  { id: "nematicide", label: "Nematicides", description: "Nematode control topics." },
  { id: "cropping", label: "Cropping guide", description: "Season planning and field practice." },
  { id: "stewardship", label: "Stewardship guide", description: "Responsible input use and record keeping." },
];

export const REPORT_STATUSES = [
  { id: "new", label: "New", description: "Submitted and not yet opened by an administrator." },
  { id: "viewed", label: "Viewed", description: "An administrator has opened the report." },
  { id: "in_progress", label: "In progress", description: "An administrator is following it up." },
  { id: "resolved", label: "Resolved", description: "The administrator has closed it with an outcome." },
  { id: "dismissed", label: "Dismissed", description: "Closed without follow-up." },
  { id: "reopened", label: "Reopened", description: "Reopened by an administrator for further review." },
];

export const REPORT_STATUS_LABEL = Object.fromEntries(REPORT_STATUSES.map((s) => [s.id, s.label]));

/** Allowed review transitions. Only trusted administrator operations apply these. */
export const REPORT_TRANSITIONS = {
  new: ["viewed", "in_progress", "dismissed"],
  viewed: ["in_progress", "resolved", "dismissed"],
  in_progress: ["resolved", "dismissed"],
  resolved: ["reopened"],
  dismissed: ["reopened"],
  reopened: ["in_progress", "resolved", "dismissed"],
};

export const CONTENT_STATUS_LABEL = {
  draft: "Draft",
  pending_review: "Pending review",
  published: "Published",
};

export const APPROVAL_STATUS_LABEL = {
  draft: "Draft",
  pending_review: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  expired: "Expired",
  withdrawn: "Withdrawn",
};