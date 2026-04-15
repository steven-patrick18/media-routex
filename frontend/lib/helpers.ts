import type { MediaPoolRecord } from "@/lib/types";
import { customers, nodes, vendors } from "@/lib/mock-data";

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

export function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
