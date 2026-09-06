const BLOCKED_PREFIXES = [
  "chrome://",
  "chrome-extension://",
  "edge://",
  "about:",
  "moz-extension://",
  "devtools://",
  "view-source:",
  "https://chrome.google.com/webstore",
  "https://chromewebstore.google.com",
];

export function canScanUrl(url: string): boolean {
  const lower = url.toLowerCase();
  if (BLOCKED_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
    return false;
  }
  return lower.startsWith("http://") || lower.startsWith("https://");
}

export function explainScanBlock(url: string | undefined): string {
  if (!url) return "Open a regular website, then scan it.";
  if (!canScanUrl(url)) {
    return "This page cannot be scanned. Open a regular website first.";
  }
  return "This page cannot be scanned.";
}
