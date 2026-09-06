import type { ConnectionType, RawFinding, RawScanPayload } from "@/src/types/graph";

const MAX_FINDINGS = 2500;

/**
 * Injected into the active tab. Must stay self-contained — Chrome serializes
 * this function body and cannot close over imports.
 */
export function collectPageFindings(): RawScanPayload {
  const MAX = 2500;
  const SNIPPET = 280;

  const types = [
    "link",
    "script",
    "image",
    "iframe",
    "stylesheet",
    "font",
    "media",
    "network",
    "other",
  ] as const;

  type LocalType = (typeof types)[number];

  const findings: RawFinding[] = [];
  const seen = new Set<string>();

  const skip = (raw: string): boolean => {
    const value = raw.trim().toLowerCase();
    if (!value || value === "#" || value.startsWith("javascript:")) return true;
    if (value.startsWith("mailto:") || value.startsWith("tel:")) return true;
    if (value.startsWith("data:") || value.startsWith("blob:")) return true;
    if (value.startsWith("about:") || value.startsWith("chrome:")) return true;
    if (value.startsWith("chrome-extension:") || value.startsWith("moz-extension:")) return true;
    return false;
  };

  const resolve = (raw: string): string | null => {
    if (skip(raw)) return null;
    try {
      return new URL(raw, location.href).href;
    } catch {
      return null;
    }
  };

  const snippetOf = (el: Element): string => {
    return el.outerHTML.replace(/\s+/g, " ").trim().slice(0, SNIPPET);
  };

  const add = (type: LocalType, rawUrl: string, snippet: string, context?: string): void => {
    if (findings.length >= MAX) return;
    const url = resolve(rawUrl);
    if (!url) return;
    const key = `${type}|${url}|${snippet}`;
    if (seen.has(key)) return;
    seen.add(key);
    const finding: RawFinding = { type: type as ConnectionType, url, snippet };
    if (context) finding.context = context.slice(0, 160);
    findings.push(finding);
  };

  const attr = (el: Element, name: string): string | null => {
    const value = el.getAttribute(name);
    return value && value.trim() ? value.trim() : null;
  };

  for (const el of Array.from(document.querySelectorAll("a[href]"))) {
    const href = attr(el, "href");
    if (!href) continue;
    add("link", href, snippetOf(el), el.textContent?.replace(/\s+/g, " ").trim());
  }

  for (const el of Array.from(document.querySelectorAll("script[src]"))) {
    const src = attr(el, "src");
    if (src) add("script", src, snippetOf(el));
  }

  for (const el of Array.from(document.querySelectorAll("img"))) {
    const src = attr(el, "src");
    if (src) add("image", src, snippetOf(el), attr(el, "alt") ?? undefined);
    const srcset = attr(el, "srcset");
    if (srcset) {
      for (const part of srcset.split(",")) {
        const url = part.trim().split(/\s+/)[0];
        if (url) add("image", url, snippetOf(el));
      }
    }
  }

  for (const el of Array.from(document.querySelectorAll("iframe[src], frame[src]"))) {
    const src = attr(el, "src");
    if (src) add("iframe", src, snippetOf(el));
  }

  for (const el of Array.from(document.querySelectorAll("link[href]"))) {
    const href = attr(el, "href");
    if (!href) continue;
    const rel = (attr(el, "rel") ?? "").toLowerCase();
    const as = (attr(el, "as") ?? "").toLowerCase();
    let type: LocalType = "other";
    if (rel.includes("stylesheet")) type = "stylesheet";
    else if (rel.includes("icon")) type = "image";
    else if (rel.includes("preload") && as === "font") type = "font";
    else if (rel.includes("font") || as === "font") type = "font";
    else if (
      rel.includes("preload") ||
      rel.includes("prefetch") ||
      rel.includes("preconnect") ||
      rel.includes("dns-prefetch")
    ) {
      type = "network";
    } else if (as === "script") type = "script";
    else if (as === "image") type = "image";
    else if (as === "style") type = "stylesheet";
    add(type, href, snippetOf(el), rel || undefined);
  }

  for (const el of Array.from(
    document.querySelectorAll("video[src], audio[src], source[src], track[src]"),
  )) {
    const src = attr(el, "src");
    if (src) add("media", src, snippetOf(el));
  }

  for (const el of Array.from(document.querySelectorAll("object[data], embed[src]"))) {
    const src = attr(el, "data") ?? attr(el, "src");
    if (src) add("media", src, snippetOf(el));
  }

  for (const el of Array.from(document.querySelectorAll("form[action]"))) {
    const action = attr(el, "action");
    if (action) add("network", action, snippetOf(el), "form action");
  }

  for (const el of Array.from(document.querySelectorAll("[href], [src]"))) {
    const href = attr(el, "href");
    const src = attr(el, "src");
    if (href) add("other", href, snippetOf(el));
    if (src) add("other", src, snippetOf(el));
  }

  try {
    const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    for (const entry of entries) {
      if (findings.length >= MAX) break;
      const initiator = entry.initiatorType || "other";
      let type: LocalType = "network";
      if (initiator === "script") type = "script";
      else if (initiator === "img" || initiator === "image" || initiator === "css") {
        type = initiator === "css" ? "stylesheet" : "image";
      } else if (initiator === "iframe") type = "iframe";
      else if (initiator === "video" || initiator === "audio") type = "media";
      else if (initiator === "link") type = "stylesheet";
      else if (initiator === "xmlhttprequest" || initiator === "fetch" || initiator === "beacon") {
        type = "network";
      }
      add(type, entry.name, `performance:${initiator} ${entry.name.slice(0, SNIPPET - 24)}`);
    }
  } catch {
    // Some pages restrict performance timeline access.
  }

  return {
    url: location.href,
    title: document.title || location.hostname,
    hostname: location.hostname,
    findings: findings.slice(0, MAX_FINDINGS),
  };
}
