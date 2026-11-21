export function Toast({ children }) { return <div>{children}</div>; }
export function ToastTitle({ children }) { return <div className="font-semibold">{children}</div>; }
export function ToastDescription({ children }) { return <div className="text-sm">{children}</div>; }
export function ToastClose() { return null; }
export function ToastViewport() { return null; }
