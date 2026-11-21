import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";
import { DISEASE_BY_ID } from "@/lib/domain/catalogue";
import {
  calculateAffectedArea,
  DiagnosisInputError,
  evaluateDiagnosis,
  validateAreaInputs,
} from "@/lib/domain/diagnosis";
import { fail, requireProfile, svc } from "./shared";

/**
 * Saved symptom-checklist assessments. The rules live in `@/lib/domain/diagnosis`:
 * the server re-runs them rather than trusting the browser's copy, so a stored
 * record always names the ruleset that produced it.
 */

export const saveDiagnosis = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      symptomCategory: z.string().min(1).max(64),
      selectedSymptoms: z.array(z.string().min(1).max(64)).min(1, "Record at least one symptom.").max(15),
      lotArea: z.union([z.number().finite(), z.string().max(40)]),
      lotAreaUnit: z.enum(["sqm", "ha"]),
      affectedAreaPercent: z.union([z.number().finite(), z.string().max(40)]),
    }),
  )
  .handler(async ({ data, context }) => {
    const profile = await requireProfile(context);
    const entities = svc(context).entities;
    const areaErrors = validateAreaInputs(data);
    if (Object.keys(areaErrors).length) {
      throw fail(Object.values(areaErrors)[0], 422);
    }
    const areaEstimate = calculateAffectedArea(data);
    let result;
    try {
      result = evaluateDiagnosis(data.symptomCategory, data.selectedSymptoms);
    } catch (error) {
      if (!(error instanceof DiagnosisInputError)) throw error;
      throw fail(error.message, 422);
    }

    const leadId = result.candidateDiseaseIds[0] ?? null;
    const occurredAt = new Date().toISOString();

    const record = await entities.DiagnosisRecord.create({
      farmerUid: profile.uid,
      farmerUsername: profile.username,
      name: profile.name,
      location: profile.location,
      symptomCategory: result.symptomCategory,
      selectedSymptoms: result.selectedSymptoms,
      resultType: result.resultType,
      candidateDiseaseIds: result.candidateDiseaseIds,
      diseaseId: result.resultType === "single_match" ? leadId : null,
      diseaseName: result.resultType === "single_match" ? DISEASE_BY_ID[leadId]?.legacyLabel ?? null : null,
      matchedRuleId: result.matchedRuleId,
      rulesetVersion: result.rulesetVersion,
      reviewStatus: result.reviewStatus,
      areaFormulaVersion: result.areaFormulaVersion,
      lotArea: Number(data.lotArea),
      lotAreaInput: String(data.lotArea),
      lotAreaUnit: data.lotAreaUnit,
      affectedAreaPercent: Number(data.affectedAreaPercent),
      affectedAreaPercentInput: String(data.affectedAreaPercent),
      totalAreaM2: areaEstimate.totalAreaM2,
      estimatedAffectedAreaM2: areaEstimate.estimatedAffectedAreaM2,
      occurredAt,
      schemaVersion: 3,
      legacyPath: `diagnoses/${profile.username}/${occurredAt}`,
    });

    return { record };
  });

export const getDiagnosis = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ diagnosisId: z.string() }))
  .handler(async ({ data, context }) => {
    const entities = svc(context).entities;
    const record = await entities.DiagnosisRecord.get(data.diagnosisId);
    if (!record) throw fail("That diagnosis could not be found.", 404);
    if (record.farmerUid !== context.user.id && context.user.role !== "admin") {
      throw fail("You do not have access to this record.", 403);
    }

    const found = await Promise.all(
      (record.candidateDiseaseIds ?? []).map(async (diseaseId) => {
        const rows = await entities.Disease.filter({ diseaseId });
        const disease = rows[0];
        if (!disease) return null;
        return {
          id: disease.id,
          diseaseId,
          legacyLabel: disease.legacyLabel,
          summary: disease.summary,
          culturalGuidance: disease.culturalGuidance,
          culturalGuidanceStatus: disease.culturalGuidanceStatus,
          contentStatus: disease.contentStatus,
        };
      }),
    );

    return { record, diseases: found.filter(Boolean) };
  });
