"use client";

import { ActionsRow, Badge, SectionCard, SimpleTable } from "@/components/panel-primitives";
import type { VendorRecord, NodeRecord } from "@/lib/types";

export function VendorListSection({
  records,
  nodeRecords,
  isLoading,
  onEdit,
    onDelete,
}: {
  records: VendorRecord[];
  nodeRecords: NodeRecord[];
  isLoading: boolean;
  onEdit: (vendor: VendorRecord) => void;
  onDelete: (vendorId: string) => void;
}) {
  return (
    <SectionCard title="Vendor List" eyebrow="Current vendors" badge={<Badge tone={isLoading ? "amber" : "violet"}>{isLoading ? "Loading" : `${records.length} vendors`}</Badge>}>
      <SimpleTable
        columns={["Vendor", "Vendor Target", "Allowed SIP Nodes", "Media Pools", "Actions"]}
        rows={records.map((vendor) => [
          <div key={`${vendor.id}-name`}>
            <p className="font-semibold uppercase tracking-[0.08em] text-white">{vendor.name}</p>
            <p className="mt-1 text-xs text-slate-500">{vendor.notes}</p>
          </div>,
          `${vendor.sipHost}:${vendor.sipPort}`,
          <div key={`${vendor.id}-nodes`} className="space-y-1">
            {vendor.allowedSipNodes.map((nodeName) => {
              const sipIp = nodeRecords.find((node) => node.name === nodeName)?.sipIp ?? "";
              return (
                <p key={nodeName} className="text-xs text-slate-300">
                  {nodeName} / {sipIp}
                </p>
              );
            })}
          </div>,
          vendor.mediaPools.join(", "),
          <ActionsRow
            key={`${vendor.id}-actions`}
            actions={[
              { label: "View", href: `/vendors/${vendor.id}` },
              { label: "Edit", onClick: () => onEdit(vendor) },
              { label: "Delete", tone: "danger", onClick: () => onDelete(vendor.id) },
            ]}
          />,
        ])}
      />
    </SectionCard>
  );
}
