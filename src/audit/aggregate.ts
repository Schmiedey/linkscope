import type { AuditDomainRow, AuditPageGraphRow } from "@/src/audit/types";
import type { GraphEdgeRecord, GraphNodeRecord, ScanGraphSnapshot } from "@/src/types/graph";

export function mergeAuditGraphs(graphs: AuditPageGraphRow[], originDomain: string): ScanGraphSnapshot {
  const nodes = new Map<string, GraphNodeRecord>();
  const edges = new Map<string, GraphEdgeRecord>();
  for (const graph of graphs) {
    for (const node of graph.nodes) {
      const existing = nodes.get(node.domain);
      if (!existing) {
        nodes.set(node.domain, { ...node, hostnames: [...node.hostnames] });
        continue;
      }
      existing.referenceCount += node.referenceCount;
      existing.hostnames = Array.from(new Set([...existing.hostnames, ...node.hostnames])).sort();
      existing.isOrigin = existing.isOrigin || node.isOrigin;
      existing.isSite = existing.isSite || node.isSite;
      existing.isFirstParty = existing.isFirstParty || node.isFirstParty;
      if (existing.category === "unknown" && node.category !== "unknown") existing.category = node.category;
      if (!existing.owner && node.owner) existing.owner = node.owner;
      existing.listed = existing.listed || node.listed;
    }
    for (const edge of graph.edges) {
      const existing = edges.get(edge.id);
      if (!existing) {
        edges.set(edge.id, { ...edge, evidence: [...edge.evidence] });
        continue;
      }
      existing.count += edge.count;
      existing.evidence = [...existing.evidence, ...edge.evidence].slice(0, 12);
    }
  }
  return {
    scanId: 0,
    originDomain,
    nodes: Array.from(nodes.values()).sort((a, b) => Number(b.isOrigin) - Number(a.isOrigin) || a.domain.localeCompare(b.domain)),
    edges: Array.from(edges.values()).sort((a, b) => a.id.localeCompare(b.id)),
  };
}

export function ownerGroupsForAudit(domains: AuditDomainRow[]): Array<{
  owner: string;
  pageCount: number;
  domains: AuditDomainRow[];
}> {
  const groups = new Map<string, AuditDomainRow[]>();
  for (const domain of domains.filter((row) => !row.isFirstParty)) {
    const owner = domain.owner?.trim() || domain.domain;
    groups.set(owner, [...(groups.get(owner) ?? []), domain]);
  }
  return Array.from(groups, ([owner, rows]) => ({
    owner,
    pageCount: new Set(rows.flatMap((row) => row.pages)).size,
    domains: rows.sort((a, b) => b.pageCount - a.pageCount || a.domain.localeCompare(b.domain)),
  })).sort((a, b) => b.pageCount - a.pageCount || a.owner.localeCompare(b.owner));
}
