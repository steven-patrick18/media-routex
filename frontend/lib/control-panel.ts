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

export type ActivityItem = {
  timestamp: string;
  module: string;
  action: string;
  target: string;
  result: string;
  user: string;
  level: "info" | "warning" | "error" | "user action" | "system action";
};

export type CustomerRecord = {
  id: string;
  name: string;
  status: "Active" | "Draft" | "Suspended";
  notes: string;
  dialerIps: string[];
  allowedSipNodes: string[];
};

export type VendorRecord = {
  id: string;
  name: string;
  sipHost: string;
  sipPort: number;
  status: "Active" | "Standby" | "Maintenance";
  notes: string;
  allowedSipNodes: string[];
  mediaPools: string[];
  strategy: "Balanced" | "Round Robin" | "Priority Failover";
};

export type NodePoolIp = {
  address: string;
  role: "MAIN" | "SIP" | "MEDIA";
  status: "Active" | "Disabled" | "Reserved";
  whitelistUse: "Customer + Vendor" | "Internal only";
};

export type MediaIpRecord = {
  address: string;
  status: "Active" | "Disabled" | "Draining";
  activeCalls: number;
  maxCalls: number;
  currentCps: number;
  maxCps: number;
  weight: number;
  drainMode: boolean;
};

export type NodePurpose = "SIP + MEDIA" | "ROUTING / GATEWAY" | "MONITORING";

export type NodeRecord = {
  id: string;
  name: string;
  mainIp: string;
  sshPort: number;
  sshUsername: string;
  osType: string;
  purpose: NodePurpose;
  region: string;
  notes: string;
  status: "Healthy" | "Warning" | "Provisioning";
  sipIp: string;
  sipPort: number;
  sipProtocol: "UDP" | "TCP" | "TLS";
  sipStatus: "Active" | "Standby" | "Disabled";
  ipPool: NodePoolIp[];
  mediaIps: MediaIpRecord[];
};

export type MediaPoolRecord = {
  id: string;
  name: string;
  nodeName: string;
  strategy: "Balanced" | "Round Robin" | "Priority Failover";
  status: "Active" | "Draining" | "Disabled";
  notes: string;
  assignedVendors: string[];
  mediaIps: {
    address: string;
    status: "Active" | "Disabled" | "Draining";
    activeCalls: number;
    maxCalls: number;
    currentCps: number;
    maxCps: number;
    weight: number;
    drainMode: boolean;
  }[];
};

export const navigation: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Customers", href: "/customers" },
  { label: "Vendors", href: "/vendors" },
  { label: "Nodes", href: "/nodes" },
  { label: "Media Pools", href: "/media-pools" },
  { label: "Usage", href: "/usage" },
  { label: "Logs", href: "/logs" },
  { label: "Settings", href: "/settings" },
];

export const dashboardMetrics: SummaryMetric[] = [
  { label: "Total Customers", value: "24", detail: "Matched by dialer IP only", tone: "text-cyan-300" },
  { label: "Total Vendors", value: "11", detail: "Can use multiple media pools", tone: "text-emerald-300" },
  { label: "Total Nodes", value: "8", detail: "One SIP IP selected per node", tone: "text-sky-300" },
  { label: "Total Media Pools", value: "14", detail: "SIP IPs stay outside pool selection", tone: "text-violet-300" },
  { label: "Active Media IPs", value: "227", detail: "Used only for RTP/media anchoring", tone: "text-amber-300" },
  { label: "Total Concurrent Capacity", value: "6,810", detail: "Media IP count x 30 calls", tone: "text-rose-300" },
];

export const customers: CustomerRecord[] = [
  {
    id: "cust-1",
    name: "BlueWave Dialing",
    status: "Active",
    notes: "Primary outbound campaign dialer for BFSI traffic.",
    dialerIps: ["203.0.113.41", "203.0.113.42"],
    allowedSipNodes: ["MUM-GW-02", "DEL-SBC-01"],
  },
  {
    id: "cust-2",
    name: "NorthGrid Connect",
    status: "Active",
    notes: "Dedicated traffic feed for east region campaigns.",
    dialerIps: ["198.51.100.18"],
    allowedSipNodes: ["MUM-GW-02"],
  },
  {
    id: "cust-3",
    name: "Orbit Reach",
    status: "Draft",
    notes: "Pending vendor mapping after QA verification.",
    dialerIps: ["192.0.2.73", "192.0.2.74"],
    allowedSipNodes: ["DEL-SBC-01"],
  },
];

export const vendors: VendorRecord[] = [
  {
    id: "vendor-1",
    name: "VoiceGrid Carrier",
    sipHost: "198.51.100.10",
    sipPort: 5060,
    status: "Active",
    notes: "Primary India route partner.",
    allowedSipNodes: ["MUM-GW-02", "DEL-SBC-01"],
    mediaPools: ["IN-MEDIA-A", "DEL-BACKUP-POOL"],
    strategy: "Balanced",
  },
  {
    id: "vendor-2",
    name: "TransitWave",
    sipHost: "198.51.100.24",
    sipPort: 5080,
    status: "Standby",
    notes: "Overflow vendor for campaign spikes.",
    allowedSipNodes: ["MUM-GW-02"],
    mediaPools: ["WEST-GW-POOL"],
    strategy: "Round Robin",
  },
  {
    id: "vendor-3",
    name: "Atlas Voice",
    sipHost: "203.0.113.88",
    sipPort: 5061,
    status: "Maintenance",
    notes: "TLS migration in progress.",
    allowedSipNodes: ["DEL-SBC-01"],
    mediaPools: ["DEL-BACKUP-POOL"],
    strategy: "Priority Failover",
  },
];

export const nodes: NodeRecord[] = [
  {
    id: "node-1",
    name: "DEL-SBC-01",
    mainIp: "10.10.0.11",
    sshPort: 22,
    sshUsername: "noc-admin",
    osType: "Ubuntu 24.04",
    purpose: "SIP + MEDIA",
    region: "Delhi",
    notes: "Primary signaling and media node for north India traffic.",
    status: "Healthy",
    sipIp: "10.10.0.12",
    sipPort: 5060,
    sipProtocol: "UDP",
    sipStatus: "Active",
    ipPool: [
      { address: "10.10.0.11", role: "MAIN", status: "Active", whitelistUse: "Internal only" },
      { address: "10.10.0.12", role: "SIP", status: "Active", whitelistUse: "Customer + Vendor" },
      { address: "10.10.0.13", role: "MEDIA", status: "Active", whitelistUse: "Internal only" },
      { address: "10.10.0.14", role: "MEDIA", status: "Active", whitelistUse: "Internal only" },
      { address: "10.10.0.15", role: "MEDIA", status: "Reserved", whitelistUse: "Internal only" },
    ],
    mediaIps: [
      { address: "10.10.0.13", status: "Active", activeCalls: 17, maxCalls: 30, currentCps: 3, maxCps: 5, weight: 1, drainMode: false },
      { address: "10.10.0.14", status: "Draining", activeCalls: 5, maxCalls: 30, currentCps: 1, maxCps: 5, weight: 1, drainMode: true },
      { address: "10.10.0.15", status: "Disabled", activeCalls: 0, maxCalls: 30, currentCps: 0, maxCps: 5, weight: 1, drainMode: false },
    ],
  },
  {
    id: "node-2",
    name: "MUM-GW-02",
    mainIp: "10.20.0.21",
    sshPort: 22,
    sshUsername: "gateway-op",
    osType: "Debian 12",
    purpose: "ROUTING / GATEWAY",
    region: "Mumbai",
    notes: "Gateway node used for customer and vendor signaling handoff.",
    status: "Warning",
    sipIp: "10.20.0.22",
    sipPort: 5060,
    sipProtocol: "UDP",
    sipStatus: "Standby",
    ipPool: [
      { address: "10.20.0.21", role: "MAIN", status: "Active", whitelistUse: "Internal only" },
      { address: "10.20.0.22", role: "SIP", status: "Active", whitelistUse: "Customer + Vendor" },
      { address: "10.20.0.23", role: "MEDIA", status: "Active", whitelistUse: "Internal only" },
      { address: "10.20.0.24", role: "MEDIA", status: "Reserved", whitelistUse: "Internal only" },
    ],
    mediaIps: [
      { address: "10.20.0.23", status: "Active", activeCalls: 11, maxCalls: 30, currentCps: 4, maxCps: 5, weight: 1, drainMode: false },
      { address: "10.20.0.24", status: "Disabled", activeCalls: 0, maxCalls: 30, currentCps: 0, maxCps: 5, weight: 1, drainMode: false },
    ],
  },
  {
    id: "node-3",
    name: "BLR-MON-01",
    mainIp: "10.30.0.31",
    sshPort: 2222,
    sshUsername: "observer",
    osType: "Ubuntu 22.04",
    purpose: "MONITORING",
    region: "Bengaluru",
    notes: "Metrics, alerting, and control-plane observability node.",
    status: "Provisioning",
    sipIp: "10.30.0.32",
    sipPort: 5060,
    sipProtocol: "TCP",
    sipStatus: "Disabled",
    ipPool: [
      { address: "10.30.0.31", role: "MAIN", status: "Active", whitelistUse: "Internal only" },
      { address: "10.30.0.32", role: "SIP", status: "Reserved", whitelistUse: "Customer + Vendor" },
    ],
    mediaIps: [],
  },
];

export const mediaPools: MediaPoolRecord[] = [
  {
    id: "pool-1",
    name: "IN-MEDIA-A",
    nodeName: "DEL-SBC-01",
    strategy: "Balanced",
    status: "Active",
    notes: "Primary balanced pool for north traffic.",
    assignedVendors: ["VoiceGrid Carrier"],
    mediaIps: [
      { address: "10.10.0.13", status: "Active", activeCalls: 17, maxCalls: 30, currentCps: 3, maxCps: 5, weight: 1, drainMode: false },
      { address: "10.10.0.14", status: "Draining", activeCalls: 5, maxCalls: 30, currentCps: 1, maxCps: 5, weight: 1, drainMode: true },
      { address: "10.10.0.15", status: "Disabled", activeCalls: 0, maxCalls: 30, currentCps: 0, maxCps: 5, weight: 1, drainMode: false },
    ],
  },
  {
    id: "pool-2",
    name: "WEST-GW-POOL",
    nodeName: "MUM-GW-02",
    strategy: "Round Robin",
    status: "Active",
    notes: "Overflow pool for west-region dialer bursts.",
    assignedVendors: ["TransitWave"],
    mediaIps: [
      { address: "10.20.0.23", status: "Active", activeCalls: 11, maxCalls: 30, currentCps: 4, maxCps: 5, weight: 1, drainMode: false },
      { address: "10.20.0.24", status: "Disabled", activeCalls: 0, maxCalls: 30, currentCps: 0, maxCps: 5, weight: 1, drainMode: false },
    ],
  },
  {
    id: "pool-3",
    name: "DEL-BACKUP-POOL",
    nodeName: "DEL-SBC-01",
    strategy: "Balanced",
    status: "Draining",
    notes: "Spare pool used during traffic bursts and maintenance windows.",
    assignedVendors: ["VoiceGrid Carrier", "Atlas Voice"],
    mediaIps: [
      { address: "10.10.0.13", status: "Active", activeCalls: 14, maxCalls: 30, currentCps: 2, maxCps: 5, weight: 1, drainMode: false },
      { address: "10.10.0.14", status: "Draining", activeCalls: 5, maxCalls: 30, currentCps: 1, maxCps: 5, weight: 1, drainMode: true },
    ],
  },
];

export const activityFeed: ActivityItem[] = [
  {
    timestamp: "2026-04-15 17:10:03",
    module: "media_pools",
    action: "assign_ip",
    target: "IN-MEDIA-A / 10.10.0.13",
    result: "success",
    user: "ops.user",
    level: "user action",
  },
  {
    timestamp: "2026-04-15 17:08:40",
    module: "vendors",
    action: "update_strategy",
    target: "TransitWave",
    result: "success",
    user: "ops.user",
    level: "user action",
  },
  {
    timestamp: "2026-04-15 17:06:11",
    module: "routing",
    action: "capacity_warning",
    target: "WEST-GW-POOL",
    result: "warning",
    user: "system",
    level: "warning",
  },
  {
    timestamp: "2026-04-15 17:05:02",
    module: "nodes",
    action: "agent_check",
    target: "BLR-MON-01",
    result: "pending",
    user: "system",
    level: "system action",
  },
];

export const usageByNode = nodes.map((node) => ({
  name: node.name,
  region: node.region,
  activeCalls: node.mediaIps.reduce((sum, item) => sum + item.activeCalls, 0),
  capacity: node.mediaIps.reduce((sum, item) => sum + item.maxCalls, 0),
  cps: node.mediaIps.reduce((sum, item) => sum + item.currentCps, 0),
}));

export const usageByPool = mediaPools.map((pool) => {
  const activeIps = pool.mediaIps.filter((item) => item.status === "Active");
  return {
    name: pool.name,
    node: pool.nodeName,
    activeIps: activeIps.length,
    concurrentCapacity: activeIps.reduce((sum, item) => sum + item.maxCalls, 0),
    cpsCapacity: activeIps.reduce((sum, item) => sum + item.maxCps, 0),
    activeCalls: pool.mediaIps.reduce((sum, item) => sum + item.activeCalls, 0),
  };
});

export function getPoolStats(pool: MediaPoolRecord) {
  const totalIps = pool.mediaIps.length;
  const activeIps = pool.mediaIps.filter((item) => item.status === "Active").length;

  return {
    totalIps,
    activeIps,
    totalConcurrentCapacity: pool.mediaIps
      .filter((item) => item.status === "Active")
      .reduce((sum, item) => sum + item.maxCalls, 0),
    totalCpsCapacity: pool.mediaIps
      .filter((item) => item.status === "Active")
      .reduce((sum, item) => sum + item.maxCps, 0),
  };
}

export function getBalancedStrategyRules() {
  return [
    "Equal priority for every media IP in the pool",
    "Equal weight by default",
    "Choose the least-used available media IP",
    "Skip disabled media IPs",
    "Skip draining media IPs for new calls",
    "Skip media IPs at max concurrent calls",
    "Skip media IPs at max CPS for the current second",
  ];
}

export const usageByMediaIp = mediaPools.flatMap((pool) =>
  pool.mediaIps.map((item) => ({
    pool: pool.name,
    ip: item.address,
    status: item.status,
    activeCalls: item.activeCalls,
    maxCalls: item.maxCalls,
    currentCps: item.currentCps,
    maxCps: item.maxCps,
    usagePercent: Math.round((item.activeCalls / item.maxCalls) * 100),
  })),
);

export function getNodeById(nodeId: string) {
  return nodes.find((node) => node.id === nodeId) ?? nodes[0];
}

export function getSipIpForNode(nodeName: string) {
  return nodes.find((node) => node.name === nodeName)?.sipIp ?? "";
}

export function getCustomerById(customerId: string) {
  return customers.find((customer) => customer.id === customerId) ?? customers[0];
}

export function getVendorById(vendorId: string) {
  return vendors.find((vendor) => vendor.id === vendorId) ?? vendors[0];
}
