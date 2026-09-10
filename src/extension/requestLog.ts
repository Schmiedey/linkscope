import type { ConnectionType, RawFinding } from "@/src/types/graph";

export type CapturedRequest = {
  url: string;
  initiator?: string;
  documentUrl?: string;
  type: string;
};

const capturing = new Map<number, CapturedRequest[]>();
const MAX_CAPTURED = 4000;

function requestType(type: string): ConnectionType {
  if (type === "script") return "script";
  if (type === "image") return "image";
  if (type === "sub_frame" || type === "main_frame") return "iframe";
  if (type === "stylesheet") return "stylesheet";
  if (type === "font") return "font";
  if (type === "media" || type === "object") return "media";
  return "network";
}

export function startRequestCapture(tabId: number): void {
  capturing.set(tabId, []);
}

export function stopRequestCapture(tabId: number): CapturedRequest[] {
  const rows = capturing.get(tabId) ?? [];
  capturing.delete(tabId);
  return rows;
}

export function findingsFromRequests(hops: CapturedRequest[]): RawFinding[] {
  return hops.map((hop) => {
    const finding: RawFinding = {
      type: requestType(hop.type),
      url: hop.url,
      snippet: `webRequest:${hop.type} ${hop.url.slice(0, 220)}`,
    };
    if (hop.initiator) finding.initiatorUrl = hop.initiator;
    if (hop.documentUrl) finding.documentUrl = hop.documentUrl;
    return finding;
  });
}

export function installRequestCapture(): void {
  if (typeof browser === "undefined" || !browser.webRequest?.onBeforeRequest) return;
  try {
    browser.webRequest.onBeforeRequest.addListener(
      (details): undefined => {
        if (details.tabId < 0) return undefined;
        const bucket = capturing.get(details.tabId);
        if (!bucket || bucket.length >= MAX_CAPTURED) return undefined;
        const extra = details as typeof details & { documentUrl?: string; initiator?: string };
        bucket.push({
          url: details.url,
          initiator: extra.initiator,
          documentUrl: extra.documentUrl,
          type: details.type,
        });
        return undefined;
      },
      { urls: ["http://*/*", "https://*/*"] },
    );
  } catch {
    // Host permission is required for a full webRequest view; frame scans still work.
  }
}
