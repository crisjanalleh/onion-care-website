import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/components/common/PageHeader";
export const Route = createFileRoute("/_authed/_farmer/help")({ component: HelpPage });
function HelpPage() { return <main className="p-6"><PageHeader title="Help" /></main>; }
