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
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center text-sm text-slate-300 transition hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </button>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-7 shadow-xl">
          <div className="mb-5 flex items-center gap-2">
            <KeyRound className="h-6 w-6 text-cyan-300" />
            <h1 className="text-2xl font-semibold">OTP Verification</h1>
          </div>

          <p className="mb-2 text-sm text-slate-300">
            Enter the OTP sent to <span className="font-semibold text-slate-100">{otpFlow?.email}</span>.
          </p>
          <p className="mb-6 text-sm text-slate-400">
            {otpFlow?.message ||
              "Verification is required before manufacturer access is granted."}
          </p>

          {otpFlow?.devOtp && (
            <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
              Development OTP: <span className="font-semibold">{otpFlow.devOtp}</span>
            </div>
          )}

          <div className="space-y-4">
            <input
              type="text"
              value={otpCode}
              onChange={(e) =>
                setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="Enter 6-digit OTP"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-cyan-400/60 transition focus:ring"
            />

            {error && <p className="text-sm text-rose-300">{error}</p>}

            <button
              onClick={onVerify}
              disabled={loading}
              className="w-full rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              onClick={onResend}
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:text-slate-500"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Resend OTP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
