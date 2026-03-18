import React from "react";
import { ArrowLeft, Building2 } from "lucide-react";

export default function ManufacturerSignup({ form, setForm, onSubmit, onBackToLogin, onBackHome, loading, error }) {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <button onClick={onBackHome} className="mb-6 inline-flex items-center text-sm text-slate-300 transition hover:text-white">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </button>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-7 shadow-xl">
          <div className="mb-5 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-cyan-300" />
            <h1 className="text-2xl font-semibold">Manufacturer Signup</h1>
          </div>

          <p className="mb-6 text-sm text-slate-300">
            Enter legal company details. This account should map to the manufacturer wallet used for blockchain registration.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => setForm((prev) => ({ ...prev, companyName: e.target.value }))}
              placeholder="Company legal name"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-cyan-400/60 transition focus:ring"
            />
            <input
              type="text"
              value={form.registrationNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, registrationNumber: e.target.value }))}
              placeholder="Business registration number"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-cyan-400/60 transition focus:ring"
            />
            <input
              type="email"
              value={form.officialEmail}
              onChange={(e) => setForm((prev) => ({ ...prev, officialEmail: e.target.value }))}
              placeholder="Official company email"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-cyan-400/60 transition focus:ring"
            />
            <input
              type="tel"
              value={form.contactNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, contactNumber: e.target.value }))}
              placeholder="Contact number"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-cyan-400/60 transition focus:ring"
            />
            <input
              type="text"
              value={form.country}
              onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
              placeholder="Country"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-cyan-400/60 transition focus:ring"
            />
            <input
              type="text"
              value={form.walletAddress}
              onChange={(e) => setForm((prev) => ({ ...prev, walletAddress: e.target.value }))}
              placeholder="Ethereum wallet address"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-cyan-400/60 transition focus:ring"
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Password"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-cyan-400/60 transition focus:ring"
            />
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Confirm password"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-cyan-400/60 transition focus:ring"
            />
          </div>

          {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}

          <button
            onClick={onSubmit}
            disabled={loading}
            className="mt-5 w-full rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
          >
            {loading ? "Creating account..." : "Create Manufacturer Account"}
          </button>

          <p className="mt-4 text-sm text-slate-300">
            Already have an account?{" "}
            <button onClick={onBackToLogin} className="font-semibold text-cyan-300 hover:text-cyan-200">
              Go to login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
