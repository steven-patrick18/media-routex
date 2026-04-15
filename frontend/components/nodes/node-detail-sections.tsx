"use client";

import type { ReactNode } from "react";
import { ActionButton, ActionsRow, Badge, SectionCard, SimpleTable } from "@/components/panel-primitives";
import type { MediaIpRecord, NodePoolIp, NodeRecord } from "@/lib/types";

type ServiceRecord = {
  name: string;
  status: "Running" | "Standby" | "Stopped" | "Pending";
  mode: string;
};

export function NodeOverviewSection({
  node,
  statusMessage,
  statusTone,
  dirty,
  onChange,
  onSave,
  onCancel,
  onTestConnection,
}: {
  node: NodeRecord;
  statusMessage: string | null;
  statusTone: "emerald" | "rose" | "amber";
  dirty: boolean;
  onChange: (next: NodeRecord) => void;
  onSave: () => void;
  onCancel: () => void;
  onTestConnection: () => void;
}) {
  return (
    <SectionCard title="Overview" eyebrow="Editable node summary" badge={<Badge tone="emerald">{node.status}</Badge>}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Node Name"><input className={inputClassName} value={node.name} onChange={(event) => onChange({ ...node, name: event.target.value })} /></Field>
        <Field label="Main IP"><input className={inputClassName} value={node.mainIp} onChange={(event) => onChange({ ...node, mainIp: event.target.value })} /></Field>
        <Field label="SSH Port"><input className={inputClassName} type="number" value={node.sshPort} onChange={(event) => onChange({ ...node, sshPort: Number(event.target.value) || 22 })} /></Field>
        <Field label="SSH Username"><input className={inputClassName} value={node.sshUsername} onChange={(event) => onChange({ ...node, sshUsername: event.target.value })} /></Field>
        <Field label="OS Type"><input className={inputClassName} value={node.osType} onChange={(event) => onChange({ ...node, osType: event.target.value })} /></Field>
        <Field label="Traffic Role">
          <select className={inputClassName} value={node.purpose} onChange={(event) => onChange({ ...node, purpose: event.target.value as NodeRecord["purpose"] })}>
            <option>MONITORING</option>
            <option>SIP + MEDIA</option>
            <option>ROUTING / GATEWAY</option>
          </select>
        </Field>
        <Field label="Region"><input className={inputClassName} value={node.region} onChange={(event) => onChange({ ...node, region: event.target.value })} /></Field>
        <Field label="Status">
          <select className={inputClassName} value={node.status} onChange={(event) => onChange({ ...node, status: event.target.value as NodeRecord["status"] })}>
            <option>Healthy</option>
            <option>Warning</option>
            <option>Provisioning</option>
          </select>
        </Field>
      </div>
      <div className="mt-4">
        <Field label="Notes"><textarea className={textareaClassName} rows={4} value={node.notes} onChange={(event) => onChange({ ...node, notes: event.target.value })} /></Field>
      </div>
      {statusMessage ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/40 px-4 py-3">
          <Badge tone={statusTone}>{statusTone === "emerald" ? "Success" : statusTone === "rose" ? "Error" : "Status"}</Badge>
          <p className="text-sm text-slate-200">{statusMessage}</p>
        </div>
      ) : null}
      <div className="mt-4">
        <ActionButton tone="emerald" onClick={onTestConnection}>Test Connection</ActionButton>
      </div>
      <SaveBar onCancel={onCancel} onSave={onSave} disabled={!dirty} />
    </SectionCard>
  );
}

export function NodeServicesSection({ services }: { services: ServiceRecord[] }) {
  return (
    <SectionCard title="Services" eyebrow="Read-only placeholder service status" badge={<Badge tone="violet">Placeholder controls</Badge>}>
      <div className="space-y-4">
        {services.map((service) => (
          <div key={service.name} className="rounded-2xl border border-white/8 bg-slate-950/40 p-4">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px_200px]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-100">{service.name}</p>
                <p className="mt-2 text-sm text-slate-400">{service.mode}</p>
              </div>
              <Badge tone={service.status === "Running" ? "emerald" : service.status === "Pending" ? "amber" : "rose"}>{service.status}</Badge>
              <div className="flex flex-wrap gap-2">
                <ActionButton tone="muted" onClick={() => undefined}>Start</ActionButton>
                <ActionButton tone="muted" onClick={() => undefined}>Stop</ActionButton>
                <ActionButton tone="muted" onClick={() => undefined}>Restart</ActionButton>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export function NodeIpPoolSection({
  node,
  statusMessage,
  totalIpCount,
  selectedSipCount,
  totalMediaIpCount,
  bulkSipAddress,
  onBulkSipAddressChange,
  onBulkAssign,
  onScan,
  onOpenCreate,
  onOpenEdit,
  onAssignRole,
  onDelete,
}: {
  node: NodeRecord;
  statusMessage: string | null;
  totalIpCount: number;
  selectedSipCount: number;
  totalMediaIpCount: number;
  bulkSipAddress: string;
  onBulkSipAddressChange: (value: string) => void;
  onBulkAssign: () => void;
  onScan: () => void;
  onOpenCreate: () => void;
  onOpenEdit: (ip: NodePoolIp) => void;
  onAssignRole: (address: string, role: "sip" | "media" | "unassign") => void;
  onDelete: (address: string) => void;
}) {
  return (
    <SectionCard
      title="IP Pool"
      eyebrow="Editable IP records"
      badge={<Badge tone="cyan">{node.ipPool.length} IPs</Badge>}
      action={
        <div className="flex flex-wrap gap-2">
          <ActionButton tone="emerald" onClick={onScan}>Scan IP Pool</ActionButton>
          <ActionButton tone="primary" onClick={onOpenCreate}>Add IP</ActionButton>
        </div>
      }
    >
      <div className="mb-5 grid gap-4 xl:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.3fr)]">
        {[
          ["Total IPs", `${totalIpCount}`],
          ["SIP IP Selected", `${selectedSipCount}`],
          ["Total Media IPs", `${totalMediaIpCount}`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/8 bg-slate-950/40 px-4 py-4">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.26em] text-slate-500">{label}</p>
            <p className="mt-3 text-2xl font-semibold uppercase tracking-[0.08em] text-white">{value}</p>
          </div>
        ))}
        <div className="rounded-2xl border border-white/8 bg-slate-950/40 px-4 py-4">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.26em] text-slate-500">Bulk Assignment</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <select className={inputClassName} value={bulkSipAddress} onChange={(event) => onBulkSipAddressChange(event.target.value)}>
              <option value="">Select primary SIP IP</option>
              {node.ipPool.filter((item) => item.role !== "MAIN").map((item) => (
                <option key={item.address} value={item.address}>
                  {item.address} / {item.interfaceName ?? "-"}
                </option>
              ))}
            </select>
            <ActionButton tone="primary" onClick={onBulkAssign}>Assign Remaining as Media</ActionButton>
          </div>
          <p className="mt-3 text-xs leading-6 text-slate-400">Changing the SIP IP automatically unassigns the old SIP IP. All remaining unassigned IPs become media IPs in one action.</p>
          {statusMessage ? <p className="mt-3 text-xs leading-6 text-slate-400">{statusMessage}</p> : null}
        </div>
      </div>
      <SimpleTable
        columns={["IP Address", "Interface", "Status", "Role", "Action"]}
        rows={node.ipPool.map((ip) => [
          ip.address,
          ip.interfaceName ?? "-",
          ip.status,
          ip.role,
          <ActionsRow
            key={`${ip.address}-actions`}
            actions={[
              { label: "Edit", onClick: () => onOpenEdit(ip) },
              { label: "Set as SIP IP", onClick: () => onAssignRole(ip.address, "sip") },
              { label: "Set as Media IP", onClick: () => onAssignRole(ip.address, "media") },
              { label: "Unassign", onClick: () => onAssignRole(ip.address, "unassign") },
              { label: "Delete", tone: "danger", onClick: () => onDelete(ip.address) },
            ]}
          />,
        ])}
      />
    </SectionCard>
  );
}

export function NodeSipSection({
  node,
  dirty,
  onChange,
  onSave,
  onCancel,
}: {
  node: NodeRecord;
  dirty: boolean;
  onChange: (next: NodeRecord) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <SectionCard title="SIP IP" eyebrow="Customer and vendor whitelist address" badge={<Badge tone="emerald">Single primary SIP IP</Badge>}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Selected SIP IP">
          <select className={inputClassName} value={node.sipIp} onChange={(event) => onChange({ ...node, sipIp: event.target.value })}>
            <option value="">Select SIP IP</option>
            {node.ipPool.filter((ip) => ip.role !== "MAIN").map((ip) => (
              <option key={ip.address} value={ip.address}>{ip.address}</option>
            ))}
          </select>
        </Field>
        <Field label="SIP Port"><input className={inputClassName} type="number" value={node.sipPort} onChange={(event) => onChange({ ...node, sipPort: Number(event.target.value) || 5060 })} /></Field>
        <Field label="Protocol">
          <select className={inputClassName} value={node.sipProtocol} onChange={(event) => onChange({ ...node, sipProtocol: event.target.value as NodeRecord["sipProtocol"] })}>
            <option>UDP</option>
            <option>TCP</option>
            <option>TLS</option>
          </select>
        </Field>
        <Field label="Status">
          <select className={inputClassName} value={node.sipStatus} onChange={(event) => onChange({ ...node, sipStatus: event.target.value as NodeRecord["sipStatus"] })}>
            <option>Active</option>
            <option>Standby</option>
            <option>Disabled</option>
          </select>
        </Field>
      </div>
      <p className="mt-4 text-sm leading-7 text-slate-300">This signaling IP is the address customers and vendors whitelist. Media IPs stay separate and are used only for RTP anchoring.</p>
      <SaveBar onCancel={onCancel} onSave={onSave} disabled={!dirty} />
    </SectionCard>
  );
}

export function NodeMediaIpsSection({
  node,
  onAdd,
  onEdit,
  onDelete,
}: {
  node: NodeRecord;
  onAdd: () => void;
  onEdit: (item: MediaIpRecord) => void;
  onDelete: (address: string) => void;
}) {
  return (
    <SectionCard
      title="Media IPs"
      eyebrow="Add, edit, or remove media assignments"
      badge={<Badge tone="emerald">{node.mediaIps.length} assigned</Badge>}
      action={<ActionButton tone="primary" onClick={onAdd}>Add media IP</ActionButton>}
    >
      <SimpleTable
        columns={["IP", "Status", "Calls", "CPS", "Weight", "Drain", "Actions"]}
        rows={node.mediaIps.map((item) => [
          item.address,
          <Badge key={`${item.address}-status`} tone={item.status === "Active" ? "emerald" : item.status === "Draining" ? "amber" : "rose"}>{item.status}</Badge>,
          `${item.activeCalls}/${item.maxCalls}`,
          `${item.currentCps}/${item.maxCps}`,
          `${item.weight}`,
          item.drainMode ? "Yes" : "No",
          <ActionsRow
            key={`${item.address}-actions`}
            actions={[
              { label: "Edit", onClick: () => onEdit(item) },
              { label: "Delete", tone: "danger", onClick: () => onDelete(item.address) },
            ]}
          />,
        ])}
      />
    </SectionCard>
  );
}

export function NodeUsageSection({
  node,
  onEdit,
}: {
  node: NodeRecord;
  onEdit: (item: MediaIpRecord) => void;
}) {
  return (
    <SectionCard title="Usage" eyebrow="Read mostly, edit limits when needed" badge={<Badge tone="amber">Admin override</Badge>}>
      <SimpleTable
        columns={["IP", "Calls", "CPS", "Usage %", "Actions"]}
        rows={node.mediaIps.map((item) => [
          item.address,
          `${item.activeCalls}/${item.maxCalls}`,
          `${item.currentCps}/${item.maxCps}`,
          `${Math.round((item.activeCalls / item.maxCalls) * 100)}%`,
          <ActionsRow key={`${item.address}-usage`} actions={[{ label: "Edit", onClick: () => onEdit(item) }]} />,
        ])}
      />
    </SectionCard>
  );
}

export function NodeLogsSection({ status }: { status: NodeRecord["status"] }) {
  return (
    <SectionCard title="Logs" eyebrow="Read-only activity trail" badge={<Badge tone="cyan">Recent</Badge>}>
      <SimpleTable
        columns={["Timestamp", "Action", "Result"]}
        rows={[
          ["2026-04-15 17:20:12", "service_check", "success"],
          ["2026-04-15 17:10:45", "media_ip_sync", "success"],
          ["2026-04-15 16:52:09", "agent_heartbeat", status === "Provisioning" ? "pending" : "success"],
        ]}
      />
    </SectionCard>
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

function SaveBar({ onSave, onCancel, disabled }: { onSave: () => void; onCancel: () => void; disabled?: boolean }) {
  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <ActionButton tone="muted" onClick={onCancel}>Cancel</ActionButton>
      <ActionButton tone="primary" onClick={onSave}>{disabled ? "Saved" : "Save"}</ActionButton>
    </div>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/70";

const textareaClassName =
  "w-full rounded-[1.6rem] border border-white/10 bg-slate-950/55 px-4 py-4 text-sm leading-7 text-white outline-none transition focus:border-cyan-300/70";
