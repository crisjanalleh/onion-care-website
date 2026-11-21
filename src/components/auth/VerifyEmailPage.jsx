import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthError } from "@/components/auth/parts";
import { Button } from "@/components/ui/button";
import { firebaseAuthErrorMessage, resendVerificationEmail } from "@/lib/firebase/auth-client";

export function VerifyEmailPage({ email = "" }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function resend() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await resendVerificationEmail();
      setMessage("A new verification link has been sent.");
    } catch (sendError) {
      setError(firebaseAuthErrorMessage(sendError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout icon={MailCheck} title="Verify your email" description="Verify your address before opening your OnionCare account.">
      <p className="text-sm leading-relaxed text-muted-foreground">
        {email ? <>A verification link was sent to <span className="font-medium text-foreground">{email}</span>.</> : "Open the verification link sent to your email address."}
      </p>
      <AuthError message={error} />
      {message ? <p className="text-sm text-muted-foreground" role="status">{message}</p> : null}
      <Button type="button" onClick={resend} disabled={busy} className="mt-4 h-12 w-full">
        {busy ? "Sending…" : "Resend verification link"}
      </Button>
      <Link to="/login" className="mt-4 inline-flex w-full justify-center text-sm font-medium text-primary hover:underline">
        Back to sign in
      </Link>
    </AuthLayout>
  );
}
