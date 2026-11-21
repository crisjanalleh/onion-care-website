import * as React from "react";
export const Input = React.forwardRef(function Input({ className = "", type = "text", ...props }, ref) {
  return <input ref={ref} type={type} className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${className}`} {...props} />;
});
