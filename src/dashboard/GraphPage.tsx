import { useParams } from "react-router-dom";
import { GraphViewer } from "@/src/graph/GraphViewer";
import { useAsync } from "@/src/lib/useAsync";
import { getScan, getScanGraph } from "@/src/storage/scans";
import { thirdPartyCountOf, trackerCountOf } from "@/src/analysis/enrich";
import { scoreFromScan } from "@/src/analysis/score";
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

  const snapshot = graph.data;
  const mark = scoreFromScan(scan.data);
  const watchNote = scan.data.captureMode === "watch" ? " · 15s watch" : "";

  return (
    <GraphViewer
      snapshot={snapshot}
      scan={scan.data}
      title={scan.data.domain}
      subtitle={`Grade ${mark.grade} ${String(mark.score)} · ${formatCount(thirdPartyCountOf(snapshot))} third parties · ${formatCount(trackerCountOf(snapshot))} trackers${watchNote}`}
      backTo="/"
    />
  );
}
