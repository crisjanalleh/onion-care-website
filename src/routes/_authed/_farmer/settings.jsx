import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Languages, LogOut, Loader2, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";
import { useSessionProfile } from "@/hooks/useSessionProfile";
import { updateMyProfile } from "@/lib/server/accounts";

export const Route = createFileRoute("/_authed/_farmer/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — OnionCare" }] }),
});

const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "fil", label: "Filipino" },
];

function SettingsPage() {
  const { logout, user } = useAuth();
  const { profile, loading } = useSessionProfile();
  const [language, setLanguage] = useState("en");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (profile?.language) setLanguage(profile.language);
  }, [profile]);

  const saveLanguage = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await updateMyProfile({ data: { name: profile?.name ?? "", sex: profile?.sex ?? "", language } });
      setSaved(true);
    } catch (err) {
      setError(err?.message ?? "Your preference could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow="Settings"
        title="Account settings"
        description="Your language preference is stored on your account, so it follows you to any device."
      />

      {loading ? (
        <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading settings…
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Languages className="h-4 w-4 text-primary" /> Language
            </h2>
            <div className="mt-3">
              <Label htmlFor="language" className="sr-only">
                Preferred language
              </Label>
              <select
                id="language"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-64"
              >
                {LANGUAGES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Interface text is currently published in English. Your preference is saved for the
                translated guidance as it is released.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Button onClick={saveLanguage} disabled={saving}>
                {saving ? "Saving…" : "Save preference"}
              </Button>
              {saved ? (
                <span className="flex items-center gap-1.5 text-sm text-emerald-800">
                  <Check className="h-4 w-4" /> Saved
                </span>
              ) : null}
              {error ? <span className="text-sm text-destructive">{error}</span> : null}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-primary" /> Account
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Signed in as</dt>
                <dd className="font-medium">{user?.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Username</dt>
                <dd className="font-medium">@{profile?.username}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium capitalize">{profile?.status ?? "active"}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Password changes and sign-in security are handled by the OnionCare sign-in page. Use
              “Forgot password” there if you need to reset your password.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link to="/forgot-password">Reset password</Link>
              </Button>
              <Button variant="ghost" className="gap-2" onClick={() => logout()}>
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Notifications</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              In-app notifications are always on: you will be notified when your administrator replies,
              when a report status changes, and when guidance relevant to your crops is published. They
              appear in the bell at the top of every page.
            </p>
            <Button asChild variant="outline" className="mt-3">
              <Link to="/notifications">Open notifications</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}