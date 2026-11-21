export default function NotificationsList({ notifications = [] }) {
  return <div className="space-y-3">{notifications.length ? notifications.map((item, index) => <div key={item.id ?? index} className="rounded-lg border p-3"><p className="font-medium">{item.title}</p>{item.body ? <p className="text-sm text-muted-foreground">{item.body}</p> : null}</div>) : <p className="text-sm text-muted-foreground">No notifications.</p>}</div>;
}
