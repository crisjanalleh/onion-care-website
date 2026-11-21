import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/components/common/PageHeader";
export const Route = createFileRoute("/_authed/_admin/admin/messages/")({ component: AdminMessagesPage });
function AdminMessagesPage() { return <main className="p-6"><PageHeader title="Messages" /><p className="text-sm text-muted-foreground">No conversation has been loaded.</p></main>; }
