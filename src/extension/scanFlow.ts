import { refreshActiveTabBadge } from "@/src/extension/badge";
import { canScanUrl, explainScanBlock } from "@/src/extension/permissions";
import { findingsFromRequests, startRequestCapture, stopRequestCapture } from "@/src/extension/requestLog";
import { registrableDomain } from "@/src/lib/domain";
import { notifyFirstSiteCheck } from "@/src/storage/alerts";
import { getScan, getSiteByDomain, persistScan, type PersistScanOptions } from "@/src/storage/scans";
import type { RawFinding, RawScanPayload } from "@/src/types/graph";

export const WATCH_DURATION_MS = 15_000;

export type ScanRunOptions = PersistScanOptions & {
  openReport?: boolean;
  tabId?: number;
  url?: string;
  notifyIfNew?: boolean;
  force?: boolean;
};

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

function mergeFindings(base: RawFinding[], extra: RawFinding[]): RawFinding[] {
  const seen = new Set(base.map((item) => `${item.type}|${item.url}|${item.documentUrl ?? ""}`));
  const findings = [...base];
  for (const item of extra) {
    const key = `${item.type}|${item.url}|${item.documentUrl ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    findings.push(item);
  }
  return findings;
}

function mergePayloads(first: RawScanPayload, second: RawScanPayload): RawScanPayload {
  return {
    url: first.url || second.url,
    title: first.title || second.title,
    hostname: first.hostname || second.hostname,
    findings: mergeFindings(first.findings, second.findings),
  };
}

async function resolveTargetTab(): Promise<{ id: number; url: string }> {
  const [active] = await browser.tabs.query({ active: true, currentWindow: true });
  if (active?.id && active.url && canScanUrl(active.url)) {
    return { id: active.id, url: active.url };
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
  const target = { tabId, allFrames: true as const };
  try {
    await browser.scripting.executeScript({
      target,
      files: ["/page-scanner.js"],
    });
  } catch {
    await browser.scripting.executeScript({
      target: { tabId },
      files: ["/page-scanner.js"],
    });
  }

  let results: Array<{ frameId?: number; result?: RawScanPayload }>;
  try {
    results = (await browser.scripting.executeScript({
      target,
      func: readInjectedScan,
    })) as Array<{ frameId?: number; result?: RawScanPayload }>;
  } catch {
    results = (await browser.scripting.executeScript({
      target: { tabId },
      func: readInjectedScan,
    })) as Array<{ frameId?: number; result?: RawScanPayload }>;
  }

  const payloads = results
    .map((row) => row.result)
    .filter((item): item is RawScanPayload => Boolean(item?.url && item.findings));
  const top =
    results.find((row) => row.frameId === 0)?.result ??
    payloads.find((item) => item.hostname) ??
    payloads[0];
  if (!top) {
    throw new Error("The page did not return any scan data.");
  }

  let merged = top;
  for (const payload of payloads) {
    if (payload === top) continue;
    merged = mergePayloads(merged, payload);
  }
  return merged;
}

function withCapturedRequests(raw: RawScanPayload, tabId: number): RawScanPayload {
  const hops = stopRequestCapture(tabId);
  if (hops.length === 0) return raw;
  return {
    ...raw,
    findings: mergeFindings(raw.findings, findingsFromRequests(hops)),
  };
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
  startRequestCapture(tab.id);
  const domainBefore = registrableDomain(tab.url);
  const existed = domainBefore ? Boolean(await getSiteByDomain(domainBefore)) : false;
  let raw: RawScanPayload;
  try {
    raw = withCapturedRequests(await injectCollector(tab.id), tab.id);
  } catch (error) {
    stopRequestCapture(tab.id);
    throw error;
  }
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

  startRequestCapture(tab.id);
  try {
    const first = await injectCollector(tab.id);
    await delay(durationMs);
    const second = await injectCollector(tab.id);
    const raw = withCapturedRequests(mergePayloads(first, second), tab.id);
    const scanId = await persistScan(raw, {
      captureMode: "watch",
      durationMs,
    });
    await refreshActiveTabBadge();
    await openGraphTab(scanId, waiting.id);
    return scanId;
  } catch (error) {
    stopRequestCapture(tab.id);
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
