import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/components/common/PageHeader";
export const Route = createFileRoute("/_authed/_farmer/library/inputs/")({ component: InputsPage });
function InputsPage() { return <main className="p-6"><PageHeader title="Agricultural inputs" /></main>; }
