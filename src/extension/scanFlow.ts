import { canScanUrl, explainScanBlock } from "@/src/extension/permissions";
import { persistScan } from "@/src/storage/scans";
import type { RawScanPayload } from "@/src/types/graph";

function readInjectedScan(): RawScanPayload | undefined {
  const scope = globalThis as typeof globalThis & { __LINKSCOPE_SCAN__?: RawScanPayload };
  const payload = scope.__LINKSCOPE_SCAN__;
  delete scope.__LINKSCOPE_SCAN__;
  return payload;
}

export async function scanActiveTab(): Promise<number> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    throw new Error("No active tab.");
  }
  if (!tab.url || !canScanUrl(tab.url)) {
    throw new Error(explainScanBlock(tab.url));
  }

  await browser.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["/page-scanner.js"],
  });

  const results = await browser.scripting.executeScript({
    target: { tabId: tab.id },
    func: readInjectedScan,
  });

  const raw = results[0]?.result as RawScanPayload | undefined;
  if (!raw) {
    throw new Error("The page did not return any scan data.");
  }

  const scanId = await persistScan(raw);
  const url = browser.runtime.getURL(`/app.html#/graph/${scanId}`);
  await browser.tabs.create({ url });
  return scanId;
}

export async function openDashboard(): Promise<void> {
  const url = browser.runtime.getURL("/app.html#/");
  await browser.tabs.create({ url });
}
