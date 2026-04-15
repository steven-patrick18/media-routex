"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ActionButton, ActionsRow, Badge, OverlayPanel, SectionCard, SimpleTable } from "@/components/panel-primitives";
import { usageByMediaIp, usageByNode, usageByPool } from "@/lib/control-panel";

export default function UsagePage() {
  const [mediaIpUsage, setMediaIpUsage] = useState(usageByMediaIp);
  const [draft, setDraft] = useState<(typeof usageByMediaIp)[number] | null>(null);

  function saveDraft() {
    if (!draft) {
      return;
    }

    setMediaIpUsage((current) => current.map((item) => (item.ip === draft.ip && item.pool === draft.pool ? draft : item)));
    setDraft(null);
  }

  return (
    <AppShell
      title="Usage"
      eyebrow="Capacity and utilization"
      description="Review per-node, per-pool, and per-media-IP utilization snapshots. Limits remain editable from this page when an admin needs a quick override."
      activePath="/usage"
    >
      <SectionCard title="Per Node Usage" eyebrow="Node consumption" badge={<Badge tone="emerald">Runtime snapshot</Badge>}>
        <SimpleTable
          columns={["Node", "Region", "Active Calls", "Capacity", "Current CPS", "Actions"]}
          rows={usageByNode.map((item) => [
            item.name,
            item.region,
            `${item.activeCalls}`,
            `${item.capacity}`,
            `${item.cps}`,
            <ActionsRow key={item.name} actions={[{ label: "View", href: "/nodes" }]} />,
          ])}
        />
      </SectionCard>

      <SectionCard title="Per Media Pool Usage" eyebrow="Pool consumption" badge={<Badge tone="amber">Capacity aware</Badge>}>
        <SimpleTable
          columns={["Pool", "Node", "Active IPs", "Concurrent Capacity", "CPS Capacity", "Active Calls", "Actions"]}
          rows={usageByPool.map((item) => [
            item.name,
            item.node,
            `${item.activeIps}`,
            `${item.concurrentCapacity}`,
            `${item.cpsCapacity}`,
            `${item.activeCalls}`,
            <ActionsRow key={item.name} actions={[{ label: "View", href: "/media-pools" }]} />,
          ])}
        />
      </SectionCard>

      <SectionCard title="Per Media IP Usage" eyebrow="Media IP consumption" badge={<Badge tone="cyan">Least-used ready</Badge>}>
        <SimpleTable
          columns={["Pool", "IP", "Status", "Calls", "CPS", "Usage %", "Actions"]}
          rows={mediaIpUsage.map((item) => [
            item.pool,
            item.ip,
            item.status,
            `${item.activeCalls}/${item.maxCalls}`,
            `${item.currentCps}/${item.maxCps}`,
            `${item.usagePercent}%`,
            <ActionsRow key={`${item.pool}-${item.ip}`} actions={[{ label: "Edit", onClick: () => setDraft({ ...item }) }]} />,
          ])}
        />
      </SectionCard>

      <OverlayPanel
        open={Boolean(draft)}
        title="Edit Usage Limits"
        description="Usage is mostly read-only, but admin edits for call and CPS limits are available here."
        onClose={() => setDraft(null)}
        footer={
          <div className="flex gap-3">
            <ActionButton tone="muted" onClick={() => setDraft(null)}>Cancel</ActionButton>
            <ActionButton tone="primary" onClick={saveDraft}>Save</ActionButton>
          </div>
        }
      >
        {draft ? (
          <div className="space-y-4">
            <label className="block">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">Pool / IP</span>
              <input className={inputClassName} readOnly value={`${draft.pool} / ${draft.ip}`} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">Max Calls</span>
                <input className={inputClassName} type="number" value={draft.maxCalls} onChange={(event) => setDraft({ ...draft, maxCalls: Number(event.target.value) || 30, usagePercent: Math.round((draft.activeCalls / (Number(event.target.value) || 30)) * 100) })} />
              </label>
              <label className="block">
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">Max CPS</span>
                <input className={inputClassName} type="number" value={draft.maxCps} onChange={(event) => setDraft({ ...draft, maxCps: Number(event.target.value) || 5 })} />
              </label>
            </div>
          </div>
        ) : null}
      </OverlayPanel>
    </AppShell>
  );
}

const inputClassName =
  "mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/70";
