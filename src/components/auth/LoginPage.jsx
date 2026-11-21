import { useState } from "react";
import { useSafeReturnTo } from "@/lib/authReturnTo";
import { Eye, EyeOff, Lock, Mail, LogIn } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthError, AuthLink, GoogleButton, OrDivider, SubmitButton } from "@/components/auth/parts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  firebaseAuthErrorMessage,
  resendVerificationEmail,
  sendVerificationEmail,
  signInEmail,
} from "@/lib/firebase/auth-client";

export function LoginPage() {
  const returnTo = useSafeReturnTo();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  async function signIn(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await signInEmail(email, password);
      if (!user.emailVerified) {
        await sendVerificationEmail(user);
        setVerificationSent(true);
        return;
      }
      window.location.assign(returnTo);
    } catch (signInError) {
      setError(firebaseAuthErrorMessage(signInError));
      setBusy(false);
    } finally {
      setBusy(false);
    }
  }

  async function resendVerification() {
    setError("");
    setBusy(true);
    try {
      await resendVerificationEmail();
      setVerificationSent(true);
    } catch (sendError) {
      setError(firebaseAuthErrorMessage(sendError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout icon={LogIn} title="Welcome back" description="Sign in to your OnionCare account.">
      {verificationSent ? (
        <p className="mb-4 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground" role="status">
          Check your email for a verification link before continuing.{" "}
          <button type="button" onClick={resendVerification} disabled={busy} className="font-medium text-primary underline disabled:opacity-60">
            Resend link
          </button>
        </p>
      ) : null}
      <GoogleButton
        returnTo={returnTo}
        onError={setError}
        onNeedsVerification={(address) => {
          setEmail(address);
          setVerificationSent(true);
        }}
        disabled={busy}
      />
      <OrDivider />
      <AuthError message={error} />
      <form className="space-y-4" onSubmit={signIn}>
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <div className="relative">
            <Mail aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="login-email" name="email" type="email" autoComplete="email" autoFocus required value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 pl-10" disabled={busy} />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="login-password">Password</Label>
            <AuthLink to="/forgot-password" returnTo={returnTo} className="text-sm font-medium text-primary hover:underline">
              Forgot password?
            </AuthLink>
          </div>
          <div className="relative">
            <Lock aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="login-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 px-10" disabled={busy} />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>
              {showPassword ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <SubmitButton busy={busy} busyLabel="Signing in...">Sign in</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to OnionCare?{" "}
        <AuthLink to="/register" returnTo={returnTo}>Create an account</AuthLink>
      </p>
    </AuthLayout>
  );
}
