import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/api/appClient";
import { returnToSearch } from "@/lib/authReturnTo";
import { getAppParams } from "@/lib/app-params";
import { loginWithGoogle } from "@/lib/authMfa";

export function AuthError({ message, children }) {
  const content = message ?? children;
  return content ? <p className="text-sm text-destructive" role="alert">{content}</p> : null;
}

export function AuthLink({ to, href, returnTo, search, className, children, ...props }) {
  return (
    <Link
      to={to ?? href ?? "/"}
      search={search ?? returnToSearch(returnTo)}
      className={className ?? "text-sm font-medium text-primary underline"}
      {...props}
    >
      {children}
    </Link>
  );
}

export function GoogleButton({ children = "Continue with Google", returnTo = "/", onError, disabled }) {
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    try {
      const result = getAppParams().appId
        ? await loginWithGoogle(returnTo)
        : await db.auth.loginWithProvider("google", returnTo);
      if (result?.redirecting) return;
      if (result?.access_token) db.auth.setToken(result.access_token);
      if (await db.auth.isAuthenticated()) {
        window.location.assign(returnTo);
        return;
      }
      setBusy(false);
      onError?.("Google sign-in did not establish a session. Please try again.");
    } catch (error) {
      onError?.(error?.message || "Google sign-in could not be completed.");
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="h-12 w-full"
      onClick={signIn}
      disabled={disabled || busy}
    >
      {busy ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" transform="translate(0 4)" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94a11.05 11.05 0 0 1-4.8 7.24l7.73 6C44.38 38.05 46.98 31.9 46.98 24.55Z" />
        <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z" transform="translate(0 4)" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.74l-7.73-6c-2.14 1.44-4.89 2.29-8.17 2.29-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" transform="translate(0 -4)" />
      </svg>}
      {children}
    </Button>
  );
}

export function OrDivider() {
  return <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>;
}

export function SubmitButton({ children = "Continue", busy = false, busyLabel = "Please wait...", disabled, ...props }) {
  return (
    <Button type="submit" className="h-12 w-full" disabled={busy || disabled} {...props}>
      {busy ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
      {busy ? busyLabel : children}
    </Button>
  );
}
