export function Accordion({ children }) { return <div>{children}</div>; }
export function AccordionItem({ children }) { return <div className="border-b">{children}</div>; }
export function AccordionTrigger({ children }) { return <button type="button" className="w-full py-3 text-left font-medium">{children}</button>; }
export function AccordionContent({ children }) { return <div className="pb-3">{children}</div>; }
