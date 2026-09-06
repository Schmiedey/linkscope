import { HashRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "@/src/components/AppShell";
import { DomainDetailPage, DomainsPage } from "@/src/dashboard/Domains";
import { GlobalGraphPage } from "@/src/dashboard/GlobalGraph";
import { GraphPage } from "@/src/dashboard/GraphPage";
import { OverviewPage } from "@/src/dashboard/Overview";
import { ScansPage } from "@/src/dashboard/Scans";
import { SettingsPage } from "@/src/dashboard/Settings";
import { SitesPage } from "@/src/dashboard/Sites";

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/graph/:scanId" element={<GraphPage />} />
        <Route path="/global" element={<GlobalGraphPage />} />
        <Route element={<AppShell />}>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/scans" element={<ScansPage />} />
          <Route path="/sites" element={<SitesPage />} />
          <Route path="/domains" element={<DomainsPage />} />
          <Route path="/domains/:domain" element={<DomainDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
