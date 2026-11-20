const db = globalThis.__APP_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ImageOff, Loader2, MessagesSquare } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import ArticleBody from "@/components/content/ArticleBody";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";

import { PESTS } from "@/lib/domain/catalogue";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authed/_farmer/library/pests/$pestId")({
  component: PestDetail,
  head: () => ({ meta: [{ title: "Pest — OnionCare" }] }),
});

function PestDetail() {
  const { pestId } = Route.useParams();
  const fallback = PESTS.find((pest) => pest.id === pestId);
  const [state, setState] = useState({ loading: true, pest: null, error: null });

  useEffect(() => {
    let active = true;
    db.entities.Pest.filter({ pestId }, { limit: 1 })
      .then((page) => active && setState({ loading: false, pest: (page.items ?? [])[0] ?? null, error: null }))
      .catch((error) => active && setState({ loading: false, pest: null, error: error?.message ?? "Unable to load this pest." }));
    return () => {
      active = false;
    };
  }, [pestId]);

  if (!fallback) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm">That pest is not in the catalogue.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/library/pests">Back to the pest library</Link>
        </Button>
      </div>
    );
  }

  const record = state.pest;
  const name = record?.name ?? fallback.name;

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/library/pests" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Pest library
      </Link>

      <PageHeader
        eyebrow="Pest library"
        title={name}
        description={record?.summary ?? fallback.summary}
        actions={<StatusBadge status={record?.contentStatus ?? "draft"} />}
      />

      {state.loading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">What to look for</h2>
          {record?.keySigns?.length ? (
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {record.keySigns.map((sign) => (
                <li key={sign} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-primary" />
                  {sign}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Field signs for this pest have not been entered yet. An administrator can add them from the
              content workspace.
            </p>
          )}
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Reference image</h2>
          {record?.imageUrl && record?.imageApproved ? (
            <div className="mt-3 overflow-hidden rounded-md border border-border">
              <Image src={record.imageUrl} alt={`Reference image for ${name}`} className="aspect-[4/3] w-full" fittingType="fill" />
            </div>
          ) : (
            <div className="mt-3 flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-secondary/50 px-4 py-10 text-center">
              <ImageOff className="h-6 w-6 text-muted-foreground" strokeWidth={1.6} />
              <p className="mt-2 text-sm font-medium">Image not yet available</p>
              <p className="mt-1 max-w-[16rem] text-xs leading-relaxed text-muted-foreground">
                No reviewed photograph has been approved for this pest yet.
              </p>
            </div>
          )}
        </section>
      </div>

      <section className="mt-5 rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Management notes</h2>
        <ArticleBody text={record?.managementNotes} className="mt-3" />
        {!record?.managementNotes ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Management guidance for this pest is still being reviewed. Nothing is shown rather than
            publishing unverified advice.
          </p>
        ) : null}
        <p className="mt-3 text-xs text-muted-foreground">
          {record?.lastReviewedAt ? `Last reviewed ${formatDate(record.lastReviewedAt)}` : "Not yet reviewed"}
          {record?.sourceReference ? ` · Source: ${record.sourceReference}` : ""}
        </p>
      </section>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild variant="outline" className="gap-2">
          <Link to="/messages">
            <MessagesSquare className="h-4 w-4" /> Ask my administrator
          </Link>
        </Button>
        <Button asChild variant="ghost">
          <Link to="/library">Back to the library</Link>
        </Button>
      </div>
    </div>
  );
}