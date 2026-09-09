import { HashRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "@/src/components/AppShell";
import { DiffPage } from "@/src/dashboard/DiffPage";
import { DomainDetailPage, DomainsPage } from "@/src/dashboard/Domains";
import { FollowingPage } from "@/src/dashboard/Following";
import { GlobalGraphPage } from "@/src/dashboard/GlobalGraph";
import { GraphPage } from "@/src/dashboard/GraphPage";
import { OverviewPage } from "@/src/dashboard/Overview";
import { ScansPage } from "@/src/dashboard/Scans";
import { SettingsPage } from "@/src/dashboard/Settings";
import { SiteDetailPage } from "@/src/dashboard/SiteDetail";
import { SitesPage } from "@/src/dashboard/Sites";
import { WatchingPage } from "@/src/dashboard/Watching";

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/graph/:scanId" element={<GraphPage />} />
        <Route path="/global" element={<GlobalGraphPage />} />
        <Route path="/watching" element={<WatchingPage />} />
        <Route element={<AppShell />}>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/scans" element={<ScansPage />} />
          <Route path="/sites" element={<SitesPage />} />
          <Route path="/sites/:siteId" element={<SiteDetailPage />} />
          <Route path="/diff/:fromId/:toId" element={<DiffPage />} />
          <Route path="/domains" element={<DomainsPage />} />
          <Route path="/domains/:domain" element={<DomainDetailPage />} />
          <Route path="/following" element={<FollowingPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
