import React from "react";
import { ArrowLeft, Building2 } from "lucide-react";

export default function ManufacturerSignup({ form, setForm, onSubmit, onBackToLogin, onBackHome, onForgotPassword, loading, error }) {
  return (
    <div className="page-shell px-4 py-10 sm:px-6 lg:px-8">
      <div className="background-nebula" />
      <div className="pointer-events-none absolute inset-0">
        <div className="ambient-orb -left-10 top-10 h-72 w-72 bg-sky-200/75" />
        <div className="ambient-orb bottom-0 right-12 h-80 w-80 bg-cyan-100/75" style={{ animationDelay: "1.2s" }} />
      </div>
      <div className="mx-auto max-w-2xl">
        <button onClick={onBackHome} className="secondary-btn mb-6 px-4 py-2 text-sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </button>

        <div className="hero-card rounded-[2rem] p-7">
          <div className="mb-5 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-sky-700" />
            <h1 className="text-2xl font-semibold">Manufacturer Signup</h1>
          </div>

          <p className="mb-6 text-sm text-slate-600">
            Enter legal company details. This account should map to the manufacturer wallet used for blockchain registration.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => setForm((prev) => ({ ...prev, companyName: e.target.value }))}
              placeholder="Company legal name"
              className="input-field"
            />
            <input
              type="text"
              value={form.registrationNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, registrationNumber: e.target.value }))}
              placeholder="Business registration number"
              className="input-field"
            />
            <input
              type="email"
              value={form.officialEmail}
              onChange={(e) => setForm((prev) => ({ ...prev, officialEmail: e.target.value }))}
              placeholder="Official company email"
              className="input-field"
            />
            <input
              type="tel"
              value={form.contactNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, contactNumber: e.target.value }))}
              placeholder="Contact number"
              className="input-field"
            />
            <input
              type="text"
              value={form.country}
              onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
              placeholder="Country"
              className="input-field"
            />
            <input
              type="text"
              value={form.walletAddress}
              onChange={(e) => setForm((prev) => ({ ...prev, walletAddress: e.target.value }))}
              placeholder="Ethereum wallet address"
              className="input-field"
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Password"
              className="input-field"
            />
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Confirm password"
              className="input-field"
            />
          </div>

          {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

          <button
            onClick={onSubmit}
            disabled={loading}
            className="primary-btn mt-5 w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create Manufacturer Account"}
          </button>

          <p className="mt-4 text-sm text-slate-600">
            Already have an account?{" "}
            <button onClick={onBackToLogin} className="font-semibold text-sky-700 hover:text-sky-800">
              Go to login
            </button>
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Need account recovery instead?{" "}
            <button onClick={onForgotPassword} className="font-semibold text-sky-700 hover:text-sky-800">
              Reset password
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
