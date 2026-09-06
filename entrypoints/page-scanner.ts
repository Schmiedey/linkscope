import { collectPageFindings } from "@/src/extension/scanner";

export default defineUnlistedScript(() => {
  const scope = globalThis as typeof globalThis & { __LINKSCOPE_SCAN__?: unknown };
  scope.__LINKSCOPE_SCAN__ = collectPageFindings();
});
