import Dexie, { type Table } from "dexie";
import type {
  AlertRow,
  DomainRow,
  ScanGraphRow,
  ScanRow,
  SettingRow,
  SightingRow,
  SiteRow,
} from "@/src/types/graph";

export class LinkScopeDB extends Dexie {
  sites!: Table<SiteRow, number>;
  scans!: Table<ScanRow, number>;
  scanGraphs!: Table<ScanGraphRow, number>;
  domains!: Table<DomainRow, string>;
  sightings!: Table<SightingRow, number>;
  alerts!: Table<AlertRow, number>;
  settings!: Table<SettingRow, string>;

  constructor() {
    super("linkscope");
    this.version(1).stores({
      sites: "++id, &domain, lastSeen",
      scans: "++id, siteId, domain, timestamp",
      scanGraphs: "scanId",
      domains: "&domain, category, lastSeen, seenOnCount",
      sightings: "++id, &[domain+siteId], domain, siteId, lastSeen",
    });
    this.version(2).stores({
      sites: "++id, &domain, lastSeen",
      scans: "++id, siteId, domain, timestamp",
      scanGraphs: "scanId",
      domains: "&domain, category, lastSeen, seenOnCount",
      sightings: "++id, &[domain+siteId], domain, siteId, lastSeen",
      alerts: "++id, siteId, timestamp, read",
      settings: "&key",
    });
  }
}

export const db = new LinkScopeDB();
