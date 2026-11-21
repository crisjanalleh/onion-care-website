export default function AdminShell({ children }) {
  return <div className="min-h-screen"><aside className="sr-only">Administrator navigation</aside><main className="mx-auto max-w-7xl p-6">{children}</main></div>;
}
