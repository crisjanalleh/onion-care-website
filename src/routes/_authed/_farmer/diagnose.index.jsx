import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/components/common/PageHeader";
export const Route = createFileRoute("/_authed/_farmer/diagnose/")({ component: DiagnosePage });
function DiagnosePage() { return <main className="p-6"><PageHeader title="Diagnose an onion problem" description="Use the diagnostic checklist when it is available." /></main>; }
