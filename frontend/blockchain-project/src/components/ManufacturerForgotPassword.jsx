import React from "react";
import { ArrowLeft, MailCheck } from "lucide-react";

export default function ManufacturerForgotPassword({
  email,
  setEmail,
  onSubmit,
  onBack,
  loading,
  error,
}) {
  return (
    <div className="page-shell px-4 py-10 sm:px-6 lg:px-8">
      <div className="background-nebula" />
      <div className="pointer-events-none absolute inset-0">
        <div className="ambient-orb left-8 top-12 h-64 w-64 bg-sky-200/70" />
        <div
          className="ambient-orb bottom-10 right-10 h-72 w-72 bg-white/90"
          style={{ animationDelay: "1.5s" }}
        />
      </div>

      <div className="mx-auto max-w-md">
        <button onClick={onBack} className="secondary-btn mb-6 px-4 py-2 text-sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
        </button>

        <div className="hero-card rounded-[2rem] p-7">
          <div className="mb-5 flex items-center gap-2">
            <MailCheck className="h-6 w-6 text-sky-700" />
            <h1 className="text-2xl font-semibold">Forgot Password</h1>
          </div>

          <p className="mb-6 text-sm leading-6 text-slate-600">
            Enter your official manufacturer email and we’ll send a one-time password
            to help you reset your account password.
          </p>

          <div className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Official company email"
              className="input-field"
            />

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <button
              onClick={onSubmit}
              disabled={loading}
              className="primary-btn w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending OTP..." : "Send Reset OTP"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
