import React, { useState } from "react";
import {
  ShieldCheck,
  Factory,
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
  { label: "Target Ecosystem", value: "Manufacturer + Admin + Consumer" },
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
      "Manufacturer creates an on-chain electronic device record using a trusted product identifier and product metadata.",
    icon: Factory,
  },
  {
    title: "Admin Approval",
    detail:
      "Admin reviews manufacturer access and authorizes only trusted organizations to issue product records.",
    icon: ShieldCheck,
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
    title: "Controlled Access",
    detail:
      "Manufacturer, admin, and public verification flows stay separated with role-specific access.",
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
  checkIdentifier,
  verificationInput,
  setVerificationInput,
  verificationType,
  setVerificationType,
  verifying,
  verificationResult,
  systemStatus,
}) {
  const [manualType, setManualType] = useState(null);

  const normalizeVerificationInput = (rawValue) => {
    if (verificationType === "imei") {
      return rawValue.replace(/\D/g, "").slice(0, 15);
    }

    const hexOnly = rawValue
      .toUpperCase()
      .replace(/[^0-9A-F]/g, "")
      .slice(0, 12);
    return hexOnly.match(/.{1,2}/g)?.join(":") || "";
  };

  const goToVerification = () => {
    const section = document.getElementById("verification-lab");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const manualContent = {
    imei: {
      title: "How to Find Your IMEI Number",
      example: "Example IMEI: 1234XXXXXXXXXXX",
      steps: [
        "Android phone: Open the Phone app and dial *#06#. Your IMEI usually appears immediately.",
        "iPhone: Open Settings > General > About, then scroll down to IMEI.",
        "Phone box or bill: Many phones print the IMEI on the device box, invoice, or warranty card.",
        "SIM tray or device body: Some phones also print the IMEI on the SIM tray or back panel.",
      ],
    },
    mac: {
      title: "How to Find Your MAC Address",
      example: "Example MAC: AA:BB:CC:DD:EE:FF",
      steps: [
        "Android: Open Settings > About phone > Status or Settings > Wi-Fi > Network details and look for Wi-Fi MAC address.",
        "iPhone: Open Settings > General > About, then find Wi-Fi Address.",
        "Windows laptop or PC: Open Command Prompt, run ipconfig /all, and check Physical Address under Wi-Fi or Ethernet.",
        "MacBook: Open System Settings > Wi-Fi > Details or System Settings > Network and look for the hardware / MAC address.",
      ],
    },
  };

  return (
    <div className="page-shell">
      <div className="background-nebula" />
      <div className="pointer-events-none absolute inset-0">
        <div className="ambient-orb -left-20 top-8 h-72 w-72 bg-sky-200/75" />
        <div
          className="ambient-orb right-0 top-32 h-80 w-80 bg-cyan-100/80"
          style={{ animationDelay: "1.2s" }}
        />
        <div
          className="ambient-orb bottom-10 left-1/3 h-96 w-96 bg-white/90"
          style={{ animationDelay: "2.4s" }}
        />
      </div>

      <nav className="sticky top-0 z-30 border-b border-white/50 bg-white/65 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="glass-card rounded-2xl p-2.5">
              <Blocks className="h-5 w-5 text-sky-700" />
            </div>
            <div>
              <p className="text-sm font-extrabold tracking-[0.22em] text-sky-700">
                CHAINAUTH
              </p>
              <p className="text-xs text-slate-500">
                Supply Chain Tracking & Counterfeit Detection DApp
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#overview" className="transition hover:text-slate-900">
              Overview
            </a>
            <a href="#roles" className="transition hover:text-slate-900">
              Roles
            </a>
            <a href="#workflow" className="transition hover:text-slate-900">
              Workflow
            </a>
            <a
              href="#verification-lab"
              className="transition hover:text-slate-900"
            >
              Verify
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onManufacturerLogin}
              className="secondary-btn px-3 py-2 text-xs sm:text-sm"
            >
              Manufacturer Login
            </button>
            <button
              onClick={goToVerification}
              className="primary-btn px-3 py-2 text-xs sm:text-sm"
            >
              Verify Now
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        <section
          id="overview"
          className="grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12"
        >
          <div>
            <div className="section-kicker">
              <Radar className="h-4 w-4" /> Blockchain Security for Electronic
              Device Supply Chains
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.02] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Blockchain-based Supply Chain Tracking and Counterfeit Detection
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Improve transparency from manufacturer to customer by securing
              device records on blockchain and enabling IMEI/MAC-based
              authenticity checks.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={onManufacturerLogin} className="primary-btn">
                Launch Manufacturer Portal{" "}
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
              <button onClick={goToVerification} className="secondary-btn">
                Jump to Public Verification
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <div className="glass-card inline-flex items-center gap-2 rounded-full px-4 py-2">
                <Cpu className="h-4 w-4 text-sky-700" />
                {systemStatus?.contractInitialized
                  ? "Local chain connected"
                  : "Chain connection offline"}
              </div>
              <div className="glass-card inline-flex items-center gap-2 rounded-full px-4 py-2">
                <BadgeCheck className="h-4 w-4 text-slate-700" />
                Secure by design
              </div>
            </div>
          </div>

          <div className="hero-card stagger-rise rounded-[2rem] p-6 sm:p-7">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-4">
              <p className="text-sm font-semibold text-slate-800">
                Trust Control Panel
              </p>
              <div className="inline-flex items-center gap-2 text-xs">
                <span
                  className={`status-dot ${
                    systemStatus?.contractInitialized
                      ? "bg-emerald-500"
                      : "bg-rose-500"
                  }`}
                />
                <span className="text-slate-600">
                  {systemStatus?.contractInitialized ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              {stats.map((item) => (
                <div key={item.label} className="metric-card">
                  <p className="text-xs uppercase tracking-wider text-slate-600">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="roles" className="mt-16">
          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <p className="section-kicker">Role Portals</p>
              <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
                Purpose-Built Access for Each Stakeholder
              </h2>
            </div>
          </div>

          <div className="stagger-rise grid gap-5 md:grid-cols-2">
            <button
              onClick={onManufacturerLogin}
              className="glass-card group rounded-[1.75rem] p-6 text-left"
            >
              <Factory className="h-7 w-7 text-sky-700" />
              <h3 className="mt-4 text-lg font-semibold">
                Manufacturer Portal
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Register electronic device identity, attach a trusted
                identifier, and initialize trusted blockchain records.
              </p>
              <p className="mt-4 text-sm font-medium text-sky-700 group-hover:text-sky-800">
                Open login <ArrowRight className="ml-1 inline h-4 w-4" />
              </p>
            </button>

            <div className="glass-card rounded-[1.75rem] p-6">
              <SearchCheck className="h-7 w-7 text-sky-700" />
              <h3 className="mt-4 text-lg font-semibold">Public User Check</h3>
              <p className="mt-2 text-sm text-slate-600">
                Verify electronic device authenticity instantly with IMEI or MAC
                search and no account barrier.
              </p>
              <button
                onClick={goToVerification}
                className="mt-4 inline-flex items-center text-sm font-medium text-sky-700 hover:text-sky-800"
              >
                Jump to verification <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section id="workflow" className="mt-16">
          <p className="section-kicker">Workflow</p>
          <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
            How the System Tracks Supply Chain and Detects Counterfeit Devices
          </h2>

          <div className="stagger-rise mt-6 grid gap-4 md:grid-cols-2">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="glass-card rounded-[1.6rem] p-5"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 shadow-sm">
                      0{index + 1}
                    </span>
                    <Icon className="h-5 w-5 text-sky-700" />
                    <h3 className="font-semibold">{step.title}</h3>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{step.detail}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section
          id="verification-lab"
          className="hero-card mt-16 grid gap-6 rounded-[2rem] p-8 lg:grid-cols-[0.95fr_1.05fr]"
        >
          <div>
            <div className="section-kicker">
              <ScanLine className="h-3.5 w-3.5" /> Real-time Verification Lab
            </div>

            <h2 className="mt-4 text-2xl font-semibold">
              Verify Product Authenticity
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Enter IMEI or MAC address to validate whether the electronic
              device is present in the blockchain registry.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => setVerificationType("imei")}
                className={`tab-chip ${
                  verificationType === "imei" ? "tab-chip-active" : ""
                }`}
              >
                <Smartphone className="mr-2 inline h-4 w-4" /> IMEI
              </button>
              <button
                onClick={() => setVerificationType("mac")}
                className={`tab-chip ${
                  verificationType === "mac" ? "tab-chip-active" : ""
                }`}
              >
                <Wifi className="mr-2 inline h-4 w-4" /> MAC Address
              </button>
            </div>

            <form
              className="mt-4 flex flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                checkIdentifier();
              }}
            >
              <input
                type="text"
                value={verificationInput}
                onChange={(e) =>
                  setVerificationInput(
                    normalizeVerificationInput(e.target.value),
                  )
                }
                inputMode={verificationType === "imei" ? "numeric" : "text"}
                maxLength={verificationType === "imei" ? 15 : 17}
                placeholder={
                  verificationType === "imei"
                    ? "Enter 15-digit IMEI"
                    : "Enter MAC (AA:BB:CC:DD:EE:FF)"
                }
                className="input-field"
              />
              <button
                type="submit"
                disabled={verifying}
                className="primary-btn disabled:cursor-not-allowed disabled:opacity-60"
              >
                {verifying ? "Verifying..." : "Verify"}
              </button>
            </form>

            <div className="mt-4 rounded-[1.35rem] border border-white/70 bg-white/45 p-4 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Example
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {verificationType === "imei"
                  ? manualContent.imei.example
                  : manualContent.mac.example}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {verificationType === "imei"
                  ? "Use the 15-digit IMEI exactly as shown above."
                  : "Use the MAC address in pairs like AA:BB:CC:DD:EE:FF."}
              </p>
              <button
                type="button"
                onClick={() => setManualType(verificationType)}
                className="secondary-btn mt-3 px-3 py-2 text-xs"
              >
                Show step-by-step guide
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-[1.75rem] p-5">
            <h3 className="text-lg font-semibold">Verification Result</h3>
            {!verificationResult && (
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Run a verification query to see product authenticity details.
              </p>
            )}

            {verificationResult && (
              <div className="mt-4 space-y-3 text-sm">
                <p
                  className={
                    verificationResult.type === "success"
                      ? "text-emerald-700"
                      : "text-rose-600"
                  }
                >
                  {verificationResult.message}
                </p>
                {verificationResult.data && (
                  <div className="space-y-1 rounded-2xl border border-white/80 bg-white/90 p-4 text-slate-700 shadow-sm">
                    <p>
                      <span className="text-slate-600">Product:</span>{" "}
                      {verificationResult.data.productName}
                    </p>
                    <p>
                      <span className="text-slate-600">Brand:</span>{" "}
                      {verificationResult.data.brand}
                    </p>
                    <p>
                      <span className="text-slate-600">Model:</span>{" "}
                      {verificationResult.data.model}
                    </p>
                    <p>
                      <span className="text-slate-600">Identifier Type:</span>{" "}
                      {verificationResult.data.identifierType?.toUpperCase()}
                    </p>
                    <p>
                      <span className="text-slate-600">Identifier Value:</span>{" "}
                      {verificationResult.data.identifierValue}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="mt-16">
          <p className="section-kicker">Security Pillars</p>
          <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
            Built for High-Trust Supply Chain Authentication
          </h2>

          <div className="stagger-rise mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {securityPillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="glass-card rounded-[1.6rem] p-5"
                >
                  <Icon className="h-5 w-5 text-sky-700" />
                  <h3 className="mt-3 font-semibold">{pillar.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{pillar.detail}</p>
                </div>
              );
            })}
          </div>
        </section>

        <footer className="glass-panel mt-16 rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xl font-semibold text-slate-900">
                Ready to operationalize counterfeit prevention?
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Start by onboarding manufacturers and recording your first
                electronic device batch on-chain.
              </p>
            </div>
            <button onClick={onManufacturerLogin} className="primary-btn">
              Open Manufacturer Portal <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-4 text-xs text-slate-600">
            <div className="inline-flex items-center gap-2">
              <LockKeyhole className="h-4 w-4" />
              ChainAuth DApp | Blockchain-based Supply Chain Tracking &
              Counterfeit Detection for Electronic Devices
            </div>
          </div>
        </footer>
      </main>

      {manualType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <button
            type="button"
            onClick={() => setManualType(null)}
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
            aria-label="Close guide"
          />

          <div className="glass-panel relative z-10 w-full max-w-2xl rounded-[2rem] p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-kicker">
                  {manualType === "imei" ? "IMEI Guide" : "MAC Guide"}
                </p>
                <h3 className="mt-4 text-2xl font-semibold text-slate-900">
                  {manualContent[manualType].title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setManualType(null)}
                className="secondary-btn px-3 py-2 text-sm"
              >
                Close
              </button>
            </div>

            <div className="mt-5 rounded-[1.3rem] border border-white/70 bg-white/45 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Correct Example
              </p>
              <p className="mt-2 text-base font-semibold text-slate-900">
                {manualContent[manualType].example}
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {manualContent[manualType].steps.map((step, index) => (
                <div
                  key={step}
                  className="rounded-[1.2rem] border border-white/70 bg-white/45 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-800">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6 text-slate-700">{step}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-5 text-sm text-slate-600">
              Tip: Mobile phones usually use IMEI, while Wi-Fi enabled devices,
              laptops, and network hardware often use MAC address.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
