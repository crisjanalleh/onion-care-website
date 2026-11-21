import { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, Lock } from "lucide-react";
import { db } from "@/api/appClient";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthError, AuthLink, SubmitButton } from "@/components/auth/parts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function readResetToken() {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return params.get("token") || params.get("code") || params.get("oobCode") || "";
}

export function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const resetToken = readResetToken();
    setToken(resetToken);
    if (!resetToken) {
      setError("This password reset link is missing its security token. Request a new reset email.");
    }
  }, []);

  async function updatePassword(event) {
    event.preventDefault();
    setError("");
    if (!token) {
      setError("This password reset link is missing its security token. Request a new reset email.");
      return;
    }
    if (password.length < 8) {
      setError("Choose a password with at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const auth = db.auth;
      const methodName = ["resetPassword", "confirmPasswordReset", "setNewPassword"]
        .find((name) => typeof auth?.[name] === "function");
      if (!methodName) {
        throw new Error("Password reset is not available in the current authentication configuration.");
      }
      const method = auth[methodName];
      const payload = methodName === "confirmPasswordReset"
        ? { oobCode: token, newPassword: password }
        : { token, password };
      const result = await method.call(auth, payload);
      if (result?.ok === false) throw new Error(result.message || "Unable to update your password.");
      setUpdated(true);
    } catch (updateError) {
      setError(updateError?.message || "Unable to update your password. Request a new reset email and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout icon={KeyRound} title="Choose a new password" description="Create a new password for your OnionCare account.">
      {updated ? (
        <div className="space-y-4" role="status">
          <p className="text-sm text-muted-foreground">Your password has been updated. Sign in with your new password.</p>
          <AuthLink to="/login" className="inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Back to sign in
          </AuthLink>
        </div>
      ) : (
        <>
          <AuthError message={error} />
          <form className="space-y-4" onSubmit={updatePassword}>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <div className="relative">
                <Lock aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="new-password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 px-10" disabled={busy} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirm new password</Label>
              <Input id="confirm-new-password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} required value={confirm} onChange={(event) => setConfirm(event.target.value)} className="h-12" disabled={busy} />
            </div>
            <SubmitButton busy={busy} busyLabel="Updating password...">Update password</SubmitButton>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Need a new reset link? <AuthLink to="/forgot-password">Request another</AuthLink>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
