import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { Input } from "@/components/ui/input";
import DiseaseReferenceImage from "@/components/media/DiseaseReferenceImage";
import { listDiseaseImages } from "@/lib/server/media";
import { DISEASES, SYMPTOM_GROUP_BY_ID } from "@/lib/domain/catalogue";

export const Route = createFileRoute("/_authed/_farmer/library/diseases/")({
  component: DiseaseLibrary,
  loader: () => listDiseaseImages(),
  head: () => ({ meta: [{ title: "Disease library — OnionCare" }] }),
});

function DiseaseLibrary() {
  const images = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();
  const results = DISEASES.filter((disease) =>
    term
      ? `${disease.legacyLabel} ${disease.summary} ${disease.keySigns.join(" ")}`.toLowerCase().includes(term)
      : true,
  );

  return (
    <div>
      <PageHeader
        eyebrow="Library"
        title="Disease library"
        description="The eleven catalogue entries preserved from the original field application, including the two separate anthracnose records."
      />

      <div className="relative mb-5 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search diseases or signs"
          className="pl-9"
          aria-label="Search diseases"
        />
      </div>

      {results.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
          No disease matches “{query}”.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {results.map((disease) => (
            <li key={disease.id}>
              <Link
                to="/library/diseases/$diseaseId"
                params={{ diseaseId: disease.id }}
                className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/50 hover:bg-secondary/50"
              >
                <DiseaseReferenceImage
                  diseaseName={disease.legacyLabel}
                  asset={images[disease.id] ?? null}
                  compact
                  className="rounded-none border-0 border-b border-border"
                />
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-sm font-semibold">{disease.legacyLabel}</h2>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">{disease.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {disease.symptomGroups.map((group) => (
                      <span key={group} className="rounded-full bg-secondary px-2 py-0.5 text-[0.6875rem] text-secondary-foreground">
                        {SYMPTOM_GROUP_BY_ID[group]?.label ?? group}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}