import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ClipboardList, Loader2, MessagesSquare, Save, TriangleAlert } from "lucide-react";
import DiagnosisResultView from "@/components/farmer/DiagnosisResultView";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSessionProfile } from "@/hooks/useSessionProfile";
import { saveDiagnosis } from "@/lib/server/diagnosis";
import { submitDiseaseReport } from "@/lib/server/reports";
import { DISEASE_BY_ID } from "@/lib/domain/catalogue";
import { clearPendingDiagnosis, readPendingDiagnosis } from "@/lib/diagnosisSession";

export const Route = createFileRoute("/_authed/_farmer/diagnose/result")({
  component: ResultPage,
  head: () => ({ meta: [{ title: "Assessment result — OnionCare" }] }),
});

function ResultPage() {
  const [pending, setPending] = useState(null);
  const [ready, setReady] = useState(false);
  const { profile } = useSessionProfile();
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportState, setReportState] = useState({ submitting: false, error: null, report: null });
  const [description, setDescription] = useState("");
  const [diseaseChoice, setDiseaseChoice] = useState("");
  const idempotencyKey = useRef(typeof crypto !== "undefined" ? crypto.randomUUID() : `key-${Date.now()}`);

  useEffect(() => {
    const parsed = readPendingDiagnosis();
    if (parsed) {
      setPending(parsed);
      setDiseaseChoice(parsed.result?.candidateDiseaseIds?.[0] ?? "");
    }
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Preparing your result…
      </div>
    );
  }

  if (!pending) {
    return (
      <div className="mx-auto max-w-xl rounded-lg border border-border bg-card p-6 text-center">
        <TriangleAlert className="mx-auto h-6 w-6 text-amber-700" />
        <h1 className="mt-3 text-lg font-semibold">No assessment in progress</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This result is no longer available in this browser session. Run the symptom checklist again to
          produce a new assessment.
        </p>
        <Button asChild className="mt-5">
          <Link to="/diagnose">Start a diagnosis</Link>
        </Button>
      </div>
    );
  }

  const { result, symptomCategory, selectedSymptoms, lotArea, lotAreaUnit, affectedAreaPercent } = pending;
  const candidates = result.candidateDiseaseIds.map((id) => DISEASE_BY_ID[id]).filter(Boolean);
  const canSave = result.resultType === "single_match" || result.resultType === "differential";

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const response = await saveDiagnosis({
        data: {
          symptomCategory,
          selectedSymptoms,
          lotArea: Number(lotArea),
          lotAreaUnit,
          affectedAreaPercent: Number(affectedAreaPercent),
        },
      });
      setSavedId(response.record.id);
      clearPendingDiagnosis();
    } catch (error) {
      setSaveError(error?.message ?? "Your diagnosis could not be saved. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReport = async () => {
    setReportState({ submitting: true, error: null, report: null });
    try {
      const response = await submitDiseaseReport({
        data: {
          diseaseId: diseaseChoice,
          diagnosisId: savedId ?? undefined,
          description: description || undefined,
          idempotencyKey: idempotencyKey.current,
        },
      });
      setReportState({ submitting: false, error: null, report: response.report });
    } catch (error) {
      setReportState({ submitting: false, error: error?.message ?? "The report could not be submitted.", report: null });
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <DiagnosisResultView
        result={result}
        categoryId={symptomCategory}
        selectedSymptoms={selectedSymptoms}
        lotArea={lotArea}
        lotAreaUnit={lotAreaUnit}
        affectedAreaPercent={affectedAreaPercent}
      >
        {savedId ? (
          <div className="flex w-full flex-col gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm text-emerald-900">
              <CheckCircle2 className="h-4 w-4" /> Saved to your history.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link to="/history/$diagnosisId" params={{ diagnosisId: savedId }}>
                Open saved record
              </Link>
            </Button>
          </div>
        ) : canSave ? (
          <Button type="button" onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save diagnosis
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link to="/diagnose">Run the checklist again</Link>
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => setReportOpen(true)}
          disabled={!diseaseChoice}
        >
          <ClipboardList className="h-4 w-4" /> Submit a report
        </Button>

        <Button asChild variant="outline" className="gap-2">
          <Link to="/messages">
            <MessagesSquare className="h-4 w-4" /> Message my administrator
          </Link>
        </Button>

        {saveError ? <p className="w-full text-sm text-destructive">{saveError}</p> : null}
      </DiagnosisResultView>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit a disease report</DialogTitle>
            <DialogDescription>
              Your administrator receives the details below. You cannot change the review status afterwards.
            </DialogDescription>
          </DialogHeader>

          {reportState.report ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                <CheckCircle2 className="h-4 w-4" /> Report submitted.
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Reference</dt>
                  <dd className="font-mono text-xs">{reportState.report.id}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <StatusBadge status={reportState.report.status} />
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Disease</dt>
                  <dd className="text-right">{reportState.report.diseaseName}</dd>
                </div>
              </dl>
              <DialogFooter>
                <Button asChild variant="outline">
                  <Link to="/reports">View my reports</Link>
                </Button>
                <Button onClick={() => setReportOpen(false)}>Close</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              {candidates.length > 1 ? (
                <div>
                  <Label htmlFor="diseaseChoice">Which result are you reporting?</Label>
                  <select
                    id="diseaseChoice"
                    value={diseaseChoice}
                    onChange={(event) => setDiseaseChoice(event.target.value)}
                    className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {candidates.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.legacyLabel}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <dl className="space-y-2 rounded-md border border-border bg-secondary/60 p-3.5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Disease</dt>
                  <dd className="text-right font-medium">
                    {DISEASE_BY_ID[diseaseChoice]?.legacyLabel ?? "Needs classification"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="text-right font-medium">{profile?.name ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Location</dt>
                  <dd className="text-right font-medium">{profile?.location ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Contact number</dt>
                  <dd className="text-right font-medium">{profile?.number ?? "—"}</dd>
                </div>
              </dl>

              <div>
                <Label htmlFor="description">Anything else your administrator should know?</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Optional — for example when you first noticed it, or what you have already applied."
                  className="mt-1.5"
                />
              </div>

              {reportState.error ? <p className="text-sm text-destructive">{reportState.error}</p> : null}

              <DialogFooter>
                <Button variant="ghost" onClick={() => setReportOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleReport} disabled={reportState.submitting}>
                  {reportState.submitting ? "Submitting…" : "Confirm and submit"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}