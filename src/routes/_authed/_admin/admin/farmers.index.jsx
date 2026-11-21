import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/components/common/PageHeader";
export const Route = createFileRoute("/_authed/_admin/admin/farmers/")({ component: FarmersPage });
function FarmersPage() { return <main className="p-6"><PageHeader title="Farmers" description="Existing accounts will appear after live read access is available." /></main>; }
