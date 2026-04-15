"use client";

import { type ReactNode, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ActionButton, ActionsRow, Badge, OverlayPanel, SectionCard, SimpleTable } from "@/components/panel-primitives";
import { getBalancedStrategyRules, getPoolStats, mediaPools as seedMediaPools, nodes, type MediaPoolRecord } from "@/lib/control-panel";

const emptyPool = (): MediaPoolRecord => ({
  id: `pool-${Date.now()}`,
  name: "",
  nodeName: nodes[0]?.name ?? "",
  strategy: "Balanced",
  status: "Active",
  notes: "",
  assignedVendors: [],
  mediaIps: [],
});

export default function MediaPoolsPage() {
  const [records, setRecords] = useState(seedMediaPools);
  const [draft, setDraft] = useState<MediaPoolRecord | null>(null);
  const [mediaIpEdit, setMediaIpEdit] = useState<{ poolId: string; address: string } | null>(null);
  const [mode, setMode] = useState<"add" | "edit" | null>(null);

  const poolForIpEdit = records.find((pool) => pool.id === mediaIpEdit?.poolId) ?? null;
  const selectedMediaIp = poolForIpEdit?.mediaIps.find((item) => item.address === mediaIpEdit?.address) ?? null;

  function openAdd() {
    setMode("add");
    setDraft(emptyPool());
  }

  function openEdit(pool: MediaPoolRecord) {
    setMode("edit");
    setDraft({ ...pool, assignedVendors: [...pool.assignedVendors], mediaIps: pool.mediaIps.map((item) => ({ ...item })) });
  }

  function closeDraft() {
    setMode(null);
    setDraft(null);
  }

  function savePool() {
    if (!draft || !draft.name.trim()) {
      return;
    }

    const next = { ...draft, name: draft.name.trim(), notes: draft.notes.trim() };
    setRecords((current) => (mode === "edit" ? current.map((item) => (item.id === next.id ? next : item)) : [next, ...current]));
    closeDraft();
  }

  function deletePool(poolId: string) {
    setRecords((current) => current.filter((pool) => pool.id !== poolId));
    if (draft?.id === poolId) {
      closeDraft();
    }
  }

  function updatePoolMediaIp(
    poolId: string,
    address: string,
    patch: Partial<MediaPoolRecord["mediaIps"][number]>,
  ) {
    setRecords((current) =>
      current.map((pool) =>
        pool.id === poolId
          ? {
              ...pool,
              mediaIps: pool.mediaIps.map((item) => (item.address === address ? { ...item, ...patch } : item)),
            }
          : pool,
      ),
    );
  }

  function removePoolMediaIp(poolId: string, address: string) {
    setRecords((current) =>
      current.map((pool) => (pool.id === poolId ? { ...pool, mediaIps: pool.mediaIps.filter((item) => item.address !== address) } : pool)),
    );
  }

  const availableMediaOptions = nodes.flatMap((node) =>
    node.ipPool.filter((ip) => ip.role === "MEDIA").map((ip) => `${node.name} / ${ip.address}`),
  );

  return (
    <AppShell
      title="Media Pools"
      eyebrow="Media pool management"
      description="Manage vendor-facing media pools, keep capacity visible, and make per-IP state easy for operators to edit."
      activePath="/media-pools"
      headerActions={<ActionButton tone="primary" onClick={openAdd}>Add pool</ActionButton>}
    >
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_320px]">
        <SectionCard title="Pool List" eyebrow="Current pools" badge={<Badge tone="amber">{records.length} pools</Badge>}>
          <SimpleTable
            columns={["Pool", "Node", "Status", "Active IPs", "Call Capacity", "CPS Capacity", "Actions"]}
            rows={records.map((pool) => {
              const stats = getPoolStats(pool);
              return [
                <div key={`${pool.id}-name`}>
                  <p className="font-semibold uppercase tracking-[0.08em] text-white">{pool.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{pool.notes}</p>
                </div>,
                pool.nodeName,
                <Badge key={`${pool.id}-status`} tone={pool.status === "Active" ? "emerald" : pool.status === "Draining" ? "amber" : "rose"}>{pool.status}</Badge>,
                `${stats.activeIps}`,
                `${stats.totalConcurrentCapacity}`,
                `${stats.totalCpsCapacity}`,
                <ActionsRow
                  key={`${pool.id}-actions`}
                  actions={[
                    { label: "Edit", onClick: () => openEdit(pool) },
                    { label: "Delete", tone: "danger", onClick: () => deletePool(pool.id) },
                  ]}
                />,
              ];
            })}
          />
        </SectionCard>

        <SectionCard title="Pool Rules" eyebrow="Operator note" badge={<Badge tone="cyan">Balanced default</Badge>}>
          <div className="space-y-3 text-sm leading-7 text-slate-300">
            <p>Vendors can use multiple media pools.</p>
            <p>Customers do not get pool assignment anywhere in this version.</p>
            <p>Balanced still means least-used available media IP with disabled, draining, full, and CPS-limited IPs skipped.</p>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6">
        {records.map((pool) => {
          const stats = getPoolStats(pool);

          return (
            <SectionCard
              key={pool.id}
              title={pool.name}
              eyebrow="Pool details"
              badge={<Badge tone={pool.strategy === "Balanced" ? "cyan" : pool.strategy === "Round Robin" ? "amber" : "violet"}>{pool.strategy}</Badge>}
              action={<ActionButton tone="muted" onClick={() => openEdit(pool)}>Edit pool</ActionButton>}
            >
              <div className="grid gap-4 md:grid-cols-4">
                {[
                  ["Total IPs", `${stats.totalIps}`],
                  ["Active IPs", `${stats.activeIps}`],
                  ["Total Concurrent Capacity", `${stats.totalConcurrentCapacity}`],
                  ["Total CPS Capacity", `${stats.totalCpsCapacity}`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/8 bg-slate-950/40 px-4 py-4">
                    <p className="font-mono text-[0.62rem] uppercase tracking-[0.26em] text-slate-500">{label}</p>
                    <p className="mt-3 text-2xl font-semibold uppercase tracking-[0.08em] text-white">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <SimpleTable
                  columns={["IP", "Status", "Active Calls", "Max Calls", "Current CPS", "Max CPS", "Usage %", "Drain Mode", "Actions"]}
                  rows={pool.mediaIps.map((item) => [
                    item.address,
                    <Badge key={`${pool.id}-${item.address}-status`} tone={item.status === "Active" ? "emerald" : item.status === "Draining" ? "amber" : "rose"}>{item.status}</Badge>,
                    `${item.activeCalls}`,
                    `${item.maxCalls}`,
                    `${item.currentCps}`,
                    `${item.maxCps}`,
                    `${Math.round((item.activeCalls / item.maxCalls) * 100)}%`,
                    item.drainMode ? "Yes" : "No",
                    <ActionsRow
                      key={`${pool.id}-${item.address}-actions`}
                      actions={[
                        { label: "Edit", onClick: () => setMediaIpEdit({ poolId: pool.id, address: item.address }) },
                        { label: "Delete", tone: "danger", onClick: () => removePoolMediaIp(pool.id, item.address) },
                      ]}
                    />,
                  ])}
                />
              </div>
            </SectionCard>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard title="Balanced Strategy" eyebrow="How selection works" badge={<Badge tone="cyan">Simple rules</Badge>}>
          <div className="grid gap-3 md:grid-cols-2">
            {getBalancedStrategyRules().map((rule) => (
              <div key={rule} className="rounded-2xl border border-white/8 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
                {rule}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Per-IP Editing" eyebrow="Current scope" badge={<Badge tone="emerald">Available now</Badge>}>
          <div className="space-y-3 text-sm leading-7 text-slate-300">
            <p>Edit pool name, node, strategy, notes, status, and assigned media IPs.</p>
            <p>Edit per-IP status, max calls, max CPS, weight, and drain mode from the pool details table.</p>
            <p>Delete removes the selected pool or selected media IP from the working list immediately.</p>
          </div>
        </SectionCard>
      </section>

      <OverlayPanel
        open={Boolean(draft)}
        title={mode === "edit" ? "Edit Media Pool" : "Add Media Pool"}
        description="Use one form for add, update, save, cancel, and delete."
        onClose={closeDraft}
        footer={
          <div className="flex flex-wrap gap-3">
            <ActionButton tone="muted" onClick={closeDraft}>Cancel</ActionButton>
            {mode === "edit" && draft ? (
              <ActionButton tone="danger" onClick={() => deletePool(draft.id)}>Delete</ActionButton>
            ) : null}
            <ActionButton tone="primary" onClick={savePool}>{mode === "edit" ? "Update" : "Save"}</ActionButton>
          </div>
        }
      >
        {draft ? (
          <div className="space-y-4">
            <Field label="Pool Name"><input className={inputClassName} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="IN-MEDIA-A" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Assigned Node">
                <select className={inputClassName} value={draft.nodeName} onChange={(event) => setDraft({ ...draft, nodeName: event.target.value })}>
                  {nodes.map((node) => (
                    <option key={node.id}>{node.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select className={inputClassName} value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as MediaPoolRecord["status"] })}>
                  <option>Active</option>
                  <option>Draining</option>
                  <option>Disabled</option>
                </select>
              </Field>
            </div>
            <Field label="Selection Strategy">
              <select className={inputClassName} value={draft.strategy} onChange={(event) => setDraft({ ...draft, strategy: event.target.value as MediaPoolRecord["strategy"] })}>
                <option>Balanced</option>
                <option>Round Robin</option>
                <option>Priority Failover</option>
              </select>
            </Field>
            <Field label="Assigned Media IPs">
              <select
                multiple
                className={`${inputClassName} h-36`}
                value={draft.mediaIps.map((item) => `${draft.nodeName} / ${item.address}`)}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    mediaIps: Array.from(event.target.selectedOptions, (option) => option.value.split(" / ")[1]).map((address) =>
                      draft.mediaIps.find((item) => item.address === address) ?? {
                        address,
                        status: "Active",
                        activeCalls: 0,
                        maxCalls: 30,
                        currentCps: 0,
                        maxCps: 5,
                        weight: 1,
                        drainMode: false,
                      },
                    ),
                  })
                }
              >
                {availableMediaOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </Field>
            <Field label="Notes"><textarea className={textareaClassName} rows={4} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></Field>
          </div>
        ) : null}
      </OverlayPanel>

      <OverlayPanel
        open={Boolean(selectedMediaIp && mediaIpEdit)}
        title="Edit Pool Media IP"
        description="Tune per-IP limits without leaving the pool details view."
        onClose={() => setMediaIpEdit(null)}
        footer={
          <div className="flex gap-3">
            <ActionButton tone="muted" onClick={() => setMediaIpEdit(null)}>Cancel</ActionButton>
          </div>
        }
      >
        {selectedMediaIp && mediaIpEdit ? (
          <div className="space-y-4">
            <Field label="IP"><input className={inputClassName} value={selectedMediaIp.address} readOnly /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Max Calls"><input className={inputClassName} type="number" value={selectedMediaIp.maxCalls} onChange={(event) => updatePoolMediaIp(mediaIpEdit.poolId, selectedMediaIp.address, { maxCalls: Number(event.target.value) || 30 })} /></Field>
              <Field label="Max CPS"><input className={inputClassName} type="number" value={selectedMediaIp.maxCps} onChange={(event) => updatePoolMediaIp(mediaIpEdit.poolId, selectedMediaIp.address, { maxCps: Number(event.target.value) || 5 })} /></Field>
              <Field label="Weight"><input className={inputClassName} type="number" value={selectedMediaIp.weight} onChange={(event) => updatePoolMediaIp(mediaIpEdit.poolId, selectedMediaIp.address, { weight: Number(event.target.value) || 1 })} /></Field>
              <Field label="Status">
                <select className={inputClassName} value={selectedMediaIp.status} onChange={(event) => updatePoolMediaIp(mediaIpEdit.poolId, selectedMediaIp.address, { status: event.target.value as typeof selectedMediaIp.status })}>
                  <option>Active</option>
                  <option>Disabled</option>
                  <option>Draining</option>
                </select>
              </Field>
            </div>
            <Field label="Drain Mode">
              <select className={inputClassName} value={selectedMediaIp.drainMode ? "Yes" : "No"} onChange={(event) => updatePoolMediaIp(mediaIpEdit.poolId, selectedMediaIp.address, { drainMode: event.target.value === "Yes" })}>
                <option>No</option>
                <option>Yes</option>
              </select>
            </Field>
          </div>
        ) : null}
      </OverlayPanel>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">{label}</span>
      <div className="mt-3">{children}</div>
    </label>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/70";

const textareaClassName =
  "w-full rounded-[1.6rem] border border-white/10 bg-slate-950/55 px-4 py-4 text-sm leading-7 text-white outline-none transition focus:border-cyan-300/70";
