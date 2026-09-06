import { parse } from "tldts";

export function registrableDomain(input: string): string | null {
  const parsed = parse(input, { allowPrivateDomains: true });
  if (parsed.domain) return parsed.domain.toLowerCase();

  const hostname = parsed.hostname?.toLowerCase();
  if (!hostname) return null;
  if (hostname === "localhost") return "localhost";
  return hostname;
}

export function hostnameFromUrl(input: string): string | null {
  try {
    const url = input.includes("://") ? new URL(input) : new URL(`https://${input}`);
    return url.hostname.toLowerCase();
  } catch {
    const parsed = parse(input, { allowPrivateDomains: true });
    return parsed.hostname?.toLowerCase() ?? null;
  }
}
