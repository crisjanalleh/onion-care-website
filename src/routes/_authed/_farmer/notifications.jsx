import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/components/common/PageHeader";
import NotificationsList from "@/components/notifications/NotificationsList";

export const Route = createFileRoute("/_authed/_farmer/notifications")({
  component: NotificationsPage,
  head: () => ({ meta: [{ title: "Notifications — OnionCare" }] }),
});

function NotificationsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Notifications"
        title="Updates"
        description="Replies from your administrator, report status changes, and newly reviewed guidance."
      />
      <NotificationsList emptyDescription="You will see a message here when your administrator replies or a report status changes." />
    </div>
  );
}