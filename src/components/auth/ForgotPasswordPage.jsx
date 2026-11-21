import { useState } from "react";
import { KeyRound, Mail } from "lucide-react";
import { db } from "@/api/appClient";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthError, AuthLink, SubmitButton } from "@/components/auth/parts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSafeReturnTo } from "@/lib/authReturnTo";

export function ForgotPasswordPage() {
  const returnTo = useSafeReturnTo();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function requestReset(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const auth = db.auth;
      const methodName = ["forgotPassword", "requestPasswordReset", "sendPasswordResetEmail"]
        .find((name) => typeof auth?.[name] === "function");
      if (!methodName) {
        throw new Error("Password recovery is not available in the current authentication configuration.");
      }
      const method = auth[methodName];
      const result = await method.call(auth, methodName === "sendPasswordResetEmail" ? email.trim() : { email: email.trim() });
      if (result?.ok === false) throw new Error(result.message || "Unable to send a password reset email.");
      setSent(true);
    } catch (requestError) {
      setError(requestError?.message || "Unable to send a password reset email. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout icon={KeyRound} title="Reset your password" description="Enter the email address linked to your OnionCare account.">
      {sent ? (
        <div className="space-y-4" role="status">
          <p className="text-sm leading-relaxed text-muted-foreground">
            If an account exists for <span className="font-medium text-foreground">{email}</span>, password reset instructions will be sent to that address.
          </p>
          <AuthLink to="/login" returnTo={returnTo} className="inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Back to sign in
          </AuthLink>
        </div>
      ) : (
        <>
          <AuthError message={error} />
          <form className="space-y-4" onSubmit={requestReset}>
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <div className="relative">
                <Mail aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="reset-email" name="email" type="email" autoComplete="email" autoFocus required value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 pl-10" disabled={busy} />
              </div>
            </div>
            <SubmitButton busy={busy} busyLabel="Sending instructions...">Send reset instructions</SubmitButton>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remembered your password?{" "}
            <AuthLink to="/login" returnTo={returnTo}>Back to sign in</AuthLink>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
