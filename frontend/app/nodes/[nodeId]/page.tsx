import { NodeDetailsPageClient } from "@/components/nodes/node-details-page";

export const dynamic = "force-dynamic";

export default async function NodeDetailsPage({
  params,
}: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = await params;
  return <NodeDetailsPageClient nodeId={nodeId} />;
}
