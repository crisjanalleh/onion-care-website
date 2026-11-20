import { cn } from "@/lib/utils";

export default function StatCard({ label, value, hint, icon: Icon, tone = "default", className }) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon ? (
          <span
            className={cn(
              "flex h-8 w-8 flex-none items-center justify-center rounded-md",
              tone === "alert" ? "bg-amber-50 text-amber-900" : "bg-secondary text-primary",
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums leading-none tracking-tight">{value}</p>
      {hint ? <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  );
}