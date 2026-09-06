import { useParams } from "react-router-dom";
import { GraphViewer } from "@/src/graph/GraphViewer";
import { useAsync } from "@/src/lib/useAsync";
import { getScan, getScanGraph } from "@/src/storage/scans";
import { formatCount } from "@/src/lib/utils";

export function GraphPage() {
  const params = useParams();
  const scanId = Number(params.scanId);
  const scan = useAsync(() => getScan(scanId), [scanId]);
  const graph = useAsync(() => getScanGraph(scanId), [scanId]);

  if (!Number.isFinite(scanId)) {
    return <p className="p-8 text-mute">Invalid scan.</p>;
  }

  if (graph.loading || scan.loading) {
    return <div className="flex h-screen items-center justify-center text-mute">Rendering graph…</div>;
  }

  if (!graph.data || !scan.data) {
    return (
      <div className="p-8">
        <h1 className="font-display text-3xl">Scan not found</h1>
        <p className="mt-2 text-mute">This snapshot is no longer in local storage.</p>
      </div>
    );
  }

  return (
    <GraphViewer
      snapshot={graph.data}
      title={scan.data.domain}
      subtitle={`${formatCount(scan.data.nodeCount)} domains · ${formatCount(scan.data.edgeCount)} connections`}
      backTo="/"
    />
  );
}
