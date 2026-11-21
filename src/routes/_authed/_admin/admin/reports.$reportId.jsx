import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/components/common/PageHeader";
export const Route = createFileRoute("/_authed/_admin/admin/reports/$reportId")({ component: ReportDetailPage });
function ReportDetailPage() { return <main className="p-6"><PageHeader title="Report detail" /></main>; }
