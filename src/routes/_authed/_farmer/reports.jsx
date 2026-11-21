import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/components/common/PageHeader";
export const Route = createFileRoute("/_authed/_farmer/reports")({ component: ReportsPage });
function ReportsPage() { return <main className="p-6"><PageHeader title="My reports" description="Existing reports will appear after live access is available." /></main>; }
