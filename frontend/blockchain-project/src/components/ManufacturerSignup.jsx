import React from "react";
import { ArrowLeft, Building2 } from "lucide-react";

export default function ManufacturerSignup({ form, setForm, onSubmit, onBackToLogin, onBackHome, loading, error }) {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <button onClick={onBackHome} className="mb-6 inline-flex items-center text-sm text-slate-600 transition hover:text-slate-900">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </button>

        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
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
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-sky-200 transition focus:ring"
            />
            <input
              type="text"
              value={form.registrationNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, registrationNumber: e.target.value }))}
              placeholder="Business registration number"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-sky-200 transition focus:ring"
            />
            <input
              type="email"
              value={form.officialEmail}
              onChange={(e) => setForm((prev) => ({ ...prev, officialEmail: e.target.value }))}
              placeholder="Official company email"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-sky-200 transition focus:ring"
            />
            <input
              type="tel"
              value={form.contactNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, contactNumber: e.target.value }))}
              placeholder="Contact number"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-sky-200 transition focus:ring"
            />
            <input
              type="text"
              value={form.country}
              onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
              placeholder="Country"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-sky-200 transition focus:ring"
            />
            <input
              type="text"
              value={form.walletAddress}
              onChange={(e) => setForm((prev) => ({ ...prev, walletAddress: e.target.value }))}
              placeholder="Ethereum wallet address"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-sky-200 transition focus:ring"
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Password"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-sky-200 transition focus:ring"
            />
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Confirm password"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-sky-200 transition focus:ring"
            />
          </div>

          {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

          <button
            onClick={onSubmit}
            disabled={loading}
            className="mt-5 w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:text-slate-100"
          >
            {loading ? "Creating account..." : "Create Manufacturer Account"}
          </button>

          <p className="mt-4 text-sm text-slate-600">
            Already have an account?{" "}
            <button onClick={onBackToLogin} className="font-semibold text-sky-700 hover:text-sky-800">
              Go to login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
