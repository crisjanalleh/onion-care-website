export function Breadcrumb({ children }) { return <nav aria-label="Breadcrumb">{children}</nav>; }
export function BreadcrumbList({ children }) { return <ol className="flex items-center gap-2">{children}</ol>; }
export function BreadcrumbItem({ children }) { return <li className="flex items-center gap-2">{children}</li>; }
export function BreadcrumbLink({ children, ...props }) { return <a {...props}>{children}</a>; }
export function BreadcrumbSeparator() { return <span aria-hidden="true">/</span>; }
