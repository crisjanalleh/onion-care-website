import assert from "node:assert/strict";
import test from "node:test";
import {
  DiagnosisInputError,
  calculateAffectedArea,
  evaluateDiagnosis,
  validateAreaInputs,
} from "../src/lib/domain/diagnosis.js";
import {
  PLANNER_CONTENT_TYPE_BY_CATEGORY,
  plannerCategoryById,
  plannerCategories,
} from "../src/lib/domain/planner.js";

test("diagnosis abstains until expert-reviewed rules are released", () => {
  const result = evaluateDiagnosis("yellow_leaves", ["twisted", "white_oval", "rotten"]);

  assert.equal(result.resultType, "inconclusive");
  assert.equal(result.reviewStatus, "not_released");
  assert.deepEqual(result.candidateDiseaseIds, []);
  assert.equal(result.matchedRuleId, null);
  assert.equal(result.rulesetVersion, "unreleased-rules-v1");
});

test("valid but empty or contradictory observations remain inconclusive", () => {
  assert.equal(evaluateDiagnosis("water_soaked_bulb", []).resultType, "inconclusive");
  const result = evaluateDiagnosis("water_soaked_bulb", ["soft", "dry"]);
  assert.equal(result.resultType, "inconclusive");
  assert.deepEqual(result.candidateDiseaseIds, []);
});

test("diagnosis rejects unknown categories, unknown symptoms, and cross-group symptoms", () => {
  assert.throws(
    () => evaluateDiagnosis("not-a-category", ["yellow"]),
    (error) => error instanceof DiagnosisInputError && error.field === "symptomCategory",
  );
  assert.throws(
    () => evaluateDiagnosis("yellow_leaves", ["not-a-symptom"]),
    (error) => error instanceof DiagnosisInputError && error.field === "selectedSymptoms",
  );
  assert.throws(
    () => evaluateDiagnosis("yellow_leaves", ["deep_pink"]),
    (error) => error instanceof DiagnosisInputError && error.field === "selectedSymptoms",
  );
});

test("area validation accepts both units and the percentage boundaries", () => {
  assert.deepEqual(validateAreaInputs({
    lotArea: "2500.5",
    lotAreaUnit: "sqm",
    affectedAreaPercent: "0",
  }), {});
  assert.deepEqual(validateAreaInputs({
    lotArea: "1",
    lotAreaUnit: "ha",
    affectedAreaPercent: "100",
  }), {});
});

test("affected-area estimates use exact decimal conversions and equivalent units", () => {
  const hectare = calculateAffectedArea({
    lotArea: "1",
    lotAreaUnit: "ha",
    affectedAreaPercent: "12.5",
  });
  const squareMetres = calculateAffectedArea({
    lotArea: "10000",
    lotAreaUnit: "sqm",
    affectedAreaPercent: "12.5",
  });

  assert.equal(hectare.totalAreaM2, "10000");
  assert.equal(hectare.estimatedAffectedAreaM2, "1250");
  assert.equal(hectare.totalAreaM2, squareMetres.totalAreaM2);
  assert.equal(hectare.estimatedAffectedAreaM2, squareMetres.estimatedAffectedAreaM2);
  assert.equal(hectare.version, "affected-area-estimate-v1");
});

test("area validation rejects non-finite, malformed, non-positive, and excessive values", () => {
  for (const lotArea of ["", "NaN", "Infinity", "-Infinity", "-1", "1,000", "0x10", "1e3", 0, Infinity, -Infinity, NaN]) {
    assert.ok(validateAreaInputs({
      lotArea,
      lotAreaUnit: "sqm",
      affectedAreaPercent: 50,
    }).lotArea, `expected invalid lot area: ${String(lotArea)}`);
  }
  assert.ok(validateAreaInputs({
    lotArea: "900719925475",
    lotAreaUnit: "ha",
    affectedAreaPercent: 50,
  }).lotArea);
  assert.ok(validateAreaInputs({
    lotArea: "9007199254740991.1",
    lotAreaUnit: "sqm",
    affectedAreaPercent: 50,
  }).lotArea);
  assert.ok(validateAreaInputs({
    lotArea: 1,
    lotAreaUnit: "sqm",
    affectedAreaPercent: Infinity,
  }).affectedAreaPercent);
  assert.ok(validateAreaInputs({
    lotArea: 1,
    lotAreaUnit: "sqm",
    affectedAreaPercent: "1,5",
  }).affectedAreaPercent);
  assert.ok(validateAreaInputs({
    lotArea: 1,
    lotAreaUnit: "sqm",
    affectedAreaPercent: 101,
  }).affectedAreaPercent);
});

test("planner categories have no inferred chemical content type", () => {
  assert.equal(Object.keys(PLANNER_CONTENT_TYPE_BY_CATEGORY).length, 10);
  assert.ok(plannerCategories().every((category) => category.contentType === null));
  assert.equal(plannerCategoryById("unreviewed-category"), null);
});
