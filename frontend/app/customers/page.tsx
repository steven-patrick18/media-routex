"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ActionButton, ActionsRow, Badge, OverlayPanel, SectionCard, SimpleTable } from "@/components/panel-primitives";
import { createCustomer, deleteCustomer, listCustomersRaw, listNodes, mapBackendCustomerToFrontend, updateCustomer } from "@/lib/api";
import type { CustomerRecord, NodeRecord } from "@/lib/control-panel";

const emptyCustomer = (): CustomerRecord => ({
  id: "",
  name: "",
  status: "Draft",
  notes: "",
  dialerIps: [],
  allowedSipNodes: [],
});

export default function CustomersPage() {
  const [records, setRecords] = useState<CustomerRecord[]>([]);
  const [nodeRecords, setNodeRecords] = useState<NodeRecord[]>([]);
  const [draft, setDraft] = useState<CustomerRecord | null>(null);
  const [mode, setMode] = useState<"add" | "edit" | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      const [backendNodes, backendCustomers] = await Promise.all([listNodes(), listCustomersRaw()]);
      if (cancelled) {
        return;
      }

      const safeNodes = backendNodes ?? [];
      setNodeRecords(safeNodes);
      setRecords((backendCustomers ?? []).map((customer) => mapBackendCustomerToFrontend(customer, safeNodes)));
      setIsLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeCount = useMemo(() => records.filter((customer) => customer.status === "Active").length, [records]);
  const nodeIdByName = useMemo(() => new Map(nodeRecords.map((node) => [node.name, Number(node.id)])), [nodeRecords]);

  function openAdd() {
    setMode("add");
    setDraft(emptyCustomer());
  }

  function openEdit(customer: CustomerRecord) {
    setMode("edit");
    setDraft({ ...customer, dialerIps: [...customer.dialerIps], allowedSipNodes: [...customer.allowedSipNodes] });
  }

  function closePanel() {
    setMode(null);
    setDraft(null);
  }

  async function saveDraft() {
    if (!draft) {
      return;
    }

    const cleaned = {
      ...draft,
      name: draft.name.trim(),
      notes: draft.notes.trim(),
      dialerIps: draft.dialerIps.filter(Boolean),
    };

    if (!cleaned.name) {
      return;
    }

    const payload = {
      name: cleaned.name,
      status: cleaned.status,
      notes: cleaned.notes,
      dialer_ips: cleaned.dialerIps,
      allowed_sip_node_ids: cleaned.allowedSipNodes
        .map((nodeName) => nodeIdByName.get(nodeName))
        .filter((value): value is number => typeof value === "number"),
    };

    const saved =
      mode === "edit" && cleaned.id
        ? await updateCustomer(cleaned.id, payload)
        : await createCustomer(payload);

    if (!saved) {
      return;
    }

    const next = mapBackendCustomerToFrontend(saved, nodeRecords);
    setRecords((current) =>
      mode === "edit"
        ? current.map((item) => (item.id === next.id ? next : item))
        : [next, ...current],
    );
    closePanel();
  }

  async function removeCustomer(customerId: string) {
    const ok = await deleteCustomer(customerId);
    if (!ok) {
      return;
    }

    setRecords((current) => current.filter((customer) => customer.id !== customerId));
    if (draft?.id === customerId) {
      closePanel();
    }
  }

  return (
    <AppShell
      title="Customers"
      eyebrow="Customer management"
      description="Manage customers by dialer IP and choose which SIP nodes they are allowed to send calls to. Customers do not receive media pools directly."
      activePath="/customers"
      headerActions={<ActionButton tone="primary" onClick={openAdd}>Add customer</ActionButton>}
    >
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SectionCard title="Customer List" eyebrow="Dialer identity records" badge={<Badge tone="cyan">{records.length} customers</Badge>}>
          <SimpleTable
            columns={["Customer", "Allowed SIP Nodes", "Status", "Dialer IPs", "Actions"]}
            rows={(isLoading ? [] : records).map((customer) => [
              <div key={`${customer.id}-name`}>
                <p className="font-semibold uppercase tracking-[0.08em] text-white">{customer.name}</p>
                <p className="mt-1 text-xs text-slate-500">{customer.notes}</p>
              </div>,
              <div key={`${customer.id}-nodes`} className="space-y-1">
                {customer.allowedSipNodes.map((nodeName) => {
                  const sipIp = nodeRecords.find((node) => node.name === nodeName)?.sipIp ?? "";
                  return (
                    <p key={nodeName} className="text-xs text-slate-300">
                      {nodeName} / {sipIp}
                    </p>
                  );
                })}
              </div>,
              <Badge key={`${customer.id}-status`} tone={customer.status === "Active" ? "emerald" : customer.status === "Draft" ? "amber" : "rose"}>
                {customer.status}
              </Badge>,
              <div key={`${customer.id}-ips`} className="space-y-1">
                {customer.dialerIps.map((ip) => (
                  <p key={ip} className="font-mono text-xs uppercase tracking-[0.12em] text-slate-300">
                    {ip}
                  </p>
                ))}
              </div>,
              <ActionsRow
                key={`${customer.id}-actions`}
                actions={[
                  { label: "View", href: `/customers/${customer.id}` },
                  { label: "Edit", onClick: () => openEdit(customer) },
                  { label: "Delete", tone: "danger", onClick: () => void removeCustomer(customer.id) },
                ]}
              />,
            ])}
          />
        </SectionCard>

        <SectionCard title="Customer Rules" eyebrow="Scope note" badge={<Badge tone="amber">{activeCount} active</Badge>}>
          <div className="space-y-3 text-sm leading-7 text-slate-300">
            <p>Customers are identified only by dialer or source IP.</p>
            <p>Each customer can keep multiple dialer IPs and multiple allowed SIP nodes.</p>
            <p>Media pools are not assigned to customers anywhere in this version.</p>
          </div>
        </SectionCard>
      </section>

      <OverlayPanel
        open={Boolean(draft)}
        title={mode === "edit" ? "Edit Customer" : "Add Customer"}
        description="Cancel discards unsaved changes. Save writes the customer to persistent storage and reloads the saved values on refresh."
        onClose={closePanel}
        footer={
          <div className="flex flex-wrap gap-3">
            <ActionButton tone="muted" onClick={closePanel}>Cancel</ActionButton>
            {mode === "edit" && draft ? (
              <ActionButton tone="danger" onClick={() => void removeCustomer(draft.id)}>Delete</ActionButton>
            ) : null}
            <ActionButton tone="primary" onClick={() => void saveDraft()}>{mode === "edit" ? "Update" : "Save"}</ActionButton>
          </div>
        }
      >
        {draft ? (
          <div className="space-y-4">
            <Field label="Customer Name">
              <input className={inputClassName} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="BlueWave Dialing" />
            </Field>
            <Field label="Status">
              <select className={inputClassName} value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as CustomerRecord["status"] })}>
                <option>Active</option>
                <option>Draft</option>
                <option>Suspended</option>
              </select>
            </Field>
            <Field label="Dialer IP List">
              <textarea
                className={textareaClassName}
                rows={5}
                value={draft.dialerIps.join("\n")}
                onChange={(event) => setDraft({ ...draft, dialerIps: normalizeLines(event.target.value) })}
                placeholder={"203.0.113.41\n203.0.113.42"}
              />
            </Field>
            <Field label="Allowed SIP Nodes">
              <select
                multiple
                className={`${inputClassName} h-36`}
                value={draft.allowedSipNodes}
                onChange={(event) => setDraft({ ...draft, allowedSipNodes: Array.from(event.target.selectedOptions, (option) => option.value) })}
              >
                {nodeRecords.map((node) => (
                  <option key={node.id} value={node.name}>
                    {node.name} / {node.sipIp}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Notes">
              <textarea className={textareaClassName} rows={4} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="Customer traffic notes and onboarding comments" />
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

function normalizeLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/70";

const textareaClassName =
  "w-full rounded-[1.6rem] border border-white/10 bg-slate-950/55 px-4 py-4 text-sm leading-7 text-white outline-none transition focus:border-cyan-300/70";
