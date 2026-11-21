import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/components/common/PageHeader";
export const Route = createFileRoute("/_authed/_admin/admin/content/legacy-info")({ component: LegacyInfoPage });
function LegacyInfoPage() { return <main className="p-6"><PageHeader title="Legacy agricultural information" description="Values will be loaded from information/info_section." /></main>; }
