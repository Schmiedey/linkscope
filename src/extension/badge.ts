import { concludeSite } from "@/src/analysis/unusual";
import { nutritionFromScan } from "@/src/analysis/nutrition";
import { canScanUrl } from "@/src/extension/permissions";
import { registrableDomain } from "@/src/lib/domain";
import { db } from "@/src/storage/database";
import { domainRowsForSnapshot, getSiteGlance } from "@/src/storage/glance";
import type { ScanGraphSnapshot, ScanRow } from "@/src/types/graph";

export type BadgeHint = {
  text: string;
  color: string;
};

function thirdPartyDomains(snapshot: ScanGraphSnapshot | undefined): string[] {
  if (!snapshot) return [];
  return snapshot.nodes.filter((node) => !node.isOrigin && !node.isFirstParty).map((node) => node.domain);
}

export function badgeForGlance(input: {
  latest: ScanRow;
  previous?: ScanRow;
  latestGraph?: ScanGraphSnapshot;
  previousGraph?: ScanGraphSnapshot;
  unusual?: boolean;
}): BadgeHint {
  const nowDomains = new Set(thirdPartyDomains(input.latestGraph));
  const beforeDomains = new Set(thirdPartyDomains(input.previousGraph));
  let added = 0;
  if (input.previous && nowDomains.size > 0) {
    for (const domain of nowDomains) {
      if (!beforeDomains.has(domain)) added += 1;
    }
  } else if (input.previous) {
    added = Math.max(0, input.latest.thirdPartyCount - input.previous.thirdPartyCount);
  }

  if (added > 0) {
    return { text: added > 9 ? "+9+" : `+${String(added)}`, color: "#a16207" };
  }
  if (input.unusual) {
    return { text: "!", color: "#b91c1c" };
  }
  const count = input.latest.thirdPartyCount;
  if (count <= 0) return { text: "0", color: "#171717" };
  return { text: count > 99 ? "99+" : String(count), color: "#171717" };
}

async function unreadAlertFallback(): Promise<number> {
  const rows = await db.alerts.toArray();
  return rows.filter((row) => !row.read).length;
}

async function applyBadge(hint: BadgeHint | null): Promise<void> {
  if (typeof browser === "undefined" || !browser.action?.setBadgeText) return;
  await browser.action.setBadgeText({ text: hint?.text ?? "" });
  if (hint && browser.action.setBadgeBackgroundColor) {
    await browser.action.setBadgeBackgroundColor({ color: hint.color });
  }
  const setTextColor = (
    browser.action as typeof browser.action & {
      setBadgeTextColor?: (details: { color: string }) => Promise<void>;
    }
  ).setBadgeTextColor;
  if (hint && setTextColor) {
    await setTextColor({ color: "#ffffff" });
  }
}

export async function applyBadgeForUrl(url: string | undefined): Promise<void> {
  if (!url || !canScanUrl(url)) {
    const unread = await unreadAlertFallback();
    if (unread > 0) {
      await applyBadge({ text: unread > 9 ? "9+" : String(unread), color: "#b91c1c" });
      return;
    }
    await applyBadge(null);
    return;
  }

  let domain: string;
  try {
    domain = registrableDomain(url) ?? new URL(url).hostname;
  } catch {
    await applyBadge(null);
    return;
  }

  const glance = await getSiteGlance(domain);
  if (!glance) {
    await applyBadge({ text: "·", color: "#171717" });
    return;
  }

  const rows = await domainRowsForSnapshot(glance.latestGraph);
  const nutrition = nutritionFromScan(glance.latest, glance.latestGraph);
  const conclusion = concludeSite({
    nutrition,
    snapshot: glance.latestGraph,
    domainRows: rows,
  });
  await applyBadge(
    badgeForGlance({
      latest: glance.latest,
      previous: glance.previous,
      latestGraph: glance.latestGraph,
      previousGraph: glance.previousGraph,
      unusual: conclusion.unusual,
    }),
  );
}

export async function refreshActiveTabBadge(): Promise<void> {
  if (typeof browser === "undefined" || !browser.tabs?.query) return;
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  await applyBadgeForUrl(tab?.url);
}
