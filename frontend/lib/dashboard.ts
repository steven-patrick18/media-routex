export type SummaryCard = {
  label: string;
  value: string;
  delta: string;
  tone: string;
};

export type NodeCard = {
  name: string;
  role: string;
  uptime: string;
  load: string;
  state: string;
  tone: string;
  border: string;
};

export type AlertItem = {
  title: string;
  detail: string;
  time: string;
  tone: string;
};

export type DashboardData = {
  sidebarItems: string[];
  summaryCards: SummaryCard[];
  nodeCards: NodeCard[];
  alertFeed: AlertItem[];
  activityFeed: string[];
  meta: {
    shiftDate: string;
    operator: string;
    operatorInitials: string;
    networkStatus: string;
    systemStatus: string;
    capacityReserve: string;
    escalations: number;
  };
};

export const fallbackData: DashboardData = {
  sidebarItems: [
    "Dashboard",
    "Nodes",
    "IP Pool",
    "SIP IPs",
    "Media IPs",
    "Usage",
    "Logs",
    "Settings",
  ],
  summaryCards: [
    { label: "Active nodes", value: "148", delta: "+12 this hour", tone: "text-cyan-300" },
    { label: "Traffic load", value: "72.4%", delta: "Within threshold", tone: "text-emerald-300" },
    { label: "Critical alerts", value: "07", delta: "2 require action", tone: "text-rose-300" },
    { label: "SIP sessions", value: "18.2K", delta: "4.8% above baseline", tone: "text-amber-300" },
  ],
  nodeCards: [
    {
      name: "DEL-Core-01",
      role: "Session border controller",
      uptime: "99.999%",
      load: "68%",
      state: "Nominal",
      tone: "text-emerald-300",
      border: "border-emerald-400/20",
    },
    {
      name: "MUM-Media-07",
      role: "Media relay cluster",
      uptime: "99.971%",
      load: "81%",
      state: "High load",
      tone: "text-amber-300",
      border: "border-amber-400/20",
    },
    {
      name: "BLR-Edge-12",
      role: "Transit edge node",
      uptime: "99.993%",
      load: "54%",
      state: "Nominal",
      tone: "text-cyan-300",
      border: "border-cyan-400/20",
    },
    {
      name: "HYD-SIP-03",
      role: "SIP routing fabric",
      uptime: "99.948%",
      load: "76%",
      state: "Monitoring",
      tone: "text-rose-300",
      border: "border-rose-400/20",
    },
    {
      name: "CHE-Cache-02",
      role: "Telemetry aggregation",
      uptime: "99.988%",
      load: "49%",
      state: "Nominal",
      tone: "text-emerald-300",
      border: "border-emerald-400/20",
    },
    {
      name: "PUN-GW-05",
      role: "Gateway services",
      uptime: "99.979%",
      load: "64%",
      state: "Balanced",
      tone: "text-cyan-300",
      border: "border-cyan-400/20",
    },
  ],
  alertFeed: [
    {
      title: "Mumbai media cluster saturation",
      detail: "Codec negotiation retries crossed 5.4% on relay pool",
      time: "2m ago",
      tone: "bg-amber-300",
    },
    {
      title: "Hyderabad SIP route drift",
      detail: "Failover policy engaged on trunk group HYD-3B",
      time: "8m ago",
      tone: "bg-rose-300",
    },
    {
      title: "Delhi auth latency recovered",
      detail: "Token issuance stabilized after edge cache flush",
      time: "14m ago",
      tone: "bg-emerald-300",
    },
    {
      title: "North backbone maintenance window",
      detail: "Carrier handoff inspection begins at 23:30 IST",
      time: "30m ago",
      tone: "bg-cyan-300",
    },
  ],
  activityFeed: [
    "IP Pool sync completed for west region",
    "Usage export generated for enterprise billing",
    "Node DEL-Core-01 accepted config revision v142",
    "Log retention policy rotated archive bucket",
  ],
  meta: {
    shiftDate: "15 Apr 2026",
    operator: "R. Khanna",
    operatorInitials: "RK",
    networkStatus: "Stable",
    systemStatus: "Systems nominal",
    capacityReserve: "82%",
    escalations: 3,
  },
};

export async function getDashboardData(): Promise<DashboardData> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

  try {
    const response = await fetch(`${apiBaseUrl}/api/dashboard`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Dashboard request failed with status ${response.status}`);
    }

    return (await response.json()) as DashboardData;
  } catch {
    return fallbackData;
  }
}
