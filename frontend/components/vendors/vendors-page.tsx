"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge, SectionCard } from "@/components/panel-primitives";
import { VendorFormDrawer } from "@/components/vendors/vendor-form-drawer";
import { VendorListSection } from "@/components/vendors/vendor-list-section";
import { ActionButton } from "@/components/panel-primitives";
import { createVendor, deleteVendor, listMediaPoolsRaw, listNodes, listVendorsRaw, mapBackendMediaPoolToFrontend, mapBackendVendorToFrontend, updateVendor } from "@/lib/api";
import { getBalancedStrategyRules } from "@/lib/helpers";
import type { MediaPoolRecord, NodeRecord, VendorRecord } from "@/lib/types";

const emptyVendor = (): VendorRecord => ({
  id: "",
  name: "",
  sipHost: "",
  sipPort: 5060,
  status: "Active",
  notes: "",
  allowedSipNodes: [],
  mediaPools: [],
  strategy: "Balanced",
});

export function VendorsPageClient() {
  const [records, setRecords] = useState<VendorRecord[]>([]);
  const [nodeRecords, setNodeRecords] = useState<NodeRecord[]>([]);
  const [mediaPoolRecords, setMediaPoolRecords] = useState<MediaPoolRecord[]>([]);
  const [draft, setDraft] = useState<VendorRecord | null>(null);
  const [mode, setMode] = useState<"add" | "edit" | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      const [backendNodes, backendPools, backendVendors] = await Promise.all([listNodes(), listMediaPoolsRaw(), listVendorsRaw()]);
      if (cancelled) {
        return;
      }

      const safeNodes = backendNodes ?? [];
      const safePools = (backendPools ?? []).map((pool) => mapBackendMediaPoolToFrontend(pool, safeNodes));

      setNodeRecords(safeNodes);
      setMediaPoolRecords(safePools);
      setRecords((backendVendors ?? []).map((vendor) => mapBackendVendorToFrontend(vendor, safeNodes, safePools)));
      setIsLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const nodeIdByName = useMemo(() => new Map(nodeRecords.map((node) => [node.name, Number(node.id)])), [nodeRecords]);
  const mediaPoolIdByName = useMemo(() => new Map(mediaPoolRecords.map((pool) => [pool.name, Number(pool.id)])), [mediaPoolRecords]);

  function openAdd() {
    setMode("add");
    setDraft(emptyVendor());
  }

  function openEdit(vendor: VendorRecord) {
    setMode("edit");
    setDraft({ ...vendor, allowedSipNodes: [...vendor.allowedSipNodes], mediaPools: [...vendor.mediaPools] });
  }

  function closePanel() {
    setMode(null);
    setDraft(null);
  }

  async function saveDraft() {
    if (!draft || !draft.name.trim() || !draft.sipHost.trim()) {
      return;
    }

    const next = { ...draft, name: draft.name.trim(), sipHost: draft.sipHost.trim(), notes: draft.notes.trim() };
    const payload = {
      name: next.name,
      sip_host: next.sipHost,
      sip_port: next.sipPort,
      status: next.status,
      notes: next.notes,
      allowed_sip_node_ids: next.allowedSipNodes
        .map((nodeName) => nodeIdByName.get(nodeName))
        .filter((value): value is number => typeof value === "number"),
      media_selection_strategy: next.strategy,
      media_pool_ids: next.mediaPools
        .map((poolName) => mediaPoolIdByName.get(poolName))
        .filter((value): value is number => typeof value === "number"),
    };

    const saved = mode === "edit" && next.id ? await updateVendor(next.id, payload) : await createVendor(payload);
    if (!saved) {
      return;
    }

    const mapped = mapBackendVendorToFrontend(saved, nodeRecords, mediaPoolRecords);
    setRecords((current) => (mode === "edit" ? current.map((item) => (item.id === mapped.id ? mapped : item)) : [mapped, ...current]));
    closePanel();
  }

  async function removeVendor(vendorId: string) {
    const ok = await deleteVendor(vendorId);
    if (!ok) {
      return;
    }

    setRecords((current) => current.filter((vendor) => vendor.id !== vendorId));
    if (draft?.id === vendorId) {
      closePanel();
    }
  }

  return (
    <AppShell
      title="Vendors"
      eyebrow="Vendor management"
      description="Manage vendor signaling targets, choose which SIP nodes they may use, and assign one or more media pools."
      activePath="/vendors"
      headerActions={<ActionButton tone="primary" onClick={openAdd}>Add vendor</ActionButton>}
    >
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_320px]">
        <VendorListSection records={records} nodeRecords={nodeRecords} isLoading={isLoading} onEdit={openEdit} onDelete={(vendorId) => void removeVendor(vendorId)} />

        <SectionCard title="Assignment Rule" eyebrow="Operator note" badge={<Badge tone="amber">Locked in scope</Badge>}>
          <div className="space-y-3 text-sm leading-7 text-slate-300">
            <p>Vendors can have multiple media pools.</p>
            <p>Customers do not get media pool assignment in this version.</p>
            <p>Balanced remains the default strategy.</p>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard title="Balanced Strategy" eyebrow="How it works" badge={<Badge tone="cyan">Operator view</Badge>}>
          <div className="grid gap-3 md:grid-cols-2">
            {getBalancedStrategyRules().map((rule) => (
              <div key={rule} className="rounded-2xl border border-white/8 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
                {rule}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Change Coverage" eyebrow="Editable fields" badge={<Badge tone="emerald">Full flow</Badge>}>
          <div className="space-y-3 text-sm leading-7 text-slate-300">
            <p>Edit SIP host, SIP port, notes, status, strategy, SIP nodes, and media pool assignments.</p>
            <p>Delete removes the vendor from persistent storage and the refreshed list reflects it immediately.</p>
            <p>Save and cancel work from the same lightweight edit drawer.</p>
          </div>
        </SectionCard>
      </section>

      <VendorFormDrawer
        draft={draft}
        mode={mode}
        nodeRecords={nodeRecords}
        mediaPoolRecords={mediaPoolRecords}
        onClose={closePanel}
        onDelete={(vendorId) => void removeVendor(vendorId)}
        onSave={() => void saveDraft()}
        onChange={setDraft}
      />
    </AppShell>
  );
}
