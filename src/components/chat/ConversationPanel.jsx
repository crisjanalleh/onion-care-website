export default function ConversationPanel({ conversation, messages = [] }) {
  return (
    <section className="rounded-xl border bg-card">
      <div className="border-b p-4 font-medium">{conversation?.title ?? "Conversation"}</div>
      <div className="min-h-64 space-y-3 p-4">
        {messages.length ? messages.map((message, index) => <div key={message.id ?? index} className="rounded-lg bg-muted p-3 text-sm">{message.text ?? message.messageText}</div>) : <p className="text-sm text-muted-foreground">No messages available.</p>}
      </div>
    </section>
  );
}
