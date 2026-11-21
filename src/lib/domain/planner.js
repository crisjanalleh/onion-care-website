/**
 * Helpers for the application planner.
 *
 * The planner shows the legacy control-option categories and the guidance that
 * belongs to each. It deliberately performs no mixture arithmetic: the legacy
 * lot-area formula's units were never verified, so no quantity is derived.
 */
import { PLANNER_CATEGORIES } from "./catalogue.js";

export const PLANNER_DISCLAIMER =
  "OnionCare does not convert a lot area into a chemical quantity. The legacy mixture formula's units were never verified. Use the product label and your local agricultural office's advice.";

export const PLANNER_CATEGORY_BY_ID = Object.fromEntries(
  PLANNER_CATEGORIES.map((category) => [category.id, category]),
);

// No category-to-treatment relationship has verified source and reviewer metadata.
export const PLANNER_CONTENT_TYPE_BY_CATEGORY = Object.freeze({
  anthracnose: null,
  pink_root: null,
  white_rot: null,
  basal_plate_rot: null,
  bacterial_soft_rot: null,
  purple_blotch: null,
  seedling_damping_off: null,
  black_mold: null,
  root_knot: null,
  neck_rot: null,
});

/** Treatment content is shown only when a reviewed mapping is explicitly recorded. */
export function plannerCategories() {
  return PLANNER_CATEGORIES.map((category) => ({
    ...category,
    contentType: PLANNER_CONTENT_TYPE_BY_CATEGORY[category.id] ?? null,
  }));
}

export function plannerCategoryById(id) {
  return PLANNER_CATEGORY_BY_ID[id] ?? null;
}
