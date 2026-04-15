"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ActionButton, ActionsRow, Badge, OverlayPanel, SectionCard, SimpleTable } from "@/components/panel-primitives";
import { activityFeed } from "@/lib/control-panel";

type LogRecord = (typeof activityFeed)[number];

export default function LogsPage() {
  const [records, setRecords] = useState(activityFeed);
  const [draft, setDraft] = useState<LogRecord | null>(null);
  const [mode, setMode] = useState<"add" | "edit" | null>(null);

  function openAdd() {
    setMode("add");
    setDraft({
      timestamp: "2026-04-15 18:00:00",
      module: "ops",
      action: "manual_note",
      target: "",
      result: "info",
      user: "ops.user",
      level: "user action",
    });
  }

  function openEdit(item: LogRecord) {
    setMode("edit");
    setDraft({ ...item });
  }

  function closePanel() {
    setMode(null);
    setDraft(null);
  }

  function saveDraft() {
    if (!draft) {
      return;
    }

    setRecords((current) =>
      mode === "edit"
        ? current.map((item) => (item.timestamp === draft.timestamp && item.action === draft.action ? draft : item))
        : [draft, ...current],
    );
    closePanel();
  }

  function deleteLog(item: LogRecord) {
    setRecords((current) => current.filter((entry) => !(entry.timestamp === item.timestamp && entry.action === item.action && entry.target === item.target)));
    if (draft && draft.timestamp === item.timestamp && draft.action === item.action) {
      closePanel();
    }
  }

  return (
    <AppShell
      title="Logs"
      eyebrow="Operational audit trail"
      description="Review timestamped actions across customers, vendors, nodes, media pools, and system processes. Manual operator notes can be added, edited, or deleted for local review."
      activePath="/logs"
      headerActions={<ActionButton tone="primary" onClick={openAdd}>Add log note</ActionButton>}
    >
      <section className="flex flex-wrap gap-3">
        {["info", "warning", "error", "user action", "system action"].map((filter) => (
          <Badge key={filter} tone={filter === "warning" ? "amber" : filter === "error" ? "rose" : filter === "user action" ? "cyan" : filter === "system action" ? "violet" : "emerald"}>
            {filter}
          </Badge>
        ))}
      </section>

      <SectionCard title="Recent Logs" eyebrow="Unified module trail" badge={<Badge tone="cyan">{records.length} entries</Badge>}>
        <SimpleTable
          columns={["Timestamp", "Module", "Action", "Target", "Result", "User", "Actions"]}
          rows={records.map((item) => [
            item.timestamp,
            item.module,
            item.action,
            item.target,
            <Badge key={`${item.timestamp}-result`} tone={item.level === "warning" ? "amber" : item.level === "error" ? "rose" : "emerald"}>
              {item.result}
            </Badge>,
            item.user,
            <ActionsRow key={`${item.timestamp}-actions`} actions={[{ label: "Edit", onClick: () => openEdit(item) }, { label: "Delete", tone: "danger", onClick: () => deleteLog(item) }]} />,
          ])}
        />
      </SectionCard>

      <OverlayPanel
        open={Boolean(draft)}
        title={mode === "edit" ? "Edit Log Note" : "Add Log Note"}
        description="System logs stay visible here, and operators can add or adjust local notes while API wiring remains scaffolded."
        onClose={closePanel}
        footer={
          <div className="flex gap-3">
            <ActionButton tone="muted" onClick={closePanel}>Cancel</ActionButton>
            {mode === "edit" && draft ? (
              <ActionButton tone="danger" onClick={() => deleteLog(draft)}>Delete</ActionButton>
            ) : null}
            <ActionButton tone="primary" onClick={saveDraft}>{mode === "edit" ? "Update" : "Save"}</ActionButton>
          </div>
        }
      >
        {draft ? (
          <div className="space-y-4">
            <label className="block">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">Timestamp</span>
              <input className={inputClassName} value={draft.timestamp} onChange={(event) => setDraft({ ...draft, timestamp: event.target.value })} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">Module</span>
                <input className={inputClassName} value={draft.module} onChange={(event) => setDraft({ ...draft, module: event.target.value })} />
              </label>
              <label className="block">
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">User</span>
                <input className={inputClassName} value={draft.user} onChange={(event) => setDraft({ ...draft, user: event.target.value })} />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">Action</span>
                <input className={inputClassName} value={draft.action} onChange={(event) => setDraft({ ...draft, action: event.target.value })} />
              </label>
              <label className="block">
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">Level</span>
                <select className={inputClassName} value={draft.level} onChange={(event) => setDraft({ ...draft, level: event.target.value as LogRecord["level"] })}>
                  <option>info</option>
                  <option>warning</option>
                  <option>error</option>
                  <option>user action</option>
                  <option>system action</option>
                </select>
              </label>
            </div>
            <label className="block">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">Target / Note</span>
              <textarea className={textareaClassName} rows={4} value={draft.target} onChange={(event) => setDraft({ ...draft, target: event.target.value })} />
            </label>
          </div>
        ) : null}
      </OverlayPanel>
    </AppShell>
  );
}

const inputClassName =
  "mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/70";

const textareaClassName =
  "mt-3 w-full rounded-[1.6rem] border border-white/10 bg-slate-950/55 px-4 py-4 text-sm leading-7 text-white outline-none transition focus:border-cyan-300/70";
