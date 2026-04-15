import { CustomerDetailsPageView } from "@/components/pages/customer-details-page";
import { getCustomerRaw, listNodes, mapBackendCustomerToFrontend } from "@/lib/api";

export default async function CustomerDetailsPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const [nodes, customer] = await Promise.all([listNodes(), getCustomerRaw(customerId)]);

  if (!nodes || !customer) {
    return null;
  }

  return <CustomerDetailsPageView customer={mapBackendCustomerToFrontend(customer, nodes)} nodes={nodes} />;
}
