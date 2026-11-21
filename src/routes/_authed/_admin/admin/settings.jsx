import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/components/common/PageHeader";
export const Route = createFileRoute("/_authed/_admin/admin/settings")({ component: SettingsPage });
function SettingsPage() { return <main className="p-6"><PageHeader title="Settings" /></main>; }
