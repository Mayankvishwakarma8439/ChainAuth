import React from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function ManufacturerLogin({ form, setForm, onSubmit, onBack, onGotoSignup, loading, loginError }) {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        <button onClick={onBack} className="mb-6 inline-flex items-center text-sm text-slate-300 transition hover:text-white">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </button>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-7 shadow-xl">
          <div className="mb-5 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-cyan-300" />
            <h1 className="text-2xl font-semibold">Manufacturer Login</h1>
          </div>

          <p className="mb-6 text-sm text-slate-300">Login to register electronics products and manage on-chain records.</p>

          <div className="space-y-4">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Official company email"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-cyan-400/60 transition focus:ring"
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Password"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-cyan-400/60 transition focus:ring"
            />

            {loginError && <p className="text-sm text-rose-300">{loginError}</p>}

            <button
              onClick={onSubmit}
              disabled={loading}
              className="w-full rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>

          <p className="mt-5 text-sm text-slate-300">
            New manufacturer?{" "}
            <button onClick={onGotoSignup} className="font-semibold text-cyan-300 hover:text-cyan-200">
              Create account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
