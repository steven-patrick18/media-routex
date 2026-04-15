"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ActionButton, ActionsRow, Badge, OverlayPanel, SectionCard, SimpleTable } from "@/components/panel-primitives";
import { createNode, deleteNode, listNodes, testNodeConnection, updateNode } from "@/lib/api";
import type { NodeRecord } from "@/lib/types";

const emptyNode = (): NodeRecord => ({
  id: `node-${Date.now()}`,
  name: "",
  mainIp: "",
  sshPort: 22,
  sshUsername: "",
  sshPassword: "",
  osType: "",
  purpose: "MONITORING",
  region: "",
  notes: "",
  status: "Provisioning",
  sipIp: "",
  sipPort: 5060,
  sipProtocol: "UDP",
  sipStatus: "Standby",
  ipPool: [],
  mediaIps: [],
});

export default function NodesPage() {
  const [records, setRecords] = useState<NodeRecord[]>([]);
  const [draft, setDraft] = useState<NodeRecord | null>(null);
  const [mode, setMode] = useState<"add" | "edit" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);
  const [connectionTone, setConnectionTone] = useState<"emerald" | "rose" | "amber">("amber");
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadNodes = useCallback(async (message?: string) => {
    setIsLoading(true);
    const response = await listNodes();
    if (!response) {
      setStatusMessage("Node data could not be refreshed from the backend. Keeping the last loaded values.");
      setIsLoading(false);
      return false;
    }

    setRecords(response);
    setStatusMessage(message ?? "Loaded latest data from the backend.");
    setIsLoading(false);
    return true;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      const response = await listNodes();
      if (!cancelled) {
        if (!response) {
          setStatusMessage("Node data could not be loaded from the backend.");
          setIsLoading(false);
          return;
        }

        setRecords(response);
        setStatusMessage("Loaded latest data from the backend.");
        setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  function openAdd() {
    setMode("add");
    setDraft(emptyNode());
    setShowPassword(false);
    setConnectionMessage(null);
  }

  function openEdit(node: NodeRecord) {
    setMode("edit");
    setDraft({
      ...node,
      sshPassword: node.sshPassword ?? "",
      ipPool: node.ipPool.map((item) => ({ ...item })),
      mediaIps: node.mediaIps.map((item) => ({ ...item })),
    });
    setShowPassword(false);
    setConnectionMessage(null);
  }

  function closePanel() {
    setMode(null);
    setDraft(null);
    setShowPassword(false);
    setConnectionMessage(null);
  }

  async function saveDraft() {
    if (!draft || !draft.name.trim() || !draft.mainIp.trim()) {
      return;
    }

    const next = { ...draft, name: draft.name.trim(), mainIp: draft.mainIp.trim(), notes: draft.notes.trim() };
    const payload = {
      name: next.name,
      main_ip: next.mainIp,
      ssh_port: next.sshPort,
      ssh_username: next.sshUsername,
      ssh_password: next.sshPassword ?? "",
      os_type: next.osType,
      purpose: next.purpose,
      region: next.region,
      notes: next.notes,
      status: next.status,
      sip_ip_id: null,
      sip_port: next.sipPort,
      sip_protocol: next.sipProtocol,
      sip_status: next.sipStatus,
    };

    const saved = mode === "edit" && next.id ? await updateNode(next.id, payload) : await createNode(payload);
    if (!saved) {
      return;
    }

    closePanel();
    await loadNodes("Node saved successfully. Loaded latest data.");
  }

  async function removeNode(nodeId: string) {
    const ok = await deleteNode(nodeId);
    if (!ok) {
      return;
    }

    if (draft?.id === nodeId) {
      closePanel();
    }
    await loadNodes("Node deleted. Loaded latest data.");
  }

  async function handleTestConnection() {
    if (!draft) {
      return;
    }

    const response = await testNodeConnection({
      main_ip: draft.mainIp.trim(),
      ssh_port: draft.sshPort,
      ssh_username: draft.sshUsername.trim(),
      ssh_password: draft.sshPassword ?? "",
    });

    if (!response) {
      setConnectionTone("rose");
      setConnectionMessage("SSH connection test could not reach the backend endpoint.");
      return;
    }

    setConnectionTone(response.ok ? "emerald" : "rose");
    setConnectionMessage(response.message);
  }

  return (
    <AppShell
      title="Nodes"
      eyebrow="Node and server management"
      description="Manage server inventory used by MediaRouteX for SIP, media, routing, and monitoring roles. Node detail tabs handle deeper IP and service editing."
      activePath="/nodes"
      headerActions={<ActionButton tone="primary" onClick={openAdd}>Add node</ActionButton>}
    >
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_320px]">
        <SectionCard title="Node Inventory" eyebrow="Server registry" badge={<Badge tone={isLoading ? "amber" : "emerald"}>{isLoading ? "Loading" : `${records.length} nodes`}</Badge>}>
          <SimpleTable
            columns={["Node", "SIP IP", "Traffic Role", "Region", "Media IPs", "Actions"]}
            rows={records.map((node) => [
              <div key={`${node.id}-name`}>
                <p className="font-semibold uppercase tracking-[0.08em] text-white">{node.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500">{node.mainIp}</p>
              </div>,
              node.sipIp || "Not selected",
              node.purpose,
              node.region,
              `${node.mediaIps.length}`,
              <ActionsRow
                key={`${node.id}-actions`}
                actions={[
                  { label: "View", href: `/nodes/${node.id}` },
                  { label: "Edit", onClick: () => openEdit(node) },
                  { label: "Delete", tone: "danger", onClick: () => void removeNode(node.id) },
                ]}
              />,
            ])}
          />
        </SectionCard>

        <SectionCard title="Node Scope" eyebrow="What edits live here" badge={<Badge tone="cyan">Operator flow</Badge>}>
          <div className="space-y-3 text-sm leading-7 text-slate-300">
            {statusMessage ? <p className="text-cyan-200">{statusMessage}</p> : null}
            <p>This screen covers add, edit, delete, and quick summary updates for each node.</p>
            <p>Open a node to edit IP pool records, SIP IP selection, media IP assignments, service placeholders, and usage limits.</p>
            <p>Monitoring stays available as the first base role, then the node can be used for SIP + MEDIA or ROUTING / GATEWAY.</p>
          </div>
        </SectionCard>
      </section>

      <OverlayPanel
        open={Boolean(draft)}
        title={mode === "edit" ? "Edit Node" : "Add Node"}
        description="This is the quick node editor. The detail page continues the same edit flow for tab-level settings."
        onClose={closePanel}
        footer={
          <div className="flex flex-wrap gap-3">
            <ActionButton tone="muted" onClick={closePanel}>Cancel</ActionButton>
            {mode === "edit" && draft ? (
              <ActionButton tone="danger" onClick={() => void removeNode(draft.id)}>Delete</ActionButton>
            ) : null}
            <ActionButton tone="primary" onClick={() => void saveDraft()}>{mode === "edit" ? "Update" : "Save"}</ActionButton>
          </div>
        }
      >
        {draft ? (
          <div className="space-y-4">
            <Field label="Node Name">
              <input className={inputClassName} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="DEL-SBC-01" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Main IP">
                <input className={inputClassName} value={draft.mainIp} onChange={(event) => setDraft({ ...draft, mainIp: event.target.value })} placeholder="10.10.0.11" />
              </Field>
              <Field label="SSH Port">
                <input className={inputClassName} type="number" value={draft.sshPort} onChange={(event) => setDraft({ ...draft, sshPort: Number(event.target.value) || 22 })} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="SSH Username">
                <input className={inputClassName} value={draft.sshUsername} onChange={(event) => setDraft({ ...draft, sshUsername: event.target.value })} placeholder="noc-admin" />
              </Field>
              <Field label="SSH Password">
                <div className="flex gap-3">
                  <input
                    className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/70"
                    type={showPassword ? "text" : "password"}
                    value={draft.sshPassword ?? ""}
                    onChange={(event) => setDraft({ ...draft, sshPassword: event.target.value })}
                    placeholder="Enter SSH password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-100 transition hover:bg-white/[0.08]"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="OS Type">
                <input className={inputClassName} value={draft.osType} onChange={(event) => setDraft({ ...draft, osType: event.target.value })} placeholder="Ubuntu 24.04" />
              </Field>
              <Field label="Traffic Role">
                <select className={inputClassName} value={draft.purpose} onChange={(event) => setDraft({ ...draft, purpose: event.target.value as NodeRecord["purpose"] })}>
                  <option>MONITORING</option>
                  <option>SIP + MEDIA</option>
                  <option>ROUTING / GATEWAY</option>
                </select>
              </Field>
              <Field label="Region">
                <input className={inputClassName} value={draft.region} onChange={(event) => setDraft({ ...draft, region: event.target.value })} placeholder="Delhi" />
              </Field>
            </div>
            <Field label="Notes">
              <textarea className={textareaClassName} rows={4} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="Node purpose and operator notes" />
            </Field>
            {connectionMessage ? (
              <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/40 px-4 py-3">
                <Badge tone={connectionTone}>{connectionTone === "emerald" ? "Success" : "Error"}</Badge>
                <p className="text-sm text-slate-200">{connectionMessage}</p>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <ActionButton tone="emerald" onClick={handleTestConnection}>Test Connection</ActionButton>
            </div>
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
