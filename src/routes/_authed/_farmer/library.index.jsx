import { createFileRoute, Link } from "@tanstack/react-router";
import PageHeader from "@/components/common/PageHeader";
export const Route = createFileRoute("/_authed/_farmer/library/")({ component: LibraryPage });
function LibraryPage() { return <main className="p-6"><PageHeader title="Information library" /><div className="flex gap-3"><Link to="/library/diseases" className="underline">Diseases</Link><Link to="/library/pests" className="underline">Pests</Link></div></main>; }
