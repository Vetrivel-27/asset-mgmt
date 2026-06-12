import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config";
import CanAccess from "../CanAccess";

// ── tiny icon components ────────────────────────────────────────────────────
const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d={d} />
  </svg>
);

const ASSET_CATEGORIES = [
  "Laptop", "Mobile", "Tablet", "Desktop",
  "Monitor", "Keyboard", "Mouse", "Printer",
];

// ── helper ───────────────────────────────────────────────────────────────────
function getAuthHeaders() {
  const token = sessionStorage.getItem("authToken");
  return { Authorization: `Bearer ${token}` };
}

// ── Collapsible quick-action panel ──────────────────────────────────────────
function QuickPanel({ open, children }) {
  return (
    <div
      className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div className="overflow-hidden">
        <div className="pt-4 max-h-[400px] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Add-Asset mini form ──────────────────────────────────────────────────────
function AddAssetForm({ onSuccess, onCancel }) {
  const [name, setName] = useState("");
  const [assetId, setAssetId] = useState("");
  const [category, setCategory] = useState("");
  const [customCat, setCustomCat] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalCat = category === "CUSTOM" ? customCat.trim() : category;
    if (!name.trim() || !finalCat || !purchaseDate) {
      setError("Name, Category, and Purchase Date are required."); return;
    }
    setSubmitting(true); setError("");
    try {
      const res = await fetch(`${API_URL}/api/assets`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), assetId: assetId.trim(), type: finalCat, purchaseDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add asset.");
      
      // Reset form states
      setName("");
      setAssetId("");
      setCategory("");
      setCustomCat("");
      setPurchaseDate("");
      
      onSuccess(`Asset "${data.name}" added successfully!`);
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const handleCancel = () => {
    setName("");
    setAssetId("");
    setCategory("");
    setCustomCat("");
    setPurchaseDate("");
    setError("");
    onCancel();
  };

  const inputCls = "w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100";
  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 animate-shake">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Asset Name</span>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="MacBook Pro 16" disabled={submitting} className={`mt-1 ${inputCls}`} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Asset ID <span className="text-slate-400 font-normal">(Optional: Auto-generated)</span></span>
          <input value={assetId} onChange={e => setAssetId(e.target.value)} placeholder="e.g. LAP-001 (or leave blank)" disabled={submitting} className={`mt-1 ${inputCls}`} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Category</span>
          <select value={category} onChange={e => setCategory(e.target.value)} disabled={submitting} className={`mt-1 ${inputCls}`}>
            <option value="">Select…</option>
            {ASSET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            <option value="CUSTOM">Custom…</option>
          </select>
        </label>
        {category === "CUSTOM" && (
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Custom Category</span>
            <input value={customCat} onChange={e => setCustomCat(e.target.value)} placeholder="e.g. Server" disabled={submitting} className={`mt-1 ${inputCls}`} />
          </label>
        )}
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Purchase Date</span>
          <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} disabled={submitting} className={`mt-1 ${inputCls}`} />
        </label>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={submitting}
          className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-yellow-300 disabled:opacity-50">
          {submitting ? "Adding…" : "Add Asset"}
        </button>
        <button type="button" onClick={handleCancel} disabled={submitting}
          className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Register-Employee mini form ──────────────────────────────────────────────
function RegisterEmployeeForm({ roles, dbDepartments = [], onSuccess, onCancel }) {
  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [customDepartment, setCustomDepartment] = useState("");
  const [roleId, setRoleId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalDepartment = department === "CUSTOM" ? customDepartment.trim() : department.trim();
    if (!name.trim() || !employeeId.trim() || !email.trim() || !finalDepartment) {
      setError("Name, ID, email, and department are required."); return;
    }
    setSubmitting(true); setError("");
    try {
      const res = await fetch(`${API_URL}/api/employees`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), employeeId: employeeId.trim(), email: email.trim(), department: finalDepartment, roleId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to register employee.");
      
      // Reset form states
      setName("");
      setEmployeeId("");
      setEmail("");
      setDepartment("");
      setCustomDepartment("");
      setRoleId("");

      onSuccess(`Employee "${data.name || name}" registered! A welcome email has been sent.`);
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const handleCancel = () => {
    setName("");
    setEmployeeId("");
    setEmail("");
    setDepartment("");
    setCustomDepartment("");
    setRoleId("");
    setError("");
    onCancel();
  };

  const inputCls = "w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100";
  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 animate-shake">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Full Name</span>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" disabled={submitting} className={`mt-1 ${inputCls}`} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Employee ID</span>
          <input value={employeeId} onChange={e => setEmployeeId(e.target.value)} placeholder="EMP-042" disabled={submitting} className={`mt-1 ${inputCls}`} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Email</span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@company.com" disabled={submitting} className={`mt-1 ${inputCls}`} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Department</span>
          <select value={department} onChange={e => setDepartment(e.target.value)} disabled={submitting} className={`mt-1 ${inputCls}`}>
            <option value="">Select Department</option>
            {dbDepartments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
            <option value="CUSTOM">Custom department...</option>
          </select>
          {department === "CUSTOM" && (
            <input value={customDepartment} onChange={e => setCustomDepartment(e.target.value)} placeholder="e.g. Data Science" disabled={submitting} className={`mt-2 ${inputCls}`} />
          )}
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-slate-600">Role</span>
          <select value={roleId} onChange={e => setRoleId(e.target.value)} disabled={submitting} className={`mt-1 ${inputCls}`}>
            <option value="">Default (Employee)</option>
            {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
          </select>
        </label>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={submitting}
          className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-yellow-300 disabled:opacity-50 transition">
          {submitting ? "Registering…" : "Register Employee"}
        </button>
        <button type="button" onClick={handleCancel} disabled={submitting}
          className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ assets: 0, employees: 0, activeAssignments: 0 });
  const [activity, setActivity] = useState([]);
  const [roles, setRoles] = useState([]);
  const [dbDepartments, setDbDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick-action panel state
  const [activePanel, setActivePanel] = useState(null); // "asset" | "employee" | null
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 5000);
  };

  const togglePanel = (panel) =>
    setActivePanel(prev => (prev === panel ? null : panel));

  useEffect(() => {
    async function loadAll() {
      try {
        const headers = getAuthHeaders();

        const safeFetch = async (url) => {
          try {
            const res = await fetch(url, { headers });
            if (!res.ok) return [];
            return await res.json();
          } catch (e) {
            console.error(`Failed to fetch ${url}`, e);
            return [];
          }
        };

        const [assets, employees, assignments, rolesData, requests, reports] = await Promise.all([
          safeFetch(`${API_URL}/api/assets`),
          safeFetch(`${API_URL}/api/employees`),
          safeFetch(`${API_URL}/api/assignments`),
          safeFetch(`${API_URL}/api/roles`),
          safeFetch(`${API_URL}/api/requests`),
          safeFetch(`${API_URL}/api/reports`),
        ]);

        const assetsArr = Array.isArray(assets) ? assets : [];
        const empArr = Array.isArray(employees) ? employees : [];
        const assignArr = Array.isArray(assignments) ? assignments : [];
        const reqArr = Array.isArray(requests) ? requests : [];
        const repArr = Array.isArray(reports) ? reports : [];

        setStats({
          assets: assetsArr.length,
          employees: empArr.length,
          activeAssignments: assignArr.filter(a => !a.returnedDate).length,
        });

        // 1. Assignments activities
        const assignmentActivities = assignArr.map(a => {
          const asset = typeof a.assetId === "object" && a.assetId !== null ? a.assetId : {};
          const employee = typeof a.employeeId === "object" && a.employeeId !== null ? a.employeeId : {};
          if (a.returnedDate) {
            return {
              id: `ret-${a._id}`,
              type: "return",
              text: `${asset.name || "Asset"} returned by ${employee.name || "Employee"}`,
              date: new Date(a.returnedDate),
            };
          }
          return {
            id: `asgn-${a._id}`,
            type: "assign",
            text: `${asset.name || "Asset"} assigned to ${employee.name || "Employee"}`,
            date: new Date(a.assignedDate || a.createdAt),
          };
        });

        // 2. Request activities
        const requestActivities = reqArr.map(r => {
          const assetName = r.requestedAssetId?.name || r.assetType || "Asset";
          const employeeName = r.employeeId?.name || "Employee";
          return {
            id: `req-${r._id}`,
            type: "request",
            text: `Borrow request for ${assetName} filed by ${employeeName} (${r.status})`,
            date: new Date(r.createdAt),
          };
        });

        // 3. Report activities
        const reportActivities = repArr.map(r => {
          const assetName = r.assetId?.name || "Asset";
          const employeeName = r.employeeId?.name || "Employee";
          return {
            id: `rep-${r._id}`,
            type: "report",
            text: `Damage reported on ${assetName} by ${employeeName} (${r.status})`,
            date: new Date(r.createdAt),
          };
        });

        // Build activity feed: sort all by most recent date
        const feed = [
          ...assignmentActivities,
          ...requestActivities,
          ...reportActivities
        ]
          .sort((a, b) => b.date - a.date)
          .slice(0, 5);

        // Compute departments
        const deps = new Set(empArr.map(e => e.department).filter(Boolean));
        setDbDepartments(Array.from(deps).sort());

        setActivity(feed);
        setRoles(Array.isArray(rolesData) ? rolesData : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const statCards = [
    {
      label: "Total Assets",
      value: stats.assets,
      icon: "M20 7l-8-4-8 4m16 0v10l-8 4m0-14L4 17m8 4V11",
      gradient: "from-yellow-400 to-amber-500",
      glow: "rgba(250,204,21,0.3)",
      bg: "bg-white",
    },
    {
      label: "Employees",
      value: stats.employees,
      icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm10 3a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 5v-2a5 5 0 0 0-4-4.9",
      gradient: "from-blue-400 to-blue-600",
      glow: "rgba(96,165,250,0.3)",
      bg: "bg-white",
    },
    {
      label: "Active Assignments",
      value: stats.activeAssignments,
      icon: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4",
      gradient: "from-emerald-400 to-teal-500",
      glow: "rgba(52,211,153,0.3)",
      bg: "bg-white",
    },
  ];

  const activityMeta = {
    return:  { label: "↩", bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
    assign:  { label: "↗", bg: "bg-blue-500/20",    text: "text-blue-400",    border: "border-blue-500/30" },
    request: { label: "✉", bg: "bg-amber-500/20",   text: "text-amber-400",   border: "border-amber-500/30" },
    report:  { label: "⚠", bg: "bg-red-500/20",     text: "text-red-400",     border: "border-red-500/30" },
  };

  if (loading)
    return (
      <div className="space-y-5">
        <div className="grid gap-5 md:grid-cols-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-36 rounded-3xl shimmer" />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="h-72 rounded-3xl shimmer" />
          <div className="h-72 rounded-3xl shimmer" />
        </div>
      </div>
    );

  return (
    <div className="space-y-6">

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-slate-900 border border-white/10 px-5 py-4 text-sm text-white shadow-2xl animate-toast">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold">✓</span>
          {toastMsg}
        </div>
      )}

      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of your asset management system</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid gap-5 md:grid-cols-3">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className={`relative overflow-hidden rounded-3xl ${card.bg} p-6 border border-slate-200/80 shadow-sm transition-all duration-300 card-hover animate-fade-in`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {/* Glow orb */}
            <div
              className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 pointer-events-none"
              style={{ background: `radial-gradient(circle, ${card.glow.replace("0.3","0.8")}, transparent)` }}
            />
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} mb-4`}
                 style={{ boxShadow: `0 4px 16px ${card.glow}` }}>
              <Icon d={card.icon} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{card.label}</p>
            <p className="mt-2 text-5xl font-black text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* ── Two-column grid ── */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* Recent Activity */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-sm card-hover animate-fade-in delay-200">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
              <p className="text-xs text-slate-400 mt-0.5">Latest events across the system</p>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </span>
          </div>

          <div className="space-y-1">
            {activity.length === 0 ? (
              <div className="py-10 text-center">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <p className="text-sm text-slate-400 font-medium">No activity yet</p>
              </div>
            ) : (
              activity.map((item, ai) => {
                const meta = activityMeta[item.type] || activityMeta.report;
                return (
                  <div key={item.id} style={{ animationDelay: `${ai * 60}ms` }} className="flex items-start gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-slate-50 group animate-fade-in">
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-xs font-bold ${meta.bg} ${meta.text} ${meta.border}`}>
                      {meta.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.text}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {item.date.toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-sm card-hover animate-fade-in delay-300">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
            <p className="text-xs text-slate-400 mt-0.5">Common tasks — do them right here</p>
          </div>

          <div className="space-y-3">

            {/* Add new asset */}
            <div>
              <button
                onClick={() => togglePanel("asset")}
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${
                  activePanel === "asset"
                    ? "bg-yellow-400 text-slate-900"
                    : "bg-yellow-400 text-slate-900 hover:bg-yellow-300 hover:shadow-md hover:shadow-yellow-400/20"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14"/>
                  </svg>
                  Add new asset
                </span>
                <span className="text-lg leading-none font-light">{activePanel === "asset" ? "−" : "+"}</span>
              </button>
              <QuickPanel open={activePanel === "asset"}>
                <AddAssetForm
                  onSuccess={(msg) => { showToast(msg); togglePanel(null); }}
                  onCancel={() => togglePanel(null)}
                />
              </QuickPanel>
            </div>

            {/* Register employee */}
            <div>
              <button
                onClick={() => togglePanel("employee")}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${
                  activePanel === "employee"
                    ? "border-yellow-400 bg-yellow-400 text-slate-900"
                    : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm6 3v-1a3 3 0 0 0-3-3"/>
                  </svg>
                  Register employee
                </span>
                <span className="text-lg leading-none font-light">{activePanel === "employee" ? "−" : "+"}</span>
              </button>
              <QuickPanel open={activePanel === "employee"}>
                <RegisterEmployeeForm
                  roles={roles}
                  dbDepartments={dbDepartments}
                  onSuccess={(msg) => { showToast(msg); togglePanel(null); }}
                  onCancel={() => togglePanel(null)}
                />
              </QuickPanel>
            </div>

            {/* Shortcut grid */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <CanAccess permission="assign_asset">
                <button
                  onClick={() => navigate("/dashboard/assignments")}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition"
                >
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/>
                  </svg>
                  Assignments
                </button>
              </CanAccess>
              <CanAccess permission="view_report">
                <button
                  onClick={() => navigate("/dashboard/reports")}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition"
                >
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 20V10M12 20V4M6 20v-6"/>
                  </svg>
                  Reports
                </button>
              </CanAccess>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;


