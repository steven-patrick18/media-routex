export type NavItem = {
  label: string;
  href: string;
};

export type SummaryMetric = {
  label: string;
  value: string;
  detail: string;
  tone: string;
};

export type ActivityLevel = "info" | "warning" | "error" | "user action" | "system action";

export type ActivityItem = {
  timestamp: string;
  module: string;
  action: string;
  target: string;
  result: string;
  user: string;
  level: ActivityLevel;
};

export type CustomerStatus = "Active" | "Draft" | "Suspended";

export type CustomerRecord = {
  id: string;
  name: string;
  status: CustomerStatus;
  notes: string;
  dialerIps: string[];
  allowedSipNodes: string[];
};

export type BackendCustomer = {
  id: number;
  name: string;
  status: string;
  notes: string;
  dialer_ips: string[];
  allowed_sip_node_ids: number[];
};

export type VendorStatus = "Active" | "Standby" | "Maintenance";
export type MediaSelectionStrategy = "Balanced" | "Round Robin" | "Priority Failover";

export type VendorRecord = {
  id: string;
  name: string;
  sipHost: string;
  sipPort: number;
  status: VendorStatus;
  notes: string;
  allowedSipNodes: string[];
  mediaPools: string[];
  strategy: MediaSelectionStrategy;
};

export type BackendVendor = {
  id: number;
  name: string;
  sip_host: string;
  sip_port: number;
  status: string;
  notes: string;
  allowed_sip_node_ids: number[];
  media_selection_strategy: string;
  media_pool_ids: number[];
};

export type NodeIpRole = "MAIN" | "SIP" | "MEDIA" | "UNASSIGNED";
export type NodeIpStatus = "Active" | "Disabled" | "Reserved";
export type NodeWhitelistUse = "Customer + Vendor" | "Internal only";

export type NodePoolIp = {
  address: string;
  role: NodeIpRole;
  status: NodeIpStatus;
  whitelistUse: NodeWhitelistUse;
  interfaceName?: string;
};

export type MediaIpStatus = "Active" | "Disabled" | "Draining";

export type MediaIpRecord = {
  address: string;
  status: MediaIpStatus;
  activeCalls: number;
  maxCalls: number;
  currentCps: number;
  maxCps: number;
  weight: number;
  drainMode: boolean;
};

export type NodeTrafficRole = "SIP + MEDIA" | "ROUTING / GATEWAY" | "MONITORING";
export type NodeHealthStatus = "Healthy" | "Warning" | "Provisioning";
export type SipProtocol = "UDP" | "TCP" | "TLS";
export type SipStatus = "Active" | "Standby" | "Disabled";

export type NodeRecord = {
  id: string;
  name: string;
  mainIp: string;
  sshPort: number;
  sshUsername: string;
  sshPassword?: string;
  osType: string;
  purpose: NodeTrafficRole;
  region: string;
  notes: string;
  status: NodeHealthStatus;
  sipIp: string;
  sipPort: number;
  sipProtocol: SipProtocol;
  sipStatus: SipStatus;
  ipPool: NodePoolIp[];
  mediaIps: MediaIpRecord[];
};

export type BackendNodeIp = {
  id: number;
  ip_address: string;
  interface_name?: string | null;
  ip_role: string;
  status: string;
  active_calls: number;
  max_concurrent_calls: number;
  current_cps: number;
  max_cps: number;
  weight: number;
  drain_mode: boolean;
};

export type BackendNode = {
  id: number;
  name: string;
  main_ip: string;
  ssh_port: number;
  ssh_username: string;
  ssh_password: string;
  os_type: string;
  purpose: string;
  region: string;
  notes: string;
  status: string;
  sip_ip_id: number | null;
  sip_port: number;
  sip_protocol: string;
  sip_status: string;
  ips: BackendNodeIp[];
};

export type NodeConnectionTestPayload = {
  main_ip: string;
  ssh_port: number;
  ssh_username: string;
  ssh_password: string;
};

export type NodeConnectionTestResult = {
  ok: boolean;
  message: string;
};

export type NodeIpAssignmentPayload = {
  role: "sip" | "media" | "unassign";
};

export type NodeBulkMediaAssignmentPayload = {
  sip_node_ip_id: number;
};

export type MediaPoolStatus = "Active" | "Draining" | "Disabled";

export type MediaPoolRecord = {
  id: string;
  name: string;
  nodeName: string;
  strategy: MediaSelectionStrategy;
  status: MediaPoolStatus;
  notes: string;
  assignedVendors: string[];
  mediaIps: MediaIpRecord[];
};

export type BackendMediaPoolIp = {
  id: number;
  node_ip_id: number;
  ip_address: string;
  status: string;
  active_calls: number;
  max_concurrent_calls: number;
  current_cps: number;
  max_cps: number;
  weight: number;
  drain_mode: boolean;
};

export type BackendMediaPool = {
  id: number;
  name: string;
  assigned_node_id: number;
  strategy: string;
  status: string;
  notes: string;
  assigned_media_ip_ids: number[];
  assigned_vendors: number[];
  media_ips: BackendMediaPoolIp[];
};

export type UsageByNodeItem = {
  name: string;
  region: string;
  activeCalls: number;
  capacity: number;
  cps: number;
};

export type UsageByPoolItem = {
  name: string;
  node: string;
  activeIps: number;
  concurrentCapacity: number;
  cpsCapacity: number;
  activeCalls: number;
};

export type UsageByMediaIpItem = {
  pool: string;
  ip: string;
  status: MediaIpStatus;
  activeCalls: number;
  maxCalls: number;
  currentCps: number;
  maxCps: number;
  usagePercent: number;
};

export type ControlPanelData = {
  navigation: NavItem[];
  dashboardMetrics: SummaryMetric[];
  customers: CustomerRecord[];
  vendors: VendorRecord[];
  nodes: NodeRecord[];
  mediaPools: MediaPoolRecord[];
  activityFeed: ActivityItem[];
  usageByNode: UsageByNodeItem[];
  usageByPool: UsageByPoolItem[];
  usageByMediaIp: UsageByMediaIpItem[];
};

export type AddNodeFormState = {
  nodeName: string;
  mainIp: string;
  sshPort: string;
  sshUsername: string;
  sshPassword: string;
  osType: string;
  region: string;
  trafficRole: "MEDIA";
  notes: string;
};

export type NodeCreatePayload = {
  name: string;
  main_ip: string;
  ssh_port: number;
  ssh_username: string;
  ssh_password: string;
  os_type: string;
  purpose: string;
  region: string;
  notes: string;
  status: string;
  sip_ip_id: number | null;
  sip_port: number;
  sip_protocol: string;
  sip_status: string;
};

export type NodeIpPayload = {
  ip_address: string;
  interface_name?: string | null;
  ip_role: string;
  status: string;
  active_calls: number;
  max_concurrent_calls: number;
  current_cps: number;
  max_cps: number;
  weight: number;
  drain_mode: boolean;
};

export type CustomerPayload = {
  name: string;
  status: string;
  notes: string;
  dialer_ips: string[];
  allowed_sip_node_ids: number[];
};

export type VendorPayload = {
  name: string;
  sip_host: string;
  sip_port: number;
  status: string;
  notes: string;
  allowed_sip_node_ids: number[];
  media_selection_strategy: string;
  media_pool_ids: number[];
};

export type MediaPoolIpPayload = {
  node_ip_id: number;
  status: string;
  active_calls: number;
  max_concurrent_calls: number;
  current_cps: number;
  max_cps: number;
  weight: number;
  drain_mode: boolean;
};

export type MediaPoolPayload = {
  name: string;
  assigned_node_id: number;
  strategy: string;
  status: string;
  notes: string;
  assigned_media_ips: MediaPoolIpPayload[];
};

export type AppSettings = {
  selectionStrategy: string;
  defaultMaxCalls: number;
  defaultMaxCps: number;
  sourceIdentityRule: string;
  customerPoolRule: string;
  sipWhitelistRule: string;
  notes: string;
};

export type BackendSettings = {
  selection_strategy: string;
  default_max_calls: number;
  default_max_cps: number;
  source_identity_rule: string;
  customer_pool_rule: string;
  sip_whitelist_rule: string;
  notes: string;
};
