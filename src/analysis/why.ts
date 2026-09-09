import { identifyDomain } from "@/src/analysis/identity";
import {
  CONNECTION_TYPE_LABELS,
  type ConnectionType,
  type GraphEdgeRecord,
  type ScanGraphSnapshot,
} from "@/src/types/graph";

export type LoadHop = {
  domain: string;
  name: string;
  resource?: string;
  via?: ConnectionType;
};

export type LoadChain = {
  hops: LoadHop[];
  triggeredBy?: string;
  usedFor: string;
};

const TYPE_RANK: Record<ConnectionType, number> = {
  script: 0,
  iframe: 1,
  network: 2,
  stylesheet: 3,
  font: 4,
  media: 5,
  image: 6,
  link: 7,
  other: 8,
};

function resourceName(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const path = new URL(url).pathname;
    const base = path.split("/").filter(Boolean).pop();
    if (!base || !base.includes(".")) return undefined;
    return decodeURIComponent(base).slice(0, 48);
  } catch {
    return undefined;
  }
}

function bestIncoming(snapshot: ScanGraphSnapshot, domain: string): GraphEdgeRecord | undefined {
  return [...snapshot.edges]
    .filter((edge) => edge.target === domain && edge.source !== domain)
    .sort((a, b) => (TYPE_RANK[a.type] ?? 9) - (TYPE_RANK[b.type] ?? 9))[0];
}

function hopFor(domain: string, via?: ConnectionType, url?: string): LoadHop {
  const identity = identifyDomain(domain);
  return {
    domain,
    name: identity.name,
    resource: resourceName(url),
    via,
  };
}

export function loadChainFor(snapshot: ScanGraphSnapshot, domain: string): LoadChain {
  const identity = identifyDomain(domain);
  const origin = snapshot.originDomain;
  const hops: LoadHop[] = [];
  const seen = new Set<string>();
  let current = domain;
  let guard = 0;
  let lastIncoming: GraphEdgeRecord | undefined;

  while (current && !seen.has(current) && guard < 8) {
    seen.add(current);
    const incoming = bestIncoming(snapshot, current);
    lastIncoming = incoming ?? lastIncoming;
    hops.unshift(hopFor(current, incoming?.type, incoming?.evidence[0]?.url));
    if (!incoming || incoming.source === current || incoming.source === origin) {
      if (origin && !seen.has(origin)) hops.unshift(hopFor(origin));
      break;
    }
    current = incoming.source;
    guard += 1;
  }

  if (hops.length === 0) hops.push(hopFor(origin), hopFor(domain));
  else if (hops[0]?.domain !== origin) hops.unshift(hopFor(origin));

  const trigger = lastIncoming?.type;
  return {
    hops,
    triggeredBy: trigger ? (trigger === "script" ? "<script>" : CONNECTION_TYPE_LABELS[trigger]) : undefined,
    usedFor: identity.usedFor,
  };
}
