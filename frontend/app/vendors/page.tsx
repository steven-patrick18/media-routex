"use client";

import { type ReactNode, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ActionButton, ActionsRow, Badge, OverlayPanel, SectionCard, SimpleTable } from "@/components/panel-primitives";
import { getBalancedStrategyRules, mediaPools, nodes, vendors as seedVendors, type VendorRecord } from "@/lib/control-panel";

const emptyVendor = (): VendorRecord => ({
  id: `vendor-${Date.now()}`,
  name: "",
  sipHost: "",
  sipPort: 5060,
  status: "Active",
  notes: "",
  allowedSipNodes: [],
  mediaPools: [],
  strategy: "Balanced",
});

export default function VendorsPage() {
  const [records, setRecords] = useState(seedVendors);
  const [draft, setDraft] = useState<VendorRecord | null>(null);
  const [mode, setMode] = useState<"add" | "edit" | null>(null);

  function openAdd() {
    setMode("add");
    setDraft(emptyVendor());
  }

  function openEdit(vendor: VendorRecord) {
    setMode("edit");
    setDraft({ ...vendor, allowedSipNodes: [...vendor.allowedSipNodes], mediaPools: [...vendor.mediaPools] });
  }

  function closePanel() {
    setMode(null);
    setDraft(null);
  }

  function saveDraft() {
    if (!draft || !draft.name.trim() || !draft.sipHost.trim()) {
      return;
    }

    const next = { ...draft, name: draft.name.trim(), sipHost: draft.sipHost.trim(), notes: draft.notes.trim() };
    setRecords((current) => (mode === "edit" ? current.map((item) => (item.id === next.id ? next : item)) : [next, ...current]));
    closePanel();
  }

  function removeVendor(vendorId: string) {
    setRecords((current) => current.filter((vendor) => vendor.id !== vendorId));
    if (draft?.id === vendorId) {
      closePanel();
    }
  }

  return (
    <AppShell
      title="Vendors"
      eyebrow="Vendor management"
      description="Manage vendor signaling targets, choose which SIP nodes they may use, and assign one or more media pools."
      activePath="/vendors"
      headerActions={<ActionButton tone="primary" onClick={openAdd}>Add vendor</ActionButton>}
    >
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_320px]">
        <SectionCard title="Vendor List" eyebrow="Current vendors" badge={<Badge tone="violet">{records.length} vendors</Badge>}>
          <SimpleTable
            columns={["Vendor", "Vendor Target", "Allowed SIP Nodes", "Media Pools", "Actions"]}
            rows={records.map((vendor) => [
              <div key={`${vendor.id}-name`}>
                <p className="font-semibold uppercase tracking-[0.08em] text-white">{vendor.name}</p>
                <p className="mt-1 text-xs text-slate-500">{vendor.notes}</p>
              </div>,
              `${vendor.sipHost}:${vendor.sipPort}`,
              <div key={`${vendor.id}-nodes`} className="space-y-1">
                {vendor.allowedSipNodes.map((nodeName) => {
                  const sipIp = nodes.find((node) => node.name === nodeName)?.sipIp ?? "";
                  return (
                    <p key={nodeName} className="text-xs text-slate-300">
                      {nodeName} / {sipIp}
                    </p>
                  );
                })}
              </div>,
              vendor.mediaPools.join(", "),
              <ActionsRow
                key={`${vendor.id}-actions`}
                actions={[
                  { label: "View", href: `/vendors/${vendor.id}` },
                  { label: "Edit", onClick: () => openEdit(vendor) },
                  { label: "Delete", tone: "danger", onClick: () => removeVendor(vendor.id) },
                ]}
              />,
            ])}
          />
        </SectionCard>

        <SectionCard title="Assignment Rule" eyebrow="Operator note" badge={<Badge tone="amber">Locked in scope</Badge>}>
          <div className="space-y-3 text-sm leading-7 text-slate-300">
            <p>Vendors can have multiple media pools.</p>
            <p>Customers do not get media pool assignment in this version.</p>
            <p>Balanced remains the default strategy.</p>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard title="Balanced Strategy" eyebrow="How it works" badge={<Badge tone="cyan">Operator view</Badge>}>
          <div className="grid gap-3 md:grid-cols-2">
            {getBalancedStrategyRules().map((rule) => (
              <div key={rule} className="rounded-2xl border border-white/8 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
                {rule}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Change Coverage" eyebrow="Editable fields" badge={<Badge tone="emerald">Full flow</Badge>}>
          <div className="space-y-3 text-sm leading-7 text-slate-300">
            <p>Edit SIP host, SIP port, notes, status, strategy, SIP nodes, and media pool assignments.</p>
            <p>Delete removes the vendor from the local state immediately.</p>
            <p>Save and cancel work from the same lightweight edit drawer.</p>
          </div>
        </SectionCard>
      </section>

      <OverlayPanel
        open={Boolean(draft)}
        title={mode === "edit" ? "Edit Vendor" : "Add Vendor"}
        description="Vendor forms stay simple: signal target, allowed SIP nodes, then one or more media pools."
        onClose={closePanel}
        footer={
          <div className="flex flex-wrap gap-3">
            <ActionButton tone="muted" onClick={closePanel}>Cancel</ActionButton>
            {mode === "edit" && draft ? (
              <ActionButton tone="danger" onClick={() => removeVendor(draft.id)}>Delete</ActionButton>
            ) : null}
            <ActionButton tone="primary" onClick={saveDraft}>{mode === "edit" ? "Update" : "Save"}</ActionButton>
          </div>
        }
      >
        {draft ? (
          <div className="space-y-4">
            <Field label="Vendor Name">
              <input className={inputClassName} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="VoiceGrid Carrier" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="SIP Host/IP">
                <input className={inputClassName} value={draft.sipHost} onChange={(event) => setDraft({ ...draft, sipHost: event.target.value })} placeholder="198.51.100.10" />
              </Field>
              <Field label="SIP Port">
                <input className={inputClassName} type="number" value={draft.sipPort} onChange={(event) => setDraft({ ...draft, sipPort: Number(event.target.value) || 5060 })} placeholder="5060" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Status">
                <select className={inputClassName} value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as VendorRecord["status"] })}>
                  <option>Active</option>
                  <option>Standby</option>
                  <option>Maintenance</option>
                </select>
              </Field>
              <Field label="Selection Strategy">
                <select className={inputClassName} value={draft.strategy} onChange={(event) => setDraft({ ...draft, strategy: event.target.value as VendorRecord["strategy"] })}>
                  <option>Balanced</option>
                  <option>Round Robin</option>
                  <option>Priority Failover</option>
                </select>
              </Field>
            </div>
            <Field label="Allowed SIP Nodes">
              <select
                multiple
                className={`${inputClassName} h-36`}
                value={draft.allowedSipNodes}
                onChange={(event) => setDraft({ ...draft, allowedSipNodes: Array.from(event.target.selectedOptions, (option) => option.value) })}
              >
                {nodes.map((node) => (
                  <option key={node.id} value={node.name}>
                    {node.name} / {node.sipIp}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Assigned Media Pools">
              <select
                multiple
                className={`${inputClassName} h-36`}
                value={draft.mediaPools}
                onChange={(event) => setDraft({ ...draft, mediaPools: Array.from(event.target.selectedOptions, (option) => option.value) })}
              >
                {mediaPools.map((pool) => (
                  <option key={pool.id} value={pool.name}>
                    {pool.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Notes">
              <textarea className={textareaClassName} rows={4} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="Connection notes or handoff details" />
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
