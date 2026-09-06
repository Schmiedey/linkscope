import { canScanUrl, explainScanBlock } from "@/src/extension/permissions";
import { persistScan, type PersistScanOptions } from "@/src/storage/scans";
import type { RawScanPayload } from "@/src/types/graph";

export const WATCH_DURATION_MS = 15_000;

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

export async function scanActiveTab(options: PersistScanOptions = {}): Promise<number> {
  const tab = await resolveTargetTab();
  const raw = await injectCollector(tab.id);
  const scanId = await persistScan(raw, options);
  await openGraphTab(scanId);
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

export async function openDashboard(): Promise<void> {
  const url = browser.runtime.getURL("/app.html#/");
  await browser.tabs.create({ url });
}
