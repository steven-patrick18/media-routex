import type {
  AppSettings,
  BackendCustomer,
  BackendMediaPool,
  BackendNode,
  BackendSettings,
  BackendVendor,
  ControlPanelData,
  CustomerPayload,
  CustomerRecord,
  MediaPoolPayload,
  MediaPoolRecord,
  NodeBulkMediaAssignmentPayload,
  NodeConnectionTestPayload,
  NodeConnectionTestResult,
  NodeCreatePayload,
  NodeIpAssignmentPayload,
  NodeIpPayload,
  NodeRecord,
  VendorPayload,
  VendorRecord,
} from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

type ApiMethod = "POST" | "PUT" | "PATCH" | "DELETE";

function buildFreshPath(path: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}_ts=${Date.now()}`;
}

function mapNodeRole(role: string): NodeRecord["ipPool"][number]["role"] {
  if (role === "main") {
    return "MAIN";
  }
  if (role === "sip") {
    return "SIP";
  }
  if (role === "media") {
    return "MEDIA";
  }
  return "UNASSIGNED";
}

function mapNodeStatus(status: string): NodeRecord["ipPool"][number]["status"] {
  if (status === "disabled") {
    return "Disabled";
  }
  if (status === "reserved") {
    return "Reserved";
  }
  return "Active";
}

function mapMediaStatus(status: string): MediaPoolRecord["mediaIps"][number]["status"] {
  if (status === "Disabled" || status === "disabled") {
    return "Disabled";
  }
  if (status === "Draining" || status === "draining") {
    return "Draining";
  }
  return "Active";
}

async function requestJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${buildFreshPath(path)}`, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!response.ok) {
      console.warn(`[MediaRouteX API] GET ${path} failed with status ${response.status}.`);
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    console.warn(`[MediaRouteX API] GET ${path} failed.`, error);
    return null;
  }
}

async function sendJson<TResponse, TPayload>(path: string, method: Exclude<ApiMethod, "DELETE">, payload: TPayload): Promise<TResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (!response.ok) {
      console.warn(`[MediaRouteX API] ${method} ${path} failed with status ${response.status}.`);
      return null;
    }
    return (await response.json()) as TResponse;
  } catch (error) {
    console.warn(`[MediaRouteX API] ${method} ${path} failed.`, error);
    return null;
  }
}

async function deleteJson(path: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "DELETE",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      cache: "no-store",
    });
    if (!response.ok) {
      console.warn(`[MediaRouteX API] DELETE ${path} failed with status ${response.status}.`);
    }
    return response.ok;
  } catch (error) {
    console.warn(`[MediaRouteX API] DELETE ${path} failed.`, error);
    return false;
  }
}

export function mapBackendNodeToFrontend(node: BackendNode, fallback?: NodeRecord): NodeRecord {
  const sipIpRecord = node.ips.find((item) => item.id === node.sip_ip_id || item.ip_role === "sip");
  const mediaIps = node.ips
    .filter((item) => item.ip_role === "media")
    .map((item) => ({
      address: item.ip_address,
      status: mapMediaStatus(item.status),
      activeCalls: item.active_calls,
      maxCalls: item.max_concurrent_calls,
      currentCps: item.current_cps,
      maxCps: item.max_cps,
      weight: item.weight,
      drainMode: item.drain_mode,
    }));

  return {
    id: String(node.id),
    name: node.name,
    mainIp: node.main_ip,
    sshPort: node.ssh_port,
    sshUsername: node.ssh_username,
    sshPassword: node.ssh_password,
    osType: node.os_type,
    purpose: (node.purpose as NodeRecord["purpose"]) ?? fallback?.purpose ?? "MONITORING",
    region: node.region,
    notes: node.notes,
    status: (node.status as NodeRecord["status"]) ?? fallback?.status ?? "Provisioning",
    sipIp: sipIpRecord?.ip_address ?? "",
    sipPort: node.sip_port ?? fallback?.sipPort ?? 5060,
    sipProtocol: (node.sip_protocol as NodeRecord["sipProtocol"]) ?? fallback?.sipProtocol ?? "UDP",
    sipStatus: (node.sip_status as NodeRecord["sipStatus"]) ?? fallback?.sipStatus ?? "Standby",
    ipPool: node.ips.map((item) => ({
      address: item.ip_address,
      role: mapNodeRole(item.ip_role),
      status: mapNodeStatus(item.status),
      whitelistUse: item.ip_role === "sip" ? "Customer + Vendor" : "Internal only",
      interfaceName: item.interface_name ?? undefined,
    })),
    mediaIps,
  };
}

export function mapBackendCustomerToFrontend(customer: BackendCustomer, nodes: NodeRecord[]): CustomerRecord {
  return {
    id: String(customer.id),
    name: customer.name,
    status: customer.status as CustomerRecord["status"],
    notes: customer.notes,
    dialerIps: customer.dialer_ips,
    allowedSipNodes: customer.allowed_sip_node_ids
      .map((nodeId) => nodes.find((node) => node.id === String(nodeId))?.name)
      .filter((value): value is string => Boolean(value)),
  };
}

export function mapBackendVendorToFrontend(vendor: BackendVendor, nodes: NodeRecord[], mediaPools: MediaPoolRecord[]): VendorRecord {
  return {
    id: String(vendor.id),
    name: vendor.name,
    sipHost: vendor.sip_host,
    sipPort: vendor.sip_port,
    status: vendor.status as VendorRecord["status"],
    notes: vendor.notes,
    allowedSipNodes: vendor.allowed_sip_node_ids
      .map((nodeId) => nodes.find((node) => node.id === String(nodeId))?.name)
      .filter((value): value is string => Boolean(value)),
    mediaPools: vendor.media_pool_ids
      .map((poolId) => mediaPools.find((pool) => pool.id === String(poolId))?.name)
      .filter((value): value is string => Boolean(value)),
    strategy: vendor.media_selection_strategy as VendorRecord["strategy"],
  };
}

export function mapBackendMediaPoolToFrontend(pool: BackendMediaPool, nodes: NodeRecord[], vendorNamesById?: Map<number, string>): MediaPoolRecord {
  return {
    id: String(pool.id),
    name: pool.name,
    nodeName: nodes.find((node) => node.id === String(pool.assigned_node_id))?.name ?? `Node ${pool.assigned_node_id}`,
    strategy: pool.strategy as MediaPoolRecord["strategy"],
    status: pool.status as MediaPoolRecord["status"],
    notes: pool.notes,
    assignedVendors: (vendorNamesById ? pool.assigned_vendors.map((vendorId) => vendorNamesById.get(vendorId) ?? `Vendor ${vendorId}`) : []),
    mediaIps: pool.media_ips.map((item) => ({
      address: item.ip_address,
      status: mapMediaStatus(item.status),
      activeCalls: item.active_calls,
      maxCalls: item.max_concurrent_calls,
      currentCps: item.current_cps,
      maxCps: item.max_cps,
      weight: item.weight,
      drainMode: item.drain_mode,
    })),
  };
}

export function mapBackendSettingsToFrontend(settings: BackendSettings): AppSettings {
  return {
    selectionStrategy: settings.selection_strategy,
    defaultMaxCalls: settings.default_max_calls,
    defaultMaxCps: settings.default_max_cps,
    sourceIdentityRule: settings.source_identity_rule,
    customerPoolRule: settings.customer_pool_rule,
    sipWhitelistRule: settings.sip_whitelist_rule,
    notes: settings.notes,
  };
}

export function mapFrontendSettingsToBackend(settings: AppSettings): BackendSettings {
  return {
    selection_strategy: settings.selectionStrategy,
    default_max_calls: settings.defaultMaxCalls,
    default_max_cps: settings.defaultMaxCps,
    source_identity_rule: settings.sourceIdentityRule,
    customer_pool_rule: settings.customerPoolRule,
    sip_whitelist_rule: settings.sipWhitelistRule,
    notes: settings.notes,
  };
}

export async function getControlPanelData(): Promise<ControlPanelData> {
  const [dashboard, customers, vendors, nodes, mediaPools, usage, logs] = await Promise.all([
    requestJson("/api/dashboard"),
    requestJson("/api/customers"),
    requestJson("/api/vendors"),
    requestJson("/api/nodes"),
    requestJson("/api/media-pools"),
    requestJson("/api/usage"),
    requestJson("/api/logs"),
  ]);

  if (!dashboard || !customers || !vendors || !nodes || !mediaPools || !usage || !logs) {
    throw new Error("Control panel data is unavailable from the backend.");
  }

  throw new Error("Control panel aggregation has not been implemented in the API layer.");
}

export async function listNodesRaw() {
  return requestJson<BackendNode[]>("/api/nodes");
}

export async function getNodeRaw(nodeId: string | number) {
  return requestJson<BackendNode>(`/api/nodes/${nodeId}`);
}

export async function listNodes() {
  const nodes = await listNodesRaw();
  return nodes?.map((node) => mapBackendNodeToFrontend(node)) ?? null;
}

export async function listCustomersRaw() {
  return requestJson<BackendCustomer[]>("/api/customers");
}

export async function getCustomerRaw(customerId: string | number) {
  return requestJson<BackendCustomer>(`/api/customers/${customerId}`);
}

export async function createCustomer(payload: CustomerPayload) {
  return sendJson<BackendCustomer, CustomerPayload>("/api/customers", "POST", payload);
}

export async function updateCustomer(customerId: string | number, payload: CustomerPayload) {
  return sendJson<BackendCustomer, CustomerPayload>(`/api/customers/${customerId}`, "PUT", payload);
}

export async function deleteCustomer(customerId: string | number) {
  return deleteJson(`/api/customers/${customerId}`);
}

export async function listVendorsRaw() {
  return requestJson<BackendVendor[]>("/api/vendors");
}

export async function getVendorRaw(vendorId: string | number) {
  return requestJson<BackendVendor>(`/api/vendors/${vendorId}`);
}

export async function createVendor(payload: VendorPayload) {
  return sendJson<BackendVendor, VendorPayload>("/api/vendors", "POST", payload);
}

export async function updateVendor(vendorId: string | number, payload: VendorPayload) {
  return sendJson<BackendVendor, VendorPayload>(`/api/vendors/${vendorId}`, "PUT", payload);
}

export async function deleteVendor(vendorId: string | number) {
  return deleteJson(`/api/vendors/${vendorId}`);
}

export async function listMediaPoolsRaw() {
  return requestJson<BackendMediaPool[]>("/api/media-pools");
}

export async function createMediaPool(payload: MediaPoolPayload) {
  return sendJson<BackendMediaPool, MediaPoolPayload>("/api/media-pools", "POST", payload);
}

export async function updateMediaPool(mediaPoolId: string | number, payload: MediaPoolPayload) {
  return sendJson<BackendMediaPool, MediaPoolPayload>(`/api/media-pools/${mediaPoolId}`, "PUT", payload);
}

export async function deleteMediaPool(mediaPoolId: string | number) {
  return deleteJson(`/api/media-pools/${mediaPoolId}`);
}

export async function createNode(payload: NodeCreatePayload) {
  return sendJson<BackendNode, NodeCreatePayload>("/api/nodes", "POST", payload);
}

export async function updateNode(nodeId: string | number, payload: NodeCreatePayload) {
  return sendJson<BackendNode, NodeCreatePayload>(`/api/nodes/${nodeId}`, "PUT", payload);
}

export async function deleteNode(nodeId: string | number) {
  return deleteJson(`/api/nodes/${nodeId}`);
}

export async function createNodeIp(nodeId: string | number, payload: NodeIpPayload) {
  return sendJson<BackendNode, NodeIpPayload>(`/api/nodes/${nodeId}/ips`, "POST", payload);
}

export async function updateNodeIp(nodeId: string | number, nodeIpId: number, payload: NodeIpPayload) {
  return sendJson<BackendNode, NodeIpPayload>(`/api/nodes/${nodeId}/ips/${nodeIpId}`, "PUT", payload);
}

export async function deleteNodeIp(nodeId: string | number, nodeIpId: number) {
  return fetch(`${API_BASE_URL}/api/nodes/${nodeId}/ips/${nodeIpId}`, {
    method: "DELETE",
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
    cache: "no-store",
  })
    .then(async (response) => (response.ok ? ((await response.json()) as BackendNode) : null))
    .catch(() => null);
}

export async function getSettings() {
  const settings = await requestJson<BackendSettings>("/api/settings");
  return settings ? mapBackendSettingsToFrontend(settings) : null;
}

export async function saveSettings(settings: AppSettings) {
  const response = await sendJson<BackendSettings, BackendSettings>("/api/settings", "PUT", mapFrontendSettingsToBackend(settings));
  return response ? mapBackendSettingsToFrontend(response) : null;
}

export async function testNodeConnection(payload: NodeConnectionTestPayload) {
  return sendJson<NodeConnectionTestResult, NodeConnectionTestPayload>("/api/nodes/test-ssh", "POST", payload);
}

export async function scanNodeIpPool(nodeId: number) {
  return sendJson<BackendNode, Record<string, never>>(`/api/nodes/${nodeId}/scan-ip-pool`, "POST", {});
}

export async function assignNodeIpRole(nodeId: number, nodeIpId: number, payload: NodeIpAssignmentPayload) {
  return sendJson<BackendNode, NodeIpAssignmentPayload>(`/api/nodes/${nodeId}/ips/${nodeIpId}`, "PATCH", payload);
}

export async function bulkAssignNodeMedia(nodeId: number, payload: NodeBulkMediaAssignmentPayload) {
  return sendJson<BackendNode, NodeBulkMediaAssignmentPayload>(`/api/nodes/${nodeId}/bulk-assign-media`, "POST", payload);
}
