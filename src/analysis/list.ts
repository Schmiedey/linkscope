import type { DomainCategory } from "@/src/types/graph";
import disconnectFile from "@/src/analysis/data/disconnect.json";

type DisconnectEntry = { c: DomainCategory; o: string };

type DisconnectFile = {
  source: string;
  license: string;
  homepage: string;
  generatedAt: string;
  domainCount: number;
  entries: Record<string, DisconnectEntry>;
};

const FILE = disconnectFile as DisconnectFile;
const ENTRIES = FILE.entries;
const SUFFIXES = Object.keys(ENTRIES).sort((a, b) => b.length - a.length);

export const LIST_ATTRIBUTION = {
  source: FILE.source,
  license: FILE.license,
  homepage: FILE.homepage,
  generatedAt: FILE.generatedAt,
  domainCount: FILE.domainCount,
} as const;

export type DomainListHit = {
  category: DomainCategory;
  owner: string;
  source: "disconnect";
};

export function lookupDisconnect(domain: string): DomainListHit | null {
  const normalized = domain.toLowerCase();
  const direct = ENTRIES[normalized];
  if (direct) {
    return { category: direct.c, owner: direct.o, source: "disconnect" };
  }
  for (const suffix of SUFFIXES) {
    if (normalized.endsWith(`.${suffix}`)) {
      const hit = ENTRIES[suffix];
      if (hit) return { category: hit.c, owner: hit.o, source: "disconnect" };
    }
  }
  return null;
}
