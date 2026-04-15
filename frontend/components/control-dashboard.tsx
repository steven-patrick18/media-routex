"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ActionButton, ActionsRow, Badge, OverlayPanel, SectionCard, SimpleTable, StatCard } from "@/components/panel-primitives";
import {
  activityFeed,
  customers,
  dashboardMetrics,
  mediaPools,
  nodes,
  vendors,
} from "@/lib/control-panel";

type WatchCard = {
  id: string;
  title: string;
  value: string;
  note: string;
};

export function ControlDashboard() {
  const [watchCards, setWatchCards] = useState<WatchCard[]>([
    { id: "watch-1", title: "Priority Queue", value: "4 vendors", note: "Vendors needing routing review after maintenance." },
    { id: "watch-2", title: "Node Attention", value: "1 warning", note: "Mumbai gateway still on standby SIP signaling." },
  ]);
  const [draft, setDraft] = useState<WatchCard | null>(null);
  const [mode, setMode] = useState<"add" | "edit" | null>(null);

  function openAdd() {
    setMode("add");
    setDraft({ id: `watch-${Date.now()}`, title: "", value: "", note: "" });
  }

  function openEdit(card: WatchCard) {
    setMode("edit");
    setDraft({ ...card });
  }

  function closePanel() {
    setMode(null);
    setDraft(null);
  }

  function saveWatchCard() {
    if (!draft || !draft.title.trim()) {
      return;
    }

    const next = { ...draft, title: draft.title.trim(), value: draft.value.trim(), note: draft.note.trim() };
    setWatchCards((current) => (mode === "edit" ? current.map((item) => (item.id === next.id ? next : item)) : [next, ...current]));
    closePanel();
  }

  function deleteWatchCard(cardId: string) {
    setWatchCards((current) => current.filter((item) => item.id !== cardId));
    if (draft?.id === cardId) {
      closePanel();
    }
  }

  return (
    <AppShell
      title="Dashboard"
      eyebrow="Telecom media routing control panel"
      description="Monitor customer dialer onboarding, vendor assignment surfaces, node capacity, media pool balancing, and operational activity from one premium control surface."
      activePath="/"
      headerActions={
        <>
          <ActionButton tone="primary" onClick={openAdd}>Add watch card</ActionButton>
          <Link
            href="/nodes/add"
            className="inline-flex items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100 transition hover:border-cyan-200/60 hover:bg-cyan-300/16"
          >
            Add node
          </Link>
          <Link
            href="/media-pools"
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-100 transition hover:border-white/20 hover:bg-white/[0.07]"
          >
            View pools
          </Link>
        </>
      }
    >
      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {dashboardMetrics.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)_360px]">
        <SectionCard
          title="Recent Nodes"
          eyebrow="Node inventory"
          badge={<Badge tone="emerald">{nodes.length} tracked</Badge>}
        >
          <SimpleTable
            columns={["Node", "Purpose", "Region", "Status", "Media IPs"]}
            rows={nodes.map((node) => [
              <div key={`${node.id}-name`}>
                <p className="font-semibold uppercase tracking-[0.08em] text-white">{node.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500">{node.mainIp}</p>
              </div>,
              node.purpose,
              node.region,
              <Badge
                key={`${node.id}-status`}
                tone={node.status === "Healthy" ? "emerald" : node.status === "Warning" ? "amber" : "violet"}
              >
                {node.status}
              </Badge>,
              `${node.mediaIps.length} assigned`,
            ])}
          />
        </SectionCard>

        <SectionCard
          title="Recent Vendors"
          eyebrow="Vendor routing"
          badge={<Badge tone="cyan">{vendors.length} vendors</Badge>}
        >
          <SimpleTable
            columns={["Vendor", "SIP Host", "Strategy", "Pools", "Status"]}
            rows={vendors.map((vendor) => [
              <div key={`${vendor.id}-name`}>
                <p className="font-semibold uppercase tracking-[0.08em] text-white">{vendor.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500">{vendor.notes}</p>
              </div>,
              `${vendor.sipHost}:${vendor.sipPort}`,
              vendor.strategy,
              vendor.mediaPools.join(", "),
              <Badge
                key={`${vendor.id}-status`}
                tone={
                  vendor.status === "Active"
                    ? "emerald"
                    : vendor.status === "Standby"
                      ? "amber"
                      : "rose"
                }
              >
                {vendor.status}
              </Badge>,
            ])}
          />
        </SectionCard>

        <SectionCard
          title="Operator Watchlist"
          eyebrow="Editable dashboard cards"
          badge={<Badge tone="violet">{watchCards.length} cards</Badge>}
        >
          <div className="space-y-3">
            {watchCards.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/8 bg-slate-950/40 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm uppercase tracking-[0.12em] text-slate-100">{item.title}</p>
                  <Badge tone="cyan">{item.value}</Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">{item.note}</p>
                <div className="mt-4">
                  <ActionsRow actions={[{ label: "Edit", onClick: () => openEdit(item) }, { label: "Delete", tone: "danger", onClick: () => deleteWatchCard(item.id) }]} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <SectionCard
          title="Pool Usage Summary"
          eyebrow="Balanced pool health"
          badge={<Badge tone="amber">{mediaPools.length} pools</Badge>}
        >
          <SimpleTable
            columns={["Pool", "Node", "Vendors", "Concurrent Capacity", "CPS Capacity"]}
            rows={mediaPools.map((pool) => {
              const activeIps = pool.mediaIps.filter((item) => item.status === "Active").length;
              return [
                <div key={`${pool.id}-name`}>
                  <p className="font-semibold uppercase tracking-[0.08em] text-white">{pool.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500">{pool.strategy}</p>
                </div>,
                pool.nodeName,
                pool.assignedVendors.join(", "),
                `${activeIps * 30}`,
                `${activeIps * 5}`,
              ];
            })}
          />
        </SectionCard>

        <SectionCard
          title="Recent Customers"
          eyebrow="Dialer identity"
          badge={<Badge tone="cyan">{customers.length} customers</Badge>}
        >
          <div className="space-y-3">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="rounded-2xl border border-white/8 bg-slate-950/40 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm uppercase tracking-[0.12em] text-slate-100">{customer.name}</p>
                  <Badge tone={customer.status === "Active" ? "emerald" : customer.status === "Draft" ? "amber" : "rose"}>
                    {customer.status}
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">{customer.notes}</p>
                <p className="mt-3 font-mono text-[0.62rem] uppercase tracking-[0.26em] text-slate-500">
                  Dialer IPs: {customer.dialerIps.join(", ")}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <SectionCard title="Recent Activity" eyebrow="Operations feed" badge={<Badge tone="violet">Live trail</Badge>}>
        <SimpleTable
          columns={["Timestamp", "Module", "Action", "Target", "Result"]}
          rows={activityFeed.map((item) => [
            item.timestamp,
            item.module,
            item.action,
            item.target,
            <Badge key={`${item.timestamp}-result`} tone={item.level === "warning" ? "amber" : item.level === "error" ? "rose" : "emerald"}>
              {item.result}
            </Badge>,
          ])}
        />
      </SectionCard>

      <OverlayPanel
        open={Boolean(draft)}
        title={mode === "edit" ? "Edit Watch Card" : "Add Watch Card"}
        description="Dashboard edit flow stays intentionally small and lightweight."
        onClose={closePanel}
        footer={
          <div className="flex flex-wrap gap-3">
            <ActionButton tone="muted" onClick={closePanel}>Cancel</ActionButton>
            {mode === "edit" && draft ? (
              <ActionButton tone="danger" onClick={() => deleteWatchCard(draft.id)}>Delete</ActionButton>
            ) : null}
            <ActionButton tone="primary" onClick={saveWatchCard}>{mode === "edit" ? "Update" : "Save"}</ActionButton>
          </div>
        }
      >
        {draft ? (
          <div className="space-y-4">
            <label className="block">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">Title</span>
              <input className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/70" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            </label>
            <label className="block">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">Value</span>
              <input className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/70" value={draft.value} onChange={(event) => setDraft({ ...draft, value: event.target.value })} />
            </label>
            <label className="block">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">Note</span>
              <textarea className="mt-3 w-full rounded-[1.6rem] border border-white/10 bg-slate-950/55 px-4 py-4 text-sm leading-7 text-white outline-none transition focus:border-cyan-300/70" rows={4} value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} />
            </label>
          </div>
        ) : null}
      </OverlayPanel>
    </AppShell>
  );
}
