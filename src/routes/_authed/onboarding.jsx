import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, UserRound } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authQuery } from "@/lib/AuthContext";
import { registerFarmerProfile } from "@/lib/server/accounts";
import { LOCATION_LABELS } from "@/lib/domain/catalogue";

export const Route = createFileRoute("/_authed/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", number: "", username: "", sex: "", location: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { profile } = await registerFarmerProfile({ data: form });
      const current = queryClient.getQueryData(authQuery.queryKey);
      if (current) queryClient.setQueryData(authQuery.queryKey, { ...current, profile });
      await navigate({ to: "/dashboard" });
    } catch (submitError) {
      setError(submitError?.message ?? "The profile could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <PageHeader
        eyebrow="Account setup"
        title="Complete your farmer profile"
        description={`Signed in as ${user?.email ?? "your verified email"}. These details help OnionCare connect your reports to the right local administrator.`}
      />
      <form onSubmit={submit} className="space-y-5 rounded-lg border border-border bg-card p-5">
        <div className="space-y-2">
          <Label htmlFor="farmer-name">Full name</Label>
          <Input id="farmer-name" autoComplete="name" value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} minLength={10} maxLength={50} required />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="farmer-username">Username</Label>
            <Input id="farmer-username" autoComplete="username" value={form.username} onChange={(event) => setForm((value) => ({ ...value, username: event.target.value.toLowerCase() }))} minLength={3} maxLength={24} pattern="[a-z0-9_]+" required />
            <p className="text-xs text-muted-foreground">3–24 lowercase letters, numbers, or underscores.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="farmer-phone">Mobile number</Label>
            <Input id="farmer-phone" type="tel" autoComplete="tel" value={form.number} onChange={(event) => setForm((value) => ({ ...value, number: event.target.value }))} placeholder="09XXXXXXXXX" required />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="farmer-location">Service location</Label>
            <select id="farmer-location" value={form.location} onChange={(event) => setForm((value) => ({ ...value, location: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" required>
              <option value="">Choose your location</option>
              {LOCATION_LABELS.map((location) => <option key={location} value={location}>{location}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="farmer-sex">Sex <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <select id="farmer-sex" value={form.sex} onChange={(event) => setForm((value) => ({ ...value, sex: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>
        </div>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={busy} className="h-11 w-full sm:w-auto">
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserRound className="mr-2 h-4 w-4" />}
          {busy ? "Saving profile…" : "Continue to OnionCare"}
        </Button>
      </form>
    </main>
  );
}
