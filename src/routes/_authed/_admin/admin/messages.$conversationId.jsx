import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import ConversationPanel from "@/components/chat/ConversationPanel";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { getConversation } from "@/lib/server/messaging";

export const Route = createFileRoute("/_authed/_admin/admin/messages/$conversationId")({
  component: AdminConversation,
  head: () => ({ meta: [{ title: "Conversation — OnionCare administration" }] }),
});

function AdminConversation() {
  const { conversationId } = Route.useParams();
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, conversation: null, error: null });

  useEffect(() => {
    let active = true;
    setState({ loading: true, conversation: null, error: null });
    getConversation({ data: { conversationId } })
      .then((result) => active && setState({ loading: false, conversation: result.conversation, error: null }))
      .catch((error) => active && setState({ loading: false, conversation: null, error: error?.message ?? "Unable to open this conversation." }));
    return () => {
      active = false;
    };
  }, [conversationId]);

  return (
    <div>
      <Link to="/admin/messages" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Inbox
      </Link>

      {state.loading ? (
        <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Opening conversation…
        </div>
      ) : state.error ? (
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-destructive">{state.error}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/admin/messages">Back to the inbox</Link>
          </Button>
        </div>
      ) : (
        <>
          <PageHeader
            eyebrow={state.conversation.location}
            title={state.conversation.farmerName || state.conversation.farmerUsername}
            description={`@${state.conversation.farmerUsername} · thread ${state.conversation.legacyPath}`}
            actions={
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/farmers/$username" params={{ username: state.conversation.farmerUsername }}>
                  Farmer record
                </Link>
              </Button>
            }
          />
          <ConversationPanel
            conversationId={conversationId}
            currentUserId={user?.id}
            heading={state.conversation.farmerName || state.conversation.farmerUsername}
            subheading={`${state.conversation.location} · replies are delivered instantly`}
            placeholder="Write a reply to this farmer…"
          />
        </>
      )}
    </div>
  );
}