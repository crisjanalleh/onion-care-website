import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/components/common/PageHeader";
export const Route = createFileRoute("/_authed/_farmer/planner")({ component: PlannerPage });
function PlannerPage() { return <main className="p-6"><PageHeader title="Crop planner" /></main>; }
