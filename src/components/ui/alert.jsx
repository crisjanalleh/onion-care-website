export function Alert({ children, className = "" }) { return <div role="alert" className={`rounded-lg border p-4 ${className}`}>{children}</div>; }
export function AlertTitle({ children }) { return <h3 className="font-semibold">{children}</h3>; }
export function AlertDescription({ children }) { return <div className="text-sm text-muted-foreground">{children}</div>; }
