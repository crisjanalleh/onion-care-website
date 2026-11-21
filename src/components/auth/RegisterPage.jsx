import { Eye, EyeOff, Lock, Mail, UserPlus } from "lucide-react";
import { useState } from "react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthError, AuthLink, GoogleButton, OrDivider, SubmitButton } from "@/components/auth/parts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSafeReturnTo } from "@/lib/authReturnTo";
import {
  createEmailAccount,
  firebaseAuthErrorMessage,
  resendVerificationEmail,
  sendVerificationEmail,
} from "@/lib/firebase/auth-client";

export function RegisterPage() {
  const returnTo = useSafeReturnTo();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState("form");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function register(event) {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Choose a password with at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    let accountCreated = false;
    try {
      const user = await createEmailAccount(email, password);
      accountCreated = true;
      setEmail(user.email ?? email.trim());
      setStep("verify");
      await sendVerificationEmail(user);
    } catch (registrationError) {
      setError(accountCreated
        ? `Your account was created, but the verification email could not be sent. ${firebaseAuthErrorMessage(registrationError)}`
        : firebaseAuthErrorMessage(registrationError));
      if (accountCreated) setStep("verify");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setError("");
    setBusy(true);
    try {
      await resendVerificationEmail();
    } catch (sendError) {
      setError(firebaseAuthErrorMessage(sendError));
    } finally {
      setBusy(false);
    }
  }

  if (step === "verify") {
    return (
      <AuthLayout icon={Mail} title="Verify your email" description="One more step before you can use OnionCare.">
        <p className="text-sm leading-relaxed text-muted-foreground" role="status">
          We sent a verification link to <span className="font-medium text-foreground">{email}</span>. Open it to verify your address, then sign in.
        </p>
        <AuthError message={error} />
        <button
          type="button"
          onClick={resend}
          disabled={busy}
          className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-md border border-input text-sm font-medium hover:bg-secondary disabled:opacity-60"
        >
          {busy ? "Sending…" : "Resend verification email"}
        </button>
        <AuthLink to="/login" returnTo={returnTo} className="mt-4 inline-flex w-full justify-center text-sm font-medium text-primary hover:underline">
          Back to sign in
        </AuthLink>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout icon={UserPlus} title="Create your account" description="Create an OnionCare account to get started.">
      <GoogleButton
        returnTo={returnTo}
        onError={setError}
        onNeedsVerification={(address) => {
          setEmail(address);
          setStep("verify");
        }}
        disabled={busy}
      />
      <OrDivider />
      <AuthError message={error} />
      <form onSubmit={register} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="register-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="register-email" type="email" autoComplete="email" autoFocus placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 pl-10" disabled={busy} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="register-password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 px-10" disabled={busy} minLength={8} required />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-confirm">Confirm password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="register-confirm" type={showConfirm ? "text" : "password"} autoComplete="new-password" placeholder="Re-enter your password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className="h-12 px-10" disabled={busy} minLength={8} required />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={showConfirm ? "Hide confirmation password" : "Show confirmation password"} aria-pressed={showConfirm} onClick={() => setShowConfirm((value) => !value)}>
              {showConfirm ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
        </div>
        <SubmitButton busy={busy} busyLabel="Creating account...">Create account</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <AuthLink to="/login" returnTo={returnTo}>Sign in</AuthLink>
      </p>
    </AuthLayout>
  );
}
