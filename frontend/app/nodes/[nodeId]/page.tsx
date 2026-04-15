"use client";

import { useParams } from "next/navigation";
import { type ReactNode, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ActionButton, ActionsRow, Badge, OverlayPanel, SectionCard, SimpleTable } from "@/components/panel-primitives";
import { assignNodeIpRole, bulkAssignNodeMedia, scanNodeIpPool, testNodeConnection } from "@/lib/api";
import { getNodeById, type BackendNodeIp, type MediaIpRecord, type NodePoolIp, type NodeRecord } from "@/lib/control-panel";

type ServiceRecord = {
  name: string;
  status: "Running" | "Standby" | "Stopped" | "Pending";
  mode: string;
};

const tabs = ["Overview", "Services", "IP Pool", "SIP IP", "Media IPs", "Usage", "Logs"] as const;

export default function NodeDetailsPage() {
  const params = useParams<{ nodeId: string }>();
  const seedNode = getNodeById(params.nodeId);
  const [savedNode, setSavedNode] = useState(() => clone(seedNode));
  const [workingNode, setWorkingNode] = useState(() => clone(seedNode));
  const [savedServices, setSavedServices] = useState<ServiceRecord[]>([
    { name: "Monitoring", status: "Running", mode: "Base role" },
    { name: "SIP", status: seedNode.sipIp ? "Running" : "Standby", mode: "Signaling" },
    { name: "Media", status: seedNode.mediaIps.length ? "Running" : "Standby", mode: "RTP anchoring" },
    { name: "Agent", status: seedNode.status === "Provisioning" ? "Pending" : "Running", mode: "Local agent" },
  ]);
  const [workingServices, setWorkingServices] = useState(() => clone(savedServices));
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");
  const [ipDraft, setIpDraft] = useState<NodePoolIp | null>(null);
  const [mediaDraft, setMediaDraft] = useState<MediaIpRecord | null>(null);
  const [nodeIpIds, setNodeIpIds] = useState<Record<string, number>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"emerald" | "rose" | "amber">("amber");
  const [bulkSipAddress, setBulkSipAddress] = useState(seedNode.sipIp || "");
  const numericNodeId = Number((params.nodeId ?? "").replace("node-", ""));

  function saveNode() {
    setSavedNode(clone(workingNode));
  }

  function cancelNode() {
    setWorkingNode(clone(savedNode));
  }

  function saveServices() {
    setSavedServices(clone(workingServices));
  }

  function cancelServices() {
    setWorkingServices(clone(savedServices));
  }

  function upsertIpRecord() {
    if (!ipDraft || !ipDraft.address.trim()) {
      return;
    }

    setWorkingNode((current) => {
      const ipPool = current.ipPool.some((item) => item.address === ipDraft.address)
        ? current.ipPool.map((item) => (item.address === ipDraft.address ? ipDraft : item))
        : [...current.ipPool, ipDraft];
      const nextSipIp = ipDraft.role === "SIP" ? ipDraft.address : current.sipIp;
      const nextMediaIps =
        ipDraft.role === "MEDIA" && !current.mediaIps.some((item) => item.address === ipDraft.address)
          ? [...current.mediaIps, makeMediaIp(ipDraft.address)]
          : current.mediaIps.filter((item) => item.address !== ipDraft.address || ipDraft.role === "MEDIA");
      return { ...current, ipPool, sipIp: nextSipIp, mediaIps: nextMediaIps };
    });
    setIpDraft(null);
  }

  function upsertMediaIp() {
    if (!mediaDraft || !mediaDraft.address.trim()) {
      return;
    }

    setWorkingNode((current) => {
      const mediaIps = current.mediaIps.some((item) => item.address === mediaDraft.address)
        ? current.mediaIps.map((item) => (item.address === mediaDraft.address ? mediaDraft : item))
        : [...current.mediaIps, mediaDraft];
      const ipPool: NodePoolIp[] = current.ipPool.some((item) => item.address === mediaDraft.address)
        ? current.ipPool.map((item) => (item.address === mediaDraft.address ? { ...item, role: "MEDIA" } : item))
        : [...current.ipPool, { address: mediaDraft.address, role: "MEDIA", status: "Active", whitelistUse: "Internal only" }];
      return { ...current, mediaIps, ipPool };
    });
    setMediaDraft(null);
  }

  function deleteMediaIp(address: string) {
    setWorkingNode((current) => ({
      ...current,
      mediaIps: current.mediaIps.filter((item) => item.address !== address),
      ipPool: current.ipPool.map((item) => (item.address === address ? { ...item, role: "MEDIA", status: "Reserved" } : item)),
    }));
  }

  async function handleTestConnection() {
    const response = await testNodeConnection({
      main_ip: workingNode.mainIp.trim(),
      ssh_port: workingNode.sshPort,
      ssh_username: workingNode.sshUsername.trim(),
      ssh_password: workingNode.sshPassword ?? "",
    });

    if (!response) {
      setStatusTone("rose");
      setStatusMessage("SSH connection test could not reach the backend endpoint.");
      return;
    }

    setStatusTone(response.ok ? "emerald" : "rose");
    setStatusMessage(response.message);
  }

  async function handleScanIpPool() {
    if (!numericNodeId) {
      setStatusTone("amber");
      setStatusMessage("This node is still using local mock data only, so IP scan cannot be sent to the backend.");
      return;
    }

    const response = await scanNodeIpPool(numericNodeId);
    if (!response) {
      setStatusTone("rose");
      setStatusMessage("IP scan failed or did not return a valid node record.");
      return;
    }

    hydrateFromBackendNode(response);
    setStatusTone("emerald");
    setStatusMessage("IP pool scan completed and discovered addresses were saved.");
  }

  async function handleAssignRole(address: string, role: "sip" | "media" | "unassign") {
    const backendIpId = nodeIpIds[address];

    if (numericNodeId && backendIpId) {
      const response = await assignNodeIpRole(numericNodeId, backendIpId, { role });
      if (response) {
        hydrateFromBackendNode(response);
        setStatusTone("emerald");
        setStatusMessage(`IP ${address} updated as ${role}.`);
        return;
      }
    }

    applyLocalRole(address, role);
    setBulkSipAddress(role === "sip" ? address : role === "unassign" && bulkSipAddress === address ? "" : bulkSipAddress);
    setStatusTone("amber");
    setStatusMessage(`IP ${address} updated locally as ${role}.`);
  }

  function applyLocalRole(address: string, role: "sip" | "media" | "unassign") {
    setWorkingNode((current) => {
      const nextIpPool: NodePoolIp[] = current.ipPool.map((item) => {
        if (role === "sip") {
          if (item.address === address) {
            return { ...item, role: "SIP", whitelistUse: "Customer + Vendor" };
          }
          return item.role === "SIP" ? { ...item, role: "UNASSIGNED", whitelistUse: "Internal only" } : item;
        }
        if (item.address === address) {
          if (role === "media") {
            return { ...item, role: "MEDIA", whitelistUse: "Internal only" };
          }
          return { ...item, role: "UNASSIGNED", whitelistUse: "Internal only" };
        }
        return item;
      });

      const nextSipIp = role === "sip" ? address : current.sipIp === address ? "" : current.sipIp;
      const nextMediaIps =
        role === "media"
          ? current.mediaIps.some((item) => item.address === address)
            ? current.mediaIps
            : [...current.mediaIps, makeMediaIp(address)]
          : current.mediaIps.filter((item) => item.address !== address);

      return { ...current, ipPool: nextIpPool, sipIp: nextSipIp, mediaIps: nextMediaIps };
    });
  }

  function hydrateFromBackendNode(node: { ips: BackendNodeIp[]; main_ip?: string; name?: string; status?: string; ssh_port?: number; ssh_username?: string; ssh_password?: string; os_type?: string; purpose?: string; region?: string; notes?: string; sip_ip_id?: number | null }) {
    const mapped = mapBackendNodeToFrontend(node, workingNode);
    setNodeIpIds(Object.fromEntries(node.ips.map((item) => [item.ip_address, item.id])));
    setWorkingNode(mapped);
    setSavedNode(mapped);
    setBulkSipAddress(mapped.sipIp || "");
  }

  async function handleBulkAssignMedia() {
    if (!bulkSipAddress) {
      setStatusTone("amber");
      setStatusMessage("Select one primary SIP IP before bulk assigning media IPs.");
      return;
    }

    const sipNodeIpId = nodeIpIds[bulkSipAddress];
    if (numericNodeId && sipNodeIpId) {
      const response = await bulkAssignNodeMedia(numericNodeId, { sip_node_ip_id: sipNodeIpId });
      if (response) {
        hydrateFromBackendNode(response);
        setStatusTone("emerald");
        setStatusMessage("Primary SIP IP updated and all remaining unassigned IPs were assigned as media IPs.");
        return;
      }
    }

    setWorkingNode((current) => {
      const nextIpPool: NodePoolIp[] = current.ipPool.map((item) => {
        if (item.address === bulkSipAddress) {
          return { ...item, role: "SIP", whitelistUse: "Customer + Vendor" };
        }
        if (item.role === "SIP") {
          return { ...item, role: "UNASSIGNED", whitelistUse: "Internal only" };
        }
        if (item.role === "UNASSIGNED") {
          return { ...item, role: "MEDIA", whitelistUse: "Internal only" };
        }
        return item;
      });

      const mediaAddresses = nextIpPool.filter((item) => item.role === "MEDIA").map((item) => item.address);
      const nextMediaIps = mediaAddresses.map((address) => current.mediaIps.find((item) => item.address === address) ?? makeMediaIp(address));

      const nextNode = { ...current, sipIp: bulkSipAddress, ipPool: nextIpPool, mediaIps: nextMediaIps };
      setSavedNode(nextNode);
      return nextNode;
    });
    setStatusTone("amber");
    setStatusMessage("Primary SIP IP updated and remaining unassigned IPs were assigned locally as media IPs.");
  }

  const totalIpCount = workingNode.ipPool.length;
  const selectedSipCount = workingNode.sipIp ? 1 : 0;
  const totalMediaIpCount = workingNode.ipPool.filter((item) => item.role === "MEDIA").length;

  const selectedTab = {
    Overview: (
      <SectionCard title="Overview" eyebrow="Editable node summary" badge={<Badge tone="emerald">{workingNode.status}</Badge>}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Node Name"><input className={inputClassName} value={workingNode.name} onChange={(event) => setWorkingNode({ ...workingNode, name: event.target.value })} /></Field>
          <Field label="Main IP"><input className={inputClassName} value={workingNode.mainIp} onChange={(event) => setWorkingNode({ ...workingNode, mainIp: event.target.value })} /></Field>
          <Field label="SSH Port"><input className={inputClassName} type="number" value={workingNode.sshPort} onChange={(event) => setWorkingNode({ ...workingNode, sshPort: Number(event.target.value) || 22 })} /></Field>
          <Field label="SSH Username"><input className={inputClassName} value={workingNode.sshUsername} onChange={(event) => setWorkingNode({ ...workingNode, sshUsername: event.target.value })} /></Field>
          <Field label="OS Type"><input className={inputClassName} value={workingNode.osType} onChange={(event) => setWorkingNode({ ...workingNode, osType: event.target.value })} /></Field>
          <Field label="Traffic Role">
            <select className={inputClassName} value={workingNode.purpose} onChange={(event) => setWorkingNode({ ...workingNode, purpose: event.target.value as typeof workingNode.purpose })}>
              <option>MONITORING</option>
              <option>SIP + MEDIA</option>
              <option>ROUTING / GATEWAY</option>
            </select>
          </Field>
          <Field label="Region"><input className={inputClassName} value={workingNode.region} onChange={(event) => setWorkingNode({ ...workingNode, region: event.target.value })} /></Field>
          <Field label="Status">
            <select className={inputClassName} value={workingNode.status} onChange={(event) => setWorkingNode({ ...workingNode, status: event.target.value as typeof workingNode.status })}>
              <option>Healthy</option>
              <option>Warning</option>
              <option>Provisioning</option>
            </select>
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Notes"><textarea className={textareaClassName} rows={4} value={workingNode.notes} onChange={(event) => setWorkingNode({ ...workingNode, notes: event.target.value })} /></Field>
        </div>
        {statusMessage ? (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/40 px-4 py-3">
            <Badge tone={statusTone}>{statusTone === "emerald" ? "Success" : statusTone === "rose" ? "Error" : "Status"}</Badge>
            <p className="text-sm text-slate-200">{statusMessage}</p>
          </div>
        ) : null}
        <div className="mt-4">
          <ActionButton tone="emerald" onClick={handleTestConnection}>Test Connection</ActionButton>
        </div>
        <SaveBar onCancel={cancelNode} onSave={saveNode} />
      </SectionCard>
    ),
    Services: (
      <SectionCard title="Services" eyebrow="Editable placeholder service settings" badge={<Badge tone="violet">Placeholder controls</Badge>}>
        <div className="space-y-4">
          {workingServices.map((service) => (
            <div key={service.name} className="rounded-2xl border border-white/8 bg-slate-950/40 p-4">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px_200px]">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-100">{service.name}</p>
                  <p className="mt-2 text-sm text-slate-400">{service.mode}</p>
                </div>
                <select
                  className={inputClassName}
                  value={service.status}
                  onChange={(event) =>
                    setWorkingServices((current) =>
                      current.map((item) => (item.name === service.name ? { ...item, status: event.target.value as ServiceRecord["status"] } : item)),
                    )
                  }
                >
                  <option>Running</option>
                  <option>Standby</option>
                  <option>Stopped</option>
                  <option>Pending</option>
                </select>
                <div className="flex flex-wrap gap-2">
                  <ActionButton tone="muted" onClick={() => undefined}>Start</ActionButton>
                  <ActionButton tone="muted" onClick={() => undefined}>Stop</ActionButton>
                  <ActionButton tone="muted" onClick={() => undefined}>Restart</ActionButton>
                </div>
              </div>
            </div>
          ))}
        </div>
        <SaveBar onCancel={cancelServices} onSave={saveServices} />
      </SectionCard>
    ),
    "IP Pool": (
      <SectionCard
        title="IP Pool"
        eyebrow="Editable IP records"
        badge={<Badge tone="cyan">{workingNode.ipPool.length} IPs</Badge>}
        action={
          <div className="flex flex-wrap gap-2">
            <ActionButton tone="emerald" onClick={handleScanIpPool}>Scan IP Pool</ActionButton>
            <ActionButton tone="primary" onClick={() => setIpDraft({ address: "", role: "UNASSIGNED", status: "Active", whitelistUse: "Internal only", interfaceName: "" })}>Add IP</ActionButton>
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
              <select
                className="min-w-[220px] flex-1 rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/70"
                value={bulkSipAddress}
                onChange={(event) => setBulkSipAddress(event.target.value)}
              >
                <option value="">Select primary SIP IP</option>
                {workingNode.ipPool
                  .filter((item) => item.role !== "MAIN")
                  .map((item) => (
                    <option key={item.address} value={item.address}>
                      {item.address} / {item.interfaceName ?? "-"}
                    </option>
                  ))}
              </select>
              <ActionButton tone="primary" onClick={handleBulkAssignMedia}>Assign Remaining as Media</ActionButton>
            </div>
            <p className="mt-3 text-xs leading-6 text-slate-400">Changing the SIP IP automatically unassigns the old SIP IP. All remaining unassigned IPs become media IPs in one action.</p>
          </div>
        </div>
        <SimpleTable
          columns={["IP Address", "Interface", "Status", "Role", "Action"]}
          rows={workingNode.ipPool.map((ip) => [
            ip.address,
            ip.interfaceName ?? "-",
            ip.status,
            ip.role,
            <ActionsRow
              key={`${ip.address}-actions`}
              actions={[
                { label: "Set as SIP IP", onClick: () => handleAssignRole(ip.address, "sip") },
                { label: "Set as Media IP", onClick: () => handleAssignRole(ip.address, "media") },
                { label: "Unassign", tone: "danger", onClick: () => handleAssignRole(ip.address, "unassign") },
              ]}
            />,
          ])}
        />
        <SaveBar onCancel={cancelNode} onSave={saveNode} />
      </SectionCard>
    ),
    "SIP IP": (
      <SectionCard title="SIP IP" eyebrow="Customer and vendor whitelist address" badge={<Badge tone="emerald">Single primary SIP IP</Badge>}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Selected SIP IP">
            <select className={inputClassName} value={workingNode.sipIp} onChange={(event) => setWorkingNode({ ...workingNode, sipIp: event.target.value })}>
              <option value="">Select SIP IP</option>
              {workingNode.ipPool.map((ip) => (
                <option key={ip.address} value={ip.address}>{ip.address}</option>
              ))}
            </select>
          </Field>
          <Field label="SIP Port">
            <input className={inputClassName} type="number" value={workingNode.sipPort} onChange={(event) => setWorkingNode({ ...workingNode, sipPort: Number(event.target.value) || 5060 })} />
          </Field>
          <Field label="Protocol">
            <select className={inputClassName} value={workingNode.sipProtocol} onChange={(event) => setWorkingNode({ ...workingNode, sipProtocol: event.target.value as typeof workingNode.sipProtocol })}>
              <option>UDP</option>
              <option>TCP</option>
              <option>TLS</option>
            </select>
          </Field>
          <Field label="Status">
            <select className={inputClassName} value={workingNode.sipStatus} onChange={(event) => setWorkingNode({ ...workingNode, sipStatus: event.target.value as typeof workingNode.sipStatus })}>
              <option>Active</option>
              <option>Standby</option>
              <option>Disabled</option>
            </select>
          </Field>
        </div>
        <p className="mt-4 text-sm leading-7 text-slate-300">This signaling IP is the address customers and vendors whitelist. Media IPs stay separate and are used only for RTP anchoring.</p>
        <SaveBar onCancel={cancelNode} onSave={saveNode} />
      </SectionCard>
    ),
    "Media IPs": (
      <SectionCard
        title="Media IPs"
        eyebrow="Add, edit, or remove media assignments"
        badge={<Badge tone="emerald">{workingNode.mediaIps.length} assigned</Badge>}
        action={<ActionButton tone="primary" onClick={() => setMediaDraft(makeMediaIp(workingNode.ipPool.find((item) => item.role !== "MAIN")?.address ?? ""))}>Add media IP</ActionButton>}
      >
        <SimpleTable
          columns={["IP", "Status", "Calls", "CPS", "Weight", "Drain", "Actions"]}
          rows={workingNode.mediaIps.map((item) => [
            item.address,
            <Badge key={`${item.address}-status`} tone={item.status === "Active" ? "emerald" : item.status === "Draining" ? "amber" : "rose"}>{item.status}</Badge>,
            `${item.activeCalls}/${item.maxCalls}`,
            `${item.currentCps}/${item.maxCps}`,
            `${item.weight}`,
            item.drainMode ? "Yes" : "No",
            <ActionsRow
              key={`${item.address}-actions`}
              actions={[
                { label: "Edit", onClick: () => setMediaDraft({ ...item }) },
                { label: "Delete", tone: "danger", onClick: () => deleteMediaIp(item.address) },
              ]}
            />,
          ])}
        />
        <SaveBar onCancel={cancelNode} onSave={saveNode} />
      </SectionCard>
    ),
    Usage: (
      <SectionCard title="Usage" eyebrow="Read mostly, edit limits when needed" badge={<Badge tone="amber">Admin override</Badge>}>
        <SimpleTable
          columns={["IP", "Calls", "CPS", "Usage %", "Actions"]}
          rows={workingNode.mediaIps.map((item) => [
            item.address,
            `${item.activeCalls}/${item.maxCalls}`,
            `${item.currentCps}/${item.maxCps}`,
            `${Math.round((item.activeCalls / item.maxCalls) * 100)}%`,
            <ActionsRow key={`${item.address}-usage`} actions={[{ label: "Edit", onClick: () => setMediaDraft({ ...item }) }]} />,
          ])}
        />
        <SaveBar onCancel={cancelNode} onSave={saveNode} />
      </SectionCard>
    ),
    Logs: (
      <SectionCard title="Logs" eyebrow="Read-only activity trail" badge={<Badge tone="cyan">Recent</Badge>}>
        <SimpleTable
          columns={["Timestamp", "Action", "Result"]}
          rows={[
            ["2026-04-15 17:20:12", "service_check", "success"],
            ["2026-04-15 17:10:45", "media_ip_sync", "success"],
            ["2026-04-15 16:52:09", "agent_heartbeat", workingNode.status === "Provisioning" ? "pending" : "success"],
          ]}
        />
      </SectionCard>
    ),
  }[activeTab];

  return (
    <AppShell
      title={workingNode.name}
      eyebrow="Node details"
      description="Edit node summary fields, SIP IP, IP pool records, media IP assignments, placeholder services, and usage limits from one operator-friendly page."
      activePath="/nodes"
    >
      <section className="flex flex-wrap gap-3">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] ${
              activeTab === tab
                ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
                : "border-white/10 bg-white/[0.04] text-slate-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </section>

      {selectedTab}

      <OverlayPanel
        open={Boolean(ipDraft)}
        title={ipDraft?.address ? "Edit IP Record" : "Add IP Record"}
        description="Use the IP pool editor to change IP status and assign roles."
        onClose={() => setIpDraft(null)}
        footer={
          <div className="flex gap-3">
            <ActionButton tone="muted" onClick={() => setIpDraft(null)}>Cancel</ActionButton>
            <ActionButton tone="primary" onClick={upsertIpRecord}>Save</ActionButton>
          </div>
        }
      >
        {ipDraft ? (
          <div className="space-y-4">
            <Field label="IP Address"><input className={inputClassName} value={ipDraft.address} onChange={(event) => setIpDraft({ ...ipDraft, address: event.target.value })} /></Field>
            <Field label="Role">
              <select className={inputClassName} value={ipDraft.role} onChange={(event) => setIpDraft({ ...ipDraft, role: event.target.value as NodePoolIp["role"] })}>
                <option>MAIN</option>
                <option>SIP</option>
                <option>MEDIA</option>
                <option>UNASSIGNED</option>
              </select>
            </Field>
            <Field label="Interface">
              <input className={inputClassName} value={ipDraft.interfaceName ?? ""} onChange={(event) => setIpDraft({ ...ipDraft, interfaceName: event.target.value })} />
            </Field>
            <Field label="Status">
              <select className={inputClassName} value={ipDraft.status} onChange={(event) => setIpDraft({ ...ipDraft, status: event.target.value as NodePoolIp["status"] })}>
                <option>Active</option>
                <option>Disabled</option>
                <option>Reserved</option>
              </select>
            </Field>
            <Field label="Whitelist Use">
              <select className={inputClassName} value={ipDraft.whitelistUse} onChange={(event) => setIpDraft({ ...ipDraft, whitelistUse: event.target.value as NodePoolIp["whitelistUse"] })}>
                <option>Customer + Vendor</option>
                <option>Internal only</option>
              </select>
            </Field>
          </div>
        ) : null}
      </OverlayPanel>

      <OverlayPanel
        open={Boolean(mediaDraft)}
        title={mediaDraft?.address ? "Edit Media IP" : "Add Media IP"}
        description="Assign remaining node IPs as media IPs and tune runtime limits."
        onClose={() => setMediaDraft(null)}
        footer={
          <div className="flex gap-3">
            <ActionButton tone="muted" onClick={() => setMediaDraft(null)}>Cancel</ActionButton>
            <ActionButton tone="primary" onClick={upsertMediaIp}>Save</ActionButton>
          </div>
        }
      >
        {mediaDraft ? (
          <div className="space-y-4">
            <Field label="Media IP">
              <select className={inputClassName} value={mediaDraft.address} onChange={(event) => setMediaDraft({ ...mediaDraft, address: event.target.value })}>
                <option value="">Select media IP</option>
                {workingNode.ipPool.filter((item) => item.role !== "MAIN").map((item) => (
                  <option key={item.address} value={item.address}>{item.address}</option>
                ))}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Max Concurrent Calls"><input className={inputClassName} type="number" value={mediaDraft.maxCalls} onChange={(event) => setMediaDraft({ ...mediaDraft, maxCalls: Number(event.target.value) || 30 })} /></Field>
              <Field label="Max CPS"><input className={inputClassName} type="number" value={mediaDraft.maxCps} onChange={(event) => setMediaDraft({ ...mediaDraft, maxCps: Number(event.target.value) || 5 })} /></Field>
              <Field label="Weight"><input className={inputClassName} type="number" value={mediaDraft.weight} onChange={(event) => setMediaDraft({ ...mediaDraft, weight: Number(event.target.value) || 1 })} /></Field>
              <Field label="Current CPS"><input className={inputClassName} type="number" value={mediaDraft.currentCps} onChange={(event) => setMediaDraft({ ...mediaDraft, currentCps: Number(event.target.value) || 0 })} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Status">
                <select className={inputClassName} value={mediaDraft.status} onChange={(event) => setMediaDraft({ ...mediaDraft, status: event.target.value as MediaIpRecord["status"] })}>
                  <option>Active</option>
                  <option>Disabled</option>
                  <option>Draining</option>
                </select>
              </Field>
              <Field label="Drain Mode">
                <select className={inputClassName} value={mediaDraft.drainMode ? "Yes" : "No"} onChange={(event) => setMediaDraft({ ...mediaDraft, drainMode: event.target.value === "Yes" })}>
                  <option>No</option>
                  <option>Yes</option>
                </select>
              </Field>
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

function SaveBar({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <ActionButton tone="muted" onClick={onCancel}>Cancel</ActionButton>
      <ActionButton tone="primary" onClick={onSave}>Save</ActionButton>
    </div>
  );
}

function makeMediaIp(address: string): MediaIpRecord {
  return {
    address,
    status: "Active",
    activeCalls: 0,
    maxCalls: 30,
    currentCps: 0,
    maxCps: 5,
    weight: 1,
    drainMode: false,
  };
}

function mapBackendNodeToFrontend(node: { ips: BackendNodeIp[]; main_ip?: string; name?: string; status?: string; ssh_port?: number; ssh_username?: string; ssh_password?: string; os_type?: string; purpose?: string; region?: string; notes?: string; sip_ip_id?: number | null }, fallback: NodeRecord): NodeRecord {
  const sipIpAddress = node.ips.find((item) => item.id === node.sip_ip_id)?.ip_address ?? fallback.sipIp;
  const mappedIpPool: NodePoolIp[] = node.ips.map((item) => ({
    address: item.ip_address,
    interfaceName: item.interface_name ?? "",
    role: item.ip_role === "main" ? "MAIN" : item.ip_role === "sip" ? "SIP" : item.ip_role === "media" ? "MEDIA" : "UNASSIGNED",
    status: item.status === "disabled" ? "Disabled" : item.status === "reserved" ? "Reserved" : "Active",
    whitelistUse: item.ip_role === "sip" ? "Customer + Vendor" : "Internal only",
  }));
  const mappedMediaIps: MediaIpRecord[] = node.ips
    .filter((item) => item.ip_role === "media")
    .map((item) => ({
      address: item.ip_address,
      status: item.status === "disabled" ? "Disabled" : item.status === "draining" ? "Draining" : "Active",
      activeCalls: item.active_calls,
      maxCalls: item.max_concurrent_calls,
      currentCps: item.current_cps,
      maxCps: item.max_cps,
      weight: item.weight,
      drainMode: item.drain_mode,
    }));

  return {
    ...fallback,
    name: node.name ?? fallback.name,
    mainIp: node.main_ip ?? fallback.mainIp,
    sshPort: node.ssh_port ?? fallback.sshPort,
    sshUsername: node.ssh_username ?? fallback.sshUsername,
    sshPassword: node.ssh_password ?? fallback.sshPassword,
    osType: node.os_type ?? fallback.osType,
    purpose: (node.purpose as NodeRecord["purpose"]) ?? fallback.purpose,
    region: node.region ?? fallback.region,
    notes: node.notes ?? fallback.notes,
    status: (node.status as NodeRecord["status"]) ?? fallback.status,
    sipIp: sipIpAddress,
    ipPool: mappedIpPool,
    mediaIps: mappedMediaIps,
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/70";

const textareaClassName =
  "w-full rounded-[1.6rem] border border-white/10 bg-slate-950/55 px-4 py-4 text-sm leading-7 text-white outline-none transition focus:border-cyan-300/70";
