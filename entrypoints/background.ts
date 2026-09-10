import { applyBadgeForUrl, refreshActiveTabBadge } from "@/src/extension/badge";
import { installRequestCapture } from "@/src/extension/requestLog";
import { openDashboard, scanActiveTab, watchActiveTab } from "@/src/extension/scanFlow";
import { blockDomain } from "@/src/extension/block";
import { toggleFollowDomain } from "@/src/storage/follows";

export default defineBackground(() => {
  installRequestCapture();
  void refreshActiveTabBadge();

  browser.commands.onCommand.addListener((command) => {
    if (command !== "scan-active-tab") return;
    void scanActiveTab().catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : "Scan failed");
    });
  });

  if (browser.tabs?.onActivated) {
    browser.tabs.onActivated.addListener((info) => {
      void browser.tabs
        .get(info.tabId)
        .then((tab) => applyBadgeForUrl(tab.url))
        .catch(() => undefined);
    });
  }
  if (browser.tabs?.onUpdated) {
    browser.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
      if (!tab.active) return;
      if (changeInfo.status !== "complete" && !changeInfo.url) return;
      void applyBadgeForUrl(tab.url);
    });
  }

  if (browser.notifications?.onClicked) {
    browser.notifications.onClicked.addListener((notificationId) => {
      const first = /^linkscope-first-(\d+)$/.exec(notificationId);
      if (first) {
        void openDashboard(`/graph/${first[1]}`);
        return;
      }
      const follow = /^linkscope-follow-(\d+)$/.exec(notificationId);
      if (follow) {
        void openDashboard(`/graph/${follow[1]}`);
        return;
      }
      const match = /^linkscope-diff-(\d+)-(\d+)$/.exec(notificationId);
      if (!match) {
        void openDashboard();
        return;
      }
      const url = browser.runtime.getURL(`/app.html#/diff/${match[1]}/${match[2]}`);
      void browser.tabs.create({ url });
    });
  }

  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "SCAN_ACTIVE_TAB") {
      void scanActiveTab()
        .then((scanId) => sendResponse({ ok: true, scanId }))
        .catch((error: unknown) =>
          sendResponse({
            ok: false,
            error: error instanceof Error ? error.message : "Scan failed",
          }),
        );
      return true;
    }

    if (message?.type === "SCAN_QUIET") {
      const tabId = typeof message.tabId === "number" ? message.tabId : undefined;
      const url = typeof message.url === "string" ? message.url : undefined;
      void scanActiveTab({
        openReport: false,
        tabId,
        url,
        notifyIfNew: false,
        force: true,
      })
        .then((scanId) => sendResponse({ ok: true, scanId }))
        .catch((error: unknown) =>
          sendResponse({
            ok: false,
            error: error instanceof Error ? error.message : "Check failed",
          }),
        );
      return true;
    }

    if (message?.type === "WATCH_ACTIVE_TAB") {
      void watchActiveTab().catch((error: unknown) => {
        console.error(error instanceof Error ? error.message : "Watch failed");
      });
      sendResponse({ ok: true });
      return false;
    }

    if (message?.type === "OPEN_DASHBOARD") {
      const hash = typeof message.hash === "string" ? message.hash : "/";
      void openDashboard(hash)
        .then(() => sendResponse({ ok: true }))
        .catch((error: unknown) =>
          sendResponse({
            ok: false,
            error: error instanceof Error ? error.message : "Could not open dashboard",
          }),
        );
      return true;
    }

    if (message?.type === "FOLLOW_DOMAIN") {
      const domain = typeof message.domain === "string" ? message.domain : "";
      void toggleFollowDomain(domain)
        .then((followed) => sendResponse({ ok: true, followed }))
        .catch((error: unknown) =>
          sendResponse({
            ok: false,
            error: error instanceof Error ? error.message : "Could not follow domain",
          }),
        );
      return true;
    }

    if (message?.type === "BLOCK_DOMAIN") {
      const domain = typeof message.domain === "string" ? message.domain : "";
      void blockDomain(domain)
        .then((result) => sendResponse({ ok: true, result }))
        .catch((error: unknown) =>
          sendResponse({
            ok: false,
            error: error instanceof Error ? error.message : "Could not block domain",
          }),
        );
      return true;
    }

    return false;
  });
});
