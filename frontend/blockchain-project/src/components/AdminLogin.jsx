import React from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";

export default function AdminLogin({ form, setForm, onSubmit, loading, error }) {
  return (
    <div className="page-shell px-4 py-10 sm:px-6 lg:px-8">
      <div className="background-nebula" />
      <div className="pointer-events-none absolute inset-0">
        <div className="ambient-orb left-10 top-12 h-60 w-60 bg-sky-200/75" />
        <div className="ambient-orb bottom-8 right-8 h-80 w-80 bg-white/90" style={{ animationDelay: "1.1s" }} />
      </div>
      <div className="mx-auto max-w-md">
        <div className="hero-card rounded-[2rem] p-7">
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
                className="input-field"
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
                  className="input-field py-3 pl-10 pr-4"
                />
              </div>
            </div>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <button
              onClick={onSubmit}
              disabled={loading}
              className="primary-btn w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Enter Admin Portal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
