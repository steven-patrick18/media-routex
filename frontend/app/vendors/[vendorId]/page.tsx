import { VendorDetailsPageView } from "@/components/pages/vendor-details-page";
import { getVendorRaw, listMediaPoolsRaw, listNodes, mapBackendMediaPoolToFrontend, mapBackendVendorToFrontend } from "@/lib/api";

export default async function VendorDetailsPage({
  params,
}: {
  params: Promise<{ vendorId: string }>;
}) {
  const { vendorId } = await params;
  const [nodes, pools, vendor] = await Promise.all([listNodes(), listMediaPoolsRaw(), getVendorRaw(vendorId)]);

  if (!nodes || !pools || !vendor) {
    return null;
  }

  const mappedPools = pools.map((pool) => mapBackendMediaPoolToFrontend(pool, nodes));

  return <VendorDetailsPageView vendor={mapBackendVendorToFrontend(vendor, nodes, mappedPools)} nodes={nodes} />;
}
