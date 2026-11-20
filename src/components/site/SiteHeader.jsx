import { Link } from "@tanstack/react-router";
import { Leaf } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";

const NAV = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "What you can look up", href: "/#library" },
  { label: "For administrators", href: "/#administrators" },
];

export default function SiteHeader() {
  const { isAuthenticated, isLoadingAuth, user, navigateToLogin } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Leaf className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <span className="font-heading text-[1.0625rem] font-semibold tracking-tight">OnionCare</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
          <Link to="/about" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            About
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {isLoadingAuth ? (
            <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
          ) : isAuthenticated ? (
            <Button asChild size="sm">
              <Link to={isAdmin ? "/admin" : "/dashboard"}>{isAdmin ? "Open admin" : "Open dashboard"}</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigateToLogin()}>
                Sign in
              </Button>
              <Button asChild size="sm">
                <Link to="/register">Create account</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}