"use client";
import { authApi } from "@/lib/api";
import api from "@/lib/axios";
import { errorMessage } from "@/lib/sales";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  Check,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Brand } from "./shell";
import { Button, Field } from "./ui";
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="nv-auth">
      <aside className="nv-auth-story">
        <Brand />
        <div>
          <div className="nv-eyebrow">YOUR COMMERCIAL WORK, CONNECTED</div>
          <h1>
            A clearer day.
            <br />
            <span>A stronger pipeline.</span>
          </h1>
          <p>
            Your opportunities, conversations and next steps — together in one
            focused place.
          </p>
          <div className="nv-auth-features">
            <div>
              <Target size={17} />
              Every opportunity, in focus
            </div>
            <div>
              <CalendarCheck size={17} />
              Your workday, thoughtfully connected
            </div>
            <div>
              <Sparkles size={17} />
              Kora, ready when you need a hand
            </div>
          </div>
        </div>
        <footer className="nv-auth-footer">
          NOVYA · Sales Partner
          <br />
          Built for the people moving business forward.
        </footer>
      </aside>
      <section className="nv-auth-form">
        <div>{children}</div>
      </section>
    </div>
  );
}
const errors: Record<string, string> = {
  mfa_required: "Enter a fresh code from your authenticator app.",
  role_not_allowed:
    "An active Sales Partner or Sales Team Lead membership is required. Contact your administrator.",
  wrong_password: "The password is incorrect.",
  user_not_found: "We could not find this work account.",
  email_not_verified: "Verify your work email before signing in.",
  session_required: "Sign in to continue.",
  session_expired: "Your session expired. Sign in again.",
  auth_service_unavailable:
    "The sign-in service is unavailable. Please try again.",
};
export function AuthPage({ mode }: { mode: string }) {
  const p = useSearchParams(),
    router = useRouter(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [show, setShow] = useState(false),
    [mfa, setMfa] = useState(false),
    [success, setSuccess] = useState(false);
  const login = mode === "login",
    forgot = mode === "forgot-password",
    otp = mode === "verify-otp",
    activate = mode === "activate",
    reset = mode === "reset-password";
  const title = login
    ? mfa
      ? "Verify it's you"
      : "Welcome back"
    : forgot
      ? "Forgot your password?"
      : otp
        ? "Check your email"
        : activate
          ? "Your next chapter starts here"
          : "Create a new password";
  const description = login
    ? "Sign in to your NOVYA Sales account."
    : forgot
      ? "Enter your work email and we’ll send a recovery code."
      : otp
        ? `Enter the recovery code sent to ${p.get("email") || "your work email"}.`
        : activate
          ? "Activate your invited work account using the temporary password provided by your administrator."
          : "Choose a strong password to protect your work account.";
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const b = Object.fromEntries(new FormData(e.currentTarget)) as Record<
      string,
      string
    >;
    setBusy(true);
    setError("");
    try {
      if (login) {
        const out = await signIn("credentials", {
          email: b.email,
          password: b.password,
          mfaCode: b.mfaCode,
          redirect: false,
          redirectTo: "/dashboard",
        });
        const code = out?.code || out?.error;
        if (code) {
          if (code === "mfa_required") setMfa(true);
          throw new Error(
            errors[code] || "Could not sign in. Check your credentials.",
          );
        }
        router.replace("/dashboard");
        router.refresh();
      } else if (forgot) {
        await authApi.forgotPassword({ email: b.email });
        router.push(`/verify-otp?email=${encodeURIComponent(b.email)}`);
      } else if (otp) {
        await authApi.verifyResetOtp({ email: b.email, otp: b.otp });
        sessionStorage.setItem(
          "novya-reset",
          JSON.stringify({ email: b.email, otp: b.otp }),
        );
        router.push(`/reset-password?email=${encodeURIComponent(b.email)}`);
      } else if (activate) {
        if (b.password !== b.confirmPassword)
          throw new Error("Passwords do not match.");
        await api.post("/auth/activate-sales", b);
        setSuccess(true);
      } else {
        let saved: { email?: string; otp?: string } = {};
        try {
          saved = JSON.parse(sessionStorage.getItem("novya-reset") || "{}");
        } catch {}
        if (b.password !== b.confirmPassword)
          throw new Error("Passwords do not match.");
        await authApi.resetPassword({
          email: b.email || saved.email,
          otp: b.otp || saved.otp,
          password: b.password,
          confirmPassword: b.confirmPassword,
        });
        sessionStorage.removeItem("novya-reset");
        setSuccess(true);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  if (success)
    return (
      <>
        <div className="nv-success-icon">
          <Check size={28} />
        </div>
        <h1>{activate ? "You're ready to begin" : "Password updated"}</h1>
        <p>
          {activate
            ? "Your Sales account is active. Sign in to start your workday."
            : "Your new password is ready. Sign in to continue."}
        </p>
        <Button href="/login" primary>
          Back to sign in <ArrowRight size={15} />
        </Button>
      </>
    );
  return (
    <>
      {!login && (
        <Link className="nv-back" href="/login">
          <ArrowLeft size={13} />
          Back to sign in
        </Link>
      )}
      <div className="nv-auth-mark">
        {login ? (
          <ShieldCheck size={23} />
        ) : forgot || otp ? (
          <Mail size={23} />
        ) : (
          <LockKeyhole size={23} />
        )}
      </div>
      <div className="nv-eyebrow" style={{ marginTop: 24 }}>
        NOVYA SALES
      </div>
      <h1>{title}</h1>
      <p>{description}</p>
      {(error || p.get("error")) && (
        <div role="alert" className="nv-auth-error">
          {error || errors[p.get("error") || ""] || "Sign in to continue."}
        </div>
      )}
      <form onSubmit={submit}>
        <Field
          label="Work email"
          name="email"
          type="email"
          required
          defaultValue={p.get("email") || ""}
        />
        {activate && (
          <Field
            label="Temporary password"
            name="temporaryPassword"
            type="password"
            required
          />
        )}
        {(login || reset || activate) && (
          <>
            <div
              className="nv-settings-row"
              style={{ border: 0, padding: "0 0 2px" }}
            >
              <span className="nv-caption">
                {reset || activate ? "New password" : "Password"}
              </span>
              {login && <Link href="/forgot-password">Forgot password?</Link>}
            </div>
            <div className="nv-inline">
              <input
                className="nv-input"
                aria-label={login ? "Password" : "New password"}
                name="password"
                type={show ? "text" : "password"}
                required
                minLength={login ? 1 : 10}
                autoComplete={login ? "current-password" : "new-password"}
              />
              <button
                type="button"
                className="nv-caption"
                onClick={() => setShow(!show)}
              >
                {show ? "Hide" : "Show"}
              </button>
            </div>
          </>
        )}
        {(reset || activate) && (
          <Field
            label="Confirm password"
            name="confirmPassword"
            type="password"
            required
          />
        )}
        {otp && (
          <Field
            label="Recovery code"
            name="otp"
            required
            placeholder="6-digit code"
          />
        )}
        {login && mfa && (
          <Field
            label="Authenticator code"
            name="mfaCode"
            required
            placeholder="6-digit code"
          />
        )}
        {reset && (
          <Field
            label="Recovery code"
            name="otp"
            placeholder="Leave empty to use your verified code"
          />
        )}
        <Button type="submit" primary disabled={busy}>
          {busy ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <ArrowRight size={15} />
          )}{" "}
          {login
            ? mfa
              ? "Verify & sign in"
              : "Sign in"
            : forgot
              ? "Send recovery code"
              : otp
                ? "Verify code"
                : activate
                  ? "Activate account"
                  : "Update password"}
        </Button>
      </form>
      {otp && (
        <Button
          disabled={busy}
          onClick={async () => {
            try {
              await authApi.forgotPassword({ email: p.get("email") || "" });
              setError("A new recovery code has been sent.");
            } catch (e) {
              setError(errorMessage(e));
            }
          }}
        >
          Resend recovery code
        </Button>
      )}
      <div className="nv-auth-hint">
        {login ? (
          <>
            Invited to NOVYA?{" "}
            <Link href="/activate">Activate your account</Link>
          </>
        ) : (
          "Your work account is protected by NOVYA security policies."
        )}
        <br />
        <ShieldCheck
          size={11}
          style={{ display: "inline", marginRight: 4, marginTop: 15 }}
        />
        Secure access · Assigned role and scope
      </div>
    </>
  );
}
