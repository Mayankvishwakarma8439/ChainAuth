import React from "react";
import { ArrowLeft, KeyRound, RefreshCcw } from "lucide-react";

export default function ManufacturerOtp({
  otpCode,
  setOtpCode,
  otpFlow,
  loading,
  error,
  onVerify,
  onResend,
  onBack,
}) {
  return (
    <div className="page-shell px-4 py-10 sm:px-6 lg:px-8">
      <div className="background-nebula" />
      <div className="pointer-events-none absolute inset-0">
        <div className="ambient-orb left-12 top-16 h-56 w-56 bg-sky-200/75" />
        <div className="ambient-orb bottom-8 right-10 h-72 w-72 bg-cyan-100/80" style={{ animationDelay: "1.4s" }} />
      </div>
      <div className="mx-auto max-w-md">
        <button
          onClick={onBack}
          className="secondary-btn mb-6 px-4 py-2 text-sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </button>

        <div className="hero-card rounded-[2rem] p-7">
          <div className="mb-5 flex items-center gap-2">
            <KeyRound className="h-6 w-6 text-sky-700" />
            <h1 className="text-2xl font-semibold">OTP Verification</h1>
          </div>

          <p className="mb-2 text-sm text-slate-600">
            Enter the OTP sent to <span className="font-semibold text-slate-900">{otpFlow?.email}</span>.
          </p>
          <p className="mb-6 text-sm text-slate-600">
            {otpFlow?.message ||
              "Verification is required before manufacturer access is granted."}
          </p>

          {otpFlow?.devOtp && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Development OTP: <span className="font-semibold">{otpFlow.devOtp}</span>
            </div>
          )}

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              onVerify();
            }}
          >
            <input
              type="text"
              value={otpCode}
              onChange={(e) =>
                setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="Enter 6-digit OTP"
              className="input-field text-center tracking-[0.35em]"
            />

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="primary-btn w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              onClick={onResend}
              disabled={loading}
              className="secondary-btn w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Resend OTP
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
