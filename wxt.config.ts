import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "LinkScope",
    description:
      "See every site, service, tracker, script, and external domain a webpage connects to—visualized as an interactive graph.",
    permissions: ["activeTab", "scripting", "tabs"],
    action: {
      default_title: "LinkScope",
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
