import { diffSnapshots } from "@/src/analysis/diff";
import { db } from "@/src/storage/database";
import { notificationsEnabled } from "@/src/storage/settings";
import type { AlertRow, ScanGraphSnapshot, ScanRow } from "@/src/types/graph";

const SURGE_MIN_ADDED = 2;
const SURGE_RATIO = 1.25;
const FIRST_SCAN_SURGE = 3;

export async function listRecentAlerts(limit = 20): Promise<AlertRow[]> {
  return await db.alerts.orderBy("timestamp").reverse().limit(limit).toArray();
}

export async function unreadAlertCount(): Promise<number> {
  const rows = await db.alerts.toArray();
  return rows.filter((row) => !row.read).length;
}

export async function markAlertsRead(): Promise<void> {
  const unread = await db.alerts.filter((row) => !row.read).toArray();
  await Promise.all(
    unread.map((row) => (row.id !== undefined ? db.alerts.update(row.id, { read: true }) : Promise.resolve())),
  );
  await syncAlertBadge(0);
}

export async function recordScanAlert(
  previous: ScanRow | undefined,
  next: ScanRow,
  nextGraph: ScanGraphSnapshot,
  previousGraph: ScanGraphSnapshot | undefined,
): Promise<AlertRow | null> {
  if (!previous?.id || next.id === undefined || !previousGraph) return null;

  const diff = diffSnapshots(previous, next, previousGraph, nextGraph);
  const delta = next.trackerCount - previous.trackerCount;
  const surged =
    previous.trackerCount === 0
      ? next.trackerCount >= FIRST_SCAN_SURGE
      : delta >= SURGE_MIN_ADDED && next.trackerCount >= previous.trackerCount * SURGE_RATIO;

  if (diff.addedTrackers.length === 0 && !surged) return null;

  const alert: AlertRow = {
    siteId: next.siteId,
    siteDomain: next.domain,
    fromScanId: previous.id,
    toScanId: next.id,
    timestamp: next.timestamp,
    kind: diff.addedTrackers.length > 0 ? "new-trackers" : "tracker-surge",
    addedTrackers: diff.addedTrackers.map((node) => node.domain),
    removedTrackers: diff.removedTrackers.map((node) => node.domain),
    trackerDelta: delta,
    read: false,
  };

  const id = await db.alerts.add(alert);
  const stored = { ...alert, id };
  await syncAlertBadge();
  if (await notificationsEnabled()) {
    await notifyChange(stored, previous.trackerCount, next.trackerCount);
  }
  return stored;
}

export async function syncAlertBadge(count?: number): Promise<void> {
  if (typeof browser === "undefined" || !browser.action?.setBadgeText) return;
  const unread = count ?? (await unreadAlertCount());
  const text = unread > 0 ? (unread > 9 ? "9+" : String(unread)) : "";
  await browser.action.setBadgeText({ text });
  if (unread > 0 && browser.action.setBadgeBackgroundColor) {
    await browser.action.setBadgeBackgroundColor({ color: "#b91c1c" });
  }
}

export async function notifyFirstSiteCheck(input: {
  domain: string;
  scanId: number;
  thirdPartyCount: number;
  trackerCount: number;
}): Promise<void> {
  if (typeof browser === "undefined" || !browser.notifications?.create) return;
  if (!(await notificationsEnabled())) return;
  const parties =
    input.thirdPartyCount === 1 ? "1 third-party domain" : `${String(input.thirdPartyCount)} third-party domains`;
  const trackers =
    input.trackerCount === 0
      ? "no trackers"
      : input.trackerCount === 1
        ? "1 tracker"
        : `${String(input.trackerCount)} trackers`;
  try {
    await browser.notifications.create(`linkscope-first-${String(input.scanId)}`, {
      type: "basic",
      iconUrl: notificationIconUrl(),
      title: input.domain,
      message: `First check · ${parties} · ${trackers}`,
    });
  } catch {
    // Notifications can be blocked even with the permission present.
  }
}

async function notifyChange(alert: AlertRow, fromCount: number, toCount: number): Promise<void> {
  if (typeof browser === "undefined" || !browser.notifications?.create) return;
  const added = alert.addedTrackers;
  const title =
    added.length > 0 ? `New trackers on ${alert.siteDomain}` : `More trackers on ${alert.siteDomain}`;
  const sample = added.slice(0, 3).join(", ");
  let message = `${String(fromCount)} → ${String(toCount)} tracker domains.`;
  if (added.length === 1) message = `${added[0]} appeared.`;
  else if (added.length > 1) message = `${String(added.length)} domains appeared${sample ? `: ${sample}` : ""}.`;

  try {
    await browser.notifications.create(`linkscope-diff-${String(alert.fromScanId)}-${String(alert.toScanId)}`, {
      type: "basic",
      iconUrl: notificationIconUrl(),
      title,
      message,
    });
  } catch {
    // Notifications can be blocked even with the permission present.
  }
}

function notificationIconUrl(): string {
  try {
    return browser.runtime.getURL("/icon/128.png");
  } catch {
    return "";
  }
}
