import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import PageHeader from "@/components/common/PageHeader";
import DiagnosisWizard from "@/components/farmer/DiagnosisWizard";
import { writePendingDiagnosis } from "@/lib/diagnosisSession";

export const Route = createFileRoute("/_authed/_farmer/diagnose/")({ component: DiagnosePage });

function DiagnosePage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const finishAssessment = async (assessment) => {
    setError(null);
    setBusy(true);
    if (!writePendingDiagnosis(assessment)) {
      setError("This browser could not preserve your answers for the result page. Check session storage and try again.");
      setBusy(false);
      return;
    }

    try {
      await navigate({ to: "/diagnose/result" });
    } catch {
      setError("The assessment is saved in this browser session, but the result page could not be opened. Try again.");
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl p-6">
      <PageHeader
        title="Check onion plant symptoms"
        description="Record what you observe. This checklist is preliminary guidance, not a confirmed diagnosis."
      />
      <DiagnosisWizard onComplete={finishAssessment} busy={busy} />
      {error ? <p role="alert" className="mt-4 text-sm text-destructive">{error}</p> : null}
    </main>
  );
}
