"use client";

import type { ReactNode } from "react";
import { ActionButton, OverlayPanel } from "@/components/panel-primitives";
import type { MediaPoolRecord, NodeRecord, VendorRecord } from "@/lib/types";

export function VendorFormDrawer({
  draft,
  mode,
  nodeRecords,
  mediaPoolRecords,
  onClose,
  onDelete,
  onSave,
  onChange,
}: {
  draft: VendorRecord | null;
  mode: "add" | "edit" | null;
  nodeRecords: NodeRecord[];
  mediaPoolRecords: MediaPoolRecord[];
  onClose: () => void;
  onDelete: (vendorId: string) => void;
  onSave: () => void;
  onChange: (next: VendorRecord) => void;
}) {
  return (
    <OverlayPanel
      open={Boolean(draft)}
      title={mode === "edit" ? "Edit Vendor" : "Add Vendor"}
      description="Vendor forms stay simple: signal target, allowed SIP nodes, then one or more media pools."
      onClose={onClose}
      footer={
        <div className="flex flex-wrap gap-3">
          <ActionButton tone="muted" onClick={onClose}>Cancel</ActionButton>
          {mode === "edit" && draft ? (
            <ActionButton tone="danger" onClick={() => onDelete(draft.id)}>Delete</ActionButton>
          ) : null}
          <ActionButton tone="primary" onClick={onSave}>{mode === "edit" ? "Update" : "Save"}</ActionButton>
        </div>
      }
    >
      {draft ? (
        <div className="space-y-4">
          <Field label="Vendor Name">
            <input className={inputClassName} value={draft.name} onChange={(event) => onChange({ ...draft, name: event.target.value })} placeholder="VoiceGrid Carrier" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="SIP Host/IP">
              <input className={inputClassName} value={draft.sipHost} onChange={(event) => onChange({ ...draft, sipHost: event.target.value })} placeholder="198.51.100.10" />
            </Field>
            <Field label="SIP Port">
              <input className={inputClassName} type="number" value={draft.sipPort} onChange={(event) => onChange({ ...draft, sipPort: Number(event.target.value) || 5060 })} placeholder="5060" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status">
              <select className={inputClassName} value={draft.status} onChange={(event) => onChange({ ...draft, status: event.target.value as VendorRecord["status"] })}>
                <option>Active</option>
                <option>Standby</option>
                <option>Maintenance</option>
              </select>
            </Field>
            <Field label="Selection Strategy">
              <select className={inputClassName} value={draft.strategy} onChange={(event) => onChange({ ...draft, strategy: event.target.value as VendorRecord["strategy"] })}>
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
              onChange={(event) => onChange({ ...draft, allowedSipNodes: Array.from(event.target.selectedOptions, (option) => option.value) })}
            >
              {nodeRecords.map((node) => (
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
              onChange={(event) => onChange({ ...draft, mediaPools: Array.from(event.target.selectedOptions, (option) => option.value) })}
            >
              {mediaPoolRecords.map((pool) => (
                <option key={pool.id} value={pool.name}>
                  {pool.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Notes">
            <textarea className={textareaClassName} rows={4} value={draft.notes} onChange={(event) => onChange({ ...draft, notes: event.target.value })} placeholder="Connection notes or handoff details" />
          </Field>
        </div>
      ) : null}
    </OverlayPanel>
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
