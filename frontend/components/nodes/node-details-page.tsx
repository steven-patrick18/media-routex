"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { assignNodeIpRole, bulkAssignNodeMedia, createNodeIp, deleteNodeIp, getNodeRaw, mapBackendNodeToFrontend, scanNodeIpPool, testNodeConnection, updateNode, updateNodeIp } from "@/lib/api";
import { cloneValue } from "@/lib/helpers";
import type { BackendNode, MediaIpRecord, NodeIpPayload, NodePoolIp, NodeRecord } from "@/lib/types";
import { NodeIpDrawer, NodeMediaDrawer } from "@/components/nodes/node-drawers";
import { NodeLogsSection, NodeMediaIpsSection, NodeOverviewSection, NodeServicesSection, NodeSipSection, NodeUsageSection, NodeIpPoolSection } from "@/components/nodes/node-detail-sections";
import { NodeTabBar, type NodeTab } from "@/components/nodes/node-tab-bar";

type ServiceRecord = {
  name: string;
  status: "Running" | "Standby" | "Stopped" | "Pending";
  mode: string;
};

const emptyNode: NodeRecord = {
  id: "",
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
};

export function NodeDetailsPageClient({ nodeId }: { nodeId: string }) {
  const [savedNode, setSavedNode] = useState<NodeRecord>(emptyNode);
  const [workingNode, setWorkingNode] = useState<NodeRecord>(emptyNode);
  const [activeTab, setActiveTab] = useState<NodeTab>("Overview");
  const [ipDraft, setIpDraft] = useState<NodePoolIp | null>(null);
  const [mediaDraft, setMediaDraft] = useState<MediaIpRecord | null>(null);
  const [nodeIpIds, setNodeIpIds] = useState<Record<string, number>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"emerald" | "rose" | "amber">("amber");
  const [bulkSipAddress, setBulkSipAddress] = useState("");

  const numericNodeId = Number(nodeId);
  const overviewDirty = JSON.stringify(savedNode) !== JSON.stringify(workingNode);
  const services = useMemo<ServiceRecord[]>(
    () => [
      { name: "Monitoring", status: "Running", mode: "Base role" },
      { name: "SIP", status: workingNode.sipIp ? "Running" : "Standby", mode: "Signaling" },
      { name: "Media", status: workingNode.mediaIps.length ? "Running" : "Standby", mode: "RTP anchoring" },
      { name: "Agent", status: workingNode.status === "Provisioning" ? "Pending" : "Running", mode: "Local agent" },
    ],
    [workingNode],
  );

  const hydrateFromBackendNode = useCallback((node: BackendNode) => {
    const mapped = mapBackendNodeToFrontend(node);
    setNodeIpIds(Object.fromEntries(node.ips.map((item) => [item.ip_address, item.id])));
    setSavedNode(mapped);
    setWorkingNode(mapped);
    setBulkSipAddress(mapped.sipIp || "");
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const response = await getNodeRaw(nodeId);
      if (!cancelled && response) {
        hydrateFromBackendNode(response);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [hydrateFromBackendNode, nodeId]);

  function toNodePayload(node: NodeRecord, sipIpOverride?: string | null) {
    const selectedSipIp = sipIpOverride === undefined ? node.sipIp : sipIpOverride ?? "";
    return {
      name: node.name.trim(),
      main_ip: node.mainIp.trim(),
      ssh_port: node.sshPort,
      ssh_username: node.sshUsername.trim(),
      ssh_password: node.sshPassword ?? "",
      os_type: node.osType.trim(),
      purpose: node.purpose,
      region: node.region.trim(),
      notes: node.notes.trim(),
      status: node.status,
      sip_ip_id: selectedSipIp ? nodeIpIds[selectedSipIp] ?? null : null,
      sip_port: node.sipPort,
      sip_protocol: node.sipProtocol,
      sip_status: node.sipStatus,
    };
  }

  function mapNodePoolIpToPayload(ip: NodePoolIp, current?: MediaIpRecord): NodeIpPayload {
    return {
      ip_address: ip.address,
      interface_name: ip.interfaceName ?? "",
      ip_role: ip.role === "MAIN" ? "main" : ip.role === "SIP" ? "sip" : ip.role === "MEDIA" ? "media" : "pool",
      status: ip.status === "Disabled" ? "disabled" : ip.status === "Reserved" ? "reserved" : current?.status === "Draining" || current?.drainMode ? "draining" : "active",
      active_calls: current?.activeCalls ?? 0,
      max_concurrent_calls: current?.maxCalls ?? 30,
      current_cps: current?.currentCps ?? 0,
      max_cps: current?.maxCps ?? 5,
      weight: current?.weight ?? 1,
      drain_mode: current?.drainMode ?? false,
    };
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

  async function saveOverview() {
    const response = await updateNode(nodeId, toNodePayload(workingNode));
    if (!response) {
      setStatusTone("rose");
      setStatusMessage("Node summary save did not reach the backend.");
      return;
    }
    hydrateFromBackendNode(response);
    setStatusTone("emerald");
    setStatusMessage("Node summary saved.");
  }

  function cancelOverview() {
    setWorkingNode(cloneValue(savedNode));
  }

  async function saveSipSettings() {
    const previousSip = savedNode.sipIp;
    const nextSip = workingNode.sipIp;

    if (nextSip && nextSip !== previousSip) {
      const sipNodeIpId = nodeIpIds[nextSip];
      if (sipNodeIpId) {
        const roleResponse = await assignNodeIpRole(numericNodeId, sipNodeIpId, { role: "sip" });
        if (roleResponse) {
          hydrateFromBackendNode(roleResponse);
        }
      }
    } else if (!nextSip && previousSip) {
      const sipNodeIpId = nodeIpIds[previousSip];
      if (sipNodeIpId) {
        const roleResponse = await assignNodeIpRole(numericNodeId, sipNodeIpId, { role: "unassign" });
        if (roleResponse) {
          hydrateFromBackendNode(roleResponse);
        }
      }
    }

    const response = await updateNode(nodeId, toNodePayload(workingNode, workingNode.sipIp || null));
    if (!response) {
      setStatusTone("rose");
      setStatusMessage("SIP settings save did not reach the backend.");
      return;
    }
    hydrateFromBackendNode(response);
    setStatusTone("emerald");
    setStatusMessage("SIP settings saved.");
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
    if (!backendIpId) {
      return;
    }

    const response = await assignNodeIpRole(numericNodeId, backendIpId, { role });
    if (!response) {
      setStatusTone("rose");
      setStatusMessage(`IP ${address} could not be updated.`);
      return;
    }

    hydrateFromBackendNode(response);
    setBulkSipAddress(role === "sip" ? address : response.ips.find((item) => item.ip_role === "sip")?.ip_address ?? "");
    setStatusTone("emerald");
    setStatusMessage(`IP ${address} updated as ${role}.`);
  }

  async function handleBulkAssignMedia() {
    if (!bulkSipAddress) {
      setStatusTone("amber");
      setStatusMessage("Select one primary SIP IP before bulk assigning media IPs.");
      return;
    }

    const sipNodeIpId = nodeIpIds[bulkSipAddress];
    if (!sipNodeIpId) {
      return;
    }

    const response = await bulkAssignNodeMedia(numericNodeId, { sip_node_ip_id: sipNodeIpId });
    if (!response) {
      setStatusTone("rose");
      setStatusMessage("Bulk media assignment failed.");
      return;
    }
    hydrateFromBackendNode(response);
    setStatusTone("emerald");
    setStatusMessage("Primary SIP IP updated and all remaining unassigned IPs were assigned as media IPs.");
  }

  async function saveIpDraft() {
    if (!ipDraft || !ipDraft.address.trim()) {
      return;
    }

    const payload = mapNodePoolIpToPayload(ipDraft, workingNode.mediaIps.find((item) => item.address === ipDraft.address));
    const existingNodeIpId = nodeIpIds[ipDraft.address];
    const response = existingNodeIpId
      ? await updateNodeIp(nodeId, existingNodeIpId, payload)
      : await createNodeIp(nodeId, payload);

    if (!response) {
      setStatusTone("rose");
      setStatusMessage("IP record save failed.");
      return;
    }

    hydrateFromBackendNode(response);
    setIpDraft(null);
    setStatusTone("emerald");
    setStatusMessage("IP record saved.");
  }

  async function removeNodeIpRecord(address: string) {
    const existingNodeIpId = nodeIpIds[address];
    if (!existingNodeIpId) {
      return;
    }
    const response = await deleteNodeIp(nodeId, existingNodeIpId);
    if (!response) {
      setStatusTone("rose");
      setStatusMessage("IP record delete failed.");
      return;
    }
    hydrateFromBackendNode(response);
    setStatusTone("emerald");
    setStatusMessage("IP record removed.");
  }

  async function saveMediaDraft() {
    if (!mediaDraft || !mediaDraft.address.trim()) {
      return;
    }

    const existingPoolIp = workingNode.ipPool.find((item) => item.address === mediaDraft.address);
    const payload: NodeIpPayload = {
      ip_address: mediaDraft.address,
      interface_name: existingPoolIp?.interfaceName ?? "",
      ip_role: "media",
      status: mediaDraft.status === "Disabled" ? "disabled" : mediaDraft.status === "Draining" ? "draining" : "active",
      active_calls: mediaDraft.activeCalls,
      max_concurrent_calls: mediaDraft.maxCalls,
      current_cps: mediaDraft.currentCps,
      max_cps: mediaDraft.maxCps,
      weight: mediaDraft.weight,
      drain_mode: mediaDraft.drainMode,
    };
    const existingNodeIpId = nodeIpIds[mediaDraft.address];
    const response = existingNodeIpId
      ? await updateNodeIp(nodeId, existingNodeIpId, payload)
      : await createNodeIp(nodeId, payload);

    if (!response) {
      setStatusTone("rose");
      setStatusMessage("Media IP save failed.");
      return;
    }

    hydrateFromBackendNode(response);
    setMediaDraft(null);
    setStatusTone("emerald");
    setStatusMessage("Media IP saved.");
  }

  async function removeMediaIp(address: string) {
    const existingNodeIpId = nodeIpIds[address];
    if (!existingNodeIpId) {
      return;
    }
    const poolIp = workingNode.ipPool.find((item) => item.address === address);
    if (!poolIp) {
      return;
    }

    const response = await updateNodeIp(nodeId, existingNodeIpId, {
      ...mapNodePoolIpToPayload({ ...poolIp, role: "UNASSIGNED" }),
      ip_address: address,
    });
    if (!response) {
      setStatusTone("rose");
      setStatusMessage("Media IP removal failed.");
      return;
    }

    hydrateFromBackendNode(response);
    setStatusTone("emerald");
    setStatusMessage("Media IP unassigned.");
  }

  const totalIpCount = workingNode.ipPool.length;
  const selectedSipCount = workingNode.sipIp ? 1 : 0;
  const totalMediaIpCount = workingNode.ipPool.filter((item) => item.role === "MEDIA").length;

  const selectedTab = {
    Overview: (
      <NodeOverviewSection
        node={workingNode}
        statusMessage={statusMessage}
        statusTone={statusTone}
        dirty={overviewDirty}
        onChange={setWorkingNode}
        onSave={() => void saveOverview()}
        onCancel={cancelOverview}
        onTestConnection={() => void handleTestConnection()}
      />
    ),
    Services: <NodeServicesSection services={services} />,
    "IP Pool": (
      <NodeIpPoolSection
        node={workingNode}
        statusMessage={statusMessage}
        totalIpCount={totalIpCount}
        selectedSipCount={selectedSipCount}
        totalMediaIpCount={totalMediaIpCount}
        bulkSipAddress={bulkSipAddress}
        onBulkSipAddressChange={setBulkSipAddress}
        onBulkAssign={() => void handleBulkAssignMedia()}
        onScan={() => void handleScanIpPool()}
        onOpenCreate={() => setIpDraft({ address: "", role: "UNASSIGNED", status: "Active", whitelistUse: "Internal only", interfaceName: "" })}
        onOpenEdit={(ip) => setIpDraft(cloneValue(ip))}
        onAssignRole={(address, role) => void handleAssignRole(address, role)}
        onDelete={(address) => void removeNodeIpRecord(address)}
      />
    ),
    "SIP IP": (
      <NodeSipSection
        node={workingNode}
        dirty={overviewDirty}
        onChange={setWorkingNode}
        onSave={() => void saveSipSettings()}
        onCancel={cancelOverview}
      />
    ),
    "Media IPs": (
      <NodeMediaIpsSection
        node={workingNode}
        onAdd={() => setMediaDraft(makeMediaIp(workingNode.ipPool.find((item) => item.role !== "MAIN")?.address ?? ""))}
        onEdit={(item) => setMediaDraft(cloneValue(item))}
        onDelete={(address) => void removeMediaIp(address)}
      />
    ),
    Usage: <NodeUsageSection node={workingNode} onEdit={(item) => setMediaDraft(cloneValue(item))} />,
    Logs: <NodeLogsSection status={workingNode.status} />,
  }[activeTab];

  return (
    <AppShell
      title={workingNode.name || "Node details"}
      eyebrow="Node details"
      description="Edit node summary fields, SIP IP, IP pool records, media IP assignments, placeholder services, and usage limits from one operator-friendly page."
      activePath="/nodes"
    >
      <NodeTabBar activeTab={activeTab} onChange={setActiveTab} />
      {selectedTab}
      <NodeIpDrawer ipDraft={ipDraft} onClose={() => setIpDraft(null)} onSave={() => void saveIpDraft()} onChange={setIpDraft} />
      <NodeMediaDrawer
        mediaDraft={mediaDraft}
        ipOptions={workingNode.ipPool.filter((item) => item.role !== "MAIN").map((item) => item.address)}
        onClose={() => setMediaDraft(null)}
        onSave={() => void saveMediaDraft()}
        onChange={setMediaDraft}
      />
    </AppShell>
  );
}
