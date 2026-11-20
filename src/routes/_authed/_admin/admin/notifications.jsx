import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/components/common/PageHeader";
import NotificationsList from "@/components/notifications/NotificationsList";

export const Route = createFileRoute("/_authed/_admin/admin/notifications")({
  component: AdminNotifications,
  head: () => ({ meta: [{ title: "Notifications — OnionCare administration" }] }),
});

function AdminNotifications() {
  return (
    <div>
      <PageHeader
        eyebrow="Notifications"
        title="Administration notifications"
        description="New farmer reports, incoming messages, and content review tasks addressed to your account."
      />
      <NotificationsList emptyDescription="New reports and farmer messages appear here." />
    </div>
  );
}