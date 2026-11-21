export function Carousel({ children }) { return <div>{children}</div>; }
export function CarouselContent({ children }) { return <div className="flex overflow-hidden">{children}</div>; }
export function CarouselItem({ children }) { return <div className="min-w-full">{children}</div>; }
export function CarouselPrevious({ children = "Previous" }) { return <button type="button">{children}</button>; }
export function CarouselNext({ children = "Next" }) { return <button type="button">{children}</button>; }
