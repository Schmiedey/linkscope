import { openDashboard, scanActiveTab } from "@/src/extension/scanFlow";

export default defineBackground(() => {
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
