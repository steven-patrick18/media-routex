import type { MediaPoolRecord } from "@/lib/types";

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

export function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
