export function DropdownMenu({ children }) { return <div>{children}</div>; }
export function DropdownMenuTrigger({ children }) { return <>{children}</>; }
export function DropdownMenuContent({ children, className = "" }) { return <div className={className}>{children}</div>; }
export function DropdownMenuItem({ children, ...props }) { return <button type="button" className="block w-full px-3 py-2 text-left" {...props}>{children}</button>; }
export function DropdownMenuLabel({ children }) { return <div className="px-3 py-2 text-xs font-semibold">{children}</div>; }
export function DropdownMenuSeparator() { return <hr />; }
