import { isTrackerCategory } from "@/src/analysis/categorizer";
import { enrichSnapshot } from "@/src/analysis/enrich";
import type { GraphNodeRecord, ScanGraphSnapshot } from "@/src/types/graph";

export const UNLISTED_OWNER = "Unlisted";

export type OwnerGroup = {
  owner: string;
  unlisted: boolean;
  domains: GraphNodeRecord[];
  trackerCount: number;
  siteCount?: number;
};

export function groupNodesByOwner(nodes: GraphNodeRecord[]): OwnerGroup[] {
  const buckets = new Map<string, GraphNodeRecord[]>();
  for (const node of nodes) {
    if (node.isOrigin || node.isFirstParty) continue;
    const owner = node.owner?.trim() || UNLISTED_OWNER;
    const list = buckets.get(owner) ?? [];
    list.push(node);
    buckets.set(owner, list);
  }

  const groups: OwnerGroup[] = [];
  for (const [owner, domains] of buckets) {
    domains.sort((a, b) => b.referenceCount - a.referenceCount || a.domain.localeCompare(b.domain));
    groups.push({
      owner,
      unlisted: owner === UNLISTED_OWNER,
      domains,
      trackerCount: domains.filter((node) => isTrackerCategory(node.category)).length,
    });
  }

  groups.sort((a, b) => {
    if (a.unlisted !== b.unlisted) return a.unlisted ? 1 : -1;
    if (b.trackerCount !== a.trackerCount) return b.trackerCount - a.trackerCount;
    if (b.domains.length !== a.domains.length) return b.domains.length - a.domains.length;
    return a.owner.localeCompare(b.owner);
  });
  return groups;
}

export function groupSnapshotByOwner(snapshot: ScanGraphSnapshot): OwnerGroup[] {
  return groupNodesByOwner(enrichSnapshot(snapshot).nodes);
}

export function siblingsFromOwner(snapshot: ScanGraphSnapshot, domain: string): GraphNodeRecord[] {
  const graph = enrichSnapshot(snapshot);
  const node = graph.nodes.find((item) => item.domain === domain);
  if (!node?.owner) return [];
  return graph.nodes.filter(
    (item) => item.domain !== domain && item.owner === node.owner && !item.isOrigin && !item.isFirstParty,
  );
}

export function mergeOwnerGroups(groups: OwnerGroup[][]): OwnerGroup[] {
  const merged = new Map<string, OwnerGroup>();
  for (const list of groups) {
    for (const group of list) {
      const existing = merged.get(group.owner);
      if (!existing) {
        merged.set(group.owner, {
          ...group,
          domains: [...group.domains],
          siteCount: 1,
        });
        continue;
      }
      const seen = new Set(existing.domains.map((node) => node.domain));
      for (const node of group.domains) {
        if (seen.has(node.domain)) continue;
        seen.add(node.domain);
        existing.domains.push(node);
      }
      existing.trackerCount = existing.domains.filter((node) => isTrackerCategory(node.category)).length;
      existing.siteCount = (existing.siteCount ?? 1) + 1;
    }
  }
  return Array.from(merged.values()).sort((a, b) => {
    if (a.unlisted !== b.unlisted) return a.unlisted ? 1 : -1;
    const siteDelta = (b.siteCount ?? 0) - (a.siteCount ?? 0);
    if (siteDelta) return siteDelta;
    if (b.domains.length !== a.domains.length) return b.domains.length - a.domains.length;
    return a.owner.localeCompare(b.owner);
  });
}
