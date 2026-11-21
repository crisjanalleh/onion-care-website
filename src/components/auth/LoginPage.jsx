import { useState } from "react";
import { useSafeReturnTo } from "@/lib/authReturnTo";
import { Eye, EyeOff, Lock, Mail, LogIn } from "lucide-react";
import { db } from "@/api/appClient";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { MfaFlow } from "@/components/auth/MfaFlow";
import { MfaScreen } from "@/components/auth/MfaParts";
import { AuthError, AuthLink, GoogleButton, OrDivider, SubmitButton } from "@/components/auth/parts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginWithMfa } from "@/lib/authMfa";
import { getAppParams } from "@/lib/app-params";

export function LoginPage() {
  const returnTo = useSafeReturnTo();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mfaChallenge, setMfaChallenge] = useState(null);

  async function signIn(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = getAppParams().appId
        ? await loginWithMfa(email.trim(), password)
        : await db.auth.loginViaEmailPassword({ email: email.trim(), password });
      if (result?.mfa_required) {
        setMfaChallenge(result);
        return;
      }
      if (result?.access_token) db.auth.setToken(result.access_token);
      if (!result?.access_token && !(await db.auth.isAuthenticated())) {
        throw new Error("Sign-in did not establish a session. Please try again.");
      }
      window.location.assign(returnTo);
    } catch (signInError) {
      setError(signInError?.message || "Unable to sign in. Check your email and password.");
      setBusy(false);
    }
  }

  if (mfaChallenge) {
    return <MfaScreen><MfaFlow challenge={mfaChallenge} returnTo={returnTo} /></MfaScreen>;
  }

  return (
    <AuthLayout icon={LogIn} title="Welcome back" description="Sign in to your OnionCare account.">
      <GoogleButton returnTo={returnTo} onError={setError} disabled={busy} />
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
