export function Avatar({ children, className = "" }) { return <div className={`relative inline-flex size-10 overflow-hidden rounded-full ${className}`}>{children}</div>; }
export function AvatarImage(props) { return <img className="size-full object-cover" {...props} />; }
export function AvatarFallback({ children }) { return <span className="flex size-full items-center justify-center bg-muted text-sm">{children}</span>; }
