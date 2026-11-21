export function Pagination({ children }) { return <nav aria-label="Pagination">{children}</nav>; }
export function PaginationContent({ children }) { return <div className="flex items-center gap-1">{children}</div>; }
export function PaginationItem({ children }) { return <div>{children}</div>; }
export function PaginationLink({ children, ...props }) { return <a className="rounded px-3 py-2" {...props}>{children}</a>; }
export function PaginationPrevious(props) { return <PaginationLink {...props}>Previous</PaginationLink>; }
export function PaginationNext(props) { return <PaginationLink {...props}>Next</PaginationLink>; }
