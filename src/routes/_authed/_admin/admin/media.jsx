import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/components/common/PageHeader";
export const Route = createFileRoute("/_authed/_admin/admin/media")({ component: MediaPage });
function MediaPage() { return <main className="p-6"><PageHeader title="Media library" description="No asset metadata has been verified." /></main>; }
