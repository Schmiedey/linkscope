import { openDashboard, scanActiveTab, watchActiveTab } from "@/src/extension/scanFlow";
import { syncAlertBadge } from "@/src/storage/alerts";

export default defineBackground(() => {
  void syncAlertBadge();

  browser.commands.onCommand.addListener((command) => {
    if (command !== "scan-active-tab") return;
    void scanActiveTab().catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : "Scan failed");
    });
  });

  if (browser.notifications?.onClicked) {
    browser.notifications.onClicked.addListener((notificationId) => {
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

    if (message?.type === "WATCH_ACTIVE_TAB") {
      void watchActiveTab().catch((error: unknown) => {
        console.error(error instanceof Error ? error.message : "Watch failed");
      });
      sendResponse({ ok: true });
      return false;
    }

    if (message?.type === "OPEN_DASHBOARD") {
      void openDashboard()
        .then(() => sendResponse({ ok: true }))
        .catch((error: unknown) =>
          sendResponse({
            ok: false,
            error: error instanceof Error ? error.message : "Could not open dashboard",
          }),
        );
      return true;
    }

    return false;
  });
});
