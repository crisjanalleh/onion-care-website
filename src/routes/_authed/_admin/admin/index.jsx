import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ClipboardList,
  FileClock,
  Loader2,
  MessagesSquare,
  UserPlus,
  Users,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { adminDashboard } from "@/lib/server/dashboard";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authed/_admin/admin/")({
  component: AdminDashboard,
  head: () => ({ meta: [{ title: "Administration — OnionCare" }] }),
});

function AdminDashboard() {
  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    let active = true;
    adminDashboard()
      .then((data) => active && setState({ loading: false, data, error: null }))
      .catch((error) => active && setState({ loading: false, data: null, error: error?.message ?? "Unable to load the dashboard." }));
    return () => {
      active = false;
    };
  }, []);

  if (state.loading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading operational data…
      </div>
    );
  }

  if (state.error) {
    return <p className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{state.error}</p>;
  }

  const data = state.data;
  const maxDisease = Math.max(1, ...data.reportsByDisease.map((row) => row.count));

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Operations dashboard"
        description="Every figure below is queried from live records. New reports count only reports that have not yet been reviewed."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Registered farmers" value={data.farmerCount} hint="Trusted farmer role only" icon={Users} />
        <StatCard label="New reports" value={data.newReports} hint="Awaiting a first review" icon={ClipboardList} tone={data.newReports > 0 ? "alert" : "default"} />
        <StatCard label="Open conversations" value={data.openConversations} hint="Threads not archived" icon={MessagesSquare} />
        <StatCard label="Unread for you" value={data.unreadForMe} hint="Messages addressed to your account" icon={MessagesSquare} tone={data.unreadForMe > 0 ? "alert" : "default"} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-5">
          <div className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <h2 className="text-sm font-semibold">Reports by disease</h2>
              <Link to="/admin/reports" className="text-xs font-medium text-primary hover:underline">
                Open report queue
              </Link>
            </div>
            {data.reportsByDisease.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">No reports have been submitted yet.</p>
            ) : (
              <ul className="space-y-3 px-5 py-4">
                {data.reportsByDisease.map((row) => (
                  <li key={row.diseaseName}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate">{row.diseaseName || "Needs classification"}</span>
                      <span className="tabular-nums text-muted-foreground">{row.count}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(row.count / maxDisease) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <h2 className="text-sm font-semibold">Latest reports</h2>
              <Link to="/admin/reports" className="text-xs font-medium text-primary hover:underline">
                View all
              </Link>
            </div>
            {data.recentReports.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">Nothing submitted yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.recentReports.map((report) => (
                  <li key={report.id}>
                    <Link
                      to="/admin/reports/$reportId"
                      params={{ reportId: report.id }}
                      className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-secondary/60"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{report.diseaseName}</p>
                        <p className="text-xs text-muted-foreground">
                          {report.name} · {report.location} · {formatDateTime(report.created_date)}
                        </p>
                      </div>
                      <StatusBadge status={report.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <FileClock className="h-4 w-4 text-primary" /> Content awaiting review
            </h2>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{data.pendingContent}</p>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              <li className="flex justify-between">
                <span>Articles</span> <span className="tabular-nums">{data.pendingBreakdown.articles}</span>
              </li>
              <li className="flex justify-between">
                <span>Disease records</span> <span className="tabular-nums">{data.pendingBreakdown.diseases}</span>
              </li>
              <li className="flex justify-between">
                <span>Treatment recommendations</span>{" "}
                <span className="tabular-nums">{data.pendingBreakdown.recommendations}</span>
              </li>
            </ul>
            <Button asChild variant="outline" className="mt-4 w-full justify-between">
              <Link to="/admin/content">
                Open content workspace <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <UserPlus className="h-4 w-4 text-primary" /> Recent registrations
            </h2>
            {data.recentFarmers.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No farmers registered yet.</p>
            ) : (
              <ul className="mt-3 space-y-2.5 text-sm">
                {data.recentFarmers.map((farmer) => (
                  <li key={farmer.id} className="flex items-center justify-between gap-3">
                    <Link
                      to="/admin/farmers/$username"
                      params={{ username: farmer.username }}
                      className="min-w-0 truncate hover:underline"
                    >
                      {farmer.name}
                    </Link>
                    <span className="flex-none text-xs text-muted-foreground">{farmer.location}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Recent activity</h2>
            {data.recentAudit.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No audit events recorded yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                {data.recentAudit.map((entry) => (
                  <li key={entry.id}>
                    <span className="font-medium text-foreground">{entry.action.replace(/_/g, " ")}</span>
                    <br />
                    {entry.entityType} · {formatDateTime(entry.created_date)}
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="ghost" className="mt-3 w-full justify-start px-0 text-primary">
              <Link to="/admin/activity-log">Open the activity log</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}