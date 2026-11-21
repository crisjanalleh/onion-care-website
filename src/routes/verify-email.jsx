import { createFileRoute } from "@tanstack/react-router";
import { VerifyEmailPage } from "@/components/auth/VerifyEmailPage";

function VerifyEmailRoute() {
  const { email } = Route.useSearch();
  return <VerifyEmailPage email={email} />;
}

export const Route = createFileRoute("/verify-email")({
  ssr: false,
  validateSearch: (search) => ({ email: typeof search.email === "string" ? search.email : "" }),
  component: VerifyEmailRoute,
});
