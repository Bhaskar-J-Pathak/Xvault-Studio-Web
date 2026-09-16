"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Mail, Check } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { usePostHog } from "posthog-js/react";

type Step = "email" | "otp";

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}

function AuthForm() {
  const router   = useRouter();
  const ph       = usePostHog();
  const params   = useSearchParams();
  const nextPath = params.get("next") ?? "/start";
  const refCode  = params.get("ref");
  const callbackFailed = params.get("error") === "callback_failed";

  const [step,         setStep]         = useState<Step>("email");
  const [email,        setEmail]        = useState("");
  const [otp,          setOtp]          = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(
    callbackFailed
      ? "We couldn't complete that sign-in. Please try Google again."
      : ""
  );
  const [resent,       setResent]       = useState(false);
  // Referral code input — pre-populated from URL param
  const [refInput,     setRefInput]     = useState(refCode?.toUpperCase() ?? "");
  // Only reveal the referral field if a code came in via URL, or the user asks
  const [showRefField, setShowRefField] = useState(!!refCode);

  const otpInputRef   = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Persist the referral code from the URL into localStorage immediately
  useEffect(() => {
    if (refCode) localStorage.setItem("xv_ref", refCode.toUpperCase());
  }, [refCode]);

  // Redirect if already signed in
  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace(nextPath);
    });
  }, [router, nextPath]);

  // Focus inputs on step change
  useEffect(() => {
    if (step === "otp")   setTimeout(() => otpInputRef.current?.focus(), 80);
    if (step === "email") setTimeout(() => emailInputRef.current?.focus(), 80);
  }, [step]);

  const refNormalised = refInput.replace(/[^A-Z0-9]/g, "").slice(0, 8);
  const refValid      = refNormalised.length === 8;

  // ── Step 1: send OTP ────────────────────────────────────────────────────
  const handleSendOtp = async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!email.trim()) return;
      setError("");
      setLoading(true);

      // Persist any manually entered referral code before navigating away
      if (refNormalised) localStorage.setItem("xv_ref", refNormalised);

      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { shouldCreateUser: true },
        });
        if (error) throw error;
        setOtp("");
        setResent(false);
        setStep("otp");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to send code.");
      } finally {
        setLoading(false);
      }
  };

  // ── Step 2: verify OTP ──────────────────────────────────────────────────
  const handleVerify = async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (otp.length !== 6) return;
      setError("");
      setLoading(true);

      try {
        const supabase = createClient();
        const { error } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: otp,
          type:  "email",
        });
        if (error) throw error;
        router.replace(nextPath);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Invalid code. Please try again.");
        setOtp("");
        otpInputRef.current?.focus();
      } finally {
        setLoading(false);
      }
  };

  // Auto-submit when all 6 digits are entered
  const handleOtpChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 6);
    setOtp(digits);
    setError("");
    if (digits.length === 6) handleVerify();
  };

  const handleResend = async () => {
    setError("");
    setResent(false);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setOtp("");
      setResent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    if (refNormalised) localStorage.setItem("xv_ref", refNormalised);
    try {
      const destination = nextPath.startsWith("/") ? nextPath : "/start";
      ph?.capture("auth_started", { method: "google", destination });
      const { error: oauthError } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: {
          // Keep this URL identical to the production Supabase allow-list entry.
          // Adding `?next=...` caused Supabase to reject the requested redirect
          // in production and fall back to the Site URL (the landing page), so
          // the authorization code was never exchanged for an app session.
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign-in could not start.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/XVault.svg" alt="XVault Studio" width={32} height={32} />
            <span className="font-semibold text-base tracking-tight text-[#1A1A1A]">
              XVault Studio
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-black/[0.08] bg-white shadow-sm p-8 space-y-6">

          {/* ── Step 1: Email ── */}
          {step === "email" && (
            <>
              <div className="space-y-1">
                <h1 className="text-xl font-semibold text-[#1A1A1A] tracking-tight">
                  Sign in or create account
                </h1>
                <p className="text-sm text-[#1A1A1A]/45">
                  We&apos;ll send a 6-digit code to your email.
                </p>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-black/[0.10] bg-white py-2.5 text-sm font-semibold text-[#1A1A1A] shadow-sm transition-colors hover:bg-black/[0.025] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <GoogleMark />
                {loading ? "Opening Google…" : "Continue with Google"}
              </button>

              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-black/[0.08]" />
                <span className="text-[11px] uppercase tracking-wider text-[#1A1A1A]/30">or use email</span>
                <span className="h-px flex-1 bg-black/[0.08]" />
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-sm font-medium text-[#1A1A1A]/70">
                    Email address
                  </label>
                  <input
                    id="email"
                    ref={emailInputRef}
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] bg-black/[0.02] text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-colors"
                  />
                </div>

                {/* Referral code — hidden by default, revealed on click */}
                {!showRefField ? (
                  <button
                    type="button"
                    onClick={() => setShowRefField(true)}
                    className="text-xs text-[#1A1A1A]/35 hover:text-violet-600 transition-colors text-left"
                  >
                    Have a referral code?
                  </button>
                ) : (
                  <div className="space-y-1.5">
                    <label htmlFor="ref-code" className="block text-sm font-medium text-[#1A1A1A]/70">
                      Referral code{" "}
                      <span className="text-[#1A1A1A]/35 font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <input
                        id="ref-code"
                        type="text"
                        autoFocus={!refCode}
                        value={refInput}
                        onChange={(e) =>
                          setRefInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))
                        }
                        placeholder="e.g. AB12CD34"
                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-black/[0.02] text-sm font-mono tracking-widest text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 placeholder:font-sans placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-colors ${
                          refInput && refValid
                            ? "border-emerald-400 bg-emerald-50/40"
                            : "border-black/[0.08]"
                        }`}
                      />
                      {refInput && refValid && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Check size={11} className="text-white" strokeWidth={2.5} />
                        </div>
                      )}
                    </div>
                    {refInput && !refValid && (
                      <p className="text-[11px] text-[#A1A1AA]">
                        Codes are 8 characters. {8 - refNormalised.length} more to go
                      </p>
                    )}
                    {refInput && refValid && (
                      <p className="text-[11px] text-emerald-600 font-medium">
                        Code applied. You&apos;ll get bonus credits on signup!
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1A1A1A] text-white text-sm font-semibold hover:bg-[#2A2A2A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Sending…" : "Send code"}
                </button>
              </form>

              <p className="text-xs text-center text-[#1A1A1A]/35">
                No password needed. New users are created automatically.
              </p>
            </>
          )}

          {/* ── Step 2: OTP ── */}
          {step === "otp" && (
            <>
              <div className="space-y-1">
                <h1 className="text-xl font-semibold text-[#1A1A1A] tracking-tight">
                  Check your email
                </h1>
                <p className="text-sm text-[#1A1A1A]/45">
                  We sent a 6-digit code to{" "}
                  <span className="font-medium text-[#1A1A1A]/70">{email}</span>
                </p>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {resent && (
                <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700">
                  New code sent. Check your inbox.
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="otp" className="block text-sm font-medium text-[#1A1A1A]/70">
                    6-digit code
                  </label>
                  <input
                    id="otp"
                    ref={otpInputRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => handleOtpChange(e.target.value)}
                    placeholder="000000"
                    className="w-full px-3.5 py-3 rounded-xl border border-black/[0.08] bg-black/[0.02] text-2xl font-mono tracking-[0.4em] text-center text-[#1A1A1A] placeholder:text-[#1A1A1A]/15 placeholder:tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1A1A1A] text-white text-sm font-semibold hover:bg-[#2A2A2A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Mail size={14} />
                  {loading ? "Verifying…" : "Verify code"}
                </button>
              </form>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => { setStep("email"); setOtp(""); setError(""); setResent(false); }}
                  className="flex items-center gap-1.5 text-xs text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70 transition-colors"
                >
                  <ArrowLeft size={12} />
                  Change email
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="text-xs text-[#1A1A1A]/40 hover:text-violet-600 disabled:opacity-40 transition-colors"
                >
                  Resend code
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#1A1A1A]/35">
          By continuing you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2 hover:text-[#1A1A1A]/60 transition-colors">Terms</Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-[#1A1A1A]/60 transition-colors">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.482h4.844a4.14 4.14 0 0 1-1.797 2.715v2.259h2.909c1.702-1.567 2.684-3.875 2.684-6.615Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.468-.806 5.956-2.18l-2.91-2.259c-.805.54-1.835.859-3.046.859-2.344 0-4.328-1.585-5.037-3.714H.955v2.333A8.998 8.998 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.963 10.706A5.41 5.41 0 0 1 3.682 9c0-.592.102-1.167.281-1.706V4.961H.955A8.996 8.996 0 0 0 0 9c0 1.452.347 2.827.955 4.039l3.008-2.333Z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.507.454 3.441 1.346l2.581-2.581C13.464.892 11.426 0 9 0A8.998 8.998 0 0 0 .955 4.961l3.008 2.333C4.672 5.165 6.656 3.58 9 3.58Z" />
    </svg>
  );
}
