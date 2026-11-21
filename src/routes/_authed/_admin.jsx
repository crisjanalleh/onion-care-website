import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/_authed/_admin")({
  beforeLoad: ({ context }) => {
    if (context.user?.role !== "admin") throw redirect({ to: "/dashboard" });
  },
  component: AdminLayout,
});
function AdminLayout() { return <Outlet />; }
