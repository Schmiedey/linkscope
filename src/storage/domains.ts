import { db } from "@/src/storage/database";
import type { DomainRow, SightingRow, SiteRow } from "@/src/types/graph";

export async function listDomains(): Promise<DomainRow[]> {
  const rows = await db.domains.toArray();
  return rows.sort((a, b) => b.seenOnCount - a.seenOnCount || a.domain.localeCompare(b.domain));
}

export async function getDomain(domain: string): Promise<DomainRow | undefined> {
  return await db.domains.get(domain);
}

export async function listSightingsForDomain(domain: string): Promise<SightingRow[]> {
  return await db.sightings.where("domain").equals(domain).reverse().sortBy("lastSeen");
}

export async function getSiteMap(): Promise<Map<number, SiteRow>> {
  const sites = await db.sites.toArray();
  return new Map(sites.filter((site) => site.id !== undefined).map((site) => [site.id as number, site]));
}
