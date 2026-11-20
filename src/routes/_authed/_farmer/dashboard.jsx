import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  Loader2,
  MessagesSquare,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { farmerDashboard } from "@/lib/server/dashboard";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authed/_farmer/dashboard")({
  component: FarmerDashboard,
  head: () => ({ meta: [{ title: "Dashboard — OnionCare" }] }),
});

function FarmerDashboard() {
  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    let active = true;
    farmerDashboard()
      .then((data) => active && setState({ loading: false, data, error: null }))
      .catch((error) => active && setState({ loading: false, data: null, error: error?.message ?? "Unable to load your dashboard." }));
    return () => {
      active = false;
    };
  }, []);

  if (state.loading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading your dashboard…
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
        {state.error}
      </div>
    );
  }

  const { profile, recentDiagnoses, recentReports, openReports, unreadMessages, recentArticles, assignment } = state.data;
  const firstName = (profile?.name ?? "Farmer").split(/\s+/)[0];

  return (
    <div>
      <PageHeader
        eyebrow={profile?.location ?? "OnionCare"}
        title={`Welcome back, ${firstName}`}
        description="Start a symptom assessment, review your last result, or message your agricultural administrator."
        actions={
          <Button asChild className="gap-2">
            <Link to="/diagnose">
              <Stethoscope className="h-4 w-4" /> Start a diagnosis
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open reports" value={openReports} hint="Submitted and not yet closed" icon={ClipboardList} />
        <StatCard
          label="Unread messages"
          value={unreadMessages}
          hint={assignment ? "From your assigned administrator" : "No administrator assigned yet"}
          icon={MessagesSquare}
          tone={unreadMessages > 0 ? "alert" : "default"}
        />
        <StatCard label="Saved diagnoses" value={recentDiagnoses.length} hint="Most recent three shown below" icon={Stethoscope} />
        <StatCard
          label="Your administrator"
          value={assignment ? assignment.adminUsername : "—"}
          hint={assignment?.source === "support_fallback" ? "Support routing — location desk not yet assigned" : profile?.location}
          icon={ShieldCheck}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <h2 className="text-sm font-semibold">Latest diagnoses</h2>
              <Link to="/history" className="text-xs font-medium text-primary hover:underline">
                View history
              </Link>
            </div>
            {recentDiagnoses.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  You have not saved a diagnosis yet. The assessment takes about two minutes.
                </p>
                <Button asChild variant="outline" className="mt-4 gap-2">
                  <Link to="/diagnose">
                    Start your first diagnosis <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recentDiagnoses.map((item) => (
                  <li key={item.id}>
                    <Link
                      to="/history/$diagnosisId"
                      params={{ diagnosisId: item.id }}
                      className="flex items-start justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-secondary/60"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.diseaseName ?? "More than one candidate"}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDate(item.occurredAt ?? item.created_date)} · {item.selectedSymptoms?.length ?? 0} symptoms
                        </p>
                      </div>
                      <StatusBadge status={item.resultType} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-5 rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <h2 className="text-sm font-semibold">Recently reviewed guidance</h2>
              <Link to="/library" className="text-xs font-medium text-primary hover:underline">
                Open library
              </Link>
            </div>
            {recentArticles.length === 0 ? (
              <p className="px-5 py-6 text-sm leading-relaxed text-muted-foreground">
                No agricultural guidance has been published yet. Your administrator is preparing it — until
                then, use the disease library for symptom descriptions.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {recentArticles.map((article) => (
                  <li key={article.id} className="px-5 py-3.5">
                    <p className="text-sm font-medium">{article.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {article.contentType} · reviewed {formatDate(article.lastReviewedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <BookOpen className="h-4 w-4 text-primary" /> Before you diagnose
            </h2>
            <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
              <li>Check a few affected plants, not only the worst one.</li>
              <li>Lift one plant so you can see the roots and the bulb base.</li>
              <li>Note roughly how much of the field is affected.</li>
              <li>Have your lot area ready if you want it recorded.</li>
            </ul>
            <Button asChild variant="outline" className="mt-4 w-full gap-2">
              <Link to="/help">
                Open the walkthrough <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Your reports</h2>
            {recentReports.length === 0 ? (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                No reports submitted yet. A report tells your administrator exactly what you are seeing.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {recentReports.map((report) => (
                  <li key={report.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{report.diseaseName}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(report.created_date)}</p>
                    </div>
                    <StatusBadge status={report.status} />
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="ghost" className="mt-3 w-full justify-start gap-2 px-0 text-primary">
              <Link to="/reports">
                All my reports <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}