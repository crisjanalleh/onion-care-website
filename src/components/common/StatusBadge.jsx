export default function StatusBadge({ status, children, className = "" }) {
  const label = children ?? String(status ?? "").replaceAll("_", " ");
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>{label}</span>;
}
