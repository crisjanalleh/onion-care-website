import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/components/common/PageHeader";
export const Route = createFileRoute("/_authed/_farmer/library/pests/")({ component: PestsPage });
function PestsPage() { return <main className="p-6"><PageHeader title="Pest information" /></main>; }
