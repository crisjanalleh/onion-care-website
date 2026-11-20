import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import ArticleCollection from "@/components/library/ArticleCollection";
import { Button } from "@/components/ui/button";
import { ARTICLE_TYPES } from "@/lib/domain/catalogue";

const LEGACY_FIELDS = {
  fertilizer: [
    "fertilizer_content",
    "nitrogen_content",
    "phosphorus_content",
    "potassium_content",
    "sulphur_content",
    "calcium_content",
    "magnesium_content",
  ],
  herbicide: [
    "herbicides_content",
    "glyphosate_content",
    "oxyfluorfen_content",
    "pendimethalin_content",
    "flumioxazin_content",
  ],
};

export const Route = createFileRoute("/_authed/_farmer/library/inputs/$category")({
  component: InputCategory,
  head: () => ({ meta: [{ title: "Active ingredients — OnionCare" }] }),
});

function InputCategory() {
  const { category } = Route.useParams();
  const type = ARTICLE_TYPES.find((item) => item.id === category);

  if (!type) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm">That category is not part of the library.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/library/inputs">Back to active ingredients</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Link to="/library/inputs" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Active ingredients
      </Link>
      <PageHeader eyebrow="Library" title={type.label} description={type.description} />
      <ArticleCollection contentType={type.id} legacyFields={LEGACY_FIELDS[type.id] ?? []} />
    </div>
  );
}