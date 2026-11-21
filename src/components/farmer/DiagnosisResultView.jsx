import { SYMPTOM_GROUP_BY_ID } from "@/lib/domain/catalogue";

export default function DiagnosisResultView({ categoryId, selectedSymptoms, children }) {
  const group = SYMPTOM_GROUP_BY_ID[categoryId];
  const observations = (selectedSymptoms ?? []).map(
    (id) => group?.symptoms.find((symptom) => symptom.id === id)?.label ?? id,
  );

  return (
    <section className="space-y-5">
      <div className="rounded-xl border bg-card p-5">
        <p className="text-sm font-medium text-muted-foreground">Preliminary assessment</p>
        <h1 className="mt-1 text-xl font-semibold">Inconclusive</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          No agronomist-reviewed diagnostic rules are currently released in OnionCare. This checklist
          cannot identify or confirm a disease. Ask your agricultural administrator to review the plants.
        </p>
        <div className="mt-5">
          <h2 className="text-sm font-semibold">What you observed</h2>
          <p className="mt-1 text-sm">{group?.label ?? "Symptom group"}: {observations.join(", ") || "No symptoms recorded"}</p>
        </div>
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </section>
  );
}
