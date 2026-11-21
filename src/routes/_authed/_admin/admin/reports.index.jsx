import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, Loader2, Search } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { getDiseaseReportCounts, listReports } from "@/lib/server/reports";
import { DISEASES, LOCATION_LABELS, REPORT_STATUSES } from "@/lib/domain/catalogue";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authed/_admin/admin/reports/")({
  component: ReportQueue,
  head: () => ({ meta: [{ title: "Disease reports — OnionCare administration" }] }),
});

function ReportQueue() {
  const [filters, setFilters] = useState({ search: "", status: "", diseaseId: "", location: "" });
  const [state, setState] = useState({ loading: true, items: [], next: null, error: null });
  const [diseaseCounts, setDiseaseCounts] = useState([]);
  const [diseaseCountsError, setDiseaseCountsError] = useState("");

  useEffect(() => {
    getDiseaseReportCounts()
      .then((page) => setDiseaseCounts(page.items ?? []))
      .catch((error) => setDiseaseCountsError(error?.message ?? "Unable to load disease report counts."));
  }, []);

  const load = useCallback(
    async (cursor) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const page = await listReports({
          data: {
            search: filters.search || undefined,
            status: filters.status || undefined,
            diseaseId: filters.diseaseId || undefined,
            location: filters.location || undefined,
            limit: 25,
            ...(cursor ? { cursor } : {}),
          },
        });
        setState((prev) => ({
          loading: false,
          items: cursor ? [...prev.items, ...page.items] : page.items,
          next: page.has_more ? page.next_cursor : null,
          error: null,
        }));
      } catch (error) {
        setState((prev) => ({ ...prev, loading: false, error: error?.message ?? "Unable to load reports." }));
      }
    },
    [filters.search, filters.status, filters.diseaseId, filters.location],
  );

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        eyebrow="Reports"
        title="Disease report queue"
        description="Opening a report does not clear its new count. A report stops counting as new only when its status actually changes."
      />

      {diseaseCountsError ? <p className="mb-4 text-sm text-destructive">{diseaseCountsError}</p> : null}
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {DISEASES.map((disease) => {
          const record = diseaseCounts.find((item) => item.diseaseId === disease.id);
          const newCount = record?.newReportCount ?? 0;
          return (
            <button
              key={disease.id}
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, diseaseId: prev.diseaseId === disease.id ? "" : disease.id }))}
              className={`rounded-lg border p-3 text-left transition-colors ${
                filters.diseaseId === disease.id ? "border-primary bg-accent" : "border-border bg-card hover:bg-secondary/60"
              }`}
            >
              <p className="truncate text-xs font-medium">{disease.legacyLabel}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums leading-none">{record?.reportCount ?? 0}</p>
              <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">{newCount} new</p>
            </button>
          );
        })}
      </div>

      <div className="mb-5 grid gap-2 lg:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            placeholder="Search by farmer, disease, or location"
            className="pl-9"
            aria-label="Search reports"
          />
        </div>
        <select
          value={filters.status}
          onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          aria-label="Filter by status"
        >
          <option value="">Any status</option>
          {REPORT_STATUSES.map((status) => (
            <option key={status.id} value={status.id}>
              {status.label}
            </option>
          ))}
        </select>
        <select
          value={filters.diseaseId}
          onChange={(event) => setFilters((prev) => ({ ...prev, diseaseId: event.target.value }))}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          aria-label="Filter by disease"
        >
          <option value="">Any disease</option>
          {DISEASES.map((disease) => (
            <option key={disease.id} value={disease.id}>
              {disease.legacyLabel}
            </option>
          ))}
        </select>
        <select
          value={filters.location}
          onChange={(event) => setFilters((prev) => ({ ...prev, location: event.target.value }))}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          aria-label="Filter by location"
        >
          <option value="">Any location</option>
          {LOCATION_LABELS.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
      </div>

      {state.loading && state.items.length === 0 ? (
        <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading reports…
        </div>
      ) : state.error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{state.error}</p>
      ) : state.items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No reports in this view"
          description="Change the filters, or wait for a farmer to submit a report. Reports with an unrecognised disease label are kept in the queue rather than discarded."
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full min-w-[42rem] text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Report</th>
                  <th className="px-4 py-3 font-medium">Farmer</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {state.items.map((report) => (
                  <tr key={report.id} className="transition-colors hover:bg-secondary/40">
                    <td className="px-4 py-3">
                      <Link to="/admin/reports/$reportId" params={{ reportId: report.id }} className="font-medium hover:underline">
                        {report.diseaseName}
                      </Link>
                      <p className="font-mono text-[0.6875rem] text-muted-foreground">{report.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-4 py-3">
                      {report.name}
                      <p className="text-xs text-muted-foreground">@{report.farmerUsername}</p>
                    </td>
                    <td className="px-4 py-3">{report.location}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(report.created_date)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={report.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {state.next ? (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={() => load(state.next)} disabled={state.loading}>
                {state.loading ? "Loading…" : "Load more"}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}