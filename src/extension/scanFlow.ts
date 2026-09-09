import { refreshActiveTabBadge } from "@/src/extension/badge";
import { canScanUrl, explainScanBlock } from "@/src/extension/permissions";
import { registrableDomain } from "@/src/lib/domain";
import { notifyFirstSiteCheck } from "@/src/storage/alerts";
import { getLatestScanForSite, getScan, getSiteByDomain, persistScan, type PersistScanOptions } from "@/src/storage/scans";
import type { RawScanPayload } from "@/src/types/graph";

export const WATCH_DURATION_MS = 15_000;

export type ScanRunOptions = PersistScanOptions & {
  openReport?: boolean;
  tabId?: number;
  url?: string;
  notifyIfNew?: boolean;
};

const QUIET_SCAN_TTL_MS = 45_000;

async function recentQuietScanId(url: string): Promise<number | null> {
  const domain = registrableDomain(url);
  if (!domain) return null;
  const site = await getSiteByDomain(domain);
  if (site?.id === undefined) return null;
  const latest = await getLatestScanForSite(site.id);
  if (latest?.id === undefined) return null;
  if (Date.now() - latest.timestamp >= QUIET_SCAN_TTL_MS) return null;
  return latest.id;
}

function readInjectedScan(): RawScanPayload | undefined {
  const scope = globalThis as typeof globalThis & { __LINKSCOPE_SCAN__?: RawScanPayload };
  const payload = scope.__LINKSCOPE_SCAN__;
  delete scope.__LINKSCOPE_SCAN__;
  return payload;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function mergePayloads(first: RawScanPayload, second: RawScanPayload): RawScanPayload {
  const seen = new Set(first.findings.map((item) => `${item.type}|${item.url}`));
  const findings = [...first.findings];
  for (const item of second.findings) {
    const key = `${item.type}|${item.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    findings.push(item);
  }
  return {
    url: second.url || first.url,
    title: second.title || first.title,
    hostname: second.hostname || first.hostname,
    findings,
  };
}

async function resolveTargetTab(): Promise<{ id: number; url: string }> {
  const [active] = await browser.tabs.query({ active: true, currentWindow: true });
  if (active?.id && active.url && canScanUrl(active.url)) {
    return { id: active.id, url: active.url };
  }

  const tabs = await browser.tabs.query({ currentWindow: true });
  const candidate = tabs.find((tab) => tab.id !== undefined && tab.url !== undefined && canScanUrl(tab.url));
  if (candidate?.id && candidate.url) {
    return { id: candidate.id, url: candidate.url };
  }

  throw new Error(explainScanBlock(active?.url));
}

export async function getScanTarget(): Promise<{ id: number; url: string } | null> {
  try {
    return await resolveTargetTab();
  } catch {
    return null;
  }
}

async function injectCollector(tabId: number): Promise<RawScanPayload> {
  await browser.scripting.executeScript({
    target: { tabId },
    files: ["/page-scanner.js"],
  });

  const results = await browser.scripting.executeScript({
    target: { tabId },
    func: readInjectedScan,
  });

  const raw = results[0]?.result as RawScanPayload | undefined;
  if (!raw) {
    throw new Error("The page did not return any scan data.");
  }
  return raw;
}

async function openGraphTab(scanId: number, replaceTabId?: number): Promise<void> {
  const url = browser.runtime.getURL(`/app.html#/graph/${String(scanId)}`);
  if (replaceTabId !== undefined) {
    try {
      await browser.tabs.update(replaceTabId, { url, active: true });
      return;
    } catch {
      // The waiting tab may have been closed.
    }
  }
  await browser.tabs.create({ url });
}

export async function scanActiveTab(options: ScanRunOptions = {}): Promise<number> {
  const tab =
    options.tabId !== undefined && options.url
      ? { id: options.tabId, url: options.url }
      : await resolveTargetTab();
  const openReport = options.openReport !== false;
  if (!openReport) {
    const recent = await recentQuietScanId(tab.url);
    if (recent !== null) return recent;
  }
  const domainBefore = registrableDomain(tab.url);
  const existed = domainBefore ? Boolean(await getSiteByDomain(domainBefore)) : false;
  const raw = await injectCollector(tab.id);
  const scanId = await persistScan(raw, options);
  await refreshActiveTabBadge();
  if (openReport) await openGraphTab(scanId);
  else if (options.notifyIfNew && !existed) {
    const saved = await getScan(scanId);
    await notifyFirstSiteCheck({
      domain: saved?.domain ?? domainBefore ?? tab.url,
      scanId,
      thirdPartyCount: saved?.thirdPartyCount ?? 0,
      trackerCount: saved?.trackerCount ?? 0,
    });
  }
  return scanId;
}

export async function watchActiveTab(durationMs = WATCH_DURATION_MS): Promise<number> {
  const tab = await resolveTargetTab();
  const waitingUrl = browser.runtime.getURL(`/app.html#/watching?ms=${String(durationMs)}`);
  const waiting = await browser.tabs.create({ url: waitingUrl });

  try {
    const first = await injectCollector(tab.id);
    await delay(durationMs);
    const second = await injectCollector(tab.id);
    const scanId = await persistScan(mergePayloads(first, second), {
      captureMode: "watch",
      durationMs,
    });
    await refreshActiveTabBadge();
    await openGraphTab(scanId, waiting.id);
    return scanId;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Watch failed.";
    if (waiting.id !== undefined) {
      const failedUrl = browser.runtime.getURL(`/app.html#/watching?error=${encodeURIComponent(message)}`);
      try {
        await browser.tabs.update(waiting.id, { url: failedUrl });
      } catch {
        // Ignore a closed waiting tab.
      }
    }
    throw error;
  }
}

export async function openDashboard(hash = "/"): Promise<void> {
  const path = hash.startsWith("#") ? hash.slice(1) : hash;
  const url = browser.runtime.getURL(`/app.html#${path.startsWith("/") ? path : `/${path}`}`);
  await browser.tabs.create({ url });
}
