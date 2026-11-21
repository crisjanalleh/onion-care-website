import {
  AREA_FORMULA_VERSION,
  RULESET_VERSION,
  SYMPTOM_GROUP_BY_ID,
} from "./catalogue.js";

export const LOT_AREA_UNITS = [
  { id: "sqm", label: "square metres" },
  { id: "ha", label: "hectares" },
];

// This technical ceiling keeps the normalized square-metre value within JS safe-integer range.
const MAX_AREA_M2 = Number.MAX_SAFE_INTEGER;
const MAX_DECIMAL_LENGTH = 40;
const DECIMAL_INPUT = /^\d+(?:\.\d+)?$/;

export class DiagnosisInputError extends Error {
  constructor(field, message) {
    super(message);
    this.name = "DiagnosisInputError";
    this.field = field;
  }
}

function decimalText(value) {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    let text = String(value);
    if (!/[eE]/.test(text)) return text;
    const [mantissa, exponentText] = text.toLowerCase().split("e");
    const exponent = Number(exponentText);
    const [whole, fraction = ""] = mantissa.split(".");
    const digits = `${whole}${fraction}`;
    const decimalPosition = whole.length + exponent;
    if (decimalPosition <= 0) return `0.${"0".repeat(-decimalPosition)}${digits}`;
    if (decimalPosition >= digits.length) return `${digits}${"0".repeat(decimalPosition - digits.length)}`;
    return `${digits.slice(0, decimalPosition)}.${digits.slice(decimalPosition)}`;
  }
  return typeof value === "string" ? value.trim() : null;
}

function decimalParts(value) {
  const text = decimalText(value);
  if (text === null || text.length > MAX_DECIMAL_LENGTH || !DECIMAL_INPUT.test(text)) return null;
  const [whole, fraction = ""] = text.split(".");
  return { coefficient: BigInt(`${whole}${fraction}`), scale: fraction.length };
}

function parseDecimal(value) {
  const text = decimalText(value);
  if (text === null || text.length > MAX_DECIMAL_LENGTH || !DECIMAL_INPUT.test(text)) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDecimal(coefficient, scale) {
  if (coefficient === 0n) return "0";
  const digits = coefficient.toString().padStart(scale + 1, "0");
  if (scale === 0) return digits;
  const whole = digits.slice(0, -scale);
  const fraction = digits.slice(-scale).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

/**
 * No agronomist-reviewed rules are currently released. Keep valid observations,
 * reject invalid category membership, and abstain rather than infer a diagnosis.
 */
export function evaluateDiagnosis(categoryId, selectedSymptoms = []) {
  const group = SYMPTOM_GROUP_BY_ID[categoryId];
  if (!group) {
    throw new DiagnosisInputError("symptomCategory", "Choose a valid symptom group.");
  }
  if (!Array.isArray(selectedSymptoms)) {
    throw new DiagnosisInputError("selectedSymptoms", "Symptoms must be provided as a list.");
  }

  const validIds = new Set(group.symptoms.map((symptom) => symptom.id));
  for (const symptomId of selectedSymptoms) {
    if (typeof symptomId !== "string" || !validIds.has(symptomId)) {
      throw new DiagnosisInputError("selectedSymptoms", "One or more symptoms do not belong to the selected group.");
    }
  }

  const symptoms = [...new Set(selectedSymptoms)];
  return {
    rulesetVersion: RULESET_VERSION,
    areaFormulaVersion: AREA_FORMULA_VERSION,
    symptomCategory: categoryId,
    selectedSymptoms: symptoms,
    groupLabel: group.label,
    resultType: "inconclusive",
    candidateDiseaseIds: [],
    matchedRuleId: null,
    reviewStatus: "not_released",
  };
}

/** Field-level errors for the affected-area step; an empty object means "go on". */
export function validateAreaInputs({ lotArea, lotAreaUnit, affectedAreaPercent } = {}) {
  const errors = {};
  const area = decimalParts(lotArea);
  const areaMultiplier = lotAreaUnit === "ha" ? 10_000 : 1;
  const canonicalArea = area
    ? area.coefficient * BigInt(areaMultiplier)
    : null;
  const precision = area ? 10n ** BigInt(area.scale) : null;

  if (
    !area ||
    area.coefficient === 0n ||
    canonicalArea > BigInt(MAX_AREA_M2) * precision
  ) {
    errors.lotArea = "Enter the lot area as a number greater than zero and within the supported range.";
  }
  if (!LOT_AREA_UNITS.some((unit) => unit.id === lotAreaUnit)) {
    errors.lotAreaUnit = "Choose a unit.";
  }

  const percent = parseDecimal(affectedAreaPercent);
  if (percent === null || percent < 0 || percent > 100) {
    errors.affectedAreaPercent = "Enter the affected area as a percentage from 0 to 100.";
  }

  return errors;
}

export function calculateAffectedArea({ lotArea, lotAreaUnit, affectedAreaPercent } = {}) {
  const errors = validateAreaInputs({ lotArea, lotAreaUnit, affectedAreaPercent });
  if (Object.keys(errors).length) {
    const [field, message] = Object.entries(errors)[0];
    throw new DiagnosisInputError(field, message);
  }

  const area = decimalParts(lotArea);
  const percent = decimalParts(affectedAreaPercent);
  const totalCoefficient = area.coefficient * (lotAreaUnit === "ha" ? 10_000n : 1n);
  const affectedCoefficient = totalCoefficient * percent.coefficient;
  return {
    totalAreaM2: formatDecimal(totalCoefficient, area.scale),
    estimatedAffectedAreaM2: formatDecimal(affectedCoefficient, area.scale + percent.scale + 2),
    version: AREA_FORMULA_VERSION,
  };
}
