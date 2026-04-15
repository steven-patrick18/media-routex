"use client";

import type { ReactNode } from "react";
import { ActionButton, OverlayPanel } from "@/components/panel-primitives";
import type { MediaIpRecord, NodePoolIp } from "@/lib/types";

export function NodeIpDrawer({
  ipDraft,
  onClose,
  onSave,
  onChange,
}: {
  ipDraft: NodePoolIp | null;
  onClose: () => void;
  onSave: () => void;
  onChange: (next: NodePoolIp) => void;
}) {
  return (
    <OverlayPanel
      open={Boolean(ipDraft)}
      title={ipDraft?.address ? "Edit IP Record" : "Add IP Record"}
      description="Use the IP pool editor to change IP status and assign roles."
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <ActionButton tone="muted" onClick={onClose}>Cancel</ActionButton>
          <ActionButton tone="primary" onClick={onSave}>Save</ActionButton>
        </div>
      }
    >
      {ipDraft ? (
        <div className="space-y-4">
          <Field label="IP Address"><input className={inputClassName} value={ipDraft.address} onChange={(event) => onChange({ ...ipDraft, address: event.target.value })} /></Field>
          <Field label="Role">
            <select className={inputClassName} value={ipDraft.role} onChange={(event) => onChange({ ...ipDraft, role: event.target.value as NodePoolIp["role"] })}>
              <option>MAIN</option>
              <option>SIP</option>
              <option>MEDIA</option>
              <option>UNASSIGNED</option>
            </select>
          </Field>
          <Field label="Interface">
            <input className={inputClassName} value={ipDraft.interfaceName ?? ""} onChange={(event) => onChange({ ...ipDraft, interfaceName: event.target.value })} />
          </Field>
          <Field label="Status">
            <select className={inputClassName} value={ipDraft.status} onChange={(event) => onChange({ ...ipDraft, status: event.target.value as NodePoolIp["status"] })}>
              <option>Active</option>
              <option>Disabled</option>
              <option>Reserved</option>
            </select>
          </Field>
          <Field label="Whitelist Use">
            <select className={inputClassName} value={ipDraft.whitelistUse} onChange={(event) => onChange({ ...ipDraft, whitelistUse: event.target.value as NodePoolIp["whitelistUse"] })}>
              <option>Customer + Vendor</option>
              <option>Internal only</option>
            </select>
          </Field>
        </div>
      ) : null}
    </OverlayPanel>
  );
}

export function NodeMediaDrawer({
  mediaDraft,
  ipOptions,
  onClose,
  onSave,
  onChange,
}: {
  mediaDraft: MediaIpRecord | null;
  ipOptions: string[];
  onClose: () => void;
  onSave: () => void;
  onChange: (next: MediaIpRecord) => void;
}) {
  return (
    <OverlayPanel
      open={Boolean(mediaDraft)}
      title={mediaDraft?.address ? "Edit Media IP" : "Add Media IP"}
      description="Assign remaining node IPs as media IPs and tune runtime limits."
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <ActionButton tone="muted" onClick={onClose}>Cancel</ActionButton>
          <ActionButton tone="primary" onClick={onSave}>Save</ActionButton>
        </div>
      }
    >
      {mediaDraft ? (
        <div className="space-y-4">
          <Field label="Media IP">
            <select className={inputClassName} value={mediaDraft.address} onChange={(event) => onChange({ ...mediaDraft, address: event.target.value })}>
              <option value="">Select media IP</option>
              {ipOptions.map((address) => (
                <option key={address} value={address}>{address}</option>
              ))}
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Max Concurrent Calls"><input className={inputClassName} type="number" value={mediaDraft.maxCalls} onChange={(event) => onChange({ ...mediaDraft, maxCalls: Number(event.target.value) || 30 })} /></Field>
            <Field label="Max CPS"><input className={inputClassName} type="number" value={mediaDraft.maxCps} onChange={(event) => onChange({ ...mediaDraft, maxCps: Number(event.target.value) || 5 })} /></Field>
            <Field label="Weight"><input className={inputClassName} type="number" value={mediaDraft.weight} onChange={(event) => onChange({ ...mediaDraft, weight: Number(event.target.value) || 1 })} /></Field>
            <Field label="Current CPS"><input className={inputClassName} type="number" value={mediaDraft.currentCps} onChange={(event) => onChange({ ...mediaDraft, currentCps: Number(event.target.value) || 0 })} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status">
              <select className={inputClassName} value={mediaDraft.status} onChange={(event) => onChange({ ...mediaDraft, status: event.target.value as MediaIpRecord["status"] })}>
                <option>Active</option>
                <option>Disabled</option>
                <option>Draining</option>
              </select>
            </Field>
            <Field label="Drain Mode">
              <select className={inputClassName} value={mediaDraft.drainMode ? "Yes" : "No"} onChange={(event) => onChange({ ...mediaDraft, drainMode: event.target.value === "Yes" })}>
                <option>No</option>
                <option>Yes</option>
              </select>
            </Field>
          </div>
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
