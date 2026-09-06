import { installLinkScopeCollector } from "@/src/extension/scanner";

export default defineUnlistedScript(() => {
  installLinkScopeCollector();
});
