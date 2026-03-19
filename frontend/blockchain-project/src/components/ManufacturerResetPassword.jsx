import React from "react";
import { ArrowLeft, KeyRound } from "lucide-react";

export default function ManufacturerResetPassword({
  form,
  setForm,
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
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </button>

        <div className="hero-card rounded-[2rem] p-7">
          <div className="mb-5 flex items-center gap-2">
            <KeyRound className="h-6 w-6 text-sky-700" />
            <h1 className="text-2xl font-semibold">Set New Password</h1>
          </div>

          <p className="mb-6 text-sm leading-6 text-slate-600">
            Choose a new password for your manufacturer account. Use at least 8 characters.
          </p>

          <div className="space-y-4">
            <input
              type="password"
              value={form.newPassword}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, newPassword: e.target.value }))
              }
              placeholder="New password"
              className="input-field"
            />
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
              }
              placeholder="Confirm new password"
              className="input-field"
            />

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <button
              onClick={onSubmit}
              disabled={loading}
              className="primary-btn w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
