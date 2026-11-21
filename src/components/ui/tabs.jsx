export function Tabs({ children }) { return <div>{children}</div>; }
export function TabsList({ children }) { return <div className="flex gap-1">{children}</div>; }
export function TabsTrigger({ children }) { return <button type="button">{children}</button>; }
export function TabsContent({ children }) { return <div>{children}</div>; }
