import React, { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Clock3, ShieldCheck, UserRoundX, Users, LogOut, RefreshCcw } from "lucide-react";

const API_BASE_URL = `http://${window.location.hostname}:3000/api`;

function statusTone(status) {
  if (status === "approved") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "rejected") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

export default function AdminDashboard({ adminEmail, adminToken, onLogout }) {
  const [manufacturers, setManufacturers] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const loadManufacturers = async (nextFilter = filter) => {
    setLoading(true);
    setError("");
    setActionMessage("");

    try {
      const query = nextFilter === "all" ? "" : `?status=${nextFilter}`;
      const response = await fetch(`${API_BASE_URL}/admin/manufacturers${query}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          onLogout();
          return;
        }
        setError(data.error || "Failed to load manufacturers.");
        return;
      }

      setManufacturers(data.manufacturers || []);
    } catch (requestError) {
      setError("Unable to load manufacturers. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadManufacturers(filter);
  }, [filter]);

  const counts = useMemo(() => {
    return manufacturers.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      },
      { total: 0, pending: 0, approved: 0, rejected: 0 }
    );
  }, [manufacturers]);

  const updateStatus = async (manufacturerId, status) => {
    setUpdatingId(manufacturerId);
    setError("");
    setActionMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/admin/manufacturers/${manufacturerId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          onLogout();
          return;
        }
        setError(data.error || "Failed to update manufacturer status.");
        return;
      }

      setActionMessage(data.message || "Manufacturer status updated.");
      loadManufacturers(filter);
    } catch (requestError) {
      setError("Unable to update manufacturer status. Make sure backend is running.");
    } finally {
      setUpdatingId("");
    }
  };

  const cards = [
    { label: "Visible Records", value: counts.total, icon: Users, tone: "text-slate-800" },
    { label: "Pending", value: counts.pending, icon: Clock3, tone: "text-amber-700" },
    { label: "Approved", value: counts.approved, icon: BadgeCheck, tone: "text-emerald-700" },
    { label: "Rejected", value: counts.rejected, icon: UserRoundX, tone: "text-rose-700" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs text-sky-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Private Admin Approval Console
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">Admin Portal</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Review pending manufacturer accounts and control which organizations are allowed to register products.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-widest text-slate-600">Signed In As</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{adminEmail}</p>
              </div>
              <button
                onClick={onLogout}
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wider text-slate-600">{card.label}</p>
                  <Icon className={`h-5 w-5 ${card.tone}`} />
                </div>
                <p className={`mt-3 text-2xl font-semibold ${card.tone}`}>{card.value}</p>
              </div>
            );
          })}
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Manufacturer Approval Queue</h2>
              <p className="mt-1 text-sm text-slate-600">
                Choose a filter, inspect company details, and approve or reject each manufacturer from here.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                ["pending", "Pending"],
                ["approved", "Approved"],
                ["rejected", "Rejected"],
                ["all", "All"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`rounded-lg border px-4 py-2 text-sm transition ${
                    filter === value
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                  }`}
                >
                  {label}
                </button>
              ))}

              <button
                onClick={() => loadManufacturers(filter)}
                disabled={loading}
                className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
          {actionMessage && <p className="mt-4 text-sm text-emerald-700">{actionMessage}</p>}

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Registration</th>
                  <th className="px-4 py-3 font-medium">Wallet</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {!loading && manufacturers.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-slate-600">
                      No manufacturers found for the selected filter.
                    </td>
                  </tr>
                )}

                {manufacturers.map((manufacturer) => (
                  <tr key={manufacturer.id} className="align-top">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">{manufacturer.companyName}</p>
                      <p className="mt-1 text-xs text-slate-600">{manufacturer.country}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{manufacturer.officialEmail}</td>
                    <td className="px-4 py-4 text-slate-700">{manufacturer.registrationNumber}</td>
                    <td className="px-4 py-4">
                      <p className="max-w-[210px] break-all font-mono text-xs text-slate-700">{manufacturer.walletAddress}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusTone(manufacturer.status)}`}>
                        {manufacturer.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {manufacturer.createdAt ? new Date(manufacturer.createdAt).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => updateStatus(manufacturer.id, "approved")}
                          disabled={updatingId === manufacturer.id || manufacturer.status === "approved"}
                          className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateStatus(manufacturer.id, "rejected")}
                          disabled={updatingId === manufacturer.id || manufacturer.status === "rejected"}
                          className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => updateStatus(manufacturer.id, "pending")}
                          disabled={updatingId === manufacturer.id || manufacturer.status === "pending"}
                          className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 transition hover:border-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Mark Pending
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
