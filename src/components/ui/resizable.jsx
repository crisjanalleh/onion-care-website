export function ResizablePanelGroup({ children }) { return <div className="flex">{children}</div>; }
export function ResizablePanel({ children }) { return <div className="min-w-0 flex-1">{children}</div>; }
export function ResizableHandle() { return <div className="w-px bg-border" />; }
