import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import ArticleCollection from "@/components/library/ArticleCollection";

export const Route = createFileRoute("/_authed/_farmer/library/cropping")({
  component: CroppingGuide,
  head: () => ({ meta: [{ title: "Cropping guide — OnionCare" }] }),
});

function CroppingGuide() {
  return (
    <div>
      <Link to="/library" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Library
      </Link>
      <PageHeader
        eyebrow="Library"
        title="Cropping guide"
        description="Season planning and field practice, published by an administrator after review."
      />
      <ArticleCollection contentType="cropping" />
    </div>
  );
}