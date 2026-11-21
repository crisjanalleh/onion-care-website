import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { KeyRound, MailCheck } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthError } from "@/components/auth/parts";
import { firebaseAuthErrorMessage, applyVerificationCode } from "@/lib/firebase/auth-client";

function actionParameters() {
  const params = new URLSearchParams(window.location.search);
  return {
    mode: params.get("mode"),
    code: params.get("oobCode"),
  };
}

export function AuthActionPage() {
  const [state, setState] = useState({ checking: true, mode: "", error: "" });

  useEffect(() => {
    const { mode, code } = actionParameters();
    if (mode === "resetPassword" && code) {
      window.location.replace(`/reset-password?oobCode=${encodeURIComponent(code)}`);
      return;
    }
    if (mode !== "verifyEmail" || !code) {
      setState({ checking: false, mode: "", error: "This account action link is incomplete or unsupported. Request a new link and try again." });
      return;
    }

    applyVerificationCode(code)
      .then(() => setState({ checking: false, mode: "verifyEmail", error: "" }))
      .catch((error) => setState({
        checking: false,
        mode: "verifyEmail",
        error: firebaseAuthErrorMessage(error),
      }));
  }, []);

  const verifying = state.checking;
  return (
    <AuthLayout
      icon={state.mode === "resetPassword" ? KeyRound : MailCheck}
      title={verifying ? "Checking your link" : state.error ? "Link could not be completed" : "Email verified"}
      description={verifying ? "Please wait while we validate this secure link." : undefined}
    >
      {verifying ? <p className="text-sm text-muted-foreground" role="status">Validating the action link…</p> : null}
      <AuthError message={state.error} />
      {!verifying && !state.error ? (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Your email address is verified. Sign in to continue to OnionCare.
          </p>
          <Link to="/login" className="inline-flex h-12 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Continue to sign in
          </Link>
        </div>
      ) : null}
      {state.error ? (
        <Link to="/login" className="mt-4 inline-flex text-sm font-medium text-primary underline">
          Back to sign in
        </Link>
      ) : null}
    </AuthLayout>
  );
}
