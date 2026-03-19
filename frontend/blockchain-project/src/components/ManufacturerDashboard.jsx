import React, { useState } from "react";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Blocks,
  Factory,
  FileBadge,
  LogOut,
  SearchCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const API_BASE_URL = `http://${window.location.hostname}:3000/api`;

const workspaceSections = [
  {
    id: "overview",
    title: "Overview",
    icon: Activity,
    description: "Manufacturer-only workspace and operating view.",
  },
  {
    id: "register",
    title: "Register Product",
    icon: Factory,
    description: "Create a new product record for the registry.",
  },
  {
    id: "verify",
    title: "Internal Verify",
    icon: SearchCheck,
    description: "Verify an existing product from inside the portal.",
  },
];

function getFriendlyVerificationError(response, data) {
  const rawMessage = String(data?.error || data?.message || "").toLowerCase();

  if (
    response.status >= 500 ||
    rawMessage.includes("contract not initialized") ||
    rawMessage.includes("failed to verify") ||
    rawMessage.includes("invalid response")
  ) {
    return "Verification is temporarily unavailable. Please try again in a moment.";
  }

  return data?.message || data?.error || "Product not found in registry.";
}

function ResultBanner({ result }) {
  if (!result) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${
        result.type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-rose-200 bg-rose-50 text-rose-600"
      }`}
    >
      <p>{result.message}</p>
      {result.tx && (
        <p className="mt-2 break-all text-xs text-slate-600">
          Transaction: {result.tx}
        </p>
      )}
    </div>
  );
}

export default function ManufacturerDashboard({
  manufacturer,
  authToken,
  onLogout,
}) {
  const normalizeTextField = (rawValue, maxLength = 80) =>
    rawValue.replace(/\s{2,}/g, " ").slice(0, maxLength);

  const normalizeAlphaNumericField = (rawValue, maxLength = 40) =>
    rawValue
      .toUpperCase()
      .replace(/[^A-Z0-9\-\/\s]/g, "")
      .replace(/\s{2,}/g, " ")
      .slice(0, maxLength);

  const normalizeNumberField = (rawValue, maxLength = 3) =>
    rawValue.replace(/\D/g, "").slice(0, maxLength);

  const normalizeIdentifierInput = (identifierType, rawValue) => {
    if (identifierType === "imei") {
      return rawValue.replace(/\D/g, "").slice(0, 15);
    }

    const hexOnly = rawValue.toUpperCase().replace(/[^0-9A-F]/g, "").slice(0, 12);
    return hexOnly.match(/.{1,2}/g)?.join(":") || "";
  };

  const updateFormField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const [activeSection, setActiveSection] = useState("overview");
  const [form, setForm] = useState({
    identifierType: "imei",
    identifier: "",
    productName: "",
    brand: "",
    model: "",
    deviceType: "",
    serialNumber: "",
    manufactureDate: "",
    warrantyMonths: "",
    color: "",
    storageCapacity: "",
  });
  const [verifyIdentifierType, setVerifyIdentifierType] = useState("imei");
  const [verifyIdentifier, setVerifyIdentifier] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [registerResult, setRegisterResult] = useState(null);
  const [latestRegistration, setLatestRegistration] = useState(null);

  const approvalStatus = manufacturer?.status || "pending";
  const isApproved = approvalStatus === "approved";
  const statusTone =
    approvalStatus === "approved"
      ? "text-emerald-700"
      : approvalStatus === "rejected"
        ? "text-rose-600"
        : "text-amber-700";

  const manufacturerStats = [
    {
      label: "Account Status",
      value: approvalStatus,
      tone: statusTone,
    },
    {
      label: "Wallet Address",
      value: manufacturer?.walletAddress
        ? `${manufacturer.walletAddress.slice(0, 8)}...${manufacturer.walletAddress.slice(-6)}`
        : "Unavailable",
      tone: "text-sky-700",
    },
    {
      label: "Portal Scope",
      value: "Private Manufacturer Workspace",
      tone: "text-slate-700",
    },
  ];

  const handleRegister = async () => {
    setRegisterResult(null);

    if (!isApproved) {
      setRegisterResult({
        type: "error",
        message:
          approvalStatus === "rejected"
            ? "This manufacturer account has been rejected and cannot register products."
            : "Your manufacturer account is pending approval. Product registration is available only after approval.",
      });
      return;
    }

    if (form.identifierType === "imei") {
      const imei = form.identifier.replace(/\D/g, "").slice(0, 15);
      if (imei.length !== 15) {
        setRegisterResult({
          type: "error",
          message: "IMEI must be exactly 15 digits.",
        });
        return;
      }
    } else {
      const macRegex = /^([0-9A-Fa-f]{2}[:\-]){5}[0-9A-Fa-f]{2}$/;
      if (!macRegex.test(form.identifier.trim())) {
        setRegisterResult({
          type: "error",
          message: "Enter a valid MAC address, e.g. AA:BB:CC:DD:EE:FF",
        });
        return;
      }
    }

    if (!form.productName.trim() || !form.brand.trim() || !form.model.trim()) {
      setRegisterResult({
        type: "error",
        message: "Product name, brand, and model are required.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const normalizedIdentifier =
        form.identifierType === "imei"
          ? form.identifier.replace(/\D/g, "").slice(0, 15)
          : form.identifier.trim().replace(/-/g, ":").toUpperCase();
      const payload = {
        identifierType: form.identifierType,
        identifierValue: normalizedIdentifier,
        productName: form.productName.trim(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        deviceType: form.deviceType.trim(),
        serialNumber: form.serialNumber.trim(),
        manufactureDate: form.manufactureDate,
        warrantyMonths: form.warrantyMonths,
        color: form.color.trim(),
        storageCapacity: form.storageCapacity.trim(),
      };

      const response = await fetch(`${API_BASE_URL}/register-product`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          onLogout();
        }
        setRegisterResult({
          type: "error",
          message: data.error || "Registration failed.",
        });
        return;
      }

      setRegisterResult({
        type: "success",
        message: data.message || "Product registered successfully.",
        tx: data.transactionHash,
      });
      setLatestRegistration({
        identifierType: payload.identifierType,
        identifierValue: payload.identifierValue,
        productName: payload.productName,
        brand: payload.brand,
        model: payload.model,
      });
      setForm({
        identifierType: "imei",
        identifier: "",
        productName: "",
        brand: "",
        model: "",
        deviceType: "",
        serialNumber: "",
        manufactureDate: "",
        warrantyMonths: "",
        color: "",
        storageCapacity: "",
      });
      setActiveSection("overview");
    } catch (error) {
      setRegisterResult({
        type: "error",
        message: "Unable to register product. Make sure backend is running.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInternalVerify = async () => {
    setVerifyResult(null);

    let normalizedIdentifier = "";
    if (verifyIdentifierType === "imei") {
      normalizedIdentifier = verifyIdentifier.replace(/\D/g, "").slice(0, 15);
      if (normalizedIdentifier.length !== 15) {
        setVerifyResult({
          type: "error",
          message: "Enter a valid 15-digit IMEI for verification.",
        });
        return;
      }
    } else {
      normalizedIdentifier = verifyIdentifier.trim().replace(/-/g, ":").toUpperCase();
      if (!/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(normalizedIdentifier)) {
        setVerifyResult({
          type: "error",
          message: "Enter a valid MAC address, e.g. AA:BB:CC:DD:EE:FF",
        });
        return;
      }
    }

    setVerifyLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/verify-product/${verifyIdentifierType}/${encodeURIComponent(normalizedIdentifier)}`
      );
      const data = await response.json();

      if (!response.ok || !data.isValid) {
        setVerifyResult({
          type: "error",
          message: getFriendlyVerificationError(response, data),
        });
        return;
      }

      setVerifyResult({
        type: "success",
        message: data.message || "Product verified successfully.",
        product: data.product,
      });
    } catch (error) {
      setVerifyResult({
        type: "error",
        message: "Unable to verify product. Make sure backend is running.",
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="background-nebula" />
      <div className="pointer-events-none absolute inset-0">
        <div className="ambient-orb left-0 top-0 h-72 w-72 bg-sky-200/70" />
        <div className="ambient-orb bottom-0 right-10 h-80 w-80 bg-white/90" style={{ animationDelay: "1.4s" }} />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="hero-card rounded-[2rem] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="glass-card rounded-2xl bg-white/60 p-3">
                <Blocks className="h-8 w-8 text-sky-700" />
              </div>
              <div>
                <div className="section-kicker">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Separate Manufacturer Workspace
                </div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                  Manufacturer Dashboard
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  Manage private manufacturer operations, review account status, and issue trusted product records from one dedicated workspace.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="glass-card rounded-2xl bg-white/70 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-widest text-slate-600">
                  Signed In As
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {manufacturer?.companyName}
                </p>
                <p className="text-xs text-slate-600">
                  {manufacturer?.officialEmail}
                </p>
              </div>
              <button
                onClick={onLogout}
                className="secondary-btn"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="mt-6 grid flex-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="glass-panel rounded-[2rem] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
              Workspace
            </p>
            <div className="mt-4 space-y-3">
              {workspaceSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isActive
                        ? "border-sky-200 bg-sky-50 shadow-sm"
                        : "border-white/70 bg-white/70 hover:border-slate-300 hover:-translate-y-0.5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`h-5 w-5 ${
                          isActive ? "text-sky-700" : "text-slate-600"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-semibold">{section.title}</p>
                        <p className="mt-1 text-xs text-slate-600">
                          {section.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {manufacturerStats.map((stat) => (
                <div key={stat.label} className="glass-card rounded-[1.5rem] p-5">
                  <p className="text-xs uppercase tracking-wider text-slate-600">
                    {stat.label}
                  </p>
                  <p className={`mt-2 text-base font-semibold ${stat.tone}`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {activeSection === "overview" && (
              <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
                <div className="hero-card rounded-[2rem] p-6">
                  <div className="flex items-center gap-3">
                    <Factory className="h-6 w-6 text-sky-700" />
                    <div>
                      <h2 className="text-xl font-semibold">
                        Manufacturer Overview
                      </h2>
                      <p className="text-sm text-slate-600">
                        Use this private dashboard to issue trusted product
                        records and run internal authenticity checks.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <button
                      onClick={() => setActiveSection("register")}
                      className="glass-card rounded-2xl bg-white/75 p-5 text-left"
                    >
                      <p className="text-sm font-semibold text-sky-700">
                        Register New Product
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        Create a new blockchain-backed product record for an electronic
                        device batch.
                      </p>
                      <p className="mt-4 inline-flex items-center text-sm text-sky-700">
                        Open registration{" "}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </p>
                    </button>

                    <button
                      onClick={() => setActiveSection("verify")}
                      className="glass-card rounded-2xl bg-white/75 p-5 text-left"
                    >
                      <p className="text-sm font-semibold text-slate-800">
                        Internal Product Verify
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        Confirm whether an identifier already exists in the blockchain
                        registry before release.
                      </p>
                      <p className="mt-4 inline-flex items-center text-sm text-slate-700">
                        Open verification{" "}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </p>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="glass-card rounded-[2rem] p-6">
                    <div className="flex items-center gap-2">
                      <FileBadge className="h-5 w-5 text-sky-700" />
                      <h3 className="text-lg font-semibold">
                        Manufacturer Profile
                      </h3>
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                      <p>
                        <span className="text-slate-600">Company:</span>{" "}
                        {manufacturer?.companyName}
                      </p>
                      <p>
                        <span className="text-slate-600">Registration:</span>{" "}
                        {manufacturer?.registrationNumber}
                      </p>
                      <p>
                        <span className="text-slate-600">Country:</span>{" "}
                        {manufacturer?.country}
                      </p>
                      <p>
                        <span className="text-slate-600">Status:</span>{" "}
                        <span className={`font-semibold ${statusTone}`}>
                          {approvalStatus}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="glass-card rounded-[2rem] p-6">
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="h-5 w-5 text-sky-700" />
                      <h3 className="text-lg font-semibold">
                        Latest Registration
                      </h3>
                    </div>
                    {latestRegistration ? (
                      <div className="mt-4 space-y-2 text-sm text-slate-600">
                        <p>
                          <span className="text-slate-600">Product:</span>{" "}
                          {latestRegistration.productName}
                        </p>
                        <p>
                          <span className="text-slate-600">Brand:</span>{" "}
                          {latestRegistration.brand}
                        </p>
                        <p>
                          <span className="text-slate-600">Model:</span>{" "}
                          {latestRegistration.model}
                        </p>
                        <p>
                          <span className="text-slate-600">Identifier:</span>{" "}
                          {latestRegistration.identifierType?.toUpperCase()} - {latestRegistration.identifierValue}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-slate-600">
                        No product registered in this session yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSection === "register" && (
              <div className="hero-card rounded-[2rem] p-6">
                <h2 className="text-xl font-semibold">Register New Product</h2>
                <p className="mt-2 text-sm text-slate-600">
                  This form is part of the manufacturer-only workspace.
                  Registered product identifiers are written to blockchain and remain
                  separate from the public user portal.
                </p>

                {!isApproved && (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {approvalStatus === "rejected"
                      ? "This manufacturer account has been rejected. Product registration is disabled."
                      : "This manufacturer account is pending approval. Product registration will be enabled after admin approval."}
                  </div>
                )}

                <form
                  className="mt-6 grid gap-4 sm:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRegister();
                  }}
                >
                  <div className="sm:col-span-2">
                    <div className="flex flex-wrap gap-3 text-sm">
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            identifierType: "imei",
                            identifier: "",
                          }))
                        }
                        className={`tab-chip ${
                          form.identifierType === "imei"
                            ? "tab-chip-active"
                            : ""
                        }`}
                      >
                        IMEI
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            identifierType: "mac",
                            identifier: "",
                          }))
                        }
                        className={`tab-chip ${
                          form.identifierType === "mac"
                            ? "tab-chip-active"
                            : ""
                        }`}
                      >
                        MAC Address
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-slate-600">
                      Select the product identifier you want to use for this record.
                    </p>
                  </div>

                  <input
                    type="text"
                    value={form.identifier}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        identifier: normalizeIdentifierInput(prev.identifierType, e.target.value),
                      }))
                    }
                    inputMode={form.identifierType === "imei" ? "numeric" : "text"}
                    maxLength={form.identifierType === "imei" ? 15 : 17}
                    autoComplete="off"
                    placeholder={
                      form.identifierType === "imei"
                        ? "IMEI (15 digits)"
                        : "MAC (AA:BB:CC:DD:EE:FF)"
                    }
                    className="input-field"
                  />
                  <input
                    type="text"
                    value={form.productName}
                    onChange={(e) =>
                      updateFormField("productName", normalizeTextField(e.target.value, 80))
                    }
                    placeholder="Product name"
                    maxLength={80}
                    className="input-field"
                  />
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) =>
                      updateFormField("brand", normalizeTextField(e.target.value, 50))
                    }
                    placeholder="Brand"
                    maxLength={50}
                    className="input-field"
                  />
                  <input
                    type="text"
                    value={form.model}
                    onChange={(e) =>
                      updateFormField("model", normalizeAlphaNumericField(e.target.value, 40))
                    }
                    placeholder="Model"
                    maxLength={40}
                    className="input-field"
                  />
                  <input
                    type="text"
                    value={form.deviceType}
                    onChange={(e) =>
                      updateFormField("deviceType", normalizeTextField(e.target.value, 40))
                    }
                    placeholder="Device type"
                    maxLength={40}
                    className="input-field"
                  />
                  <input
                    type="text"
                    value={form.serialNumber}
                    onChange={(e) =>
                      updateFormField(
                        "serialNumber",
                        normalizeAlphaNumericField(e.target.value, 40)
                      )
                    }
                    placeholder="Serial number"
                    autoComplete="off"
                    maxLength={40}
                    className="input-field"
                  />
                  <input
                    type="date"
                    value={form.manufactureDate}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        manufactureDate: e.target.value,
                      }))
                    }
                    className="input-field"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.warrantyMonths}
                    onChange={(e) =>
                      updateFormField(
                        "warrantyMonths",
                        normalizeNumberField(e.target.value, 3)
                      )
                    }
                    placeholder="Warranty (months)"
                    maxLength={3}
                    className="input-field"
                  />
                  <input
                    type="text"
                    value={form.color}
                    onChange={(e) =>
                      updateFormField("color", normalizeTextField(e.target.value, 30))
                    }
                    placeholder="Color"
                    maxLength={30}
                    className="input-field"
                  />
                  <input
                    type="text"
                    value={form.storageCapacity}
                    onChange={(e) =>
                      updateFormField(
                        "storageCapacity",
                        normalizeAlphaNumericField(e.target.value, 30)
                      )
                    }
                    placeholder="Storage / Capacity"
                    maxLength={30}
                    className="input-field"
                  />
                </form>

                <div className="mt-5">
                  <ResultBanner result={registerResult} />
                </div>

                <button
                  type="button"
                  onClick={handleRegister}
                  disabled={submitting || !isApproved}
                  className="primary-btn mt-5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? "Registering..."
                    : isApproved
                      ? "Register Product"
                      : "Approval Required"}
                </button>
              </div>
            )}

            {activeSection === "verify" && (
              <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="hero-card rounded-[2rem] p-6">
                  <h2 className="text-xl font-semibold">
                    Internal Manufacturer Verify
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Search a registered identifier from inside the manufacturer portal
                    before release or internal review.
                  </p>

                  <form
                    className="mt-6 space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleInternalVerify();
                    }}
                  >
                    <div className="flex flex-wrap gap-3 text-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setVerifyIdentifierType("imei");
                          setVerifyIdentifier("");
                        }}
                        className={`tab-chip ${
                          verifyIdentifierType === "imei"
                            ? "tab-chip-active"
                            : ""
                        }`}
                      >
                        IMEI
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVerifyIdentifierType("mac");
                          setVerifyIdentifier("");
                        }}
                        className={`tab-chip ${
                          verifyIdentifierType === "mac"
                            ? "tab-chip-active"
                            : ""
                        }`}
                      >
                        MAC Address
                      </button>
                    </div>
                    <input
                      type="text"
                      value={verifyIdentifier}
                      onChange={(e) =>
                        setVerifyIdentifier(
                          normalizeIdentifierInput(verifyIdentifierType, e.target.value)
                        )
                      }
                      inputMode={verifyIdentifierType === "imei" ? "numeric" : "text"}
                      maxLength={verifyIdentifierType === "imei" ? 15 : 17}
                      placeholder={
                        verifyIdentifierType === "imei"
                          ? "Enter 15-digit IMEI"
                          : "Enter MAC (AA:BB:CC:DD:EE:FF)"
                      }
                      className="input-field"
                    />

                    <button
                      type="submit"
                      disabled={verifyLoading}
                      className="primary-btn disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {verifyLoading ? "Verifying..." : "Verify Product"}
                    </button>

                    {verifyResult && (
                      <div
                        className={`rounded-2xl border px-4 py-3 text-sm ${
                          verifyResult.type === "success"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-rose-200 bg-rose-50 text-rose-600"
                        }`}
                      >
                        {verifyResult.message}
                      </div>
                    )}
                  </form>
                </div>

                <div className="glass-panel rounded-[2rem] p-6">
                  <div className="flex items-center gap-2">
                    <SearchCheck className="h-5 w-5 text-sky-700" />
                    <h3 className="text-lg font-semibold">
                      Verification Details
                    </h3>
                  </div>

                  {!verifyResult?.product && (
                    <p className="mt-4 text-sm text-slate-600">
                      Verified product details will appear here after a
                      successful verification check.
                    </p>
                  )}

                  {verifyResult?.product && (
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <div className="glass-card rounded-2xl bg-white/80 p-4">
                        <p className="text-xs uppercase tracking-wider text-slate-600">
                          Product Name
                        </p>
                        <p className="mt-2 font-semibold text-slate-900">
                          {verifyResult.product.productName}
                        </p>
                      </div>
                      <div className="glass-card rounded-2xl bg-white/80 p-4">
                        <p className="text-xs uppercase tracking-wider text-slate-600">
                          Brand
                        </p>
                        <p className="mt-2 font-semibold text-slate-900">
                          {verifyResult.product.brand}
                        </p>
                      </div>
                      <div className="glass-card rounded-2xl bg-white/80 p-4">
                        <p className="text-xs uppercase tracking-wider text-slate-600">
                          Model
                        </p>
                        <p className="mt-2 font-semibold text-slate-900">
                          {verifyResult.product.model}
                        </p>
                      </div>
                      <div className="glass-card rounded-2xl bg-white/80 p-4">
                        <p className="text-xs uppercase tracking-wider text-slate-600">
                          Identifier Type
                        </p>
                        <p className="mt-2 font-semibold text-slate-900">
                          {verifyResult.product.identifierType?.toUpperCase()}
                        </p>
                      </div>
                      <div className="glass-card rounded-2xl bg-white/80 p-4">
                        <p className="text-xs uppercase tracking-wider text-slate-600">
                          Identifier Value
                        </p>
                        <p className="mt-2 font-semibold text-slate-900">
                          {verifyResult.product.identifierValue}
                        </p>
                      </div>
                      <div className="glass-card rounded-2xl bg-white/80 p-4 md:col-span-2">
                        <p className="text-xs uppercase tracking-wider text-slate-600">
                          Manufacturer Address
                        </p>
                        <p className="mt-2 break-all font-mono text-sm text-slate-800">
                          {verifyResult.product.manufacturer}
                        </p>
                      </div>
                      <div className="glass-card rounded-2xl bg-white/80 p-4 md:col-span-2">
                        <p className="text-xs uppercase tracking-wider text-slate-600">
                          Registration Date
                        </p>
                        <p className="mt-2 font-semibold text-slate-900">
                          {new Date(
                            verifyResult.product.registrationDate,
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
