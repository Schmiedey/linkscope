import { enrichSnapshot } from "@/src/analysis/enrich";
import { isTrackerCategory } from "@/src/analysis/categorizer";
import type { GraphNodeRecord, ScanGraphSnapshot, ScanRow } from "@/src/types/graph";

export type ScanDiff = {
  from: ScanRow;
  to: ScanRow;
  added: GraphNodeRecord[];
  removed: GraphNodeRecord[];
  persistent: GraphNodeRecord[];
  addedTrackers: GraphNodeRecord[];
  removedTrackers: GraphNodeRecord[];
};

function thirdParties(snapshot: ScanGraphSnapshot): GraphNodeRecord[] {
  return enrichSnapshot(snapshot).nodes.filter((node) => !node.isOrigin);
}

export function diffSnapshots(fromScan: ScanRow, toScan: ScanRow, fromGraph: ScanGraphSnapshot, toGraph: ScanGraphSnapshot): ScanDiff {
  const before = new Map(thirdParties(fromGraph).map((node) => [node.domain, node] as const));
  const after = new Map(thirdParties(toGraph).map((node) => [node.domain, node] as const));

  const added: GraphNodeRecord[] = [];
  const removed: GraphNodeRecord[] = [];
  const persistent: GraphNodeRecord[] = [];

  for (const [domain, node] of after) {
    if (before.has(domain)) persistent.push(node);
    else added.push(node);
  }
  for (const [domain, node] of before) {
    if (!after.has(domain)) removed.push(node);
  }

  const byName = (a: GraphNodeRecord, b: GraphNodeRecord): number => a.domain.localeCompare(b.domain);
  added.sort(byName);
  removed.sort(byName);
  persistent.sort(byName);

  return {
    from: fromScan,
    to: toScan,
    added,
    removed,
    persistent,
    addedTrackers: added.filter((node) => !node.isFirstParty && isTrackerCategory(node.category)),
    removedTrackers: removed.filter((node) => !node.isFirstParty && isTrackerCategory(node.category)),
  };
}
