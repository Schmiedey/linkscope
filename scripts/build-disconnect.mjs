import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CATEGORY_MAP = {
  Advertising: "advertising",
  Analytics: "analytics",
  Social: "social",
  Email: "advertising",
  EmailAggressive: "advertising",
  FingerprintingInvasive: "telemetry",
  FingerprintingGeneral: "telemetry",
  Cryptomining: "telemetry",
  ConsentManagers: "security",
  Content: "cdn",
};

const PRIORITY = {
  advertising: 10,
  analytics: 9,
  telemetry: 8,
  social: 5,
  security: 4,
  cdn: 2,
};

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = process.argv[2];
if (!sourcePath) {
  console.error("Usage: node scripts/build-disconnect.mjs <services.json>");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(sourcePath, "utf8"));
const entries = {};

for (const [disconnectCategory, groups] of Object.entries(raw.categories ?? {})) {
  const category = CATEGORY_MAP[disconnectCategory];
  if (!category || !Array.isArray(groups)) continue;
  for (const group of groups) {
    if (!group || typeof group !== "object") continue;
    for (const [owner, siteMap] of Object.entries(group)) {
      if (!siteMap || typeof siteMap !== "object") continue;
      for (const hosts of Object.values(siteMap)) {
        if (!Array.isArray(hosts)) continue;
        for (const host of hosts) {
          if (typeof host !== "string" || !host.trim()) continue;
          const domain = host.trim().toLowerCase().replace(/^\*\./, "");
          if (!domain || domain.includes("/")) continue;
          const existing = entries[domain];
          if (!existing || (PRIORITY[category] ?? 0) > (PRIORITY[existing.c] ?? 0)) {
            entries[domain] = { c: category, o: owner };
          }
        }
      }
    }
  }
}

const outDir = join(root, "src/analysis/data");
mkdirSync(outDir, { recursive: true });
const payload = {
  source: "Disconnect Tracking Protection",
  license: "CC BY-NC-SA 4.0",
  homepage: "https://github.com/disconnectme/disconnect-tracking-protection",
  generatedAt: new Date().toISOString().slice(0, 10),
  domainCount: Object.keys(entries).length,
  entries,
};
writeFileSync(join(outDir, "disconnect.json"), `${JSON.stringify(payload)}\n`);
console.log(`Wrote ${payload.domainCount} domains to src/analysis/data/disconnect.json`);
