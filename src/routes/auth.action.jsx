import { createFileRoute } from "@tanstack/react-router";
import { AuthActionPage } from "@/components/auth/AuthActionPage";

export const Route = createFileRoute("/auth/action")({
  ssr: false,
  component: AuthActionPage,
});
