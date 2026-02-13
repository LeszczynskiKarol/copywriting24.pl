import { useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "/api";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface DashboardData {
  overview: { totalGenerations: number; todayGenerations: number; weekGenerations: number; monthGenerations: number; totalErrors: number; todayErrors: number; errorRate: string };
  users: { todayUniqueIps: number; todayUniqueFingerprints: number; totalUniqueIps: number };
  costs: { totalUsd: number; todayUsd: number; weekUsd: number; monthUsd: number; totalPln: string; monthPln: string };
  performance: { avgLatencyMs: number; todayAvgLatencyMs: number };
  tokens: { totalInput: number; totalOutput: number; total: number };
  lengthDistribution: Array<{ length: number; count: number }>;
  recentGenerations: any[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function fmt(n: number | null | undefined, decimals = 0): string {
  if (n == null) return "—";
  return n.toLocaleString("pl-PL", { maximumFractionDigits: decimals });
}
function fmtUsd(n: number | null | undefined): string {
  if (n == null) return "—";
  return "$" + n.toFixed(5);
}
function fmtMs(n: number | null | undefined): string {
  if (n == null) return "—";
  return n > 1000 ? (n / 1000).toFixed(1) + "s" : n + "ms";
}
function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function statusColor(s: string): string {
  switch (s) {
    case "completed": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
    case "error": return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
    case "generating": return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
}
function truncate(s: string, n: number): string {
  return s.length > n ? s.substring(0, n) + "…" : s;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function adminFetch(token: string, path: string, opts?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "x-admin-token": token, "Content-Type": "application/json", ...(opts?.headers || {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function adminDelete(token: string, path: string, body?: any) {
  return adminFetch(token, path, { method: "DELETE", ...(body ? { body: JSON.stringify(body) } : {}) });
}

async function adminPost(token: string, path: string, body: any) {
  return adminFetch(token, path, { method: "POST", body: JSON.stringify(body) });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Stat Card
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`p-4 rounded-xl border ${accent ? "bg-brand-50 border-brand-200 dark:bg-brand-950/30 dark:border-brand-800" : "bg-white border-gray-200 dark:bg-slate-900 dark:border-slate-700"}`}>
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${accent ? "text-brand-700 dark:text-brand-300" : "text-gray-900 dark:text-white"}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Confirm Button
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ConfirmButton({ label, confirmLabel, onConfirm, className, disabled }: { label: string; confirmLabel: string; onConfirm: () => void; className?: string; disabled?: boolean }) {
  const [confirming, setConfirming] = useState(false);
  useEffect(() => { if (confirming) { const t = setTimeout(() => setConfirming(false), 3000); return () => clearTimeout(t); } }, [confirming]);
  return (
    <button
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); if (confirming) { onConfirm(); setConfirming(false); } else { setConfirming(true); } }}
      className={`${className || ""} ${confirming ? "!bg-red-600 !text-white !border-red-600 animate-pulse" : ""}`}
    >
      {confirming ? confirmLabel : label}
    </button>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN ADMIN PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function AdminPanel() {
  const [token, setToken] = useState(() => localStorage.getItem("c24_admin_token") || "");
  const [authenticated, setAuthenticated] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [tab, setTab] = useState<"dashboard" | "generations" | "users" | "limits">("dashboard");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [generations, setGenerations] = useState<any[]>([]);
  const [genPage, setGenPage] = useState(1);
  const [genTotal, setGenTotal] = useState(0);
  const [genTotalPages, setGenTotalPages] = useState(0);
  const [genSearch, setGenSearch] = useState("");
  const [genStatus, setGenStatus] = useState("");
  const [genSort, setGenSort] = useState("createdAt");
  const [genSortDir, setGenSortDir] = useState("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");

  const [limitOverrides, setLimitOverrides] = useState<any[]>([]);
  const [newLimitIp, setNewLimitIp] = useState("");
  const [newLimitBonus, setNewLimitBonus] = useState("0");
  const [newLimitNote, setNewLimitNote] = useState("");

  const [selectedGen, setSelectedGen] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userGenerations, setUserGenerations] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [userBonus, setUserBonus] = useState("");
  const [userNote, setUserNote] = useState("");
  const [userCurrentOverride, setUserCurrentOverride] = useState<any>(null);

  const [dailyStats, setDailyStats] = useState<any[]>([]);

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(""), 4000); return () => clearTimeout(t); } }, [toast]);

  const login = useCallback(async (t: string) => {
    try {
      setError("");
      await adminFetch(t, "/admin/dashboard");
      setToken(t);
      setAuthenticated(true);
      localStorage.setItem("c24_admin_token", t);
    } catch {
      setError("Nieprawidlowy token");
      setAuthenticated(false);
    }
  }, []);

  useEffect(() => { if (token) login(token); }, []);

  const loadDashboard = useCallback(async () => {
    if (!token) return;
    try {
      const [dash, daily] = await Promise.all([adminFetch(token, "/admin/dashboard"), adminFetch(token, "/admin/stats/daily")]);
      setDashboard(dash);
      setDailyStats(daily);
    } catch (e: any) { setError(e.message); }
  }, [token]);

  const loadGenerations = useCallback(async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams({ page: String(genPage), limit: "25", sortBy: genSort, sortDir: genSortDir, ...(genSearch ? { search: genSearch } : {}), ...(genStatus ? { status: genStatus } : {}) });
      const data = await adminFetch(token, `/admin/generations?${params}`);
      setGenerations(data.generations);
      setGenTotal(data.pagination.total);
      setGenTotalPages(data.pagination.totalPages);
    } catch (e: any) { setError(e.message); }
  }, [token, genPage, genSearch, genStatus, genSort, genSortDir]);

  const loadUsers = useCallback(async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams({ limit: "50", ...(userSearch ? { search: userSearch } : {}) });
      const data = await adminFetch(token, `/admin/users?${params}`);
      setUsers(data.users);
    } catch (e: any) { setError(e.message); }
  }, [token, userSearch]);

  const loadLimits = useCallback(async () => {
    if (!token) return;
    try { setLimitOverrides(await adminFetch(token, "/admin/limits")); } catch (e: any) { setError(e.message); }
  }, [token]);

  const loadUserDetail = useCallback(async (ip: string) => {
    if (!token) return;
    try {
      const [data, limits] = await Promise.all([adminFetch(token, `/admin/user/${encodeURIComponent(ip)}`), adminFetch(token, "/admin/limits")]);
      setSelectedUser(ip);
      setUserGenerations(data.generations);
      setUserStats(data.stats);
      const existing = limits.find((o: any) => o.ip === ip);
      setUserCurrentOverride(existing || null);
      setUserBonus(existing ? String(existing.bonusToday) : "0");
      setUserNote(existing?.note || "");
    } catch (e: any) { setError(e.message); }
  }, [token]);

  const loadGenDetail = useCallback(async (id: string) => {
    if (!token) return;
    try { setSelectedGen(await adminFetch(token, `/admin/generation/${id}`)); } catch (e: any) { setError(e.message); }
  }, [token]);

  const deleteGeneration = useCallback(async (id: string) => {
    if (!token) return;
    try { await adminDelete(token, `/admin/generation/${id}`); setToast("Usunieto generacje"); setSelectedGen(null); loadGenerations(); loadDashboard(); } catch (e: any) { setError(e.message); }
  }, [token, loadGenerations, loadDashboard]);

  const deleteBulkIds = useCallback(async () => {
    if (!token || selectedIds.size === 0) return;
    try { const r = await adminDelete(token, "/admin/generations/bulk", { ids: Array.from(selectedIds) }); setToast(`Usunieto ${r.deleted} generacji`); setSelectedIds(new Set()); loadGenerations(); loadDashboard(); } catch (e: any) { setError(e.message); }
  }, [token, selectedIds, loadGenerations, loadDashboard]);

  const deleteByStatus = useCallback(async (status: string) => {
    if (!token) return;
    try { const r = await adminDelete(token, `/admin/generations/by-status?status=${status}`); setToast(`Usunieto ${r.deleted} generacji "${status}"`); loadGenerations(); loadDashboard(); } catch (e: any) { setError(e.message); }
  }, [token, loadGenerations, loadDashboard]);

  const setUserBonusLimit = useCallback(async (ip: string, bonus: number, note: string) => {
    if (!token) return;
    try { const r = await adminPost(token, `/admin/user/${encodeURIComponent(ip)}/bonus`, { bonus, note }); setToast(`Limit ${ip}: ${r.effectiveLimit}/dzien (bonus: ${bonus >= 0 ? "+" : ""}${bonus})`); setUserCurrentOverride({ bonusToday: bonus, note }); loadLimits(); } catch (e: any) { setError(e.message); }
  }, [token, loadLimits]);

  const deleteLimitOverride = useCallback(async (ip: string) => {
    if (!token) return;
    try { await adminDelete(token, `/admin/limit/${encodeURIComponent(ip)}`); setToast(`Override ${ip} usuniety (reset do 3/dzien)`); setUserCurrentOverride(null); loadLimits(); } catch (e: any) { setError(e.message); }
  }, [token, loadLimits]);

  useEffect(() => { if (authenticated && tab === "dashboard") loadDashboard(); }, [authenticated, tab, loadDashboard]);
  useEffect(() => { if (authenticated && tab === "generations") loadGenerations(); }, [authenticated, tab, loadGenerations]);
  useEffect(() => { if (authenticated && tab === "users") loadUsers(); }, [authenticated, tab, loadUsers]);
  useEffect(() => { if (authenticated && tab === "limits") loadLimits(); }, [authenticated, tab, loadLimits]);

  useEffect(() => {
    if (!authenticated) return;
    const interval = setInterval(() => { if (tab === "dashboard") loadDashboard(); if (tab === "generations") loadGenerations(); }, 30000);
    return () => clearInterval(interval);
  }, [authenticated, tab, loadDashboard, loadGenerations]);

  // ━━━ LOGIN ━━━
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Panel Admina</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Copywriting24.pl</p>
          {error && <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm">{error}</div>}
          <input type="password" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login(tokenInput)} placeholder="Admin token" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white mb-4 outline-none focus:ring-2 focus:ring-brand-500" />
          <button onClick={() => login(tokenInput)} className="w-full py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700">Zaloguj</button>
        </div>
      </div>
    );
  }

  // ━━━ GENERATION DETAIL MODAL ━━━
  const GenDetailModal = () => {
    if (!selectedGen) return null;
    const g = selectedGen;
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 pt-12 overflow-y-auto" onClick={() => setSelectedGen(null)}>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Szczegoly generacji</h2>
            <div className="flex items-center gap-2">
              <ConfirmButton label="🗑 Usun" confirmLabel="Na pewno?" onConfirm={() => deleteGeneration(g.id)} className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30" />
              <button onClick={() => setSelectedGen(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none">&times;</button>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><div className="text-xs text-gray-500">ID</div><div className="text-sm font-mono text-gray-900 dark:text-white break-all">{g.id}</div></div>
              <div><div className="text-xs text-gray-500">Status</div><div><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(g.status)}`}>{g.status}</span></div></div>
              <div><div className="text-xs text-gray-500">Data</div><div className="text-sm text-gray-900 dark:text-white">{fmtDate(g.createdAt)}</div></div>
              <div><div className="text-xs text-gray-500">Zakonczone</div><div className="text-sm text-gray-900 dark:text-white">{fmtDate(g.completedAt)}</div></div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 space-y-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Uzytkownik</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <div><span className="text-gray-500">IP:</span> <span className="font-mono text-gray-900 dark:text-white cursor-pointer hover:text-brand-600" onClick={() => { setSelectedGen(null); loadUserDetail(g.ip); }}>{g.ip}</span></div>
                <div><span className="text-gray-500">Fingerprint:</span> <span className="font-mono text-gray-900 dark:text-white break-all">{g.fingerprint}</span></div>
                <div><span className="text-gray-500">Accept-Lang:</span> <span className="text-gray-900 dark:text-white">{g.acceptLang || "—"}</span></div>
              </div>
              {g.userAgent && <div className="text-xs text-gray-400 break-all mt-1">UA: {g.userAgent}</div>}
              {g.referer && <div className="text-xs text-gray-400 break-all">Referer: {g.referer}</div>}
            </div>
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 space-y-2">
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Request</div>
              <div><span className="text-sm text-gray-500">Temat:</span> <span className="text-sm font-medium text-gray-900 dark:text-white">{g.topic}</span></div>
              <div className="flex gap-4 text-sm">
                <div><span className="text-gray-500">Zamowiona dlugosc:</span> <span className="font-medium">{fmt(g.length)} zn.</span></div>
                <div><span className="text-gray-500">Keywords:</span> <span className="font-medium">{g.keywords || "—"}</span></div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 space-y-2">
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Metryki API</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><span className="text-gray-500">Model:</span> <span className="font-mono">{g.model || "—"}</span></div>
                <div><span className="text-gray-500">Latencja:</span> <span className="font-bold">{fmtMs(g.latencyMs)}</span></div>
                <div><span className="text-gray-500">Koszt:</span> <span className="font-bold text-emerald-700 dark:text-emerald-300">{fmtUsd(g.costUsd)}</span></div>
                <div><span className="text-gray-500">Stop:</span> <span className="font-mono">{g.stopReason || "—"}</span></div>
                <div><span className="text-gray-500">Input:</span> <span className="font-mono">{fmt(g.inputTokens)}</span></div>
                <div><span className="text-gray-500">Output:</span> <span className="font-mono">{fmt(g.outputTokens)}</span></div>
                <div><span className="text-gray-500">Total:</span> <span className="font-bold">{fmt(g.totalTokens)}</span></div>
                <div><span className="text-gray-500">Prompt:</span> <span className="font-mono">{fmt(g.promptLength)} zn.</span></div>
                <div><span className="text-gray-500">HTML:</span> <span className="font-mono">{fmt(g.resultLength)} zn.</span></div>
                <div><span className="text-gray-500">Plain:</span> <span className="font-bold">{fmt(g.plainLength)} zn.</span></div>
                <div><span className="text-gray-500">Cel:</span> <span className="font-mono">{fmt(g.length)} zn.</span></div>
                <div><span className="text-gray-500">Trafnosc:</span> <span className="font-bold">{g.plainLength && g.length ? Math.round((g.plainLength / g.length) * 100) + "%" : "—"}</span></div>
              </div>
            </div>
            {g.errorMessage && (<div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20"><div className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Blad</div><pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap break-all">{g.errorMessage}</pre></div>)}
            {g.result && (<div><div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Wygenerowany tekst</div><div className="p-4 rounded-xl border border-gray-200 dark:border-slate-700 max-h-96 overflow-y-auto generated-html" dangerouslySetInnerHTML={{ __html: g.result }} /></div>)}
          </div>
        </div>
      </div>
    );
  };

  // ━━━ USER DETAIL MODAL ━━━
  const UserDetailModal = () => {
    if (!selectedUser) return null;
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 pt-12 overflow-y-auto" onClick={() => { setSelectedUser(null); setUserGenerations([]); setUserStats(null); setUserCurrentOverride(null); }}>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 w-full max-w-5xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">Uzytkownik: <span className="font-mono">{selectedUser}</span></h2>
              {userStats && <p className="text-xs text-gray-500">{userStats._count} generacji · ${(userStats._sum?.costUsd || 0).toFixed(5)} · avg {fmtMs(Math.round(userStats._avg?.latencyMs || 0))}</p>}
            </div>
            <button onClick={() => { setSelectedUser(null); setUserGenerations([]); setUserStats(null); setUserCurrentOverride(null); }} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
          <div className="p-6 space-y-4">
            {/* LIMIT OVERRIDE PANEL */}
            <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800">
              <div className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide mb-3">Zarzadzanie limitem dziennym</div>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Bonus (+/- generacji)</label>
                  <input type="number" value={userBonus} onChange={(e) => setUserBonus(e.target.value)} className="w-24 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white outline-none" placeholder="0" />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs text-gray-500 block mb-1">Notatka</label>
                  <input type="text" value={userNote} onChange={(e) => setUserNote(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white outline-none" placeholder="np. testowy user, VIP..." />
                </div>
                <button onClick={() => setUserBonusLimit(selectedUser, parseInt(userBonus) || 0, userNote)} className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700">Zapisz limit</button>
                {userCurrentOverride && (<ConfirmButton label="Reset do 3" confirmLabel="Na pewno?" onConfirm={() => deleteLimitOverride(selectedUser)} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800" />)}
              </div>
              <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                Aktualny limit: <span className="font-bold text-violet-700 dark:text-violet-300">{3 + (parseInt(userBonus) || 0)}/dzien</span>
                {userCurrentOverride && <span className="ml-2 text-xs bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full">override: +{userCurrentOverride.bonusToday}</span>}
                {!userCurrentOverride && <span className="ml-2 text-xs text-gray-400">(domyslny)</span>}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs text-gray-500 self-center mr-1">Szybkie:</span>
                {[-2, -1, 0, 2, 5, 10, 20, 50, 100].map((b) => (
                  <button key={b} onClick={() => setUserBonus(String(b))} className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${parseInt(userBonus) === b ? "bg-violet-600 text-white border-violet-600" : "border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"}`}>
                    {b >= 0 ? "+" : ""}{b} ({3 + b})
                  </button>
                ))}
              </div>
            </div>

            <table className="w-full text-xs">
              <thead><tr className="text-left text-gray-500 border-b border-gray-100 dark:border-slate-700"><th className="pb-2 pr-3">Data</th><th className="pb-2 pr-3">Temat</th><th className="pb-2 pr-3">Dl.</th><th className="pb-2 pr-3">Status</th><th className="pb-2 pr-3">Wynik</th><th className="pb-2 pr-3">Koszt</th><th className="pb-2 pr-3">Latencja</th><th className="pb-2 pr-3">Tokeny</th><th className="pb-2">Akcje</th></tr></thead>
              <tbody>
                {userGenerations.map((g) => (
                  <tr key={g.id} className="border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer">
                    <td className="py-2 pr-3 whitespace-nowrap" onClick={() => loadGenDetail(g.id)}>{fmtDate(g.createdAt)}</td>
                    <td className="py-2 pr-3 max-w-[200px] truncate" title={g.topic} onClick={() => loadGenDetail(g.id)}>{g.topic}</td>
                    <td className="py-2 pr-3 font-mono" onClick={() => loadGenDetail(g.id)}>{fmt(g.length)}</td>
                    <td className="py-2 pr-3" onClick={() => loadGenDetail(g.id)}><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColor(g.status)}`}>{g.status}</span></td>
                    <td className="py-2 pr-3 font-mono" onClick={() => loadGenDetail(g.id)}>{fmt(g.plainLength)}/{fmt(g.length)}</td>
                    <td className="py-2 pr-3 font-mono" onClick={() => loadGenDetail(g.id)}>{fmtUsd(g.costUsd)}</td>
                    <td className="py-2 pr-3" onClick={() => loadGenDetail(g.id)}>{fmtMs(g.latencyMs)}</td>
                    <td className="py-2 pr-3 font-mono" onClick={() => loadGenDetail(g.id)}>{fmt(g.totalTokens)}</td>
                    <td className="py-2"><ConfirmButton label="✕" confirmLabel="?" onConfirm={() => deleteGeneration(g.id)} className="w-6 h-6 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs flex items-center justify-center" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ━━━ HELPERS ━━━
  const toggleSelectId = (id: string) => { setSelectedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); };
  const toggleSelectAll = () => { if (selectedIds.size === generations.length) setSelectedIds(new Set()); else setSelectedIds(new Set(generations.map((g) => g.id))); };

  // ━━━ MAIN LAYOUT ━━━
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <GenDetailModal />
      <UserDetailModal />

      {toast && <div className="fixed top-4 right-4 z-[60] bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium">✓ {toast}</div>}

      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center"><span className="text-white font-black text-xs">A</span></div>
            <span className="font-bold text-gray-900 dark:text-white text-sm">Copywriting24 — Admin</span>
          </div>
          <div className="flex items-center gap-1">
            {(["dashboard", "generations", "users", "limits"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"}`}>
                {t === "dashboard" ? "Dashboard" : t === "generations" ? "Generacje" : t === "users" ? "Uzytkownicy" : "Limity"}
              </button>
            ))}
            <button onClick={() => { setAuthenticated(false); setToken(""); localStorage.removeItem("c24_admin_token"); }} className="ml-4 px-3 py-1.5 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">Wyloguj</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm">{error} <button onClick={() => setError("")} className="ml-2 underline">Zamknij</button></div>}

        {/* ━━━ DASHBOARD ━━━ */}
        {tab === "dashboard" && dashboard && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <StatCard label="Dzis" value={fmt(dashboard.overview.todayGenerations)} sub={`${dashboard.users.todayUniqueIps} IP`} accent />
              <StatCard label="Tydzien" value={fmt(dashboard.overview.weekGenerations)} />
              <StatCard label="Miesiac" value={fmt(dashboard.overview.monthGenerations)} />
              <StatCard label="Lacznie" value={fmt(dashboard.overview.totalGenerations)} sub={`${dashboard.users.totalUniqueIps} IP`} />
              <StatCard label="Bledy dzis" value={String(dashboard.overview.todayErrors)} sub={`Ogolem: ${dashboard.overview.errorRate}`} />
              <StatCard label="Avg latencja" value={fmtMs(dashboard.performance.todayAvgLatencyMs)} sub={`Ogolem: ${fmtMs(dashboard.performance.avgLatencyMs)}`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Koszt dzis" value={fmtUsd(dashboard.costs.todayUsd)} accent />
              <StatCard label="Koszt tydzien" value={fmtUsd(dashboard.costs.weekUsd)} />
              <StatCard label="Koszt miesiac" value={fmtUsd(dashboard.costs.monthUsd)} sub={`~${dashboard.costs.monthPln} PLN`} />
              <StatCard label="Koszt lacznie" value={fmtUsd(dashboard.costs.totalUsd)} sub={`~${dashboard.costs.totalPln} PLN`} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Input tokens" value={fmt(dashboard.tokens.totalInput)} />
              <StatCard label="Output tokens" value={fmt(dashboard.tokens.totalOutput)} />
              <StatCard label="Lacznie tokens" value={fmt(dashboard.tokens.total)} />
            </div>

            {/* BULK ACTIONS */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Szybkie akcje</h3>
              <div className="flex flex-wrap gap-2">
                <ConfirmButton label="🗑 Usun pending" confirmLabel="Potwierdzam!" onConfirm={() => deleteByStatus("pending")} className="px-4 py-2 rounded-lg border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 text-sm font-medium hover:bg-orange-50 dark:hover:bg-orange-950/30" />
                <ConfirmButton label="🗑 Usun error" confirmLabel="Potwierdzam!" onConfirm={() => deleteByStatus("error")} className="px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30" />
                <ConfirmButton label="🗑 Usun generating" confirmLabel="Potwierdzam!" onConfirm={() => deleteByStatus("generating")} className="px-4 py-2 rounded-lg border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-950/30" />
                <button onClick={() => { loadDashboard(); setToast("Odswiezono"); }} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 text-sm hover:bg-gray-100 dark:hover:bg-slate-800">🔄 Odswiez</button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Rozklad dlugosci</h3>
              <div className="flex gap-4">
                {dashboard.lengthDistribution.map((d) => (<div key={d.length} className="flex-1 text-center"><div className="text-lg font-bold text-brand-600 dark:text-brand-400">{d.count}</div><div className="text-xs text-gray-500">{fmt(d.length)} zn.</div></div>))}
              </div>
            </div>

            {dailyStats.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4 overflow-x-auto">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Ostatnie 30 dni</h3>
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-gray-500 border-b border-gray-100 dark:border-slate-700"><th className="pb-2 pr-4">Data</th><th className="pb-2 pr-4">Generacje</th><th className="pb-2 pr-4">Unikalne IP</th><th className="pb-2 pr-4">Koszt</th><th className="pb-2 pr-4">Avg latencja</th><th className="pb-2">Tokeny</th></tr></thead>
                  <tbody>{dailyStats.map((d) => (<tr key={d.date} className="border-b border-gray-50 dark:border-slate-800"><td className="py-1.5 pr-4 whitespace-nowrap">{new Date(d.date).toLocaleDateString("pl-PL")}</td><td className="py-1.5 pr-4 font-bold">{d.count}</td><td className="py-1.5 pr-4">{d.uniqueIps}</td><td className="py-1.5 pr-4 font-mono">{fmtUsd(d.cost)}</td><td className="py-1.5 pr-4">{fmtMs(d.avgLatency)}</td><td className="py-1.5 font-mono">{fmt(d.tokens)}</td></tr>))}</tbody>
                </table>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Ostatnie generacje</h3>
              <table className="w-full text-xs">
                <thead><tr className="text-left text-gray-500 border-b border-gray-100 dark:border-slate-700"><th className="pb-2 pr-3">Data</th><th className="pb-2 pr-3">IP</th><th className="pb-2 pr-3">Temat</th><th className="pb-2 pr-3">Dl.</th><th className="pb-2 pr-3">Status</th><th className="pb-2 pr-3">Koszt</th><th className="pb-2 pr-3">Latencja</th><th className="pb-2">Akcje</th></tr></thead>
                <tbody>
                  {dashboard.recentGenerations.map((g) => (
                    <tr key={g.id} className="border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => loadGenDetail(g.id)}>
                      <td className="py-2 pr-3 whitespace-nowrap">{fmtDate(g.createdAt)}</td>
                      <td className="py-2 pr-3 font-mono">{g.ip}</td>
                      <td className="py-2 pr-3 max-w-[200px] truncate" title={g.topic}>{truncate(g.topic, 40)}</td>
                      <td className="py-2 pr-3 font-mono">{fmt(g.length)}</td>
                      <td className="py-2 pr-3"><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColor(g.status)}`}>{g.status}</span></td>
                      <td className="py-2 pr-3 font-mono">{fmtUsd(g.costUsd)}</td>
                      <td className="py-2 pr-3">{fmtMs(g.latencyMs)}</td>
                      <td className="py-2" onClick={(e) => e.stopPropagation()}><ConfirmButton label="✕" confirmLabel="?" onConfirm={() => deleteGeneration(g.id)} className="w-6 h-6 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs flex items-center justify-center" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ━━━ GENERATIONS ━━━ */}
        {tab === "generations" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <input value={genSearch} onChange={(e) => { setGenSearch(e.target.value); setGenPage(1); }} placeholder="Szukaj tematu..." className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white w-64 outline-none focus:ring-2 focus:ring-brand-500" />
              <select value={genStatus} onChange={(e) => { setGenStatus(e.target.value); setGenPage(1); }} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white outline-none">
                <option value="">Wszystkie</option><option value="completed">Completed</option><option value="error">Error</option><option value="generating">Generating</option><option value="pending">Pending</option>
              </select>
              <select value={genSort} onChange={(e) => setGenSort(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white outline-none">
                <option value="createdAt">Data</option><option value="costUsd">Koszt</option><option value="latencyMs">Latencja</option><option value="totalTokens">Tokeny</option><option value="resultLength">Dlugosc</option>
              </select>
              <button onClick={() => setGenSortDir((d) => d === "desc" ? "asc" : "desc")} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm">{genSortDir === "desc" ? "↓ Newest" : "↑ Oldest"}</button>
              {selectedIds.size > 0 && <ConfirmButton label={`🗑 Usun zaznaczone (${selectedIds.size})`} confirmLabel={`Usunac ${selectedIds.size}?`} onConfirm={deleteBulkIds} className="px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30" />}
              {genStatus && <ConfirmButton label={`🗑 Usun "${genStatus}"`} confirmLabel={`Na pewno?`} onConfirm={() => deleteByStatus(genStatus)} className="px-3 py-2 rounded-lg border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 text-sm font-medium hover:bg-orange-50 dark:hover:bg-orange-950/30" />}
              <span className="text-xs text-gray-500 ml-auto">{fmt(genTotal)} generacji</span>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="text-left text-gray-500 border-b border-gray-100 dark:border-slate-700">
                  <th className="px-3 py-3 w-8"><input type="checkbox" checked={generations.length > 0 && selectedIds.size === generations.length} onChange={toggleSelectAll} className="rounded" /></th>
                  <th className="px-3 py-3">Data</th><th className="px-3 py-3">IP</th><th className="px-3 py-3">Temat</th><th className="px-3 py-3">Cel</th><th className="px-3 py-3">Wynik</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Koszt</th><th className="px-3 py-3">Latencja</th><th className="px-3 py-3">Tokeny</th><th className="px-3 py-3">Akcje</th>
                </tr></thead>
                <tbody>
                  {generations.map((g) => (
                    <tr key={g.id} className={`border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer ${selectedIds.has(g.id) ? "bg-brand-50 dark:bg-brand-950/20" : ""}`}>
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.has(g.id)} onChange={() => toggleSelectId(g.id)} className="rounded" /></td>
                      <td className="px-3 py-2.5 whitespace-nowrap" onClick={() => loadGenDetail(g.id)}>{fmtDate(g.createdAt)}</td>
                      <td className="px-3 py-2.5 font-mono cursor-pointer hover:text-brand-600" onClick={(e) => { e.stopPropagation(); loadUserDetail(g.ip); }}>{g.ip}</td>
                      <td className="px-3 py-2.5 max-w-[180px] truncate" title={g.topic} onClick={() => loadGenDetail(g.id)}>{truncate(g.topic, 35)}</td>
                      <td className="px-3 py-2.5 font-mono" onClick={() => loadGenDetail(g.id)}>{fmt(g.length)}</td>
                      <td className="px-3 py-2.5 font-mono" onClick={() => loadGenDetail(g.id)}>{fmt(g.plainLength)}</td>
                      <td className="px-3 py-2.5" onClick={() => loadGenDetail(g.id)}><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColor(g.status)}`}>{g.status}</span></td>
                      <td className="px-3 py-2.5 font-mono" onClick={() => loadGenDetail(g.id)}>{fmtUsd(g.costUsd)}</td>
                      <td className="px-3 py-2.5" onClick={() => loadGenDetail(g.id)}>{fmtMs(g.latencyMs)}</td>
                      <td className="px-3 py-2.5 font-mono" onClick={() => loadGenDetail(g.id)}>{fmt(g.inputTokens)}/{fmt(g.outputTokens)}</td>
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}><ConfirmButton label="✕" confirmLabel="?" onConfirm={() => deleteGeneration(g.id)} className="w-6 h-6 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs flex items-center justify-center" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between">
              <button disabled={genPage <= 1} onClick={() => setGenPage((p) => p - 1)} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-sm disabled:opacity-30">← Poprzednia</button>
              <span className="text-sm text-gray-500">Strona {genPage} z {genTotalPages}</span>
              <button disabled={genPage >= genTotalPages} onClick={() => setGenPage((p) => p + 1)} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-sm disabled:opacity-30">Nastepna →</button>
            </div>
          </div>
        )}

        {/* ━━━ USERS ━━━ */}
        {tab === "users" && (
          <div className="space-y-4">
            <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Szukaj IP lub tematu..." className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm w-64 outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-white" />
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="text-left text-gray-500 border-b border-gray-100 dark:border-slate-700"><th className="px-4 py-3">IP</th><th className="px-3 py-3">Fingerprint</th><th className="px-3 py-3">Generacje</th><th className="px-3 py-3">Dzis</th><th className="px-3 py-3">Bledy</th><th className="px-3 py-3">Koszt</th><th className="px-3 py-3">Tokeny</th><th className="px-3 py-3">Avg latencja</th><th className="px-3 py-3">Pierwszy</th><th className="px-3 py-3">Ostatni</th></tr></thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={i} className="border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => loadUserDetail(u.ip)}>
                      <td className="px-4 py-2.5 font-mono font-medium text-gray-900 dark:text-white">{u.ip}</td>
                      <td className="px-3 py-2.5 font-mono text-gray-500 max-w-[120px] truncate">{u.fingerprint}</td>
                      <td className="px-3 py-2.5 font-bold">{u.total_generations}</td>
                      <td className="px-3 py-2.5"><span className={u.today_count >= 3 ? "text-red-600 font-bold" : ""}>{u.today_count}</span></td>
                      <td className="px-3 py-2.5"><span className={u.errors > 0 ? "text-red-600" : "text-gray-400"}>{u.errors}</span></td>
                      <td className="px-3 py-2.5 font-mono">{fmtUsd(u.total_cost)}</td>
                      <td className="px-3 py-2.5 font-mono">{fmt(u.total_tokens)}</td>
                      <td className="px-3 py-2.5">{fmtMs(u.avg_latency)}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{fmtDate(u.first_seen)}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{fmtDate(u.last_seen)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ━━━ LIMITS ━━━ */}
        {tab === "limits" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Dodaj/zmien override limitu</h3>
              <div className="flex flex-wrap items-end gap-3">
                <div><label className="text-xs text-gray-500 block mb-1">Adres IP</label><input type="text" value={newLimitIp} onChange={(e) => setNewLimitIp(e.target.value)} className="w-48 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white outline-none font-mono" placeholder="np. 127.0.0.1" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Bonus generacji</label><input type="number" value={newLimitBonus} onChange={(e) => setNewLimitBonus(e.target.value)} className="w-24 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white outline-none" placeholder="0" /></div>
                <div className="flex-1 min-w-[200px]"><label className="text-xs text-gray-500 block mb-1">Notatka</label><input type="text" value={newLimitNote} onChange={(e) => setNewLimitNote(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white outline-none" placeholder="opcjonalna notatka..." /></div>
                <button onClick={async () => { if (!newLimitIp.trim()) return; await setUserBonusLimit(newLimitIp.trim(), parseInt(newLimitBonus) || 0, newLimitNote); setNewLimitIp(""); setNewLimitBonus("0"); setNewLimitNote(""); }} disabled={!newLimitIp.trim()} className="px-5 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-40">Zapisz</button>
              </div>
              <div className="mt-2 text-xs text-gray-500">Domyslny limit: 3/dzien. Bonus +5 = 8/dzien. Bonus -2 = 1/dzien.</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Aktywne overrides ({limitOverrides.length})</h3>
              {limitOverrides.length === 0 ? (<div className="text-sm text-gray-500 py-4 text-center">Brak overrides — wszyscy maja domyslny limit 3/dzien</div>) : (
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-gray-500 border-b border-gray-100 dark:border-slate-700"><th className="pb-2 pr-4">IP</th><th className="pb-2 pr-4">Bonus</th><th className="pb-2 pr-4">Efektywny limit</th><th className="pb-2 pr-4">Notatka</th><th className="pb-2 pr-4">Zmieniono</th><th className="pb-2">Akcje</th></tr></thead>
                  <tbody>
                    {limitOverrides.map((o) => (
                      <tr key={o.id} className="border-b border-gray-50 dark:border-slate-800">
                        <td className="py-2.5 pr-4 font-mono font-medium text-gray-900 dark:text-white cursor-pointer hover:text-brand-600" onClick={() => loadUserDetail(o.ip)}>{o.ip}</td>
                        <td className="py-2.5 pr-4"><span className={`font-bold ${o.bonusToday > 0 ? "text-emerald-600" : o.bonusToday < 0 ? "text-red-600" : "text-gray-500"}`}>{o.bonusToday >= 0 ? "+" : ""}{o.bonusToday}</span></td>
                        <td className="py-2.5 pr-4 font-bold text-violet-700 dark:text-violet-300">{o.effectiveLimit}/dzien</td>
                        <td className="py-2.5 pr-4 text-gray-500 max-w-[200px] truncate">{o.note || "—"}</td>
                        <td className="py-2.5 pr-4 whitespace-nowrap">{fmtDate(o.updatedAt)}</td>
                        <td className="py-2.5"><ConfirmButton label="Usun" confirmLabel="Na pewno?" onConfirm={() => deleteLimitOverride(o.ip)} className="px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-950/30" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}