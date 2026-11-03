"use client";

import { useEffect, useState } from "react";
import {
  Download,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Database,
  Search,
  RefreshCw,
  Edit,
  Save,
  Clock,
  Layers,
} from "lucide-react";

export default function AdminBciSurveyPage() {
  const [activeTab, setActiveTab] = useState<"submissions" | "config">("submissions");

  // Submissions State
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubs, setLoadingSubs] = useState<boolean>(true);
  const [subsTotal, setSubsTotal] = useState<number>(0);
  const [subsPage, setSubsPage] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [areaFilter, setAreaFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Action status state
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Config State
  const [config, setConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState<boolean>(false);
  const [configMsg, setConfigMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch Submissions
  const fetchSubmissions = async () => {
    setLoadingSubs(true);
    try {
      const params = new URLSearchParams({
        page: String(subsPage),
        pageSize: "25",
      });
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (areaFilter !== "ALL") params.append("area", areaFilter);
      if (categoryFilter !== "ALL") params.append("category", categoryFilter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(`/api/admin/bci-survey/submissions?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setSubmissions(data.submissions || []);
        setSubsTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Failed to load admin submissions", err);
    } finally {
      setLoadingSubs(false);
    }
  };

  // Fetch Config
  const fetchConfig = async () => {
    setLoadingConfig(true);
    try {
      const res = await fetch("/api/admin/bci-survey/config");
      const data = await res.json();
      if (res.ok) {
        setConfig(data);
      }
    } catch (err) {
      console.error("Failed to load config", err);
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    if (activeTab === "submissions") {
      fetchSubmissions();
    } else {
      fetchConfig();
    }
  }, [activeTab, subsPage, statusFilter, areaFilter, categoryFilter]);

  // Update Status
  const handleStatusChange = async (
    id: string,
    newStatus: "approved" | "flagged" | "excluded" | "duplicate"
  ) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/bci-survey/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchSubmissions();
      }
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Save Config Changes
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigMsg(null);
    setLoadingConfig(true);

    try {
      const res = await fetch("/api/admin/bci-survey/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to update configuration");
      }
      setConfigMsg({ type: "success", text: data.message || "Config updated successfully!" });
      setConfig(data.config);
    } catch (err: any) {
      setConfigMsg({ type: "error", text: err.message || "Failed to update" });
    } finally {
      setLoadingConfig(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            BCI 2026 Marks Survey & Statistical Model
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Manage candidate submissions, moderate records, edit vacancy assumptions, and export datasets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/admin/bci-survey/export"
            download
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab("submissions")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === "submissions"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Database className="w-4 h-4" />
          Submissions Management ({subsTotal})
        </button>

        <button
          onClick={() => setActiveTab("config")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === "config"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Settings className="w-4 h-4" />
          Model & Vacancy Parameters
        </button>
      </div>

      {/* Tab 1: Submissions */}
      {activeTab === "submissions" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 shadow-sm">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, district, hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchSubmissions()}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-slate-900"
            >
              <option value="ALL">All Statuses</option>
              <option value="approved">Approved (Valid)</option>
              <option value="pending">Pending</option>
              <option value="flagged">Flagged</option>
              <option value="excluded">Excluded</option>
              <option value="duplicate">Duplicate</option>
            </select>

            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-slate-900"
            >
              <option value="ALL">All Areas</option>
              <option value="Non-TSP">Non-TSP</option>
              <option value="TSP">TSP</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-slate-900"
            >
              <option value="ALL">All Categories</option>
              <option value="UR">UR</option>
              <option value="EWS">EWS</option>
              <option value="OBC">OBC</option>
              <option value="MBC">MBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
            </select>
          </div>

          {/* Submissions Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Candidate / District</th>
                    <th className="py-3 px-4">Area / Cat</th>
                    <th className="py-3 px-4">Gender</th>
                    <th className="py-3 px-4">P1 / P2</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Qualification</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingSubs ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-500">
                        Loading submissions...
                      </td>
                    </tr>
                  ) : submissions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-500">
                        No submissions match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    submissions.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">
                            {s.candidateName || "Anonymous"}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {s.district || "District N/A"} • Shift: {s.shift || "N/A"}
                          </p>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-800">{s.category}</span>
                          <span className="text-[11px] text-slate-500 block">{s.area}</span>
                        </td>

                        <td className="py-3 px-4 text-slate-700">{s.gender}</td>

                        <td className="py-3 px-4 font-mono">
                          {s.paper1Marks} / {s.paper2Marks}
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-extrabold text-indigo-700 text-sm">
                            {s.totalMarks}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              s.qualificationStatus === "paper_verified_qualified"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {s.qualificationStatus === "paper_verified_qualified"
                              ? "Qualified"
                              : "Not Qualified"}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              s.adminStatus === "approved"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : s.adminStatus === "flagged"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : s.adminStatus === "duplicate"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {s.adminStatus}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            {s.adminStatus !== "approved" && (
                              <button
                                onClick={() => handleStatusChange(s.id, "approved")}
                                disabled={actionLoading === s.id}
                                className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold transition"
                                title="Approve for Analytics"
                              >
                                Approve
                              </button>
                            )}

                            {s.adminStatus !== "flagged" && (
                              <button
                                onClick={() => handleStatusChange(s.id, "flagged")}
                                disabled={actionLoading === s.id}
                                className="px-2 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 text-[10px] font-bold transition"
                                title="Flag for Review"
                              >
                                Flag
                              </button>
                            )}

                            {s.adminStatus !== "excluded" && (
                              <button
                                onClick={() => handleStatusChange(s.id, "excluded")}
                                disabled={actionLoading === s.id}
                                className="px-2 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 text-[10px] font-bold transition"
                                title="Exclude from Model"
                              >
                                Exclude
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Showing up to 25 records per page</span>
              <div className="flex gap-2">
                <button
                  disabled={subsPage <= 1}
                  onClick={() => setSubsPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded border border-slate-300 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-2 py-1 font-semibold text-slate-800">Page {subsPage}</span>
                <button
                  disabled={submissions.length < 25}
                  onClick={() => setSubsPage((p) => p + 1)}
                  className="px-3 py-1 rounded border border-slate-300 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Config & Model Parameters */}
      {activeTab === "config" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          {configMsg && (
            <div
              className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-3 ${
                configMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {configMsg.type === "success" ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <div>{configMsg.text}</div>
            </div>
          )}

          {loadingConfig || !config ? (
            <div className="py-12 text-center text-slate-500">Loading configuration...</div>
          ) : (
            <form onSubmit={handleSaveConfig} className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Model Version {config.version}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Last updated on {new Date(config.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loadingConfig}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition"
                >
                  <Save className="w-4 h-4" />
                  Save & Publish New Version
                </button>
              </div>

              {/* Vacancy Breakdown */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide">
                  1. Non-TSP Category Seats Matrix
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                  {Object.entries(config.vacancies?.nonTspCategorySeats || {}).map(
                    ([cat, seats]: [string, any]) => (
                      <div key={cat} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {cat}
                        </label>
                        <input
                          type="number"
                          value={seats}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setConfig({
                              ...config,
                              vacancies: {
                                ...config.vacancies,
                                nonTspCategorySeats: {
                                  ...config.vacancies.nonTspCategorySeats,
                                  [cat]: val,
                                },
                              },
                            });
                          }}
                          className="w-full text-xs font-bold p-1.5 border border-slate-300 rounded bg-white text-slate-900"
                        />
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* TSP Seats Matrix */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide">
                  2. TSP Category Seats Matrix
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(config.vacancies?.tspCategorySeats || {}).map(
                    ([cat, seats]: [string, any]) => (
                      <div key={cat} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {cat}
                        </label>
                        <input
                          type="number"
                          value={seats}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setConfig({
                              ...config,
                              vacancies: {
                                ...config.vacancies,
                                tspCategorySeats: {
                                  ...config.vacancies.tspCategorySeats,
                                  [cat]: val,
                                },
                              },
                            });
                          }}
                          className="w-full text-xs font-bold p-1.5 border border-slate-300 rounded bg-white text-slate-900"
                        />
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Statistical Assumptions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Coverage Fraction (c)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="1.0"
                    value={config.coverageFraction}
                    onChange={(e) =>
                      setConfig({ ...config, coverageFraction: parseFloat(e.target.value) || 0.15 })
                    }
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Default 0.15 (assumes survey captures 15% of candidate pool)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Backlog Seats Switch
                  </label>
                  <select
                    value={config.backlogEnabled ? "true" : "false"}
                    onChange={(e) =>
                      setConfig({ ...config, backlogEnabled: e.target.value === "true" })
                    }
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="false">Backlog OFF (Base Seats)</option>
                    <option value="true">Backlog ON (Include Backlog)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bootstrap Resample Iterations
                  </label>
                  <input
                    type="number"
                    value={config.bootstrapIterations || 400}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        bootstrapIterations: parseInt(e.target.value) || 400,
                      })
                    }
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Recommended: 200–400 iterations for 80% uncertainty interval
                  </p>
                </div>
              </div>

              {/* Change Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Change Description (Audit Log)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Updated OBC seat allocation based on latest RSSB corrigendum"
                  value={config.changeDescription || ""}
                  onChange={(e) => setConfig({ ...config, changeDescription: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
