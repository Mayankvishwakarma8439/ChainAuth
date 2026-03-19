import React from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function ManufacturerLogin({ form, setForm, onSubmit, onBack, onGotoSignup, onForgotPassword, loading, loginError }) {
  return (
    <div className="page-shell px-4 py-10 sm:px-6 lg:px-8">
      <div className="background-nebula" />
      <div className="pointer-events-none absolute inset-0">
        <div className="ambient-orb left-8 top-12 h-64 w-64 bg-sky-200/70" />
        <div className="ambient-orb bottom-10 right-10 h-72 w-72 bg-white/90" style={{ animationDelay: "1.5s" }} />
      </div>
      <div className="mx-auto max-w-md">
        <button onClick={onBack} className="secondary-btn mb-6 px-4 py-2 text-sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </button>

        <div className="hero-card rounded-[2rem] p-7">
          <div className="mb-5 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-sky-700" />
            <h1 className="text-2xl font-semibold">Manufacturer Login</h1>
          </div>

          <p className="mb-6 text-sm leading-6 text-slate-600">Login to register electronics products and manage on-chain records.</p>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Official company email"
              className="input-field"
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Password"
              className="input-field"
            />

            {loginError && <p className="text-sm text-rose-600">{loginError}</p>}

            <button
              type="submit"
              disabled={loading}
              className="primary-btn w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <button
              onClick={onForgotPassword}
              type="button"
              className="w-full text-sm font-medium text-sky-700 transition hover:text-sky-800"
            >
              Forgot password?
            </button>
          </form>

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
