import { AppShell } from "@/components/app-shell";
import { Badge, SectionCard, SimpleTable } from "@/components/panel-primitives";
import { getCustomerById, nodes } from "@/lib/control-panel";

export default async function CustomerDetailsPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const customer = getCustomerById(customerId);

  return (
    <AppShell
      title={customer.name}
      eyebrow="Customer details"
      description="Customer records are identified only by source dialer IP. Media pools are not assigned to customers in this version."
      activePath="/customers"
    >
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard title="Summary" eyebrow="Customer record" badge={<Badge tone={customer.status === "Active" ? "emerald" : customer.status === "Draft" ? "amber" : "rose"}>{customer.status}</Badge>}>
          <SimpleTable
            columns={["Field", "Value"]}
            rows={[
              ["Customer Name", customer.name],
              ["Status", customer.status],
              ["Notes", customer.notes],
            ]}
          />
        </SectionCard>

        <SectionCard title="Important Rule" eyebrow="Current behavior" badge={<Badge tone="amber">No pool assignment</Badge>}>
          <div className="space-y-3 text-sm leading-7 text-slate-300">
            <p>Customer matching is done only by dialer or source IP.</p>
            <p>Customers whitelist the SIP IPs of their allowed SIP nodes.</p>
            <p>Customers do not receive media pool assignment directly.</p>
            <p>Vendor and pool selection happens later in the call flow.</p>
          </div>
        </SectionCard>
      </section>

      <SectionCard title="Allowed SIP Nodes" eyebrow="Whitelist targets" badge={<Badge tone="emerald">{customer.allowedSipNodes.length} nodes</Badge>}>
        <SimpleTable
          columns={["Node", "SIP IP"]}
          rows={customer.allowedSipNodes.map((nodeName) => [nodeName, nodes.find((node) => node.name === nodeName)?.sipIp ?? ""]) }
        />
      </SectionCard>

      <SectionCard title="Dialer IPs" eyebrow="Source identity list" badge={<Badge tone="cyan">{customer.dialerIps.length} IPs</Badge>}>
        <SimpleTable
          columns={["IP Address"]}
          rows={customer.dialerIps.map((ip) => [ip])}
        />
      </SectionCard>
    </AppShell>
  );
}
