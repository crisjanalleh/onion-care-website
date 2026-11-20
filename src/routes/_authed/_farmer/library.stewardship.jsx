import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import ArticleCollection from "@/components/library/ArticleCollection";

export const Route = createFileRoute("/_authed/_farmer/library/stewardship")({
  component: StewardshipGuide,
  head: () => ({ meta: [{ title: "Stewardship guide — OnionCare" }] }),
});

function StewardshipGuide() {
  return (
    <div>
      <Link to="/library" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Library
      </Link>
      <PageHeader
        eyebrow="Library"
        title="Stewardship guide"
        description="Responsible input use, storage, and record keeping, published after review."
      />
      <ArticleCollection contentType="stewardship" />
    </div>
  );
}