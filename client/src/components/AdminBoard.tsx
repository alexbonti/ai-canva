import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { fetchAdminStats, type AdminStats } from "../lib/admin.js";

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + " " + units[i];
}

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  accent: string;
}

function StatCard({ label, value, sub, icon, accent }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="text-3xl font-bold" style={{ color: accent }}>{value}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

export default function AdminBoard({ user, onBack }: { user: User; onBack: () => void }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setStats(await fetchAdminStats(user));
    } catch (err: any) {
      setError(err.message || "Failed to load admin stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-100">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">🛠️ Admin Board</h1>
            <p className="text-sm text-slate-500">System-wide usage for AI Canva</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>
            <button
              onClick={onBack}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 transition"
            >
              ← Back to canvas
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            <span className="font-medium">Could not load stats:</span> {error}
          </div>
        )}

        {loading && !stats && (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <span className="animate-spin mr-2">⏳</span> Loading stats...
          </div>
        )}

        {stats && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <StatCard label="Total Users" value={String(stats.users.total)} icon="👥" accent="#3b82f6" />
              <StatCard label="Active Now" value={String(stats.users.activeLast5m)} sub="last 5 minutes" icon="🟢" accent="#22c55e" />
              <StatCard label="New Users" value={String(stats.users.newLast7d)} sub="last 7 days" icon="✨" accent="#8b5cf6" />
              <StatCard label="Total Boards" value={String(stats.boards.total)} icon="📋" accent="#f59e0b" />
              <StatCard label="New Boards" value={String(stats.boards.newLast7d)} sub="last 7 days" icon="🆕" accent="#ec4899" />
              <StatCard label="Storage Used" value={formatBytes(stats.storage.bytes)} sub={stats.storage.files + " files"} icon="💾" accent="#14b8a6" />
            </div>

            {/* Footer note */}
            <div className="text-xs text-slate-400">
              Last updated {new Date(stats.generatedAt).toLocaleString()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
