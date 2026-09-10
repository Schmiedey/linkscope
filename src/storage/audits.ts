import { isTrackerCategory } from "@/src/analysis/categorizer";
import { scoreSnapshot } from "@/src/analysis/score";
import { scoreAudit } from "@/src/audit/scoring";
import { AUDIT_MODES, type AuditDomainRow, type AuditMode, type AuditPageRow, type AuditProgress, type AuditRow } from "@/src/audit/types";
import { auditPath, canonicalAuditUrl } from "@/src/audit/url";
import { normalizeScan } from "@/src/extension/normalize";
import { registrableDomain } from "@/src/lib/domain";
import { db } from "@/src/storage/database";
import type { ConnectionType, RawScanPayload } from "@/src/types/graph";

export async function createAudit(rootUrl: string, mode: AuditMode): Promise<number> {
  const canonical = canonicalAuditUrl(rootUrl, rootUrl);
  if (!canonical) throw new Error("Enter a valid public website URL.");
  const root = new URL(canonical);
  root.pathname = "/";
  root.search = "";
  root.hash = "";
  const config = AUDIT_MODES[mode];
  const domain = registrableDomain(root.href) ?? root.hostname.replace(/^www\./, "");
  const previous = (await db.audits.where("domain").equals(domain).sortBy("startedAt")).reverse();
  return await db.audits.add({
    domain,
    rootUrl: root.href,
    startedAt: Date.now(),
    status: "discovering",
    mode,
    maxPages: config.maxPages,
    waitMs: config.waitMs,
    pagesDiscovered: 1,
    pagesScanned: 0,
    pagesFailed: 0,
    uniqueDomains: 0,
    thirdPartyCount: 0,
    trackerCount: 0,
    unknownCount: 0,
    ownerCount: 0,
    previousAuditId: previous.find((row) => row.status === "completed")?.id,
  });
}

export async function getAudit(auditId: number): Promise<AuditRow | undefined> {
  return await db.audits.get(auditId);
}

export async function listAudits(): Promise<AuditRow[]> {
  return await db.audits.orderBy("startedAt").reverse().toArray();
}

export async function listAuditPages(auditId: number): Promise<AuditPageRow[]> {
  return await db.auditPages.where("auditId").equals(auditId).sortBy("path");
}

export async function listAuditDomains(auditId: number): Promise<AuditDomainRow[]> {
  return await db.auditDomains.where("auditId").equals(auditId).toArray();
}

export async function listAuditGraphs(auditId: number) {
  return await db.auditPageGraphs.where("auditId").equals(auditId).toArray();
}

export async function setAuditDiscovery(auditId: number, discovered: number): Promise<void> {
  await db.audits.update(auditId, { status: "running", pagesDiscovered: discovered });
}

export async function setAuditCurrentPage(auditId: number, url: string, discovered: number): Promise<void> {
  const existing = await db.auditPages.where("[auditId+url]").equals([auditId, url]).first();
  if (existing?.id !== undefined) {
    await db.auditPages.update(existing.id, { status: "scanning", error: undefined });
  } else {
    await db.auditPages.add({
      auditId,
      url,
      path: auditPath(url),
      title: auditPath(url),
      status: "scanning",
      thirdPartyCount: 0,
      trackerCount: 0,
      unknownCount: 0,
    });
  }
  await db.audits.update(auditId, { status: "running", currentUrl: url, pagesDiscovered: discovered });
}

export async function persistAuditPage(auditId: number, raw: RawScanPayload): Promise<string[]> {
  const audit = await getAudit(auditId);
  if (!audit) throw new Error("Audit not found.");
  const url = canonicalAuditUrl(raw.url, audit.rootUrl) ?? raw.url;
  const normalized = normalizeScan({ ...raw, url });
  const snapshot = { scanId: 0, ...normalized.snapshot };
  const scored = scoreSnapshot(snapshot);
  const path = auditPath(url);
  const newlyFound: string[] = [];

  await db.transaction("rw", db.auditPages, db.auditPageGraphs, db.auditDomains, async () => {
    const existingPage = await db.auditPages.where("[auditId+url]").equals([auditId, url]).first();
    const pageData: Omit<AuditPageRow, "id"> = {
      auditId,
      url,
      path,
      title: raw.title || path,
      status: "completed",
      scannedAt: Date.now(),
      thirdPartyCount: scored.thirdParties,
      trackerCount: scored.trackers,
      unknownCount: scored.unknown,
      score: scored.score,
    };
    let pageId: number;
    if (existingPage?.id !== undefined) {
      pageId = existingPage.id;
      await db.auditPages.put({ ...pageData, id: pageId });
    } else {
      pageId = await db.auditPages.add(pageData);
    }
    await db.auditPageGraphs.put({
      pageId,
      auditId,
      originDomain: normalized.originDomain,
      nodes: normalized.snapshot.nodes,
      edges: normalized.snapshot.edges,
    });

    for (const node of normalized.snapshot.nodes) {
      if (node.isOrigin) continue;
      const types = Array.from(new Set(normalized.snapshot.edges.filter((edge) => edge.target === node.domain).map((edge) => edge.type))) as ConnectionType[];
      const key: [number, string] = [auditId, node.domain];
      const existing = await db.auditDomains.get(key);
      if (!existing) newlyFound.push(node.domain);
      const pages = Array.from(new Set([...(existing?.pages ?? []), path])).sort();
      await db.auditDomains.put({
        auditId,
        domain: node.domain,
        category: existing?.category === "unknown" && node.category !== "unknown" ? node.category : existing?.category ?? node.category,
        owner: existing?.owner ?? node.owner,
        pageCount: pages.length,
        referenceCount: (existing?.referenceCount ?? 0) + node.referenceCount,
        pages,
        types: Array.from(new Set([...(existing?.types ?? []), ...types])),
        listed: Boolean(existing?.listed || node.listed),
        isFirstParty: Boolean(existing?.isFirstParty || node.isFirstParty),
      });
    }
  });
  await refreshAuditTotals(auditId);
  return newlyFound.filter((domain) => {
    const node = normalized.snapshot.nodes.find((item) => item.domain === domain);
    return node && !node.isFirstParty;
  });
}

export async function recordAuditPageFailure(auditId: number, url: string, error: string): Promise<void> {
  const existing = await db.auditPages.where("[auditId+url]").equals([auditId, url]).first();
  const row: Omit<AuditPageRow, "id"> = {
    auditId,
    url,
    path: auditPath(url),
    title: auditPath(url),
    status: "failed",
    scannedAt: Date.now(),
    thirdPartyCount: 0,
    trackerCount: 0,
    unknownCount: 0,
    error,
  };
  if (existing?.id !== undefined) await db.auditPages.put({ ...row, id: existing.id });
  else await db.auditPages.add(row);
  await refreshAuditTotals(auditId);
}

export async function refreshAuditTotals(auditId: number): Promise<void> {
  const [pages, domains] = await Promise.all([listAuditPages(auditId), listAuditDomains(auditId)]);
  const completed = pages.filter((page) => page.status === "completed");
  const failed = pages.filter((page) => page.status === "failed");
  const third = domains.filter((domain) => !domain.isFirstParty);
  await db.audits.update(auditId, {
    pagesScanned: completed.length,
    pagesFailed: failed.length,
    uniqueDomains: third.length,
    thirdPartyCount: third.length,
    trackerCount: third.filter((domain) => isTrackerCategory(domain.category)).length,
    unknownCount: third.filter((domain) => domain.category === "unknown").length,
    ownerCount: new Set(third.map((domain) => domain.owner || domain.domain)).size,
  });
}

export async function completeAudit(auditId: number): Promise<void> {
  const audit = await getAudit(auditId);
  if (!audit) throw new Error("Audit not found.");
  const [pages, graphs] = await Promise.all([listAuditPages(auditId), listAuditGraphs(auditId)]);
  const scores = scoreAudit(pages.filter((page) => page.status === "completed"), graphs, audit.domain);
  await refreshAuditTotals(auditId);
  await db.audits.update(auditId, {
    ...scores,
    status: "completed",
    completedAt: Date.now(),
    currentUrl: undefined,
    error: undefined,
  });
}

export async function failAudit(auditId: number, error: string): Promise<void> {
  await db.audits.update(auditId, { status: "failed", completedAt: Date.now(), error, currentUrl: undefined });
}

export async function cancelAudit(auditId: number): Promise<void> {
  await db.audits.update(auditId, { status: "cancelled", completedAt: Date.now(), currentUrl: undefined });
}

export async function auditProgress(auditId: number, recentlyFound: string[] = []): Promise<AuditProgress | null> {
  const audit = await getAudit(auditId);
  if (!audit) return null;
  return {
    auditId,
    status: audit.status,
    currentUrl: audit.currentUrl,
    pagesDiscovered: audit.pagesDiscovered,
    pagesScanned: audit.pagesScanned,
    pagesFailed: audit.pagesFailed,
    thirdPartyCount: audit.thirdPartyCount,
    trackerCount: audit.trackerCount,
    unknownCount: audit.unknownCount,
    recentlyFound,
  };
}
