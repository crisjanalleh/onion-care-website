import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/components/common/PageHeader";
export const Route = createFileRoute("/_authed/_admin/admin/content/diseases")({ component: DiseaseContentPage });
function DiseaseContentPage() { return <main className="p-6"><PageHeader title="Disease content" description="Live disease content is unavailable until Firebase access is configured." /></main>; }
