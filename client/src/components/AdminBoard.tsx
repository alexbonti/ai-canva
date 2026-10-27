import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import {
  fetchAdminStats,
  fetchUsers,
  setUserBlocked,
  setFacilitatorRole,
  type AdminStats,
  type AdminUser,
} from "../lib/admin.js";
import { Button } from "./ui/Button.js";
import { Icon } from "./ui/Icon.js";

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + " " + units[i];
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function formatNum(n: number): string {
  return (n || 0).toLocaleString("en-US");
}

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  /** Fills the rest of the grid row (the totals strip); keeps the hairline grid closed. */
  wide?: boolean;
}

/**
 * One figure in the printed stat grid: a small-caps caption with its glyph, the
 * number at Archivo display scale, and a mono caption for the qualifying fact.
 * The grid itself draws the hairlines (gap-px over the rule colour), so the cells
 * carry no borders of their own.
 */
function StatCard({ label, value, sub, icon, wide = false }: StatCardProps) {
  return (
    <div className={"bg-card px-4 py-3" + (wide ? " col-span-2 md:col-span-3" : "")}>
      <div className="flex items-center gap-1.5 text-ink-muted">
        <Icon name={icon} size={12} />
        <span className="label-caps">{label}</span>
      </div>
      <div className="mt-1.5 text-[30px] font-bold leading-none tracking-tight text-ink tabular-nums">
        {value}
      </div>
      {sub && <div className="data-mono mt-1.5 text-ink-muted">{sub}</div>}
    </div>
  );
}

type Tab = "overview" | "users";

/**
 * Admin Board — system-wide usage and user management.
 *
 * Styling follows "The Printed Line": paper ground, hairline-ruled stat grid,
 * lead figures in Archivo with mono captions, and one table with uppercase mono
 * column headers, tabular numerals and zebra-free ruled rows. Tabs are small-caps
 * buttons with an ink underline for the active one.
 */
export default function AdminBoard({ user, onBack }: { user: User; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");

  // Overview stats
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Users list
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  const loadStats = async (silent = false) => {
    if (!silent) setStatsLoading(true);
    setStatsError(null);
    try {
      setStats(await fetchAdminStats(user));
    } catch (err: any) {
      setStatsError(err.message || "Failed to load admin stats");
    } finally {
      setStatsLoading(false);
    }
  };

  const loadUsers = async (pageToken?: string) => {
    setUsersError(null);
    if (!pageToken) setUsersLoading(true);
    try {
      const res = await fetchUsers(user, pageToken);
      if (pageToken) {
        setUsers((prev) => [...prev, ...res.users]);
      } else {
        setUsers(res.users);
      }
      setNextPageToken(res.nextPageToken);
    } catch (err: any) {
      setUsersError(err.message || "Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (tab === "users" && users.length === 0) loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleToggleFacilitator = async (target: AdminUser) => {
    setBusyUid(target.uid);
    try {
      await setFacilitatorRole(user, target.uid, !target.facilitator);
      setUsers((prev) => prev.map((u) => (u.uid === target.uid ? { ...u, facilitator: !u.facilitator } : u)));
    } catch (err: any) {
      alert(err?.message || "Failed to update role");
    } finally {
      setBusyUid(null);
    }
  };

  const handleToggleBlock = async (target: AdminUser) => {
    const action = target.disabled ? "unblock" : "block";
    if (!confirm(`Are you sure you want to ${action} ${target.email || target.uid}?`)) return;
    setBusyUid(target.uid);
    try {
      await setUserBlocked(user, target.uid, !target.disabled);
      setUsers((prev) => prev.map((u) => (u.uid === target.uid ? { ...u, disabled: !u.disabled } : u)));
    } catch (err: any) {
      alert(err.message || `Failed to ${action} user`);
    } finally {
      setBusyUid(null);
    }
  };

  const chip = (tone: "ok" | "error" | "pine" | "muted") =>
    "inline-flex h-[18px] items-center rounded-xs border px-1.5 data-mono uppercase " +
    (tone === "ok"
      ? "border-[rgba(46,125,79,0.28)] bg-[rgba(46,125,79,0.10)] text-state-ok"
      : tone === "error"
        ? "border-[rgba(179,58,43,0.28)] bg-[rgba(179,58,43,0.10)] text-state-error"
        : tone === "pine"
          ? "border-[rgba(18,50,41,0.22)] bg-[rgba(18,50,41,0.06)] text-pine"
          : "border-rule bg-card text-ink-muted");

  return (
    <div className="h-full w-full overflow-y-auto bg-paper">
      <div className="mx-auto max-w-5xl px-6 py-6">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-rule pb-4">
          <div>
            <p className="label-caps text-ink-muted">System</p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold leading-tight tracking-tight text-ink">
              <Icon name="admin" size={20} className="text-pine" />
              Admin Board
            </h1>
            <p className="mt-1 text-[12.5px] text-ink-muted">System-wide management for AI Canva</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={onBack}
            icon={<Icon name="arrowRight" size={14} className="rotate-180" />}
          >
            Back to canvas
          </Button>
        </div>

        {/* Tabs — small caps with an ink underline, never pills */}
        <div className="mb-5 flex items-center gap-5 border-b border-rule">
          {(["overview", "users"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={
                "label-caps -mb-px flex items-center gap-1.5 border-b-2 px-0.5 pb-2 pt-1 transition-colors " +
                (tab === t
                  ? "border-ink text-ink"
                  : "border-transparent text-ink-muted hover:border-rule-strong hover:text-ink")
              }
            >
              <Icon name={t === "overview" ? "panel" : "users"} size={12} />
              {t === "overview" ? "Overview" : "Users"}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <>
            {statsError && (
              <div className="mb-5 flex items-start gap-2 rounded-sm border border-[rgba(179,58,43,0.28)] bg-[rgba(179,58,43,0.06)] px-3 py-2 text-[12px] leading-snug text-state-error">
                <Icon name="alert" size={13} className="mt-[1px]" />
                <span>
                  <span className="font-semibold">Could not load stats:</span> {statsError}
                </span>
              </div>
            )}

            {statsLoading && !stats && (
              <div className="flex items-center justify-center gap-2 border-t border-rule py-20 text-[12px] text-ink-muted">
                <Icon name="loader" size={14} className="animate-spin" />
                Loading stats…
              </div>
            )}

            {stats && (
              <>
                <div className="mb-4 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-rule bg-rule md:grid-cols-3">
                  <StatCard label="Total Users" value={String(stats.users.total)} icon="users" />
                  <StatCard
                    label="Active Now"
                    value={String(stats.users.activeLast5m)}
                    sub="last 5 minutes"
                    icon="station"
                  />
                  <StatCard
                    label="New Users"
                    value={String(stats.users.newLast7d)}
                    sub="last 7 days"
                    icon="plus"
                  />
                  <StatCard label="Total Boards" value={String(stats.boards.total)} icon="boards" />
                  <StatCard
                    label="New Boards"
                    value={String(stats.boards.newLast7d)}
                    sub="last 7 days"
                    icon="plus"
                  />
                  <StatCard
                    label="Storage Used"
                    value={formatBytes(stats.storage.bytes)}
                    sub={stats.storage.files + " files"}
                    icon="file"
                  />
                  <StatCard
                    label="LLM Tokens Used"
                    value={formatNum(stats.tokens.totalTokens)}
                    sub={
                      formatNum(stats.tokens.promptTokens) + " in · " + formatNum(stats.tokens.completionTokens) + " out"
                    }
                    icon="zap"
                    wide
                  />
                </div>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-3">
                  <span className="data-mono text-ink-muted">
                    Last updated {new Date(stats.generatedAt).toLocaleString()}
                  </span>
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => loadStats(true)}
                    disabled={statsLoading}
                    icon={<Icon name="rotate" size={12} />}
                  >
                    {statsLoading ? "Refreshing…" : "Refresh"}
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        {tab === "users" && (
          <div className="overflow-hidden rounded-md border border-rule bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule bg-paper-raised px-4 py-2.5">
              <span className="label-caps flex items-center gap-1.5 text-ink-muted">
                <Icon name="users" size={12} />
                Registered users
                <span className="data-mono normal-case text-ink-muted">({users.length})</span>
              </span>
              <Button
                variant="secondary"
                size="xs"
                onClick={() => loadUsers()}
                disabled={usersLoading}
                icon={<Icon name="rotate" size={12} />}
              >
                {usersLoading ? "Loading…" : "Refresh"}
              </Button>
            </div>

            {usersError && (
              <div className="flex items-start gap-2 border-b border-[rgba(179,58,43,0.28)] bg-[rgba(179,58,43,0.06)] px-4 py-2 text-[12px] leading-snug text-state-error">
                <Icon name="alert" size={13} className="mt-[1px]" />
                <span className="flex-1">{usersError}</span>
              </div>
            )}

            {usersLoading && users.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-16 text-[12px] text-ink-muted">
                <Icon name="loader" size={14} className="animate-spin" />
                Loading users…
              </div>
            )}

            {!usersLoading && usersError && users.length === 0 && (
              <div className="py-16 text-center text-[12px] text-ink-muted">Could not load users.</div>
            )}

            {!usersLoading && !usersError && users.length === 0 && (
              <div className="py-16 text-center text-[12px] text-ink-muted">
                No users yet — accounts appear here after their first sign-in.
              </div>
            )}

            {users.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-rule text-left">
                      <th className="data-mono px-4 py-2 font-medium uppercase text-ink-muted">User</th>
                      <th className="data-mono px-4 py-2 font-medium uppercase text-ink-muted">Status</th>
                      <th className="data-mono px-4 py-2 font-medium uppercase text-ink-muted">Role</th>
                      <th className="data-mono hidden px-4 py-2 text-right font-medium uppercase text-ink-muted md:table-cell">
                        <span className="inline-flex items-center gap-1">
                          Tokens
                          <Icon name="arrowRight" size={10} className="-rotate-90" />
                        </span>
                      </th>
                      <th className="data-mono hidden px-4 py-2 text-right font-medium uppercase text-ink-muted md:table-cell">
                        <span className="inline-flex items-center gap-1">
                          Tokens
                          <Icon name="arrowRight" size={10} className="rotate-90" />
                        </span>
                      </th>
                      <th className="data-mono hidden px-4 py-2 font-medium uppercase text-ink-muted lg:table-cell">
                        Signed Up
                      </th>
                      <th className="data-mono hidden px-4 py-2 font-medium uppercase text-ink-muted xl:table-cell">
                        Last Sign-in
                      </th>
                      <th className="data-mono px-4 py-2 text-right font-medium uppercase text-ink-muted">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.uid}
                        className="border-b border-rule transition-colors last:border-b-0 hover:bg-paper-raised"
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            {u.photoURL ? (
                              <img src={u.photoURL} alt="" className="h-7 w-7 flex-shrink-0 rounded-pill border border-rule" />
                            ) : (
                              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-pill border border-rule bg-paper-raised text-[11px] font-bold text-ink-muted">
                                {(u.displayName || u.email || "?").slice(0, 1).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="truncate text-[12.5px] font-medium text-ink">{u.displayName || "—"}</div>
                              <div className="data-mono truncate text-ink-muted">{u.email || u.uid}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={chip(u.disabled ? "error" : "ok")}>
                            {u.disabled ? "Blocked" : "Active"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className={chip(u.facilitator ? "pine" : "muted")}>
                              {u.facilitator ? "Facilitator" : "—"}
                            </span>
                            {u.uid !== user.uid && (
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => handleToggleFacilitator(u)}
                                disabled={busyUid === u.uid}
                                title={u.facilitator ? "Revoke the facilitator role" : "Grant the facilitator role"}
                              >
                                {u.facilitator ? "Revoke" : "Grant"}
                              </Button>
                            )}
                          </div>
                        </td>
                        <td className="data-mono hidden px-4 py-2.5 text-right tabular-nums text-ink-soft md:table-cell">
                          {formatNum(u.tokens?.promptTokens)}
                        </td>
                        <td className="data-mono hidden px-4 py-2.5 text-right tabular-nums text-ink-soft md:table-cell">
                          {formatNum(u.tokens?.completionTokens)}
                        </td>
                        <td className="data-mono hidden px-4 py-2.5 text-ink-muted lg:table-cell">
                          {formatDate(u.createdAt)}
                        </td>
                        <td className="data-mono hidden px-4 py-2.5 text-ink-muted xl:table-cell">
                          {formatDate(u.lastSignIn)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {u.uid === user.uid ? (
                            <span className="data-mono text-ink-muted">(you)</span>
                          ) : (
                            <Button
                              variant={u.disabled ? "secondary" : "danger"}
                              size="xs"
                              onClick={() => handleToggleBlock(u)}
                              disabled={busyUid === u.uid}
                            >
                              {busyUid === u.uid ? "…" : u.disabled ? "Unblock" : "Block"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {nextPageToken && (
              <div className="border-t border-rule px-4 py-2.5">
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => loadUsers(nextPageToken)}
                  disabled={usersLoading}
                  icon={<Icon name="arrowRight" size={12} className="rotate-90" />}
                >
                  {usersLoading ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
