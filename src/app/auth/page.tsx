"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase";

type Step = "email" | "otp";

// useSearchParams() requires a Suspense boundary during static generation.
// Wrap the inner component and export a shell that provides it.
export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}

function AuthForm() {
  const router  = useRouter();
  const params  = useSearchParams();
  const nextPath = params.get("next") ?? "/dashboard";

  const [step,    setStep]    = useState<Step>("email");
  const [email,   setEmail]   = useState("");
  const [otp,     setOtp]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [resent,  setResent]  = useState(false);

  const otpInputRef  = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Redirect if already signed in
  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace(nextPath);
    });
  }, [router, nextPath]);

  // Focus OTP input when step changes
  useEffect(() => {
    if (step === "otp") setTimeout(() => otpInputRef.current?.focus(), 80);
    if (step === "email") setTimeout(() => emailInputRef.current?.focus(), 80);
  }, [step]);

  // ── Step 1: send OTP ──────────────────────────────────────────
  const handleSendOtp = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!email.trim()) return;
      setError("");
      setLoading(true);

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
    },
    [email]
  );

  // ── Step 2: verify OTP ────────────────────────────────────────
  const handleVerify = useCallback(
    async (e?: React.FormEvent) => {
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
    },
    [email, otp, router, nextPath]
  );

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
                  New code sent — check your inbox.
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
          <span className="underline underline-offset-2 cursor-pointer">Terms</span>{" "}
          and{" "}
          <span className="underline underline-offset-2 cursor-pointer">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
