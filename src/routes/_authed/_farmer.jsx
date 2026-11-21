import { createFileRoute, redirect } from "@tanstack/react-router";
import FarmerShell from "@/components/layout/FarmerShell";

export const Route = createFileRoute("/_authed/_farmer")({
  beforeLoad: ({ context }) => {
    if (context.user && context.user.role === "admin") {
      throw redirect({ to: "/admin" });
    }
    if (context.user?.role !== "farmer") {
      throw redirect({ to: "/login" });
    }
  },
  component: FarmerShell,
});