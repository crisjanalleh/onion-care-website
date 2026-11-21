import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/components/common/PageHeader";
export const Route = createFileRoute("/_authed/_admin/admin/activity-log")({ component: ActivityLogPage });
function ActivityLogPage() { return <main className="p-6"><PageHeader title="Activity log" /><p className="text-sm text-muted-foreground">No audit activity has been loaded.</p></main>; }
