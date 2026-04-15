import { AppShell } from "@/components/app-shell";
import { Badge, SectionCard, SimpleTable } from "@/components/panel-primitives";
import { getBalancedStrategyRules } from "@/lib/helpers";
import type { NodeRecord, VendorRecord } from "@/lib/types";

export function VendorDetailsPageView({ vendor, nodes }: { vendor: VendorRecord; nodes: NodeRecord[] }) {

  return (
    <AppShell
      title={vendor.name}
      eyebrow="Vendor details"
      description="Vendor records hold the outgoing connection and one or more assigned media pools. Customers do not receive pool assignment directly."
      activePath="/vendors"
    >
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard title="Summary" eyebrow="Vendor record" badge={<Badge tone={vendor.status === "Active" ? "emerald" : vendor.status === "Standby" ? "amber" : "rose"}>{vendor.status}</Badge>}>
          <SimpleTable
            columns={["Field", "Value"]}
            rows={[
              ["Vendor Name", vendor.name],
              ["Connection", `${vendor.sipHost}:${vendor.sipPort}`],
              ["Status", vendor.status],
              ["Strategy", vendor.strategy],
              ["Notes", vendor.notes],
            ]}
          />
        </SectionCard>

        <SectionCard title="Balanced Rule Set" eyebrow="Operator view" badge={<Badge tone="cyan">Simple rules</Badge>}>
          <div className="space-y-3">
            {getBalancedStrategyRules().map((rule) => (
              <div key={rule} className="rounded-2xl border border-white/8 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
                {rule}
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <SectionCard title="Allowed SIP Nodes" eyebrow="Whitelist targets" badge={<Badge tone="cyan">{vendor.allowedSipNodes.length} nodes</Badge>}>
        <SimpleTable
          columns={["Node", "SIP IP"]}
          rows={vendor.allowedSipNodes.map((nodeName) => [nodeName, nodes.find((node) => node.name === nodeName)?.sipIp ?? ""])}
        />
      </SectionCard>

      <SectionCard title="Assigned Media Pools" eyebrow="Vendor to pool mapping" badge={<Badge tone="violet">{vendor.mediaPools.length} pools</Badge>}>
        <SimpleTable columns={["Pool Name"]} rows={vendor.mediaPools.map((pool) => [pool])} />
      </SectionCard>
    </AppShell>
  );
}
