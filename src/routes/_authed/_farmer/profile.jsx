import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Loader2, Lock } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSessionProfile } from "@/hooks/useSessionProfile";
import { updateMyProfile } from "@/lib/server/accounts";
import { resolveMyAdmin } from "@/lib/server/accounts";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authed/_farmer/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile — OnionCare" }] }),
});

const SEX_OPTIONS = ["Prefer not to say", "Female", "Male"];

function ProfilePage() {
  const { profile, loading } = useSessionProfile();
  const [form, setForm] = useState({ name: "", sex: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [assignment, setAssignment] = useState(null);

  useEffect(() => {
    if (profile) setForm({ name: profile.name ?? "", sex: profile.sex ?? "" });
  }, [profile]);

  useEffect(() => {
    resolveMyAdmin()
      .then((result) => setAssignment(result.assignment))
      .catch(() => setAssignment(null));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading your profile…
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm">Your profile could not be loaded. Sign in again to continue.</p>
      </div>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await updateMyProfile({ data: { name: form.name, sex: form.sex, language: profile.language ?? "en" } });
      setMessage("Your profile has been updated.");
    } catch (err) {
      setError(err?.message ?? "Your profile could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const completeness = [profile.name, profile.number, profile.sex, profile.location].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Profile"
        title={profile.name}
        description={`@${profile.username} · ${profile.location}`}
        actions={<StatusBadge status={profile.status} />}
      />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Editable details</h2>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="mt-1.5"
                minLength={10}
                maxLength={50}
              />
              <p className="mt-1 text-xs text-muted-foreground">10 to 50 characters, as it should appear on reports.</p>
            </div>
            <div>
              <Label htmlFor="sex">Sex</Label>
              <select
                id="sex"
                value={form.sex}
                onChange={(event) => setForm((prev) => ({ ...prev, sex: event.target.value }))}
                className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Not set</option>
                {SEX_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {message ? (
              <p className="flex items-center gap-2 rounded-md bg-emerald-50 p-2.5 text-sm text-emerald-900">
                <Check className="h-4 w-4" /> {message}
              </p>
            ) : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>

        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Lock className="h-4 w-4 text-muted-foreground" /> Managed by your administrator
            </h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Username</dt>
                <dd className="font-medium">@{profile.username}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Mobile number</dt>
                <dd className="font-medium">{profile.number}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Location</dt>
                <dd className="font-medium">{profile.location}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Registered</dt>
                <dd className="font-medium">{formatDate(profile.created_date)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Your username identifies your records and cannot be changed. A new mobile number or location
              must be verified by your administrator, because your location decides which administrator
              receives your reports and messages.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Profile completeness</h2>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{Math.round((completeness / 4) * 100)}%</p>
            <p className="mt-1 text-xs text-muted-foreground">Name, number, sex, and location.</p>
            <div className="mt-3 border-t border-border pt-3 text-sm">
              <p className="text-muted-foreground">Assigned administrator</p>
              <p className="mt-0.5 font-medium">
                {assignment ? assignment.adminUsername : "Not assigned yet"}
                {assignment?.source === "support_fallback" ? (
                  <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[0.6875rem] text-amber-900">
                    support routing
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}