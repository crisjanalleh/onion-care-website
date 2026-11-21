import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { listArticlesForAdmin, saveArticle } from "@/lib/server/content";
import { ARTICLE_TYPES } from "@/lib/domain/catalogue";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authed/_admin/admin/content/articles/$contentType")({
  component: ArticleWorkspace,
  head: () => ({ meta: [{ title: "Article workspace — OnionCare administration" }] }),
});

const EMPTY = { id: null, title: "", summary: "", body: "", sourceReference: "", status: "draft" };

function ArticleWorkspace() {
  const { contentType } = Route.useParams();
  const type = ARTICLE_TYPES.find((item) => item.id === contentType);
  const [state, setState] = useState({ loading: true, items: [], error: null });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    const page = await listArticlesForAdmin({ data: { contentType } });
    setState({ loading: false, items: page.items ?? [], error: null });
  }, [contentType]);

  useEffect(() => {
    let active = true;
    load().catch((error) => active && setState({ loading: false, items: [], error: error?.message ?? "Unable to load articles." }));
    return () => {
      active = false;
    };
  }, [load]);

  if (!type) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm">Unknown content type.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/admin/content">Back to the content workspace</Link>
        </Button>
      </div>
    );
  }

  const select = (article) => {
    setMessage(null);
    setForm({
      id: article.id,
      title: article.title ?? "",
      summary: article.summary ?? "",
      body: article.body ?? "",
      sourceReference: article.sourceReference ?? "",
      status: article.status ?? "draft",
    });
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await saveArticle({
        data: {
          id: form.id ?? undefined,
          contentType,
          title: form.title,
          summary: form.summary || undefined,
          body: form.body || undefined,
          sourceReference: form.sourceReference || undefined,
          status: form.status,
        },
      });
      setMessage(form.status === "published" ? "Article published." : "Article saved.");
      setForm(EMPTY);
      await load();
    } catch (error) {
      setMessage(error?.message ?? "The article could not be saved.");
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
        title={type.label}
        description="Drafts stay hidden from farmers. Publishing records a review date and an audit event."
        actions={
          <Button variant="outline" onClick={() => setForm(EMPTY)} className="gap-2">
            <Plus className="h-4 w-4" /> New article
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <section className="rounded-lg border border-border bg-card">
          <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">Articles</h2>
          {state.loading ? (
            <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : state.error ? (
            <p className="px-4 py-4 text-sm text-destructive">{state.error}</p>
          ) : state.items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">No articles in this category yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {state.items.map((article) => (
                <li key={article.id}>
                  <button
                    type="button"
                    onClick={() => select(article)}
                    className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-secondary/60 ${
                      form.id === article.id ? "bg-accent/50" : ""
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{article.title}</span>
                      <StatusBadge status={article.status} />
                    </span>
                    <span className="text-xs text-muted-foreground">
                      v{article.version} · {formatDateTime(article.updated_date)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <form onSubmit={save} className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">{form.id ? "Edit article" : "New article"}</h2>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                className="mt-1.5"
                required
                minLength={3}
              />
            </div>
            <div>
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                value={form.summary}
                onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
                rows={2}
                maxLength={400}
                className="mt-1.5"
                placeholder="One or two sentences shown in the list."
              />
            </div>
            <div>
              <Label htmlFor="body">Body</Label>
              <Textarea
                id="body"
                value={form.body}
                onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
                rows={10}
                className="mt-1.5 font-mono text-[0.8125rem]"
                placeholder={"Plain text. Separate paragraphs with a blank line.\nStart a line with - for a bullet."}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="source">Source reference</Label>
                <Input
                  id="source"
                  value={form.sourceReference}
                  onChange={(event) => setForm((prev) => ({ ...prev, sourceReference: event.target.value }))}
                  className="mt-1.5"
                  placeholder="Publication, edition, or authority"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                  className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="pending_review">Pending review</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : form.status === "published" ? "Save and publish" : "Save draft"}
              </Button>
              {form.id ? (
                <Button type="button" variant="ghost" onClick={() => setForm(EMPTY)}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}