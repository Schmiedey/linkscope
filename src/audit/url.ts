const DANGEROUS_SEGMENTS = [
  "/logout",
  "/log-out",
  "/signout",
  "/sign-out",
  "/delete",
  "/remove",
  "/unsubscribe",
  "/wp-admin",
  "/admin",
];

const DOWNLOAD_EXTENSIONS = new Set([
  "7z", "avi", "csv", "doc", "docx", "dmg", "exe", "gz", "iso", "mov", "mp3", "mp4",
  "pdf", "pkg", "ppt", "pptx", "rar", "tar", "tgz", "wav", "xls", "xlsx", "zip",
]);

export function canonicalAuditUrl(raw: string, rootUrl: string): string | null {
  try {
    const root = new URL(rootUrl);
    const url = new URL(raw, root);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.origin !== root.origin) return null;
    url.hash = "";
    url.search = "";
    url.username = "";
    url.password = "";
    url.pathname = url.pathname.replace(/\/{2,}/g, "/");
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "");
    const lowerPath = url.pathname.toLowerCase();
    if (DANGEROUS_SEGMENTS.some((part) => lowerPath === part || lowerPath.startsWith(`${part}/`))) {
      return null;
    }
    const extension = lowerPath.split(".").pop();
    if (extension && extension !== lowerPath && DOWNLOAD_EXTENSIONS.has(extension)) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function auditPath(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname || "/";
  } catch {
    return url;
  }
}

function pathDepth(url: string): number {
  return auditPath(url).split("/").filter(Boolean).length;
}

export function prioritizeAuditUrls(urls: Iterable<string>, rootUrl: string, limit: number): string[] {
  const root = canonicalAuditUrl(rootUrl, rootUrl);
  const unique = Array.from(new Set(Array.from(urls).map((url) => canonicalAuditUrl(url, rootUrl)).filter((url): url is string => Boolean(url))));
  const selected: string[] = [];
  const usedFirst = new Set<string>();
  const usedShapes = new Set<string>();

  const ranked = unique.sort((a, b) => {
    if (a === root) return -1;
    if (b === root) return 1;
    return pathDepth(a) - pathDepth(b) || auditPath(a).localeCompare(auditPath(b));
  });

  for (const url of ranked) {
    const parts = auditPath(url).split("/").filter(Boolean);
    const first = parts[0] ?? "/";
    if (usedFirst.has(first)) continue;
    usedFirst.add(first);
    selected.push(url);
    if (selected.length >= limit) return selected;
  }

  for (const url of ranked) {
    if (selected.includes(url)) continue;
    const parts = auditPath(url).split("/").filter(Boolean);
    const shape = parts.map((part) => (/^\d+$/.test(part) || part.length > 28 ? ":item" : part)).slice(0, 2).join("/");
    if (usedShapes.has(shape)) continue;
    usedShapes.add(shape);
    selected.push(url);
    if (selected.length >= limit) return selected;
  }

  for (const url of ranked) {
    if (!selected.includes(url)) selected.push(url);
    if (selected.length >= limit) break;
  }
  return selected;
}
