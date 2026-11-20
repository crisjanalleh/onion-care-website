const db = globalThis.__APP_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Bug, FileClock, FlaskConical, Image as ImageIcon, Loader2 } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";

import { ARTICLE_TYPES } from "@/lib/domain/catalogue";

export const Route = createFileRoute("/_authed/_admin/admin/content/")({
  component: ContentHub,
  head: () => ({ meta: [{ title: "Agricultural content — OnionCare administration" }] }),
});

function ContentHub() {
  const [state, setState] = useState({ loading: true, counts: {}, error: null });

  useEffect(() => {
    let active = true;
    Promise.all([
      ...ARTICLE_TYPES.map(async (type) => [type.id, await db.entities.ContentArticle.count({ contentType: type.id })]),
      db.entities.Disease.count({}),
      db.entities.Pest.count({}),
      db.entities.TreatmentRecommendation.count({}),
      db.entities.MediaAsset.count({}),
      db.entities.ContentArticle.count({ status: "pending_review" }),
    ])
      .then((results) => {
        if (!active) return;
        const counts = {};
        results.slice(0, ARTICLE_TYPES.length).forEach(([id, count]) => {
          counts[id] = count;
        });
        setState({
          loading: false,
          counts: {
            ...counts,
            diseases: results[ARTICLE_TYPES.length],
            pests: results[ARTICLE_TYPES.length + 1],
            recommendations: results[ARTICLE_TYPES.length + 2],
            media: results[ARTICLE_TYPES.length + 3],
            pendingArticles: results[ARTICLE_TYPES.length + 4],
          },
          error: null,
        });
      })
      .catch((error) => active && setState({ loading: false, counts: {}, error: error?.message ?? "Unable to load content counts." }));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Agricultural content workspace"
        description="Draft, review, and publish the material farmers read. Chemical guidance has its own approval gate and cannot be published as approved without a source, a reviewer, and a verified dose."
      />

      {state.loading ? (
        <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading workspace…
        </div>
      ) : state.error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{state.error}</p>
      ) : (
        <>
          <div className="mb-6 rounded-lg border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <FileClock className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Awaiting review</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {state.counts.pendingArticles ?? 0} article(s) are pending review. Nothing pending is visible to
              farmers until it is published.
            </p>
          </div>

          <h2 className="mb-2 text-sm font-semibold">Active ingredient and guide articles</h2>
          <ul className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ARTICLE_TYPES.map((type) => (
              <li key={type.id}>
                <Link
                  to="/admin/content/articles/$contentType"
                  params={{ contentType: type.id }}
                  className="flex h-full flex-col rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-secondary/40"
                >
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h3 className="mt-2.5 text-sm font-semibold">{type.label}</h3>
                  <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">{type.description}</p>
                  <span className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    {state.counts[type.id] ?? 0} article(s)
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <h2 className="mb-2 text-sm font-semibold">Catalogues and reference data</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <li>
              <Link to="/admin/content/diseases" className="flex h-full flex-col rounded-lg border border-border bg-card p-5 hover:bg-secondary/40">
                <FlaskConical className="h-4 w-4 text-primary" />
                <h3 className="mt-2.5 text-sm font-semibold">Disease records</h3>
                <p className="mt-1 text-xs text-muted-foreground">{state.counts.diseases ?? 0} catalogue entries</p>
              </Link>
            </li>
            <li>
              <Link to="/admin/content/pests" className="flex h-full flex-col rounded-lg border border-border bg-card p-5 hover:bg-secondary/40">
                <Bug className="h-4 w-4 text-primary" />
                <h3 className="mt-2.5 text-sm font-semibold">Pest records</h3>
                <p className="mt-1 text-xs text-muted-foreground">{state.counts.pests ?? 0} pest entries</p>
              </Link>
            </li>
            <li>
              <Link to="/admin/content/recommendations" className="flex h-full flex-col rounded-lg border border-border bg-card p-5 hover:bg-secondary/40">
                <FileClock className="h-4 w-4 text-primary" />
                <h3 className="mt-2.5 text-sm font-semibold">Treatment recommendations</h3>
                <p className="mt-1 text-xs text-muted-foreground">{state.counts.recommendations ?? 0} records</p>
              </Link>
            </li>
            <li>
              <Link to="/admin/content/legacy-info" className="flex h-full flex-col rounded-lg border border-border bg-card p-5 hover:bg-secondary/40">
                <ImageIcon className="h-4 w-4 text-primary" />
                <h3 className="mt-2.5 text-sm font-semibold">Legacy information section</h3>
                <p className="mt-1 text-xs text-muted-foreground">Fertilizer and herbicide fields</p>
              </Link>
            </li>
          </ul>
        </>
      )}
    </div>
  );
}