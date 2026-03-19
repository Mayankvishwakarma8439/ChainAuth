import React from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function ManufacturerLogin({ form, setForm, onSubmit, onBack, onGotoSignup, loading, loginError }) {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        <button onClick={onBack} className="mb-6 inline-flex items-center text-sm text-slate-600 transition hover:text-slate-900">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </button>

        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-sky-700" />
            <h1 className="text-2xl font-semibold">Manufacturer Login</h1>
          </div>

          <p className="mb-6 text-sm text-slate-600">Login to register electronics products and manage on-chain records.</p>

          <div className="space-y-4">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Official company email"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-sky-200 transition focus:ring"
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Password"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-sky-200 transition focus:ring"
            />

            {loginError && <p className="text-sm text-rose-600">{loginError}</p>}

            <button
              onClick={onSubmit}
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:text-slate-100"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>

          <p className="mt-5 text-sm text-slate-600">
            New manufacturer?{" "}
            <button onClick={onGotoSignup} className="font-semibold text-sky-700 hover:text-sky-800">
              Create account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
