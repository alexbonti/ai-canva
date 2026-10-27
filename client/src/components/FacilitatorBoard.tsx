import { useCallback, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { deleteBoard, listTemplateBoards, type BoardDoc } from "../lib/firestore.js";
import {
  MAX_TEAM_MEMBERS,
  createTeamFromTemplate,
  createTemplateBoard,
  createWorkshop,
  deleteTeam,
  deleteWorkshop,
  listCodes,
  listTeams,
  listWorkshops,
  regenerateCode,
  setBoardTemplate,
  type SeatCode,
  type Team,
  type Workshop,
} from "../lib/workshop.js";
import { Button } from "./ui/Button.js";
import { Icon } from "./ui/Icon.js";

type Tab = "templates" | "workshops" | "teams";

interface FacilitatorBoardProps {
  user: User;
  onBack: () => void;
  /** Opens a board in the editor (used for templates). */
  onOpenBoard: (boardId: string) => void;
}

/** Shared field styling: card stock, hairline rule, 13px ink. */
const FIELD =
  "h-8 min-w-0 rounded-sm border border-rule bg-card px-2.5 text-[12.5px] text-ink " +
  "placeholder:text-ink-muted disabled:opacity-45";

/**
 * Facilitator Dashboard — for facilitators and admins. Three tabs:
 *  - Templates: workshop board templates (ordinary boards flagged isTemplate)
 *  - Workshops: create/manage workshops
 *  - Teams: workshop-scoped teams of up to 5 guests, created from templates,
 *    with per-seat join codes
 *
 * Styling follows "The Printed Line": a card-stock header, small-caps tabs with
 * an ink underline, ruled lists instead of stacked cards, and mono codes, counts
 * and timestamps. Each tab keeps a real empty state.
 */
export default function FacilitatorBoard({ user, onBack, onOpenBoard }: FacilitatorBoardProps) {
  const [tab, setTab] = useState<Tab>("workshops");

  // Templates
  const [templates, setTemplates] = useState<BoardDoc[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // Workshops
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [workshopName, setWorkshopName] = useState("");
  const [workshopDesc, setWorkshopDesc] = useState("");
  const [workshopsLoading, setWorkshopsLoading] = useState(false);

  // Teams
  const [selectedWorkshopId, setSelectedWorkshopId] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [codesByTeam, setCodesByTeam] = useState<Record<string, SeatCode[]>>({});
  const [teamName, setTeamName] = useState("");
  const [teamTemplateId, setTeamTemplateId] = useState("");
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");

  const me = { uid: user.uid, email: user.email || "" };

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      setTemplates(await listTemplateBoards(user.uid));
    } catch (err) {
      console.error("[facilitator] templates load failed:", err);
    } finally {
      setTemplatesLoading(false);
    }
  }, [user.uid]);

  const loadWorkshops = useCallback(async () => {
    setWorkshopsLoading(true);
    try {
      const ws = await listWorkshops(user.uid);
      setWorkshops(ws);
      setSelectedWorkshopId((prev) => prev || ws[0]?.id || "");
    } catch (err) {
      console.error("[facilitator] workshops load failed:", err);
    } finally {
      setWorkshopsLoading(false);
    }
  }, [user.uid]);

  const loadTeams = useCallback(async (workshopId: string) => {
    if (!workshopId) {
      setTeams([]);
      setCodesByTeam({});
      return;
    }
    setTeamsLoading(true);
    try {
      const ts = await listTeams(workshopId);
      setTeams(ts);
      const codeEntries = await Promise.all(
        ts.map(async (t) => [t.id, t.boardId ? await listCodes(t.id).catch(() => []) : []] as const)
      );
      setCodesByTeam(Object.fromEntries(codeEntries));
    } catch (err) {
      console.error("[facilitator] teams load failed:", err);
    } finally {
      setTeamsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
    loadWorkshops();
  }, [loadTemplates, loadWorkshops]);

  useEffect(() => {
    loadTeams(selectedWorkshopId);
  }, [selectedWorkshopId, loadTeams]);

  const run = async (fn: () => Promise<void>) => {
    setError("");
    try {
      await fn();
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(""), 1500);
  };

  return (
    <div className="flex h-full w-full flex-col bg-paper">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule bg-card px-5 py-3">
        <h1 className="flex items-center gap-2 text-[15px] font-bold leading-tight tracking-tight text-ink">
          <Icon name="facilitator" size={16} className="text-pine" />
          Facilitator Dashboard
        </h1>
        <Button
          variant="secondary"
          size="sm"
          onClick={onBack}
          icon={<Icon name="arrowRight" size={14} className="rotate-180" />}
        >
          Back to board
        </Button>
      </div>

      {/* Tabs — small caps, ink underline on the active one */}
      <div className="flex items-center gap-5 border-b border-rule bg-card px-5">
        {(["workshops", "teams", "templates"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              "label-caps -mb-px border-b-2 px-0.5 pb-2 pt-2.5 transition-colors " +
              (tab === t
                ? "border-ink text-ink"
                : "border-transparent text-ink-muted hover:border-rule-strong hover:text-ink")
            }
          >
            {t}
          </button>
        ))}
      </div>

      {error && (
        <div className="mx-5 mt-3 flex items-start gap-2 rounded-sm border border-[rgba(179,58,43,0.28)] bg-[rgba(179,58,43,0.06)] px-3 py-2 text-[12px] leading-snug text-state-error">
          <Icon name="alert" size={13} className="mt-[1px]" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {/* ===== WORKSHOPS ===== */}
        {tab === "workshops" && (
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="overflow-hidden rounded-md border border-rule bg-card">
              <div className="border-b border-rule bg-paper-raised px-3.5 py-2">
                <h2 className="label-caps text-ink-muted">New workshop</h2>
              </div>
              <div className="flex flex-col gap-2 p-3.5 sm:flex-row">
                <input
                  className={FIELD + " flex-1"}
                  placeholder="Workshop name (e.g. Design Thinking 101)"
                  value={workshopName}
                  onChange={(e) => setWorkshopName(e.target.value)}
                />
                <input
                  className={FIELD + " flex-1"}
                  placeholder="Description (optional)"
                  value={workshopDesc}
                  onChange={(e) => setWorkshopDesc(e.target.value)}
                />
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!workshopName.trim() || workshopsLoading}
                  onClick={() =>
                    run(async () => {
                      await createWorkshop(me, workshopName, workshopDesc);
                      setWorkshopName("");
                      setWorkshopDesc("");
                      await loadWorkshops();
                    })
                  }
                >
                  Create
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-md border border-rule bg-card">
              <div className="flex items-center justify-between gap-2 border-b border-rule bg-paper-raised px-3.5 py-2">
                <span className="label-caps text-ink-muted">Workshops</span>
                <span className="data-mono text-ink-muted">{workshops.length}</span>
              </div>
              {workshops.map((w) => (
                <div
                  key={w.id}
                  className="flex flex-wrap items-start justify-between gap-3 border-b border-rule px-3.5 py-2.5 last:border-b-0"
                >
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-semibold leading-tight text-ink">{w.name}</h3>
                    <p className="text-[12px] leading-snug text-ink-soft">{w.description || "No description"}</p>
                    <p className="data-mono mt-1 text-ink-muted">
                      Created {new Date(w.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1.5">
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => {
                        setSelectedWorkshopId(w.id);
                        setTab("teams");
                      }}
                      icon={<Icon name="arrowRight" size={11} />}
                    >
                      Teams
                    </Button>
                    <Button
                      variant="danger"
                      size="xs"
                      onClick={() =>
                        run(async () => {
                          await deleteWorkshop(w.id);
                          await loadWorkshops();
                        })
                      }
                      title="Delete workshop (teams must be deleted first)"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
              {!workshopsLoading && workshops.length === 0 && (
                <p className="px-3.5 py-6 text-center text-[12px] text-ink-muted">
                  No workshops yet — create one above.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ===== TEAMS ===== */}
        {tab === "teams" && (
          <div className="mx-auto max-w-4xl space-y-4">
            <div className="overflow-hidden rounded-md border border-rule bg-card">
              <div className="border-b border-rule bg-paper-raised px-3.5 py-2">
                <h2 className="label-caps text-ink-muted">Create a team</h2>
                <p className="mt-1 text-[11px] leading-snug text-ink-muted">
                  Teams copy a template board and get{" "}
                  <span className="data-mono text-ink-soft">{MAX_TEAM_MEMBERS}</span> seat codes for guests.
                </p>
              </div>
              <div className="flex flex-col gap-2 p-3.5 sm:flex-row">
                <select
                  className={FIELD}
                  value={selectedWorkshopId}
                  onChange={(e) => setSelectedWorkshopId(e.target.value)}
                >
                  <option value="">Select workshop…</option>
                  {workshops.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
                <select
                  className={FIELD}
                  value={teamTemplateId}
                  onChange={(e) => setTeamTemplateId(e.target.value)}
                >
                  <option value="">Select template…</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
                <input
                  className={FIELD + " flex-1"}
                  placeholder="Team name (e.g. Team Alpha)"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!selectedWorkshopId || !teamTemplateId || !teamName.trim()}
                  onClick={() =>
                    run(async () => {
                      const workshop = workshops.find((w) => w.id === selectedWorkshopId)!;
                      const template = templates.find((t) => t.id === teamTemplateId)!;
                      await createTeamFromTemplate({
                        workshop,
                        name: teamName,
                        template,
                        facilitatorUid: me.uid,
                        facilitatorEmail: me.email,
                        newBoardId: () =>
                          `board-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                      });
                      setTeamName("");
                      await loadTeams(selectedWorkshopId);
                    })
                  }
                >
                  Create team
                </Button>
              </div>
            </div>

            {teams.map((t) => {
              const codes = codesByTeam[t.id] || [];
              const claimed = codes.filter((c) => c.claimed).length;
              return (
                <div key={t.id} className="overflow-hidden rounded-md border border-rule bg-card">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-rule bg-paper-raised px-3.5 py-2.5">
                    <div className="min-w-0">
                      <h3 className="text-[13px] font-semibold leading-tight text-ink">{t.name}</h3>
                      <p className="mt-0.5 text-[11px] leading-snug text-ink-muted">
                        Seats:{" "}
                        <span className="data-mono text-ink-soft">
                          {claimed}/{t.maxMembers}
                        </span>{" "}
                        claimed
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1.5">
                      {t.boardId && (
                        <Button variant="secondary" size="xs" onClick={() => onOpenBoard(t.boardId)}>
                          Open board
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="xs"
                        onClick={() =>
                          run(async () => {
                            await deleteTeam(t);
                            await loadTeams(selectedWorkshopId);
                          })
                        }
                        title="Delete the team, its board, and its codes"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  {codes.length > 0 && (
                    <div>
                      {codes.map((c) => (
                        <div
                          key={c.code}
                          className="flex items-center justify-between gap-2 border-b border-rule px-3.5 py-1.5 last:border-b-0"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <code className="data-mono text-[11px] font-medium tracking-[0.12em] text-ink">
                              {c.code}
                            </code>
                            <span
                              className={
                                "inline-flex h-[16px] items-center rounded-xs border px-1 data-mono uppercase " +
                                (c.claimed
                                  ? "border-[rgba(46,125,79,0.28)] bg-[rgba(46,125,79,0.10)] text-state-ok"
                                  : "border-rule bg-card text-ink-muted")
                              }
                            >
                              {c.claimed ? "claimed" : "unclaimed"}
                            </span>
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-1">
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => copyCode(c.code)}
                              title="Copy code"
                              icon={<Icon name={copied === c.code ? "check" : "copy"} size={11} />}
                            >
                              {copied === c.code ? "Copied" : "Copy"}
                            </Button>
                            {!c.claimed && (
                              <button
                                onClick={() =>
                                  run(async () => {
                                    await regenerateCode(t.id, t.workshopId, c.code);
                                    await loadTeams(selectedWorkshopId);
                                  })
                                }
                                className="box-icon-btn"
                                title="Replace this unused code"
                              >
                                <Icon name="rotate" size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {selectedWorkshopId && !teamsLoading && teams.length === 0 && (
              <p className="text-center text-[12px] text-ink-muted">
                No teams in this workshop yet — create one above.
              </p>
            )}
            {!selectedWorkshopId && (
              <p className="text-center text-[12px] text-ink-muted">Select a workshop to manage its teams.</p>
            )}
          </div>
        )}

        {/* ===== TEMPLATES ===== */}
        {tab === "templates" && (
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="overflow-hidden rounded-md border border-rule bg-card">
              <div className="border-b border-rule bg-paper-raised px-3.5 py-2">
                <h2 className="label-caps text-ink-muted">New template board</h2>
                <p className="mt-1 text-[11px] leading-snug text-ink-muted">
                  Templates are ordinary boards — build them with any box types, then create teams from them.
                </p>
              </div>
              <div className="flex gap-2 p-3.5">
                <input
                  className={FIELD + " flex-1"}
                  placeholder="Template name (e.g. Empathy Map Exercise)"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!templateName.trim()}
                  onClick={() =>
                    run(async () => {
                      const id = await createTemplateBoard(me, templateName);
                      setTemplateName("");
                      await loadTemplates();
                      onOpenBoard(id);
                    })
                  }
                >
                  Create &amp; open
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-md border border-rule bg-card">
              <div className="flex items-center justify-between gap-2 border-b border-rule bg-paper-raised px-3.5 py-2">
                <span className="label-caps text-ink-muted">Templates</span>
                <span className="data-mono text-ink-muted">{templates.length}</span>
              </div>
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-wrap items-start justify-between gap-3 border-b border-rule px-3.5 py-2.5 last:border-b-0"
                >
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-semibold leading-tight text-ink">{t.title}</h3>
                    <p className="data-mono mt-1 text-ink-muted">
                      {(t.nodes as unknown[]).length} boxes · updated{" "}
                      {new Date(t.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1.5">
                    <Button variant="secondary" size="xs" onClick={() => onOpenBoard(t.id)}>
                      Open
                    </Button>
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() =>
                        run(async () => {
                          await setBoardTemplate(t.id, false);
                          await loadTemplates();
                        })
                      }
                      title="Turn back into a regular board"
                    >
                      Unlist
                    </Button>
                    <Button
                      variant="danger"
                      size="xs"
                      onClick={() =>
                        run(async () => {
                          await deleteBoard(t.id);
                          await loadTemplates();
                        })
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
              {!templatesLoading && templates.length === 0 && (
                <p className="px-3.5 py-6 text-center text-[12px] text-ink-muted">
                  No templates yet — create one above.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
