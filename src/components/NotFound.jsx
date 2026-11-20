import { Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";

/**
 * Shown by the root route when no child route matches the current URL.
 */
export function NotFound({ children }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-5 py-20 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <Compass className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <h1 className="mt-5 text-lg font-semibold">This page could not be found</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {children ?? "The page you were looking for has moved or never existed."}
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex min-h-[44px] items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Back to the home page
      </Link>
    </div>
  );
}

export default NotFound;
