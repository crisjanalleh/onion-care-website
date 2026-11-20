/**
 * The symptom-checklist assessment.
 *
 * The original legacy rules table is not recoverable from the surviving files, so
 * this is a transparent stand-in: a disease is scored by how many of the selected
 * symptoms' meaningful words appear in its catalogue entry. The shape of the result
 * is the part that the rest of the app depends on, and it is kept stable:
 * `{ resultType, candidateDiseaseIds, matchedRuleId, rulesetVersion }`.
 */
import {
  AREA_FORMULA_VERSION,
  DISEASES,
  RULESET_VERSION,
  SYMPTOM_GROUP_BY_ID,
  SYMPTOM_GROUPS,
} from "@/lib/domain/catalogue";

export const LOT_AREA_UNITS = [
  { id: "sqm", label: "square metres" },
  { id: "ha", label: "hectares" },
];

const STOPWORDS = new Set([
  "the", "a", "an", "or", "and", "of", "to", "with", "on", "in", "is", "are",
  "for", "its", "it", "be", "by", "as", "at", "that", "this", "from", "into",
]);

function words(text) {
  return String(text ?? "")
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((word) => word.length > 3 && !STOPWORDS.has(word));
}

const SYMPTOM_LABEL = new Map(
  SYMPTOM_GROUPS.flatMap((group) => group.symptoms.map((symptom) => [symptom.id, symptom.label])),
);

function scoreDisease(disease, selectedSymptoms) {
  const haystack = new Set(words([disease.summary, ...(disease.keySigns ?? [])].join(" ")));
  let score = 0;
  for (const id of selectedSymptoms) {
    const label = SYMPTOM_LABEL.get(id);
    if (!label) continue;
    if (words(label).some((word) => haystack.has(word))) score += 1;
  }
  return score;
}

/**
 * Produces the assessment shown on the result page.
 * resultType is "single_match", "differential" (a tie), or "no_match".
 */
export function evaluateDiagnosis(categoryId, selectedSymptoms = []) {
  const symptoms = [...new Set(selectedSymptoms)];
  const inGroup = DISEASES.filter((disease) => (disease.symptomGroups ?? []).includes(categoryId));

  const scored = inGroup
    .map((disease) => ({ disease, score: scoreDisease(disease, symptoms) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  let resultType = "no_match";
  let candidates = [];
  let matchedRuleId = null;

  if (scored.length > 0) {
    const topScore = scored[0].score;
    const leaders = scored.filter((entry) => entry.score === topScore).map((entry) => entry.disease);
    candidates = leaders.map((disease) => disease.id);
    resultType = leaders.length > 1 ? "differential" : "single_match";
    matchedRuleId = `${categoryId}:${leaders.map((disease) => disease.id).join("+")}`;
  } else if (inGroup.length > 0) {
    // Nothing scored: offer the whole group as a differential rather than a dead end.
    candidates = inGroup.map((disease) => disease.id);
    resultType = "differential";
    matchedRuleId = `${categoryId}:group`;
  }

  return {
    rulesetVersion: RULESET_VERSION,
    areaFormulaVersion: AREA_FORMULA_VERSION,
    symptomCategory: categoryId,
    selectedSymptoms: symptoms,
    groupLabel: SYMPTOM_GROUP_BY_ID[categoryId]?.label ?? null,
    resultType,
    candidateDiseaseIds: candidates,
    matchedRuleId,
  };
}

/** Field-level errors for the affected-area step; an empty object means "go on". */
export function validateAreaInputs({ lotArea, lotAreaUnit, affectedAreaPercent }) {
  const errors = {};

  const area = Number(lotArea);
  if (lotArea === "" || lotArea === null || lotArea === undefined || Number.isNaN(area) || area <= 0) {
    errors.lotArea = "Enter the lot area as a number greater than zero.";
  }
  if (!LOT_AREA_UNITS.some((unit) => unit.id === lotAreaUnit)) {
    errors.lotAreaUnit = "Choose a unit.";
  }
  const percent = Number(affectedAreaPercent);
  if (
    affectedAreaPercent === "" ||
    affectedAreaPercent === null ||
    affectedAreaPercent === undefined ||
    Number.isNaN(percent) ||
    percent < 0 ||
    percent > 100
  ) {
    errors.affectedAreaPercent = "Enter the affected area as a percentage from 0 to 100.";
  }

  return errors;
}
