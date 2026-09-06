import type { RawScanPayload } from "@/src/types/graph";
import { persistScan } from "@/src/storage/scans";

const GUARDIAN_SAMPLE: RawScanPayload = {
  url: "https://www.theguardian.com/us",
  title: "Latest news, sport and opinion from the Guardian",
  hostname: "www.theguardian.com",
  findings: [
    {
      type: "script",
      url: "https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX",
      snippet: '<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX"></script>',
    },
    {
      type: "script",
      url: "https://connect.facebook.net/en_US/fbevents.js",
      snippet: '<script src="https://connect.facebook.net/en_US/fbevents.js"></script>',
    },
    {
      type: "script",
      url: "https://static.chartbeat.com/js/chartbeat.js",
      snippet: '<script src="https://static.chartbeat.com/js/chartbeat.js"></script>',
    },
    {
      type: "image",
      url: "https://i.guim.co.uk/images/2024/01/01/example.jpg",
      snippet: '<img src="https://i.guim.co.uk/images/2024/01/01/example.jpg" alt="headline">',
    },
    {
      type: "stylesheet",
      url: "https://assets.guim.co.uk/static/frontend/css/main.css",
      snippet: '<link rel="stylesheet" href="https://assets.guim.co.uk/static/frontend/css/main.css">',
    },
    {
      type: "font",
      url: "https://assets.guim.co.uk/static/frontend/fonts/guardian-headline.woff2",
      snippet: '<link rel="preload" href="https://assets.guim.co.uk/static/frontend/fonts/guardian-headline.woff2" as="font">',
    },
    {
      type: "iframe",
      url: "https://www.youtube.com/embed/example",
      snippet: '<iframe src="https://www.youtube.com/embed/example" title="video"></iframe>',
    },
    {
      type: "link",
      url: "https://www.facebook.com/sharer/sharer.php",
      snippet: '<a href="https://www.facebook.com/sharer/sharer.php">Share on Facebook</a>',
      context: "Share on Facebook",
    },
    {
      type: "link",
      url: "https://www.linkedin.com/shareArticle",
      snippet: '<a href="https://www.linkedin.com/shareArticle">LinkedIn</a>',
      context: "Share on LinkedIn",
    },
    {
      type: "link",
      url: "https://www.instagram.com/theguardian/",
      snippet: '<a href="https://www.instagram.com/theguardian/">Instagram</a>',
    },
    {
      type: "network",
      url: "https://www.google.co.uk/search",
      snippet: '<form action="https://www.google.co.uk/search"><input name="q"></form>',
      context: "form action",
    },
    {
      type: "script",
      url: "https://cdn.adjust.com/adjust-latest.min.js",
      snippet: '<script src="https://cdn.adjust.com/adjust-latest.min.js"></script>',
    },
    {
      type: "link",
      url: "https://bsky.app/profile/theguardian.com",
      snippet: '<a href="https://bsky.app/profile/theguardian.com">Bluesky</a>',
    },
    {
      type: "link",
      url: "https://www.wordiply.com/",
      snippet: '<a href="https://www.wordiply.com/">Wordiply</a>',
    },
    {
      type: "link",
      url: "https://www.newspapers.com/",
      snippet: '<a href="https://www.newspapers.com/">Newspapers.com</a>',
    },
    {
      type: "script",
      url: "https://cdn.privacy-mgmt.com/unified/wrapperMessagingWithoutDetection.js",
      snippet: '<script src="https://cdn.privacy-mgmt.com/unified/wrapperMessagingWithoutDetection.js"></script>',
    },
    {
      type: "image",
      url: "https://pagead2.googlesyndication.com/pagead/imgad",
      snippet: '<img src="https://pagead2.googlesyndication.com/pagead/imgad">',
    },
  ],
};

export async function seedSampleSite(): Promise<number> {
  return await persistScan(GUARDIAN_SAMPLE);
}

export const LIVE_SCAN_IDS = [
  "github",
  "wikipedia",
  "guardian",
  "stripe",
  "mdn",
  "bbc",
  "nytimes",
  "stackoverflow",
  "reddit",
  "cloudflare",
] as const;

export const LIVE_SCAN_DOMAINS = [
  "github.com",
  "wikipedia.org",
  "theguardian.com",
  "stripe.com",
  "mozilla.org",
  "bbc.com",
  "nytimes.com",
  "stackoverflow.com",
  "reddit.com",
  "cloudflare.com",
] as const;

function isRawScanPayload(value: unknown): value is RawScanPayload {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.url === "string" &&
    typeof record.title === "string" &&
    typeof record.hostname === "string" &&
    Array.isArray(record.findings)
  );
}

export async function seedLiveTen(): Promise<number[]> {
  const ids: number[] = [];
  for (const id of LIVE_SCAN_IDS) {
    const response = await fetch(`/live-scans/${id}.json`);
    if (!response.ok) {
      throw new Error(`Could not load live scan for ${id}.`);
    }
    const payload: unknown = await response.json();
    if (!isRawScanPayload(payload)) {
      throw new Error(`Live scan for ${id} is not valid.`);
    }
    ids.push(await persistScan(payload));
  }
  return ids;
}
