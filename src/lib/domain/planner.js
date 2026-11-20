/**
 * Helpers for the application planner.
 *
 * The planner shows the legacy control-option categories and the guidance that
 * belongs to each. It deliberately performs no mixture arithmetic: the legacy
 * lot-area formula's units were never verified, so no quantity is derived.
 */
import { ARTICLE_TYPES, PLANNER_CATEGORIES } from "@/lib/domain/catalogue";

export const PLANNER_DISCLAIMER =
  "OnionCare does not convert a lot area into a chemical quantity. The legacy mixture formula's units were never verified. Use the product label and your local agricultural office's advice.";

export const PLANNER_CATEGORY_BY_ID = Object.fromEntries(
  PLANNER_CATEGORIES.map((category) => [category.id, category]),
);

/** The legacy categories, each annotated with the content type its guidance lives under. */
export function plannerCategories() {
  return PLANNER_CATEGORIES.map((category) => ({
    ...category,
    contentType: ARTICLE_TYPES.some((type) => type.id === "fungicide") ? "fungicide" : null,
  }));
}

export function plannerCategoryById(id) {
  return PLANNER_CATEGORY_BY_ID[id] ?? null;
}
