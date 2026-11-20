import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, MessagesSquare } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import ArticleBody from "@/components/content/ArticleBody";
import { Button } from "@/components/ui/button";
import { getDiagnosis } from "@/lib/server/diagnosis";
import { SYMPTOM_GROUP_BY_ID } from "@/lib/domain/catalogue";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authed/_farmer/history/$diagnosisId")({
  component: DiagnosisDetail,
  head: () => ({ meta: [{ title: "Saved diagnosis — OnionCare" }] }),
});

function DiagnosisDetail() {
  const { diagnosisId } = Route.useParams();
  const [state, setState] = useState({ loading: true, record: null, diseases: [], error: null });

  useEffect(() => {
    let active = true;
    getDiagnosis({ data: { diagnosisId } })
      .then((result) => active && setState({ loading: false, ...result, error: null }))
      .catch((error) => active && setState({ loading: false, record: null, diseases: [], error: error?.message ?? "Unable to load this record." }));
    return () => {
      active = false;
    };
  }, [diagnosisId]);

  if (state.loading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading record…
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="mx-auto max-w-xl rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-destructive">{state.error}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/history">Back to history</Link>
        </Button>
      </div>
    );
  }

  const { record, diseases } = state;
  const group = SYMPTOM_GROUP_BY_ID[record.symptomCategory];

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/history" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> History
      </Link>

      <PageHeader
        eyebrow={formatDateTime(record.occurredAt ?? record.created_date)}
        title={record.diseaseName ?? "More than one candidate"}
        description={group ? `${group.label} · ${record.selectedSymptoms?.length ?? 0} symptoms recorded` : undefined}
        actions={<StatusBadge status={record.resultType} />}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Symptoms recorded</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            {(record.selectedSymptoms ?? []).map((id) => (
              <li key={id} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-primary" />
                {group?.symptoms.find((s) => s.id === id)?.label ?? id}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Record details</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Ruleset</dt>
              <dd className="font-mono text-xs">{record.rulesetVersion}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Matched rule</dt>
              <dd className="font-mono text-xs">{record.matchedRuleId ?? "—"}</dd>
            </div>
            {record.lotArea ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Lot area</dt>
                <dd>
                  {record.lotArea} {record.lotAreaUnit}
                </dd>
              </div>
            ) : null}
            {record.affectedAreaPercent !== null && record.affectedAreaPercent !== undefined ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Affected area</dt>
                <dd>{record.affectedAreaPercent}%</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Legacy path</dt>
              <dd className="truncate font-mono text-[0.6875rem]">{record.legacyPath}</dd>
            </div>
          </dl>
        </section>
      </div>

      {diseases.length > 0 ? (
        <section className="mt-5 space-y-4">
          {diseases.map((disease) => (
            <div key={disease.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold">{disease.legacyLabel}</h2>
                <StatusBadge status={disease.contentStatus} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{disease.summary}</p>
              {disease.culturalGuidance ? (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Management notes · {disease.culturalGuidanceStatus === "approved" ? "reviewed" : "not yet reviewed"}
                  </p>
                  <ArticleBody text={disease.culturalGuidance} className="mt-2" />
                </div>
              ) : null}
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/library/diseases/$diseaseId" params={{ diseaseId: disease.diseaseId }}>
                  Open in the disease library
                </Link>
              </Button>
            </div>
          ))}
        </section>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild variant="outline" className="gap-2">
          <Link to="/messages">
            <MessagesSquare className="h-4 w-4" /> Ask my administrator
          </Link>
        </Button>
        <Button asChild>
          <Link to="/diagnose">Run a new diagnosis</Link>
        </Button>
      </div>
    </div>
  );
}