import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/components/common/PageHeader";
export const Route = createFileRoute("/_authed/_farmer/history/")({ component: HistoryPage });
function HistoryPage() { return <main className="p-6"><PageHeader title="Diagnosis history" description="Existing records will appear after live Firebase access is available." /></main>; }
