import type { ConnectionType, DomainCategory, GraphEdgeRecord, GraphNodeRecord } from "@/src/types/graph";
import { INFRA_CATEGORIES } from "@/src/types/graph";

export type GraphFilterState = {
  enabledTypes: Record<ConnectionType, boolean>;
  thirdPartyOnly: boolean;
  hideCommonInfra: boolean;
  searchQuery: string;
};

export function isNodeVisible(
  node: GraphNodeRecord,
  edges: GraphEdgeRecord[],
  filters: GraphFilterState,
): boolean {
  if (node.isOrigin || node.isSite) {
    if (filters.searchQuery && !matchesSearch(node, filters.searchQuery) && !neighborMatches(node, edges, filters.searchQuery)) {
      return true;
    }
    return true;
  }
  if (filters.thirdPartyOnly && node.isSite) return false;
  if (filters.hideCommonInfra && INFRA_CATEGORIES.has(node.category as DomainCategory) && !node.isSite) {
    return false;
  }
  const connected = edges.some(
    (edge) =>
      filters.enabledTypes[edge.type] && (edge.source === node.domain || edge.target === node.domain),
  );
  return connected;
}

export function matchesSearch(node: GraphNodeRecord, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (node.domain.includes(q)) return true;
  return node.hostnames.some((host) => host.includes(q));
}

function neighborMatches(node: GraphNodeRecord, edges: GraphEdgeRecord[], query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return edges.some((edge) => {
    if (edge.source !== node.domain && edge.target !== node.domain) return false;
    return edge.source.includes(q) || edge.target.includes(q);
  });
}
