import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, MessagesSquare } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { getFarmerDetail } from "@/lib/server/accounts";
import { startConversationWithFarmer } from "@/lib/server/messaging";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authed/_admin/admin/farmers/$username")({
  component: FarmerDetail,
  head: () => ({ meta: [{ title: "Farmer record — OnionCare administration" }] }),
});

function FarmerDetail() {
  const { username } = Route.useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    let active = true;
    getFarmerDetail({ data: { username } })
      .then((data) => active && setState({ loading: false, data, error: null }))
      .catch((error) => active && setState({ loading: false, data: null, error: error?.message ?? "Unable to load this farmer." }));
    return () => {
      active = false;
    };
  }, [username]);

  const openConversation = async () => {
    setStarting(true);
    try {
      const result = await startConversationWithFarmer({ data: { farmerUsername: username } });
      navigate({ to: "/admin/messages/$conversationId", params: { conversationId: result.conversation.id } });
    } catch (error) {
      setState((prev) => ({ ...prev, error: error?.message ?? "Unable to open the conversation." }));
    } finally {
      setStarting(false);
    }
  };

  if (state.loading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading farmer record…
      </div>
    );
  }

  if (state.error || !state.data) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-destructive">{state.error ?? "Farmer not found."}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/admin/farmers">Back to the directory</Link>
        </Button>
      </div>
    );
  }

  const { profile, recentDiagnoses, recentReports, assignment } = state.data;

  return (
    <div>
      <Link to="/admin/farmers" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Farmer directory
      </Link>

      <PageHeader
        eyebrow={`@${profile.username}`}
        title={profile.name}
        description={`${profile.location} · ${profile.number}`}
        actions={
          <>
            <StatusBadge status={profile.status} />
            <Button onClick={openConversation} disabled={starting} className="gap-2">
              {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessagesSquare className="h-4 w-4" />}
              Open conversation
            </Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Profile</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Username</dt>
              <dd className="font-medium">@{profile.username}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Mobile</dt>
              <dd className="font-medium">{profile.number}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Sex</dt>
              <dd className="font-medium">{profile.sex || "Not set"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Registered</dt>
              <dd className="font-medium">{formatDateTime(profile.created_date)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Location desk</dt>
              <dd className="text-right font-medium">
                {assignment?.adminUsername ?? "Unassigned"}
                <br />
                <span className="text-xs font-normal text-muted-foreground">
                  {assignment?.active ? "active" : "not resolved"}
                </span>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Legacy path</dt>
              <dd className="truncate font-mono text-[0.6875rem]">{profile.legacyPath}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Recent diagnoses</h2>
          {recentDiagnoses.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No saved diagnoses.</p>
          ) : (
            <ul className="mt-3 space-y-2.5 text-sm">
              {recentDiagnoses.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate">{item.diseaseName ?? "Multiple candidates"}</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(item.occurredAt ?? item.created_date)}</span>
                  </span>
                  <StatusBadge status={item.resultType} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Recent reports</h2>
          {recentReports.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No reports submitted.</p>
          ) : (
            <ul className="mt-3 space-y-2.5 text-sm">
              {recentReports.map((report) => (
                <li key={report.id} className="flex items-start justify-between gap-2">
                  <Link to="/admin/reports/$reportId" params={{ reportId: report.id }} className="min-w-0 hover:underline">
                    <span className="block truncate">{report.diseaseName}</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(report.created_date)}</span>
                  </Link>
                  <StatusBadge status={report.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}