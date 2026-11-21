import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { listPestsForAdmin, savePestContent } from "@/lib/server/content";

export const Route = createFileRoute("/_authed/_admin/admin/content/pests")({
  component: PestContent,
  head: () => ({ meta: [{ title: "Pest content — OnionCare administration" }] }),
});

function PestContent() {
  const [state, setState] = useState({ loading: true, items: [], error: null });
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    const page = await listPestsForAdmin();
    setState({ loading: false, items: page.items ?? [], error: null });
  }, []);

  useEffect(() => {
    let active = true;
    load().catch((error) => active && setState({ loading: false, items: [], error: error?.message ?? "Unable to load pests." }));
    return () => {
      active = false;
    };
  }, [load]);

  const select = (pest) => {
    setMessage(null);
    setForm({
      id: pest.id,
      name: pest.name,
      summary: pest.summary ?? "",
      managementNotes: pest.managementNotes ?? "",
      contentStatus: pest.contentStatus ?? "draft",
      sourceReference: pest.sourceReference ?? "",
    });
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await savePestContent({
        data: {
          id: form.id,
          summary: form.summary,
          managementNotes: form.managementNotes,
          contentStatus: form.contentStatus,
          sourceReference: form.sourceReference || undefined,
        },
      });
      setMessage("Pest record updated.");
      await load();
    } catch (error) {
      setMessage(error?.message ?? "The record could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Link to="/admin/content" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Content workspace
      </Link>
      <PageHeader
        eyebrow="Content"
        title="Pest records"
        description="Armyworm, leafminer, and thrips. Field signs and management notes are only shown to farmers once published."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <section className="rounded-lg border border-border bg-card">
          <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">Catalogue</h2>
          {state.loading ? (
            <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {state.items.map((pest) => (
                <li key={pest.id}>
                  <button
                    type="button"
                    onClick={() => select(pest)}
                    className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-secondary/60 ${
                      form?.id === pest.id ? "bg-accent/50" : ""
                    }`}
                  >
                    <span className="truncate text-sm font-medium">{pest.name}</span>
                    <StatusBadge status={pest.contentStatus} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          {!form ? (
            <p className="text-sm text-muted-foreground">Select a pest record to edit its content.</p>
          ) : (
            <form onSubmit={save} className="space-y-4">
              <h2 className="text-sm font-semibold">{form.name}</h2>
              <div>
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  value={form.summary}
                  onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
                  rows={3}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="notes">Management notes</Label>
                <Textarea
                  id="notes"
                  value={form.managementNotes}
                  onChange={(event) => setForm((prev) => ({ ...prev, managementNotes: event.target.value }))}
                  rows={7}
                  className="mt-1.5"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="status">Visibility</Label>
                  <select
                    id="status"
                    value={form.contentStatus}
                    onChange={(event) => setForm((prev) => ({ ...prev, contentStatus: event.target.value }))}
                    className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="pending_review">Pending review</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="source">Source reference</Label>
                  <Input
                    id="source"
                    value={form.sourceReference}
                    onChange={(event) => setForm((prev) => ({ ...prev, sourceReference: event.target.value }))}
                    className="mt-1.5"
                  />
                </div>
              </div>
              {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save record"}
              </Button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}