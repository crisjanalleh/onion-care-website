import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/components/common/PageHeader";
export const Route = createFileRoute("/_authed/_farmer/library/diseases/$diseaseId")({ component: DiseaseDetailPage });
function DiseaseDetailPage() { return <main className="p-6"><PageHeader title="Disease information" description="Verified reference material is not yet available." /></main>; }
