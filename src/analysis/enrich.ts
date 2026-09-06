import { describeDomain, isTrackerCategory } from "@/src/analysis/categorizer";
import { isFirstPartyDomain } from "@/src/analysis/firstParty";
import type { GraphNodeRecord, ScanGraphSnapshot } from "@/src/types/graph";

export function withFirstParty(originDomain: string, node: GraphNodeRecord): GraphNodeRecord {
  if (node.isOrigin) return { ...node, isFirstParty: true, listed: false, owner: undefined };
  const listed = describeDomain(node.domain);
  return {
    ...node,
    isFirstParty: Boolean(node.isFirstParty) || isFirstPartyDomain(originDomain, node.domain),
    category: node.isOrigin ? "origin" : listed.category,
    owner: listed.owner,
    listed: listed.listed,
  };
}

export function enrichSnapshot(snapshot: ScanGraphSnapshot): ScanGraphSnapshot {
  return {
    ...snapshot,
    nodes: snapshot.nodes.map((node) => withFirstParty(snapshot.originDomain, node)),
  };
}

export function trackerCountOf(snapshot: ScanGraphSnapshot): number {
  const graph = enrichSnapshot(snapshot);
  return graph.nodes.filter(
    (node) => !node.isOrigin && !node.isFirstParty && isTrackerCategory(node.category),
  ).length;
}

export function thirdPartyCountOf(snapshot: ScanGraphSnapshot): number {
  const graph = enrichSnapshot(snapshot);
  return graph.nodes.filter((node) => !node.isOrigin && !node.isFirstParty).length;
}
