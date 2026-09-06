import { categorizeDomain, isTrackerCategory } from "@/src/analysis/categorizer";
import { hostnameFromUrl, registrableDomain } from "@/src/lib/domain";
import type {
  ConnectionType,
  Evidence,
  GraphEdgeRecord,
  GraphNodeRecord,
  RawScanPayload,
  ScanGraphSnapshot,
} from "@/src/types/graph";

const MAX_EVIDENCE = 12;

export type NormalizedScan = {
  originDomain: string;
  snapshot: Omit<ScanGraphSnapshot, "scanId">;
  thirdPartyCount: number;
  trackerCount: number;
};

export function normalizeScan(raw: RawScanPayload): NormalizedScan {
  const originDomain = registrableDomain(raw.url);
  if (!originDomain) {
    throw new Error("Could not parse this page’s domain.");
  }

  const edges = new Map<string, GraphEdgeRecord>();
  const hostnamesByDomain = new Map<string, Set<string>>();
  const referenceByDomain = new Map<string, number>();

  const touchHostname = (domain: string, hostname: string): void => {
    const set = hostnamesByDomain.get(domain) ?? new Set<string>();
    set.add(hostname);
    hostnamesByDomain.set(domain, set);
  };

  touchHostname(originDomain, hostnameFromUrl(raw.url) ?? originDomain);
  referenceByDomain.set(originDomain, 0);

  for (const finding of raw.findings) {
    const targetDomain = registrableDomain(finding.url);
    const hostname = hostnameFromUrl(finding.url);
    if (!targetDomain || !hostname) continue;
    if (targetDomain === originDomain) continue;

    const type = finding.type as ConnectionType;
    const edgeId = `${originDomain}|${targetDomain}|${type}`;
    const evidence: Evidence = {
      type,
      url: finding.url,
      hostname,
      snippet: finding.snippet,
    };
    if (finding.context) evidence.context = finding.context;

    const existing = edges.get(edgeId);
    if (existing) {
      existing.count += 1;
      if (existing.evidence.length < MAX_EVIDENCE) {
        existing.evidence.push(evidence);
      }
    } else {
      edges.set(edgeId, {
        id: edgeId,
        source: originDomain,
        target: targetDomain,
        type,
        count: 1,
        evidence: [evidence],
      });
    }

    touchHostname(targetDomain, hostname);
    referenceByDomain.set(targetDomain, (referenceByDomain.get(targetDomain) ?? 0) + 1);
    referenceByDomain.set(originDomain, (referenceByDomain.get(originDomain) ?? 0) + 1);
  }

  const nodes: GraphNodeRecord[] = [];
  const domains = new Set<string>([originDomain, ...referenceByDomain.keys()]);

  for (const domain of domains) {
    const isOrigin = domain === originDomain;
    const category = isOrigin ? "origin" : categorizeDomain(domain);
    nodes.push({
      id: domain,
      domain,
      category,
      isOrigin,
      isSite: isOrigin,
      referenceCount: referenceByDomain.get(domain) ?? 0,
      hostnames: Array.from(hostnamesByDomain.get(domain) ?? [domain]).sort(),
    });
  }

  nodes.sort((a, b) => {
    if (a.isOrigin) return -1;
    if (b.isOrigin) return 1;
    return a.domain.localeCompare(b.domain);
  });

  const edgeList = Array.from(edges.values()).sort((a, b) => a.id.localeCompare(b.id));
  const thirdPartyCount = nodes.filter((node) => !node.isOrigin).length;
  const trackerCount = nodes.filter((node) => isTrackerCategory(node.category)).length;

  return {
    originDomain,
    thirdPartyCount,
    trackerCount,
    snapshot: {
      originDomain,
      nodes,
      edges: edgeList,
    },
  };
}
