import React from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";

export default function AdminLogin({ form, setForm, onSubmit, loading, error }) {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-sky-700" />
            <h1 className="text-2xl font-semibold">Admin Login</h1>
          </div>

          <p className="mb-6 text-sm text-slate-600">
            Sign in to the private approval console. This area is separate from the public manufacturer and user portals.
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Admin Email
              </label>
              <input
                type="email"
                value={form.email}
                placeholder="Enter admin email"
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-sky-200 transition focus:ring"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter admin password"
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none ring-sky-200 transition focus:ring"
                />
              </div>
            </div>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <button
              onClick={onSubmit}
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:text-slate-100"
            >
              {loading ? "Signing in..." : "Enter Admin Portal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
