export function Dialog({ children }) { return <>{children}</>; }
export function DialogTrigger({ children }) { return <>{children}</>; }
export function DialogContent({ children, className = "" }) { return <div className={`rounded-xl border bg-card p-6 ${className}`}>{children}</div>; }
export function DialogHeader({ children }) { return <div className="mb-4">{children}</div>; }
export function DialogFooter({ children }) { return <div className="mt-4 flex justify-end gap-2">{children}</div>; }
export function DialogTitle({ children }) { return <h2 className="text-lg font-semibold">{children}</h2>; }
export function DialogDescription({ children }) { return <p className="text-sm text-muted-foreground">{children}</p>; }
