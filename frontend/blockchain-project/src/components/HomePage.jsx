import React from "react";
import {
  ShieldCheck,
  Factory,
  Truck,
  SearchCheck,
  Wifi,
  Smartphone,
  ArrowRight,
  Blocks,
  BadgeCheck,
  Radar,
  Cpu,
  Database,
  Fingerprint,
  Globe,
  LockKeyhole,
  ScanLine,
  Network,
} from "lucide-react";

const stats = [
  { label: "Target Ecosystem", value: "Manufacturer + Supplier + Consumer" },
  { label: "Verification Mode", value: "Public IMEI / MAC Lookup" },
  { label: "Record Nature", value: "Immutable Blockchain Ledger" },
  {
    label: "Core Objective",
    value: "Supply Chain Tracking + Counterfeit Detection",
  },
];

const processSteps = [
  {
    title: "Manufacturer Registration",
    detail:
      "Manufacturer creates an on-chain electronic device record with unique IMEI and product metadata.",
    icon: Factory,
  },
  {
    title: "Supplier Validation",
    detail:
      "Supplier validates incoming inventory against blockchain records before onward distribution.",
    icon: Truck,
  },
  {
    title: "Public Verification",
    detail:
      "Any customer checks authenticity using IMEI or MAC without creating an account.",
    icon: SearchCheck,
  },
  {
    title: "Tamper-Resistant Trust",
    detail:
      "Tamper-resistant ledger history helps detect suspicious products and counterfeit circulation quickly.",
    icon: ShieldCheck,
  },
];

const securityPillars = [
  {
    title: "On-Chain Provenance",
    detail:
      "Track origin and lifecycle of each electronic device from manufacturing to delivery.",
    icon: Network,
  },
  {
    title: "Immutable Registry",
    detail:
      "Once committed, product records cannot be silently altered or deleted.",
    icon: Database,
  },
  {
    title: "Multi-Stakeholder Flow",
    detail:
      "Manufacturer and supplier checkpoints strengthen trust across the supply chain.",
    icon: Globe,
  },
  {
    title: "Identity-Oriented Controls",
    detail:
      "Role-specific portals enforce different privileges for each participant type.",
    icon: Fingerprint,
  },
];

export default function HomePage({
  onManufacturerLogin,
  onSupplierPortal,
  checkIdentifier,
  verificationInput,
  setVerificationInput,
  verificationType,
  setVerificationType,
  verifying,
  verificationResult,
  systemStatus,
}) {
  const goToVerification = () => {
    const section = document.getElementById("verification-lab");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <nav className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-cyan-400/50 bg-cyan-400/10 p-2">
              <Blocks className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-cyan-300">
                CHAINAUTH
              </p>
              <p className="text-xs text-slate-400">
                Supply Chain Tracking & Counterfeit Detection DApp
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#overview" className="transition hover:text-white">
              Overview
            </a>
            <a href="#roles" className="transition hover:text-white">
              Roles
            </a>
            <a href="#workflow" className="transition hover:text-white">
              Workflow
            </a>
            <a href="#verification-lab" className="transition hover:text-white">
              Verify
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onManufacturerLogin}
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-500 sm:text-sm"
            >
              Manufacturer Login
            </button>
            <button
              onClick={goToVerification}
              className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-cyan-300 sm:text-sm"
            >
              Verify Now
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        <section id="overview" className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-medium text-cyan-200">
              <Radar className="h-4 w-4" /> Blockchain Security for Electronic
              Device Supply Chains
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Blockchain-based Supply Chain Tracking and Counterfeit Detection
            </h1>

            <p className="mt-5 max-w-2xl text-base text-slate-300 sm:text-lg">
              Improve transparency from manufacturer to customer by securing
              device records on blockchain and enabling IMEI/MAC-based
              authenticity checks.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={onManufacturerLogin}
                className="inline-flex items-center rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300"
              >
                Launch Manufacturer Portal{" "}
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
              <button
                onClick={onSupplierPortal}
                className="inline-flex items-center rounded-xl border border-amber-300/50 bg-amber-300/10 px-5 py-3 text-sm font-semibold text-amber-200 transition hover:border-amber-200 hover:bg-amber-300/20"
              >
                Open Supplier Portal
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-slate-300">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2">
                <Cpu className="h-4 w-4 text-cyan-300" />
                {systemStatus?.contractInitialized
                  ? "Local chain connected"
                  : "Chain connection offline"}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2">
                <BadgeCheck className="h-4 w-4 text-emerald-300" />
                Secure by design
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <p className="text-sm font-semibold text-slate-200">
                Trust Control Panel
              </p>
              <div className="inline-flex items-center gap-2 text-xs">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    systemStatus?.contractInitialized
                      ? "bg-emerald-400"
                      : "bg-rose-400"
                  } ${systemStatus?.contractInitialized ? "animate-pulse" : ""}`}
                />
                {systemStatus?.contractInitialized ? "Active" : "Inactive"}
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
                >
                  <p className="text-xs uppercase tracking-wider text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="roles" className="mt-14">
          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
                Role Portals
              </p>
              <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
                Purpose-Built Access for Each Stakeholder
              </h2>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <button
              onClick={onManufacturerLogin}
              className="group rounded-2xl border border-cyan-400/40 bg-cyan-400/10 p-6 text-left transition hover:border-cyan-300 hover:bg-cyan-400/20"
            >
              <Factory className="h-7 w-7 text-cyan-300" />
              <h3 className="mt-4 text-lg font-semibold">
                Manufacturer Portal
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                Register electronic device identity, attach IMEI, and initialize
                trusted blockchain records.
              </p>
              <p className="mt-4 text-sm font-medium text-cyan-200 group-hover:text-cyan-100">
                Open login <ArrowRight className="ml-1 inline h-4 w-4" />
              </p>
            </button>

            <button
              onClick={onSupplierPortal}
              className="group rounded-2xl border border-amber-300/40 bg-amber-300/10 p-6 text-left transition hover:border-amber-300 hover:bg-amber-300/20"
            >
              <Truck className="h-7 w-7 text-amber-300" />
              <h3 className="mt-4 text-lg font-semibold">Supplier Portal</h3>
              <p className="mt-2 text-sm text-slate-300">
                Validate supply-chain inventory against manufacturer records
                before forwarding to market.
              </p>
              <p className="mt-4 text-sm font-medium text-amber-200 group-hover:text-amber-100">
                Open supplier tools{" "}
                <ArrowRight className="ml-1 inline h-4 w-4" />
              </p>
            </button>

            <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-6">
              <SearchCheck className="h-7 w-7 text-emerald-300" />
              <h3 className="mt-4 text-lg font-semibold">Public User Check</h3>
              <p className="mt-2 text-sm text-slate-300">
                Verify electronic device authenticity instantly with IMEI or MAC
                search and no account barrier.
              </p>
              <button
                onClick={goToVerification}
                className="mt-4 inline-flex items-center text-sm font-medium text-emerald-200 hover:text-emerald-100"
              >
                Jump to verification <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section id="workflow" className="mt-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
            Workflow
          </p>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
            How the System Tracks Supply Chain and Detects Counterfeit Devices
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-950 text-xs font-semibold text-slate-300">
                      0{index + 1}
                    </span>
                    <Icon className="h-5 w-5 text-cyan-300" />
                    <h3 className="font-semibold">{step.title}</h3>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">{step.detail}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section
          id="verification-lab"
          className="mt-14 grid gap-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-8 lg:grid-cols-2"
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-200">
              <ScanLine className="h-3.5 w-3.5" /> Real-time Verification Lab
            </div>

            <h2 className="mt-4 text-2xl font-semibold">
              Verify Product Authenticity
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Enter IMEI or MAC address to validate whether the electronic
              device is present in the blockchain registry.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                onClick={() => setVerificationType("imei")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  verificationType === "imei"
                    ? "bg-cyan-400 text-slate-900"
                    : "border border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-500"
                }`}
              >
                <Smartphone className="mr-2 inline h-4 w-4" /> IMEI
              </button>
              <button
                onClick={() => setVerificationType("mac")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  verificationType === "mac"
                    ? "bg-cyan-400 text-slate-900"
                    : "border border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-500"
                }`}
              >
                <Wifi className="mr-2 inline h-4 w-4" /> MAC Address
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={verificationInput}
                onChange={(e) => setVerificationInput(e.target.value)}
                placeholder={
                  verificationType === "imei"
                    ? "Enter 15-digit IMEI"
                    : "Enter MAC (AA:BB:CC:DD:EE:FF)"
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none ring-cyan-400/60 transition focus:ring"
              />
              <button
                onClick={checkIdentifier}
                disabled={verifying}
                className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
              >
                {verifying ? "Verifying..." : "Verify"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <h3 className="text-lg font-semibold">Verification Result</h3>
            {!verificationResult && (
              <p className="mt-3 text-sm text-slate-400">
                Run a verification query to see product authenticity details.
              </p>
            )}

            {verificationResult && (
              <div className="mt-4 space-y-3 text-sm">
                <p
                  className={
                    verificationResult.type === "success"
                      ? "text-emerald-300"
                      : "text-rose-300"
                  }
                >
                  {verificationResult.message}
                </p>
                {verificationResult.data && (
                  <div className="space-y-1 rounded-lg border border-slate-700 bg-slate-900 p-3 text-slate-200">
                    <p>
                      <span className="text-slate-400">Product:</span>{" "}
                      {verificationResult.data.productName}
                    </p>
                    <p>
                      <span className="text-slate-400">Brand:</span>{" "}
                      {verificationResult.data.brand}
                    </p>
                    <p>
                      <span className="text-slate-400">Model:</span>{" "}
                      {verificationResult.data.model}
                    </p>
                    <p>
                      <span className="text-slate-400">IMEI:</span>{" "}
                      {verificationResult.data.imeiNumber}
                    </p>
                    <p>
                      <span className="text-slate-400">Manufacturer:</span>{" "}
                      {verificationResult.data.manufacturer}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="mt-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
            Security Pillars
          </p>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
            Built for High-Trust Supply Chain Authentication
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {securityPillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5"
                >
                  <Icon className="h-5 w-5 text-cyan-300" />
                  <h3 className="mt-3 font-semibold">{pillar.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{pillar.detail}</p>
                </div>
              );
            })}
          </div>
        </section>

        <footer className="mt-14 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 to-cyan-950/40 p-6 sm:p-8">
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xl font-semibold">
                Ready to operationalize counterfeit prevention?
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Start by onboarding manufacturers and recording your first
                electronic device batch on-chain.
              </p>
            </div>
            <button
              onClick={onManufacturerLogin}
              className="inline-flex items-center rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300"
            >
              Open Manufacturer Portal <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 border-t border-slate-800 pt-4 text-xs text-slate-400">
            <div className="inline-flex items-center gap-2">
              <LockKeyhole className="h-4 w-4" />
              ChainAuth DApp | Blockchain-based Supply Chain Tracking &
              Counterfeit Detection for Electronic Devices
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
