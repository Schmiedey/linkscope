import { parse } from "tldts";

const RELATED: Record<string, readonly string[]> = {
  "github.com": [
    "githubassets.com",
    "githubusercontent.com",
    "github.blog",
    "githubstatus.com",
    "github.community",
    "github.careers",
    "thegithubshop.com",
    "gh.io",
    "github.io",
  ],
  "theguardian.com": ["guim.co.uk", "ophan.co.uk", "guardianapps.co.uk", "guardianapis.com"],
  "stripe.com": ["stripecdn.com", "stripeassets.com", "stripe.dev", "stripe.community", "stripecommunity.com"],
  "mozilla.org": ["mdn.dev", "mozillademos.org"],
  "wikipedia.org": [
    "wikimedia.org",
    "mediawiki.org",
    "wikidata.org",
    "wiktionary.org",
    "wikibooks.org",
    "wikiquote.org",
    "wikisource.org",
    "wikiversity.org",
    "wikivoyage.org",
    "wikinews.org",
    "wikifunctions.org",
    "wikimediafoundation.org",
  ],
};

const CLUSTERS: readonly string[][] = [
  [
    "wikipedia.org",
    "wikimedia.org",
    "mediawiki.org",
    "wikidata.org",
    "wiktionary.org",
    "wikibooks.org",
    "wikiquote.org",
    "wikisource.org",
    "wikiversity.org",
    "wikivoyage.org",
    "wikinews.org",
    "wikifunctions.org",
    "wikimediafoundation.org",
  ],
  ["github.com", "githubassets.com", "githubusercontent.com"],
  ["stripe.com", "stripecdn.com", "stripeassets.com"],
];

function sld(domain: string): string {
  return parse(domain, { allowPrivateDomains: true }).domainWithoutSuffix?.toLowerCase() ?? domain.split(".")[0] ?? domain;
}

function brandTokens(origin: string): string[] {
  const base = sld(origin);
  const tokens = new Set<string>();
  if (base.length >= 5) tokens.add(base);
  const stripped = base.replace(/^the/, "");
  if (stripped.length >= 5) tokens.add(stripped);
  return Array.from(tokens);
}

function inRelatedTable(origin: string, target: string): boolean {
  const listed = RELATED[origin];
  if (listed?.some((item) => target === item || target.endsWith(`.${item}`))) return true;
  return CLUSTERS.some((cluster) => cluster.includes(origin) && cluster.includes(target));
}

export function isFirstPartyDomain(originDomain: string, targetDomain: string): boolean {
  if (!originDomain || !targetDomain) return false;
  if (originDomain === "global") return false;
  if (originDomain === targetDomain) return true;
  if (inRelatedTable(originDomain, targetDomain) || inRelatedTable(targetDomain, originDomain)) return true;

  for (const token of brandTokens(originDomain)) {
    const t = sld(targetDomain);
    if (t === token || t.startsWith(token) || t.endsWith(token)) return true;
    if (targetDomain.startsWith(`${token}.`) || targetDomain.includes(`.${token}.`)) return true;
  }
  return false;
}
