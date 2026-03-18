import React, { useState } from "react";
import { Factory, LogOut } from "lucide-react";

const API_BASE_URL = `http://${window.location.hostname}:3000/api`;

export default function ManufacturerDashboard({ manufacturer, onLogout }) {
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
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleRegister = async () => {
    setResult(null);

    if (form.identifierType === "imei") {
      const imei = form.identifier.replace(/\D/g, "").slice(0, 15);
      if (imei.length !== 15) {
        setResult({ type: "error", message: "IMEI must be exactly 15 digits." });
        return;
      }
    } else {
      const macRegex = /^([0-9A-Fa-f]{2}[:\-]){5}[0-9A-Fa-f]{2}$/;
      if (!macRegex.test(form.identifier.trim())) {
        setResult({
          type: "error",
          message: "Enter a valid MAC address, e.g. AA:BB:CC:DD:EE:FF",
        });
        return;
      }
    }

    if (!form.productName.trim() || !form.brand.trim() || !form.model.trim()) {
      setResult({ type: "error", message: "All fields are required." });
      return;
    }

    if (form.identifierType === "mac") {
      setResult({
        type: "error",
        message:
          "MAC registration is UI-only right now. The backend only registers IMEI on-chain.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const imei = form.identifier.replace(/\D/g, "").slice(0, 15);
      const response = await fetch(`${API_BASE_URL}/register-product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imeiNumber: imei,
          productName: form.productName.trim(),
          brand: form.brand.trim(),
          model: form.model.trim(),
          deviceType: form.deviceType.trim(),
          serialNumber: form.serialNumber.trim(),
          manufactureDate: form.manufactureDate,
          warrantyMonths: form.warrantyMonths,
          color: form.color.trim(),
          storageCapacity: form.storageCapacity.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setResult({ type: "error", message: data.error || "Registration failed." });
        return;
      }

      setResult({
        type: "success",
        message: data.message || "Product registered successfully.",
        tx: data.transactionHash,
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
    } catch (error) {
      setResult({
        type: "error",
        message: "Unable to register product. Make sure backend is running.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Factory className="h-7 w-7 text-cyan-300" />
            <div>
              <h1 className="text-2xl font-semibold">Manufacturer Portal</h1>
              <p className="text-sm text-slate-300">Welcome, {manufacturer?.companyName}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-500"
          >
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </button>
        </div>

        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950 p-5">
          <h2 className="text-lg font-semibold">Register New Product</h2>
          <p className="mt-1 text-sm text-slate-300">
            Submit product details to register them on-chain.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <div className="flex flex-wrap gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, identifierType: "imei", identifier: "" }))}
                  className={`rounded-lg border px-4 py-2 transition ${
                    form.identifierType === "imei"
                      ? "border-cyan-300 bg-cyan-300/10 text-cyan-200"
                      : "border-slate-700 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  IMEI (On-chain)
                </button>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, identifierType: "mac", identifier: "" }))}
                  className={`rounded-lg border px-4 py-2 transition ${
                    form.identifierType === "mac"
                      ? "border-amber-300 bg-amber-300/10 text-amber-200"
                      : "border-slate-700 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  MAC (UI-only)
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                IMEI is stored on-chain and can be verified from the Home page. MAC verification UI exists but backend is not implemented yet.
              </p>
            </div>

            <input
              type="text"
              value={form.identifier}
              onChange={(e) => setForm((prev) => ({ ...prev, identifier: e.target.value }))}
              placeholder={form.identifierType === "imei" ? "IMEI (15 digits)" : "MAC (AA:BB:CC:DD:EE:FF)"}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm outline-none ring-cyan-400/60 transition focus:ring"
            />
            <input
              type="text"
              value={form.productName}
              onChange={(e) => setForm((prev) => ({ ...prev, productName: e.target.value }))}
              placeholder="Product name"
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm outline-none ring-cyan-400/60 transition focus:ring"
            />
            <input
              type="text"
              value={form.brand}
              onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
              placeholder="Brand"
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm outline-none ring-cyan-400/60 transition focus:ring"
            />
            <input
              type="text"
              value={form.model}
              onChange={(e) => setForm((prev) => ({ ...prev, model: e.target.value }))}
              placeholder="Model"
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm outline-none ring-cyan-400/60 transition focus:ring"
            />
            <input
              type="text"
              value={form.deviceType}
              onChange={(e) => setForm((prev) => ({ ...prev, deviceType: e.target.value }))}
              placeholder="Device type (e.g., Smartphone, Router)"
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm outline-none ring-cyan-400/60 transition focus:ring"
            />
            <input
              type="text"
              value={form.serialNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, serialNumber: e.target.value }))}
              placeholder="Serial number"
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm outline-none ring-cyan-400/60 transition focus:ring"
            />
            <input
              type="date"
              value={form.manufactureDate}
              onChange={(e) => setForm((prev) => ({ ...prev, manufactureDate: e.target.value }))}
              placeholder="Manufacture date"
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm outline-none ring-cyan-400/60 transition focus:ring"
            />
            <input
              type="number"
              min="0"
              value={form.warrantyMonths}
              onChange={(e) => setForm((prev) => ({ ...prev, warrantyMonths: e.target.value }))}
              placeholder="Warranty (months)"
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm outline-none ring-cyan-400/60 transition focus:ring"
            />
            <input
              type="text"
              value={form.color}
              onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
              placeholder="Color"
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm outline-none ring-cyan-400/60 transition focus:ring"
            />
            <input
              type="text"
              value={form.storageCapacity}
              onChange={(e) => setForm((prev) => ({ ...prev, storageCapacity: e.target.value }))}
              placeholder="Storage / Capacity"
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm outline-none ring-cyan-400/60 transition focus:ring"
            />
          </div>

          {result && (
            <p
              className={`mt-4 text-sm ${
                result.type === "success" ? "text-emerald-300" : "text-rose-300"
              }`}
            >
              {result.message}
              {result.tx ? ` (Tx: ${result.tx})` : ""}
            </p>
          )}

          <button
            onClick={handleRegister}
            disabled={submitting}
            className="mt-5 w-full rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
          >
            {submitting ? "Registering..." : "Register Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
