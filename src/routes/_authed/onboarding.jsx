import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/components/common/PageHeader";
export const Route = createFileRoute("/_authed/onboarding")({ component: OnboardingPage });
function OnboardingPage() { return <main className="mx-auto max-w-3xl p-6"><PageHeader title="Complete your profile" description="Provide the account details required by your administrator." /></main>; }
