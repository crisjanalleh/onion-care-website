export function Command({ children, className = "" }) { return <div className={className}>{children}</div>; }
export function CommandEmpty({ children }) { return <div className="p-3 text-sm text-muted-foreground">{children}</div>; }
export function CommandGroup({ children }) { return <div>{children}</div>; }
export function CommandInput(props) { return <input className="h-10 w-full border-b px-3 text-sm" {...props} />; }
export function CommandItem({ children, ...props }) { return <button type="button" className="w-full px-3 py-2 text-left text-sm" {...props}>{children}</button>; }
export function CommandList({ children }) { return <div>{children}</div>; }
