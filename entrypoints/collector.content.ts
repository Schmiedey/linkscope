import { ensureResourceWatch } from "@/src/extension/scanner";

export default defineContentScript({
  matches: ["http://*/*", "https://*/*"],
  runAt: "document_start",
  allFrames: false,
  main() {
    ensureResourceWatch();
  },
});
